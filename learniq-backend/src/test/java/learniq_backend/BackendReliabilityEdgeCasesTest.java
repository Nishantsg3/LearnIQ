package learniq_backend;

import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.exception.GlobalExceptionHandler;
import learniq_backend.model.Question;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import learniq_backend.service.AttemptService;
import learniq_backend.service.TestLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:edgecases_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class BackendReliabilityEdgeCasesTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private TestLifecycleService testLifecycleService;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    private User student;

    private learniq_backend.model.Test createTest(String title, String category, String testType, LocalDateTime start, LocalDateTime end, int duration) {
        learniq_backend.model.Test t = new learniq_backend.model.Test();
        t.setTitle(title != null ? title : "Default Assessment");
        t.setCategory(category != null ? category : "GENERAL");
        t.setSectionType("Multiple Choice");
        t.setDifficultyLevel("Easy");
        t.setQuestionCount(5);
        t.setDurationMinutes(duration > 0 ? duration : 60);
        t.setTestType(testType);
        t.setStartTime(start);
        t.setEndTime(end);
        t.setStatus("ACTIVE");
        return testRepository.save(t);
    }

    private Question linkQuestionToTest(learniq_backend.model.Test test, String text) {
        Question q = new Question();
        q.setQuestionText(text);
        q.setOptionA("A");
        q.setOptionB("B");
        q.setOptionC("C");
        q.setOptionD("D");
        q.setCorrectAnswer("A");
        q.setCategory(test.getCategory());
        q = questionRepository.save(q);

        if (test.getQuestions() == null) {
            test.setQuestions(new ArrayList<>());
        }
        test.getQuestions().add(q);
        testRepository.save(test);
        return q;
    }

    @BeforeEach
    void setUp() {
        testAttemptRepository.deleteAll();
        testRepository.deleteAll();
        questionRepository.hardDeleteAll();
        userRepository.deleteAll();

        student = User.builder()
                .name("Student Edge")
                .email("student.edge@learniq.test")
                .password("encoded_pass")
                .role(User.Role.STUDENT)
                .build();
        student.setVerified(true);
        student = userRepository.save(student);
    }

    @Test
    @WithMockUser(username = "student.edge@learniq.test", roles = "STUDENT")
    @DisplayName("EDGE-01: /attempts/me returns 200 with empty list for candidate with 0 attempts")
    void testGetMyAttemptsZeroAttempts() throws Exception {
        mockMvc.perform(get("/api/v1/attempts/me"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @DisplayName("EDGE-02: mapToSummaryResponse handles null test association and missing title/category gracefully")
    void testMapToSummaryResponseNullTestAndCategory() {
        TestAttempt attempt = new TestAttempt();
        attempt.setId(101L);
        attempt.setUser(student);
        attempt.setUserEmail(student.getEmail());
        attempt.setTest(null);
        attempt.setTestType("PRACTICE");
        attempt.setStatus(TestAttempt.Status.IN_PROGRESS);

        TestAttemptResponse summary = attemptService.mapToSummaryResponse(attempt);
        assertNotNull(summary);
        assertEquals("Assessment", summary.getTestTitle());
        assertEquals("GENERAL", summary.getCategory());
        assertEquals("IN_PROGRESS", summary.getStatus());
        assertEquals(-1, summary.getScorePercent());
    }

    @Test
    @WithMockUser(username = "student.edge@learniq.test", roles = "STUDENT")
    @DisplayName("EDGE-03: /attempts/me masks scores for in-progress attempts")
    void testGetMyAttemptsInProgressScoreMasked() throws Exception {
        learniq_backend.model.Test test = createTest("Spring Core", "SPRING", "MAIN", LocalDateTime.now(), LocalDateTime.now().plusHours(1), 45);

        TestAttempt attempt = new TestAttempt();
        attempt.setUser(student);
        attempt.setUserEmail(student.getEmail());
        attempt.setUserName(student.getName());
        attempt.setTest(test);
        attempt.setTestType("MAIN");
        attempt.setStatus(TestAttempt.Status.IN_PROGRESS);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setScorePercent(80); // In-progress attempt
        attempt.setSubmitted(false);
        testAttemptRepository.save(attempt);

        mockMvc.perform(get("/api/v1/attempts/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].scorePercent").value(-1))
                .andExpect(jsonPath("$[0].correctCount").value(0))
                .andExpect(jsonPath("$[0].submitted").value(false));
    }

    @Test
    @WithMockUser(username = "student.edge@learniq.test", roles = "STUDENT")
    @DisplayName("EDGE-04: /attempts/start returns 409 CONFLICT with attemptId when test is already completed")
    void testStartAttemptAlreadySubmittedReturns409WithAttemptId() throws Exception {
        learniq_backend.model.Test test = createTest("Final Exam", "JAVA", "MAIN",
                LocalDateTime.now().minusMinutes(10), LocalDateTime.now().plusMinutes(50), 60);

        linkQuestionToTest(test, "What is Java?");

        TestAttempt submittedAttempt = new TestAttempt();
        submittedAttempt.setUser(student);
        submittedAttempt.setUserEmail(student.getEmail());
        submittedAttempt.setUserName(student.getName());
        submittedAttempt.setTest(test);
        submittedAttempt.setTestType("MAIN");
        submittedAttempt.setStatus(TestAttempt.Status.SUBMITTED);
        submittedAttempt.setSubmitted(true);
        submittedAttempt.setScorePercent(90);
        submittedAttempt.setStartedAt(LocalDateTime.now().minusMinutes(20));
        submittedAttempt.setSubmittedAt(LocalDateTime.now().minusMinutes(5));
        submittedAttempt = testAttemptRepository.save(submittedAttempt);

        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + test.getId() + "}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.attemptId").value(submittedAttempt.getId()))
                .andExpect(jsonPath("$.message").value("You have already completed this test."));
    }

    @Test
    @WithMockUser(username = "student.edge@learniq.test", roles = "STUDENT")
    @DisplayName("EDGE-05: /attempts/start resumes existing in-progress session idempotently")
    void testStartAttemptIdempotentResume() throws Exception {
        learniq_backend.model.Test test = createTest("Practice Test", "JAVA", "PRACTICE", null, null, 30);

        linkQuestionToTest(test, "Question 1");

        // First start
        TestAttempt attempt1 = attemptService.startOrResumeAttempt(student.getEmail(), test.getId());
        assertNotNull(attempt1);

        // Second start via HTTP POST /attempts/start
        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + test.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId").value(attempt1.getId()))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("EDGE-06: /tests/counts handles upcoming scheduled MAIN tests and duration fallbacks properly")
    void testTestCountsUpcomingAndDurationGraceful() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        // 1. Upcoming MAIN test (start in future)
        createTest("Upcoming Exam", "JAVA", "MAIN", now.plusHours(2), now.plusHours(3), 0);

        // 2. Active LIVE MAIN test
        createTest("Active Exam", "JAVA", "MAIN", now.minusMinutes(10), now.plusMinutes(50), 60);

        // 3. Active Practice test
        createTest("Active Practice", "JAVA", "PRACTICE", null, null, 30);

        mockMvc.perform(get("/api/v1/tests/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.practice").value(1))
                .andExpect(jsonPath("$.liveMain").value(1))
                .andExpect(jsonPath("$.scheduled").value(1));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("EDGE-07: /tests/active excludes upcoming scheduled MAIN tests whose startTime has not arrived")
    void testGetActiveTestsExcludesUpcomingTests() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        // Upcoming test: startTime in future
        createTest("Tomorrow Exam", "JAVA", "MAIN", now.plusDays(1), now.plusDays(1).plusHours(1), 60);

        // Live test: startTime arrived
        createTest("Live Right Now", "JAVA", "MAIN", now.minusMinutes(10), now.plusMinutes(50), 60);

        mockMvc.perform(get("/api/v1/tests/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Live Right Now"));
    }

    @Test
    @DisplayName("EDGE-08: Database exceptions are sanitized and return HTTP 500 without leaking DB internals")
    void testDatabaseExceptionSanitization() {
        DataIntegrityViolationException dive = new DataIntegrityViolationException(
                "could not execute statement; SQL [INSERT INTO test_attempts VALUES (...)]; constraint [UK_xyz]");

        ResponseEntity<Map<String, String>> response = globalExceptionHandler.handleDatabaseExceptions(dive);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("A database error occurred. Please try again later.", response.getBody().get("message"));
        assertFalse(response.getBody().toString().contains("SQL"), "Must NOT leak SQL keywords");
        assertFalse(response.getBody().toString().contains("constraint"), "Must NOT leak constraint info");
    }
}
