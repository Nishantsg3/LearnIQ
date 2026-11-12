package learniq_backend.security;

import learniq_backend.controller.QuestionController;
import learniq_backend.controller.QuestionController.AnalysisItem;
import learniq_backend.controller.QuestionController.SubmissionRequest;
import learniq_backend.controller.QuestionController.SubmissionResult;
import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.service.AttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:main_privacy_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long",
        "app.frontend.url=http://localhost:5173"
})
@Transactional
public class MainTestAnswerPrivacyEnforcementTest {

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private QuestionController questionController;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private AttemptAnswerRepository attemptAnswerRepository;

    private User studentUser;
    private Authentication studentAuth;

    @BeforeEach
    void setUp() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        studentUser = new User();
        studentUser.setName("Security Candidate " + unique);
        studentUser.setEmail("candidate." + unique + "@learniq.test");
        studentUser.setPassword("$2a$10$hashedTestPasswordForPrivacyEnforcement");
        studentUser.setRole(User.Role.STUDENT);
        studentUser.setVerified(true);
        studentUser = userRepository.save(studentUser);

        studentAuth = new UsernamePasswordAuthenticationToken(
                studentUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );
    }

    private Question createQuestion(String text, String ans) {
        Question q = new Question();
        q.setQuestionText(text);
        q.setOptionA("Option Alpha");
        q.setOptionB("Option Bravo");
        q.setOptionC("Option Charlie");
        q.setOptionD("Option Delta");
        q.setCorrectAnswer(ans);
        q.setCategory("JAVA");
        q.setDifficultyLevel("Medium");
        return questionRepository.save(q);
    }

    private learniq_backend.model.Test createTest(String title, String testType, String status, LocalDateTime start, LocalDateTime end) {
        learniq_backend.model.Test t = new learniq_backend.model.Test();
        t.setTitle(title);
        t.setCategory("JAVA");
        t.setSectionType("Multiple Choice");
        t.setDifficultyLevel("Medium");
        t.setDurationMinutes(30);
        t.setTestType(testType);
        t.setStatus(status);
        t.setStartTime(start);
        t.setEndTime(end);
        t.setQuestionCount(1);
        return testRepository.save(t);
    }

    // =========================================================================
    // 1. CROSS ORIGIN REMOVAL VERIFICATION
    // =========================================================================
    @Test
    @DisplayName("Verify @CrossOrigin(origins = '*') is removed from QuestionController")
    void testQuestionControllerHasNoCrossOriginWildcard() {
        assertFalse(
                QuestionController.class.isAnnotationPresent(CrossOrigin.class),
                "QuestionController must NOT be annotated with @CrossOrigin"
        );
    }

    // =========================================================================
    // 2. CAN DISCLOSE ANSWERS LOGIC MATRIX
    // =========================================================================
    @Test
    @DisplayName("canDiscloseAnswers should strictly evaluate testType, endTime, and status")
    void testCanDiscloseAnswersMatrix() {
        learniq_backend.model.Test activeMain = createTest(
                "Active Main Test",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(10),
                LocalDateTime.now().plusHours(1)
        );
        assertFalse(attemptService.canDiscloseAnswers(activeMain), "Active MAIN test must not disclose answers while now < endTime");

        learniq_backend.model.Test closedMain = createTest(
                "Closed Main Test",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now().minusMinutes(5)
        );
        assertTrue(attemptService.canDiscloseAnswers(closedMain), "Closed MAIN test must disclose answers when now >= endTime");

        learniq_backend.model.Test completedMain = createTest(
                "Completed Main Test",
                "MAIN",
                "COMPLETED",
                LocalDateTime.now().minusMinutes(10),
                LocalDateTime.now().plusHours(1)
        );
        assertTrue(attemptService.canDiscloseAnswers(completedMain), "Completed MAIN test must disclose answers even if now < endTime");

        learniq_backend.model.Test practiceTest = createTest(
                "Practice Test",
                "PRACTICE",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(10),
                LocalDateTime.now().plusHours(1)
        );
        assertTrue(attemptService.canDiscloseAnswers(practiceTest), "PRACTICE tests must always disclose answers immediately");
    }

    // =========================================================================
    // 3. ATTEMPT SERVICE mapToResponse PROTECTION
    // =========================================================================
    @Test
    @DisplayName("AttemptService.mapToResponse masks correctAnswer and isCorrect while MAIN test is active")
    void testMapToResponseActiveMainTestMasking() {
        Question q1 = createQuestion("What is polymorphism in Java?", "B");
        learniq_backend.model.Test mainTest = createTest(
                "Active Main Exam",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(15),
                LocalDateTime.now().plusMinutes(45)
        );
        mainTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(mainTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), mainTest.getId());
        attempt = attemptService.submitAttempt(attempt.getId(), Map.of(q1.getId().toString(), "B"));

        // While MAIN test is active (now < endTime)
        TestAttemptResponse response = attemptService.mapToResponse(attempt);
        assertNotNull(response);
        assertNotNull(response.getAnswerReviews());
        assertFalse(response.getAnswerReviews().isEmpty());

        for (TestAttemptResponse.AnswerReview review : response.getAnswerReviews()) {
            assertNull(review.getCorrectAnswer(), "correctAnswer must be null while MAIN test is active");
            assertFalse(review.isCorrect(), "isCorrect must be masked (false) while MAIN test is active");
            assertEquals("B", review.getSelectedOption(), "Student's selectedOption must remain preserved");
        }

        // Now simulate window closing (now >= endTime)
        mainTest.setEndTime(LocalDateTime.now().minusMinutes(1));
        testRepository.save(mainTest);

        TestAttemptResponse unmaskedResponse = attemptService.mapToResponse(attempt);
        assertNotNull(unmaskedResponse);
        for (TestAttemptResponse.AnswerReview review : unmaskedResponse.getAnswerReviews()) {
            assertEquals("B", review.getCorrectAnswer(), "correctAnswer must be unmasked when MAIN test window closes");
            assertTrue(review.isCorrect(), "isCorrect must be unmasked (true) when MAIN test window closes");
        }
    }

    @Test
    @DisplayName("AttemptService.mapToResponse unmasks answers immediately for PRACTICE test regardless of time")
    void testMapToResponsePracticeTestImmediateUnmask() {
        Question q1 = createQuestion("Explain JVM garbage collection", "C");
        learniq_backend.model.Test practiceTest = createTest(
                "Practice Quiz",
                "PRACTICE",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(10),
                LocalDateTime.now().plusHours(2)
        );
        practiceTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(practiceTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), practiceTest.getId());
        attempt = attemptService.submitAttempt(attempt.getId(), Map.of(q1.getId().toString(), "C"));

        TestAttemptResponse response = attemptService.mapToResponse(attempt);
        assertNotNull(response);
        for (TestAttemptResponse.AnswerReview review : response.getAnswerReviews()) {
            assertEquals("C", review.getCorrectAnswer(), "PRACTICE test must return correctAnswer immediately upon submission");
            assertTrue(review.isCorrect(), "PRACTICE test must return isCorrect immediately upon submission");
        }
    }

    // =========================================================================
    // 4. QUESTION CONTROLLER submitTest / submitAnswers & AnalysisItem PROTECTION
    // =========================================================================
    @Test
    @DisplayName("QuestionController.submitTest masks correctAnswer, explanation, and isCorrect while MAIN test is active")
    void testQuestionControllerSubmitActiveMainMasking() {
        Question q1 = createQuestion("What does ACID stand for?", "A");
        learniq_backend.model.Test mainTest = createTest(
                "Active Main Certification",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(20),
                LocalDateTime.now().plusMinutes(40)
        );
        mainTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(mainTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), mainTest.getId());

        ResponseEntity<?> responseEntity = questionController.submitAnswers(
                mainTest.getId(),
                attempt.getId(),
                new SubmissionRequest(Map.of(q1.getId().toString(), "A")),
                studentAuth
        );

        assertEquals(200, responseEntity.getStatusCode().value());
        assertTrue(responseEntity.getBody() instanceof SubmissionResult);
        SubmissionResult result = (SubmissionResult) responseEntity.getBody();

        assertNotNull(result.analysis());
        assertFalse(result.analysis().isEmpty());

        for (AnalysisItem item : result.analysis()) {
            assertNull(item.correctAnswer(), "AnalysisItem.correctAnswer must be null while MAIN test is active");
            assertNull(item.explanation(), "AnalysisItem.explanation must be masked (null) while MAIN test is active");
            assertFalse(item.correct(), "AnalysisItem.correct must be masked (false) while MAIN test is active");
            assertEquals("A", item.selectedAnswer(), "Selected answer must be recorded");
        }

        // Test Idempotent re-submission while still active: remains masked
        ResponseEntity<?> idempEntity = questionController.submitTest(
                mainTest.getId(),
                attempt.getId(),
                new SubmissionRequest(Map.of(q1.getId().toString(), "A")),
                studentAuth
        );
        assertEquals(200, idempEntity.getStatusCode().value());
        SubmissionResult idempResult = (SubmissionResult) idempEntity.getBody();
        for (AnalysisItem item : idempResult.analysis()) {
            assertNull(item.correctAnswer(), "Idempotent response must continue masking correctAnswer while active");
            assertNull(item.explanation(), "Idempotent response must continue masking explanation while active");
            assertFalse(item.correct(), "Idempotent response must continue masking correct indicator while active");
        }
    }

    @Test
    @DisplayName("QuestionController.submitTest unmasks correctAnswer, explanation, and isCorrect when MAIN test window closes")
    void testQuestionControllerSubmitClosedMainUnmasking() {
        Question q1 = createQuestion("Define Idempotence in REST APIs", "D");
        learniq_backend.model.Test closedMainTest = createTest(
                "Closed Main Exam",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now().plusMinutes(30)
        );
        closedMainTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(closedMainTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), closedMainTest.getId());

        // Now test window closes before submission/result review
        closedMainTest.setEndTime(LocalDateTime.now().minusMinutes(1));
        testRepository.save(closedMainTest);

        ResponseEntity<?> responseEntity = questionController.submitTest(
                closedMainTest.getId(),
                attempt.getId(),
                new SubmissionRequest(Map.of(q1.getId().toString(), "D")),
                studentAuth
        );

        assertEquals(200, responseEntity.getStatusCode().value());
        SubmissionResult result = (SubmissionResult) responseEntity.getBody();

        for (AnalysisItem item : result.analysis()) {
            assertEquals("D", item.correctAnswer(), "correctAnswer must be unmasked when window closes");
            assertNotNull(item.explanation(), "explanation must be unmasked when window closes");
            assertTrue(item.correct(), "correct indicator must be unmasked (true) when window closes");
        }
    }

    @Test
    @DisplayName("QuestionController.submitTest unmasks correctAnswer, explanation, and isCorrect when MAIN test is COMPLETED")
    void testQuestionControllerSubmitCompletedMainUnmasking() {
        Question q1 = createQuestion("What is HikariCP in Spring Boot?", "A");
        learniq_backend.model.Test completedMainTest = createTest(
                "Completed Main Test",
                "MAIN",
                "COMPLETED",
                LocalDateTime.now().minusMinutes(30),
                LocalDateTime.now().plusHours(2) // Future end time, but status is COMPLETED
        );
        completedMainTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(completedMainTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), completedMainTest.getId());

        ResponseEntity<?> responseEntity = questionController.submitAnswers(
                completedMainTest.getId(),
                attempt.getId(),
                new SubmissionRequest(Map.of(q1.getId().toString(), "A")),
                studentAuth
        );

        assertEquals(200, responseEntity.getStatusCode().value());
        SubmissionResult result = (SubmissionResult) responseEntity.getBody();

        for (AnalysisItem item : result.analysis()) {
            assertEquals("A", item.correctAnswer(), "correctAnswer must be unmasked when test.status == COMPLETED");
            assertNotNull(item.explanation(), "explanation must be unmasked when test.status == COMPLETED");
            assertTrue(item.correct(), "isCorrect must be unmasked (true) when test.status == COMPLETED");
        }
    }

    @Test
    @DisplayName("QuestionController.submitTest returns unmasked correctAnswer and explanation immediately for PRACTICE tests")
    void testQuestionControllerSubmitPracticeTestImmediate() {
        Question q1 = createQuestion("What is thread safety?", "B");
        learniq_backend.model.Test practiceTest = createTest(
                "Practice Assessment",
                "PRACTICE",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(5),
                LocalDateTime.now().plusHours(5)
        );
        practiceTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(practiceTest);

        TestAttempt attempt = attemptService.startOrResumeAttempt(studentUser.getEmail(), practiceTest.getId());

        ResponseEntity<?> responseEntity = questionController.submitTest(
                practiceTest.getId(),
                attempt.getId(),
                new SubmissionRequest(Map.of(q1.getId().toString(), "B")),
                studentAuth
        );

        assertEquals(200, responseEntity.getStatusCode().value());
        SubmissionResult result = (SubmissionResult) responseEntity.getBody();

        for (AnalysisItem item : result.analysis()) {
            assertEquals("B", item.correctAnswer(), "PRACTICE test must return correctAnswer immediately upon submission");
            assertNotNull(item.explanation(), "PRACTICE test must return explanation immediately upon submission");
            assertTrue(item.correct(), "PRACTICE test must return isCorrect immediately upon submission");
        }
    }

    // =========================================================================
    // 5. QUESTION LISTING ENDPOINT /test/{testId} PROTECTION
    // =========================================================================
    @Test
    @DisplayName("QuestionController.getQuestionsByTest masks correctAnswer for active MAIN test, unmasks for closed/practice")
    void testGetQuestionsByTestProtection() {
        Question q1 = createQuestion("Active Question 1", "A");
        learniq_backend.model.Test activeMain = createTest(
                "Active Main For Listing",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(10),
                LocalDateTime.now().plusHours(1)
        );
        activeMain.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(activeMain);

        ResponseEntity<List<Question>> activeResp = questionController.getQuestionsByTest(activeMain.getId());
        assertEquals(200, activeResp.getStatusCode().value());
        assertNotNull(activeResp.getBody());
        for (Question q : activeResp.getBody()) {
            assertNull(q.getCorrectAnswer(), "Question listing endpoint must mask correctAnswer while MAIN test is active");
        }

        // Verify original in repository is NOT modified (no Hibernate dirty-checking leakage)
        Question persisted = questionRepository.findById(q1.getId()).orElseThrow();
        assertEquals("A", persisted.getCorrectAnswer(), "Persisted question in DB must retain actual correctAnswer");

        // Closed MAIN test
        learniq_backend.model.Test closedMain = createTest(
                "Closed Main For Listing",
                "MAIN",
                "ACTIVE",
                LocalDateTime.now().minusHours(2),
                LocalDateTime.now().minusMinutes(5)
        );
        closedMain.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(closedMain);

        ResponseEntity<List<Question>> closedResp = questionController.getQuestionsByTest(closedMain.getId());
        assertEquals(200, closedResp.getStatusCode().value());
        for (Question q : closedResp.getBody()) {
            assertEquals("A", q.getCorrectAnswer(), "Question listing endpoint must unmask correctAnswer when MAIN test window closes");
        }

        // Practice test
        learniq_backend.model.Test practiceTest = createTest(
                "Practice Test For Listing",
                "PRACTICE",
                "ACTIVE",
                LocalDateTime.now().minusMinutes(5),
                LocalDateTime.now().plusHours(1)
        );
        practiceTest.setQuestions(new ArrayList<>(List.of(q1)));
        testRepository.save(practiceTest);

        ResponseEntity<List<Question>> practiceResp = questionController.getQuestionsByTest(practiceTest.getId());
        assertEquals(200, practiceResp.getStatusCode().value());
        for (Question q : practiceResp.getBody()) {
            assertEquals("A", q.getCorrectAnswer(), "Question listing endpoint must return correctAnswer for PRACTICE tests");
        }
    }
}
