package learniq_backend.service;

import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.Question;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.AttemptAnswerRepository;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Regression tests proving on-demand, request-time lifecycle transitions for:
 * 1. SCHEDULED -> ACTIVE test promotion when scheduledAt has elapsed.
 * 2. Automatic on-demand finalization of expired IN_PROGRESS attempts during student queries.
 *
 * Runs with app.lifecycle.scheduler.enabled=false to prove zero dependence on background schedulers.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:ondemand_lifecycle_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long",
        "app.lifecycle.scheduler.enabled=false"
})
public class OnDemandLifecycleTransitionTest {

    @Autowired
    private TestLifecycleService testLifecycleService;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private AttemptAnswerRepository attemptAnswerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private LifecycleScheduler lifecycleScheduler;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private User testStudent;
    private learniq_backend.model.Test sampleTest;
    private Question sampleQuestion;

    private learniq_backend.model.Test createScheduledTest(String title, LocalDateTime scheduledAt, LocalDateTime endTime) {
        learniq_backend.model.Test t = learniq_backend.model.Test.builder()
                .title(title)
                .category("Math")
                .sectionType("Multiple Choice")
                .difficultyLevel("Medium")
                .questionCount(1)
                .durationMinutes(60)
                .testType("MAIN")
                .scheduledAt(scheduledAt)
                .endTime(endTime)
                .questions(List.of(sampleQuestion))
                .build();
        t = testRepository.save(t);
        jdbcTemplate.update("UPDATE test SET status = 'SCHEDULED' WHERE id = ?", t.getId());
        entityManager.clear();
        return testRepository.findById(t.getId()).orElseThrow();
    }

    @BeforeEach
    void setUp() {
        attemptAnswerRepository.deleteAll();
        testAttemptRepository.deleteAll();
        testRepository.deleteAll();
        questionRepository.hardDeleteAll();
        userRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        testStudent = User.builder()
                .name("Lifecycle Student")
                .email("student.lifecycle." + suffix + "@learniq.test")
                .password("encoded_pass")
                .role(User.Role.STUDENT)
                .build();
        testStudent.setVerified(true);
        testStudent = userRepository.save(testStudent);

        sampleQuestion = Question.builder()
                .questionText("Sample Question: What is 5 x 5?")
                .optionA("20")
                .optionB("25")
                .optionC("30")
                .optionD("35")
                .correctAnswer("25")
                .category("Math")
                .difficultyLevel("Easy")
                .build();
        sampleQuestion = questionRepository.save(sampleQuestion);

        sampleTest = learniq_backend.model.Test.builder()
                .title("Lifecycle Verification Assessment " + suffix)
                .category("Math")
                .sectionType("Multiple Choice")
                .difficultyLevel("Easy")
                .questionCount(1)
                .durationMinutes(30)
                .testType("MAIN")
                .status("ACTIVE")
                .questions(List.of(sampleQuestion))
                .build();
        sampleTest = testRepository.save(sampleTest);
    }

    @Test
    @DisplayName("LIFECYCLE-01: Background scheduler bean is disabled via app.lifecycle.scheduler.enabled=false")
    void testSchedulerDisabledByProperty() {
        // With app.lifecycle.scheduler.enabled=false, the bean is either not created or reports disabled
        if (lifecycleScheduler != null) {
            assertFalse(lifecycleScheduler.isEnabled(),
                    "LifecycleScheduler must be disabled when app.lifecycle.scheduler.enabled=false");
        }
    }

    @Test
    @DisplayName("LIFECYCLE-02: SCHEDULED test past scheduledAt transitions to ACTIVE synchronously on-demand")
    void testScheduledTestPromotesToActiveOnDemand() {
        LocalDateTime pastScheduledTime = LocalDateTime.now().minusMinutes(15);
        learniq_backend.model.Test scheduledTest = createScheduledTest(
                "Scheduled Test Past Due",
                pastScheduledTime,
                LocalDateTime.now().plusMinutes(45)
        );

        // Pre-condition assertion: DB holds SCHEDULED status
        assertEquals("SCHEDULED", scheduledTest.getStatus());
        assertNull(scheduledTest.getStartedAt());

        // isActuallyActive reports true for past scheduledAt within end window
        assertTrue(testLifecycleService.isActuallyActive(scheduledTest, LocalDateTime.now()),
                "isActuallyActive must return true when scheduledAt is in the past and test has not expired");

        // Synchronous on-demand transition without background scheduler
        learniq_backend.model.Test transitioned = testLifecycleService.syncTestLifecycle(scheduledTest);

        assertNotNull(transitioned);
        assertEquals("ACTIVE", transitioned.getStatus(),
                "Test status must transition from SCHEDULED to ACTIVE on-demand");
        assertNotNull(transitioned.getStartedAt(),
                "startedAt timestamp must be populated on promotion to ACTIVE");

        // Verify persisted state in repository
        Optional<learniq_backend.model.Test> reloaded = testRepository.findById(scheduledTest.getId());
        assertTrue(reloaded.isPresent());
        assertEquals("ACTIVE", reloaded.get().getStatus());
        assertNotNull(reloaded.get().getStartedAt());
    }

    @Test
    @DisplayName("LIFECYCLE-03: Future SCHEDULED test does NOT transition to ACTIVE and is not active")
    void testFutureScheduledTestDoesNotPromote() {
        LocalDateTime futureScheduledTime = LocalDateTime.now().plusHours(2);
        learniq_backend.model.Test futureTest = createScheduledTest(
                "Upcoming Future Test",
                futureScheduledTime,
                futureScheduledTime.plusMinutes(60)
        );

        assertFalse(testLifecycleService.isActuallyActive(futureTest, LocalDateTime.now()),
                "Future scheduled test must not be considered active");

        learniq_backend.model.Test synced = testLifecycleService.syncTestLifecycle(futureTest);
        assertEquals("SCHEDULED", synced.getStatus(),
                "Future scheduled test must remain SCHEDULED");
        assertNull(synced.getStartedAt());
    }

    @Test
    @DisplayName("LIFECYCLE-04: Expired IN_PROGRESS attempt auto-submits on-demand during getUserAttempts query")
    void testExpiredAttemptAutoSubmitsOnUserAttemptsQuery() {
        // Create an IN_PROGRESS attempt whose individual endTime has elapsed
        LocalDateTime startedAt = LocalDateTime.now().minusHours(2);
        LocalDateTime expiredEndTime = LocalDateTime.now().minusMinutes(30);

        TestAttempt expiredAttempt = TestAttempt.builder()
                .user(testStudent)
                .userEmail(testStudent.getEmail())
                .userName(testStudent.getName())
                .test(sampleTest)
                .testType("MAIN")
                .status(TestAttempt.Status.IN_PROGRESS)
                .submitted(false)
                .startedAt(startedAt)
                .endTime(expiredEndTime)
                .totalQuestions(1)
                .scorePercent(-1)
                .answers(new ArrayList<>())
                .build();
        expiredAttempt = testAttemptRepository.save(expiredAttempt);
        final Long expiredAttemptId = expiredAttempt.getId();

        // Pre-condition check: attempt is IN_PROGRESS and unsubmitted
        assertEquals(TestAttempt.Status.IN_PROGRESS, expiredAttempt.getStatus());
        assertFalse(expiredAttempt.isSubmitted());
        assertNull(expiredAttempt.getSubmittedAt());

        // Perform on-demand query (as done by student dashboard or history fetch)
        List<TestAttemptResponse> userAttempts = attemptService.getUserAttempts(testStudent.getEmail());

        assertNotNull(userAttempts);
        assertFalse(userAttempts.isEmpty());

        TestAttemptResponse summary = userAttempts.stream()
                .filter(a -> a.getId().equals(expiredAttemptId))
                .findFirst()
                .orElse(null);

        assertNotNull(summary, "Query result must contain the attempt");
        assertEquals("SUBMITTED", summary.getStatus(),
                "Summary response must reflect SUBMITTED status after on-demand auto-submit");

        // Verify persisted state in repository
        Optional<TestAttempt> persisted = testAttemptRepository.findById(expiredAttempt.getId());
        assertTrue(persisted.isPresent());
        assertEquals(TestAttempt.Status.SUBMITTED, persisted.get().getStatus(),
                "Persisted attempt status must be SUBMITTED without scheduler intervention");
        assertTrue(persisted.get().isSubmitted(),
                "Persisted attempt isSubmitted must be true");
        assertNotNull(persisted.get().getSubmittedAt(),
                "submittedAt must be populated upon on-demand auto-submission");
    }

    @Test
    @DisplayName("LIFECYCLE-05: Expired IN_PROGRESS attempt auto-submits on-demand during startOrResumeAttempt")
    void testExpiredAttemptAutoSubmitsOnResume() {
        LocalDateTime startedAt = LocalDateTime.now().minusHours(1);
        LocalDateTime expiredEndTime = LocalDateTime.now().minusMinutes(10);

        TestAttempt expiredAttempt = TestAttempt.builder()
                .user(testStudent)
                .userEmail(testStudent.getEmail())
                .userName(testStudent.getName())
                .test(sampleTest)
                .testType("MAIN")
                .status(TestAttempt.Status.IN_PROGRESS)
                .submitted(false)
                .startedAt(startedAt)
                .endTime(expiredEndTime)
                .totalQuestions(1)
                .scorePercent(-1)
                .answers(new ArrayList<>())
                .build();
        expiredAttempt = testAttemptRepository.save(expiredAttempt);

        // Student tries to resume or start the expired attempt
        TestAttempt resumed = attemptService.startOrResumeAttempt(testStudent.getEmail(), sampleTest.getId());

        assertNotNull(resumed);
        assertEquals(TestAttempt.Status.SUBMITTED, resumed.getStatus(),
                "Resuming an expired attempt must auto-submit it synchronously");
        assertTrue(resumed.isSubmitted());
        assertNotNull(resumed.getSubmittedAt());

        // Verify in repository
        Optional<TestAttempt> persisted = testAttemptRepository.findById(expiredAttempt.getId());
        assertTrue(persisted.isPresent());
        assertEquals(TestAttempt.Status.SUBMITTED, persisted.get().getStatus());
    }

    @Test
    @DisplayName("LIFECYCLE-06: MAIN test past end time transitions to ARCHIVED on-demand synchronously")
    void testMainTestPastEndTimeTransitionsToArchivedOnDemand() {
        LocalDateTime startTime = LocalDateTime.now().minusHours(3);
        LocalDateTime endTime = LocalDateTime.now().minusHours(1);

        learniq_backend.model.Test pastMainTest = learniq_backend.model.Test.builder()
                .title("Past MAIN Test")
                .category("Math")
                .sectionType("Multiple Choice")
                .difficultyLevel("Easy")
                .questionCount(1)
                .durationMinutes(60)
                .testType("MAIN")
                .status("ACTIVE")
                .startTime(startTime)
                .endTime(endTime)
                .questions(List.of(sampleQuestion))
                .build();
        pastMainTest = testRepository.save(pastMainTest);

        assertFalse(testLifecycleService.isActuallyActive(pastMainTest, LocalDateTime.now()),
                "Expired MAIN test must not be considered active");
        assertTrue(testLifecycleService.isExpired(pastMainTest, LocalDateTime.now()),
                "Expired MAIN test must be recognized by isExpired");

        learniq_backend.model.Test archived = testLifecycleService.syncTestLifecycle(pastMainTest);
        assertEquals("ARCHIVED", archived.getStatus(),
                "MAIN test past its window must transition to ARCHIVED on-demand");

        Optional<learniq_backend.model.Test> persisted = testRepository.findById(pastMainTest.getId());
        assertTrue(persisted.isPresent());
        assertEquals("ARCHIVED", persisted.get().getStatus());
    }
}
