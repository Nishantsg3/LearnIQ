package learniq_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.model.User;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:main_attempt_inv_reg_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class MainExamAttemptInvariantRegressionTest {

    private static final String TEST_STUDENT_EMAIL = "student.inv.regression@learniq.test";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpStudentUser() {
        if (userRepository.findByEmail(TEST_STUDENT_EMAIL).isEmpty()) {
            User student = new User();
            student.setName("Invariant Test Student");
            student.setEmail(TEST_STUDENT_EMAIL);
            student.setPassword(passwordEncoder.encode("Test@123456"));
            student.setRole(User.Role.STUDENT);
            student.setVerified(true);
            userRepository.save(student);
        }
    }

    private List<Question> createAndPersistQuestions(int count) {
        List<Question> questions = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Question q = Question.builder()
                    .questionText("Invariant Regression Q " + i + " " + UUID.randomUUID())
                    .category("JAVA")
                    .difficultyLevel("Medium")
                    .optionA("Alpha")
                    .optionB("Bravo")
                    .optionC("Charlie")
                    .optionD("Delta")
                    .correctAnswer("Alpha")
                    .build();
            questions.add(questionRepository.save(q));
        }
        return questions;
    }

    private Test createMainTest(int questionCount, int durationMinutes, LocalDateTime startTime, LocalDateTime endTime) {
        Test test = new Test();
        test.setTitle("MAIN Invariant Exam " + UUID.randomUUID());
        test.setCategory("JAVA");
        test.setTestType("MAIN");
        test.setStatus("ACTIVE");
        test.setDurationMinutes(durationMinutes);
        test.setQuestionCount(questionCount);
        test.setNegativeMarking(BigDecimal.ZERO);
        test.setStartTime(startTime);
        test.setEndTime(endTime);
        test = testRepository.save(test);

        if (questionCount > 0) {
            List<Question> questions = createAndPersistQuestions(questionCount);
            test.setQuestions(new ArrayList<>(questions));
            for (Question q : questions) {
                if (q.getTests() == null) q.setTests(new ArrayList<>());
                q.getTests().add(test);
            }
            test = testRepository.save(test);
        }
        return test;
    }

    private Test createPracticeTest(int questionCount, int durationMinutes) {
        Test test = new Test();
        test.setTitle("Practice Drills " + UUID.randomUUID());
        test.setCategory("JAVA");
        test.setTestType("PRACTICE");
        test.setStatus("ACTIVE");
        test.setDurationMinutes(durationMinutes);
        test.setQuestionCount(questionCount);
        test.setNegativeMarking(BigDecimal.ZERO);
        test = testRepository.save(test);

        if (questionCount > 0) {
            List<Question> questions = createAndPersistQuestions(questionCount);
            test.setQuestions(new ArrayList<>(questions));
            for (Question q : questions) {
                if (q.getTests() == null) q.setTests(new ArrayList<>());
                q.getTests().add(test);
            }
            test = testRepository.save(test);
        }
        return test;
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(username = TEST_STUDENT_EMAIL, roles = "STUDENT")
    @DisplayName("INV-01: Starting attempt on invalid 10-question MAIN test with valid window fails with HTTP 400 (not 403 scheduled date)")
    void testStartAttemptRejectsInvalid10QuestionMainTest() throws Exception {
        // Valid scheduling window: started 10 mins ago, ends 50 mins from now
        LocalDateTime start = LocalDateTime.now().minusMinutes(10);
        LocalDateTime end = LocalDateTime.now().plusMinutes(50);
        Test invalidMainTest = createMainTest(10, 60, start, end);

        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + invalidMainTest.getId() + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(username = TEST_STUDENT_EMAIL, roles = "STUDENT")
    @DisplayName("INV-02: Starting attempt on valid 50-question, 60-minute MAIN test with valid window succeeds with HTTP 200")
    void testStartAttemptSucceedsForValid50QuestionMainTest() throws Exception {
        // Valid scheduling window: started 10 mins ago, ends 50 mins from now
        LocalDateTime start = LocalDateTime.now().minusMinutes(10);
        LocalDateTime end = LocalDateTime.now().plusMinutes(50);
        Test validMainTest = createMainTest(50, 60, start, end);

        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + validMainTest.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId").isNumber())
                .andExpect(jsonPath("$.testId").value(validMainTest.getId()))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(username = TEST_STUDENT_EMAIL, roles = "STUDENT")
    @DisplayName("INV-03: Starting attempt on MAIN test with invalid duration (e.g. 30 mins) fails with HTTP 400")
    void testStartAttemptRejectsInvalidDurationMainTest() throws Exception {
        LocalDateTime start = LocalDateTime.now().minusMinutes(10);
        LocalDateTime end = LocalDateTime.now().plusMinutes(50);
        Test invalidDurationTest = createMainTest(50, 30, start, end);

        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + invalidDurationTest.getId() + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 60 minutes duration"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(username = TEST_STUDENT_EMAIL, roles = "STUDENT")
    @DisplayName("INV-04: Legacy /questions/test/{testId}/start-attempt endpoint also enforces 50-question invariant")
    void testLegacyStartAttemptEndpointEnforces50QuestionInvariant() throws Exception {
        LocalDateTime start = LocalDateTime.now().minusMinutes(10);
        LocalDateTime end = LocalDateTime.now().plusMinutes(50);
        Test invalidMainTest = createMainTest(10, 60, start, end);

        mockMvc.perform(post("/api/v1/questions/test/" + invalidMainTest.getId() + "/start-attempt"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(username = TEST_STUDENT_EMAIL, roles = "STUDENT")
    @DisplayName("INV-05: Starting attempt on PRACTICE test with 10 questions succeeds (unconstrained by MAIN invariant)")
    void testStartAttemptAllowsPracticeTestWithArbitraryQuestionCount() throws Exception {
        Test practiceTest = createPracticeTest(10, 15);

        mockMvc.perform(post("/api/v1/attempts/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"testId\":" + practiceTest.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId").isNumber())
                .andExpect(jsonPath("$.testId").value(practiceTest.getId()))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }
}
