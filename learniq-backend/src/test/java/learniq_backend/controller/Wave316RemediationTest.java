package learniq_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.*;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import learniq_backend.service.AttemptService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Wave 3.16 Backend Remediation Tests
 * M-1: Negative Marking Persistence & Validation
 * M-2: MAIN Exam Constraint Enforcement (50 questions, 60 minutes)
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:wave316_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class Wave316RemediationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private ObjectMapper objectMapper;

    // ─── M-1: NEGATIVE MARKING VALIDATION & PERSISTENCE ──────────────────────

    @Nested
    @DisplayName("M-1: Negative Marking Validation")
    class NegativeMarkingValidation {

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept negativeMarking = 0")
        void shouldAcceptZeroPenalty() throws Exception {
            String json = """
                {
                    "title": "NM Test Zero",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": 0
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept negativeMarking = 0.25")
        void shouldAcceptQuarterPenalty() throws Exception {
            String json = """
                {
                    "title": "NM Test Quarter",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": 0.25
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0.25));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept negativeMarking = 0.50")
        void shouldAcceptHalfPenalty() throws Exception {
            String json = """
                {
                    "title": "NM Test Half",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": 0.50
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0.50));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept negativeMarking = 1.00")
        void shouldAcceptFullPenalty() throws Exception {
            String json = """
                {
                    "title": "NM Test Full",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": 1.00
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(1.00));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept null negativeMarking (defaults to 0)")
        void shouldDefaultToZeroWhenNull() throws Exception {
            String json = """
                {
                    "title": "NM Test Default",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE"
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0));
        }

        @ParameterizedTest
        @ValueSource(doubles = {-0.5, 0.33, 0.75, 2.0, -1.0, 0.10})
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject invalid negativeMarking values on create")
        void shouldRejectInvalidPenalties(double value) throws Exception {
            String json = String.format("""
                {
                    "title": "NM Test Invalid",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": %s
                }
                """, value);
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(
                            "Invalid negative marking value. Allowed values: 0, 0.25, 0.50, 1.00"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Negative marking persists, retrieves and updates correctly")
        void shouldPersistRetrieveAndUpdate() throws Exception {
            String json = """
                {
                    "title": "NM Persistence Test",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE",
                    "negativeMarking": 0.25
                }
                """;
            String response = mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            Long testId = objectMapper.readTree(response).get("id").asLong();

            // 1. Verify via GET
            mockMvc.perform(get("/api/v1/tests/" + testId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0.25));

            // 2. Verify in DB directly
            learniq_backend.model.Test dbTest = testRepository.findById(testId).orElseThrow();
            assertThat(dbTest.getNegativeMarking()).isEqualByComparingTo(new BigDecimal("0.25"));

            // 3. Update to 0.50 via PUT
            String updateJson = """
                {
                    "negativeMarking": 0.50
                }
                """;
            mockMvc.perform(put("/api/v1/tests/" + testId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updateJson))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.negativeMarking").value(0.50));

            // 4. Reject invalid update value
            String invalidUpdateJson = """
                {
                    "negativeMarking": 0.33
                }
                """;
            mockMvc.perform(put("/api/v1/tests/" + testId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidUpdateJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(
                            "Invalid negative marking value. Allowed values: 0, 0.25, 0.50, 1.00"));
        }
    }

    // ─── M-2: MAIN EXAM CONSTRAINT ENFORCEMENT ──────────────────────────────

    @Nested
    @DisplayName("M-2: MAIN Exam Constraint Enforcement")
    class MainExamConstraints {

        private String mainTestJson(int questions, int duration) {
            return String.format("""
                {
                    "title": "MAIN Constraint Test %s",
                    "category": "ALL",
                    "totalQuestions": %d,
                    "duration": %d,
                    "testType": "MAIN",
                    "startTime": "%s"
                }
                """, UUID.randomUUID().toString().substring(0, 8), questions, duration, LocalDateTime.now().plusHours(1).toString());
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Accept MAIN test with exactly 50 questions and 60 minutes")
        void shouldAcceptValid50q60m() throws Exception {
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(50, 60)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.questionCount").value(50))
                    .andExpect(jsonPath("$.durationMinutes").value(60));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject MAIN test with 49 questions")
        void shouldReject49Questions() throws Exception {
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(49, 60)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject MAIN test with 51 questions")
        void shouldReject51Questions() throws Exception {
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(51, 60)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject MAIN test with 59 minutes")
        void shouldReject59Minutes() throws Exception {
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(50, 59)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 60 minutes duration"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject MAIN test with 61 minutes")
        void shouldReject61Minutes() throws Exception {
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(50, 61)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 60 minutes duration"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject MAIN test without startTime")
        void shouldRejectMainWithoutStartTime() throws Exception {
            String json = """
                {
                    "title": "MAIN No Start Time",
                    "category": "ALL",
                    "totalQuestions": 50,
                    "duration": 60,
                    "testType": "MAIN"
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Start time is required for MAIN tests"));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("PRACTICE test unaffected by MAIN constraints")
        void shouldNotConstrainPractice() throws Exception {
            String json = """
                {
                    "title": "Practice Free Form",
                    "category": "JAVA",
                    "totalQuestions": 10,
                    "duration": 15,
                    "testType": "PRACTICE"
                }
                """;
            mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.questionCount").value(10))
                    .andExpect(jsonPath("$.durationMinutes").value(15));
        }

        @org.junit.jupiter.api.Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Reject updating MAIN test to non-60 duration")
        void shouldRejectUpdatingMainDuration() throws Exception {
            // Create a valid MAIN test
            String response = mockMvc.perform(post("/api/v1/tests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mainTestJson(50, 60)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            Long testId = objectMapper.readTree(response).get("id").asLong();

            // Attempt to update duration to 45
            String updateJson = """
                {
                    "duration": 45
                }
                """;
            mockMvc.perform(put("/api/v1/tests/" + testId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updateJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 60 minutes duration"));
        }
    }

    // ─── M-1: NEGATIVE MARKING SCORING CALCULATION ───────────────────────────

    @Nested
    @DisplayName("M-1: Scoring Formula Verification")
    class ScoringFormulaVerification {

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Score calculation with penalty 0.00: 8 correct, 2 wrong of 10 total = 80%")
        void shouldScoreZeroPenalty() {
            learniq_backend.model.Test test = createTestWithPenalty(BigDecimal.ZERO);
            List<Question> questions = seedQuestionsForTest(test, 10);

            // 8 correct, 2 wrong
            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            answers.put(String.valueOf(questions.get(8).getId()), "WRONG_ANSWER");
            answers.put(String.valueOf(questions.get(9).getId()), "WRONG_ANSWER");

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getTotalQuestions()).isEqualTo(10);
            assertThat(scored.getCorrectCount()).isEqualTo(8);
            assertThat(scored.getWrongCount()).isEqualTo(2);
            assertThat(scored.getAttemptedCount()).isEqualTo(10);
            assertThat(scored.getScorePercent()).isEqualTo(80);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Score calculation with penalty 0.25: 8 correct, 2 wrong of 10 total = 75%")
        void shouldScoreQuarterPenalty() {
            // Raw score = 8 - (2 * 0.25) = 7.5; Percent = (7.5 / 10) * 100 = 75%
            learniq_backend.model.Test test = createTestWithPenalty(new BigDecimal("0.25"));
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            answers.put(String.valueOf(questions.get(8).getId()), "WRONG_ANSWER");
            answers.put(String.valueOf(questions.get(9).getId()), "WRONG_ANSWER");

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(8);
            assertThat(scored.getWrongCount()).isEqualTo(2);
            assertThat(scored.getScorePercent()).isEqualTo(75);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Score calculation with penalty 0.50: 8 correct, 2 wrong of 10 total = 70%")
        void shouldScoreHalfPenalty() {
            // Raw score = 8 - (2 * 0.50) = 7.0; Percent = (7.0 / 10) * 100 = 70%
            learniq_backend.model.Test test = createTestWithPenalty(new BigDecimal("0.50"));
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            answers.put(String.valueOf(questions.get(8).getId()), "WRONG_ANSWER");
            answers.put(String.valueOf(questions.get(9).getId()), "WRONG_ANSWER");

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(8);
            assertThat(scored.getWrongCount()).isEqualTo(2);
            assertThat(scored.getScorePercent()).isEqualTo(70);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Score calculation with penalty 1.00: 8 correct, 2 wrong of 10 total = 60%")
        void shouldScoreFullPenalty() {
            // Raw score = 8 - (2 * 1.00) = 6.0; Percent = (6.0 / 10) * 100 = 60%
            learniq_backend.model.Test test = createTestWithPenalty(BigDecimal.ONE);
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            answers.put(String.valueOf(questions.get(8).getId()), "WRONG_ANSWER");
            answers.put(String.valueOf(questions.get(9).getId()), "WRONG_ANSWER");

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(8);
            assertThat(scored.getWrongCount()).isEqualTo(2);
            assertThat(scored.getScorePercent()).isEqualTo(60);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Score is floored at 0% when penalties exceed correct answers")
        void shouldFloorScoreAtZero() {
            // 2 correct, 8 wrong with penalty 1.00: rawScore = 2 - 8 = -6.0 -> 0%
            learniq_backend.model.Test test = createTestWithPenalty(BigDecimal.ONE);
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 2; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            for (int i = 2; i < 10; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), "WRONG_ANSWER");
            }

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(2);
            assertThat(scored.getWrongCount()).isEqualTo(8);
            assertThat(scored.getScorePercent()).isEqualTo(0);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Unanswered questions receive zero penalty")
        void shouldNotPenalizeUnansweredQuestions() {
            // 5 correct, 0 wrong, 5 unanswered with penalty 0.50: rawScore = 5 - 0 = 5.0 -> 50%
            learniq_backend.model.Test test = createTestWithPenalty(new BigDecimal("0.50"));
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 5; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            // remaining 5 are NOT attempted

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(5);
            assertThat(scored.getWrongCount()).isEqualTo(0);
            assertThat(scored.getAttemptedCount()).isEqualTo(5);
            assertThat(scored.getScorePercent()).isEqualTo(50);
        }

        @org.junit.jupiter.api.Test
        @Transactional
        @DisplayName("Backward compatibility: Test with null negativeMarking defaults to zero penalty")
        void shouldDefaultNullPenaltyToZeroInScoring() {
            learniq_backend.model.Test test = createTestWithPenalty(null);
            List<Question> questions = seedQuestionsForTest(test, 10);

            Map<String, String> answers = new HashMap<>();
            for (int i = 0; i < 8; i++) {
                answers.put(String.valueOf(questions.get(i).getId()), questions.get(i).getCorrectAnswer());
            }
            answers.put(String.valueOf(questions.get(8).getId()), "WRONG_ANSWER");
            answers.put(String.valueOf(questions.get(9).getId()), "WRONG_ANSWER");

            TestAttempt attempt = createAttemptForTest(test);
            TestAttempt scored = attemptService.finalizeAndSubmit(attempt, answers);

            assertThat(scored.getCorrectCount()).isEqualTo(8);
            assertThat(scored.getWrongCount()).isEqualTo(2);
            assertThat(scored.getScorePercent()).isEqualTo(80);
        }
    }

    // ─── M-1: ENTITY DEFAULTS ────────────────────────────────────────────────

    @Nested
    @DisplayName("M-1: Negative Marking Entity Defaults")
    class NegativeMarkingEntityDefaults {

        @org.junit.jupiter.api.Test
        @DisplayName("Test entity defaults negativeMarking to ZERO")
        void entityDefaultsToZero() {
            learniq_backend.model.Test test = new learniq_backend.model.Test();
            assertThat(test.getNegativeMarking()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("Test entity setter/getter round-trips BigDecimal")
        void entitySetterGetterRoundTrip() {
            learniq_backend.model.Test test = new learniq_backend.model.Test();
            test.setNegativeMarking(new BigDecimal("0.25"));
            assertThat(test.getNegativeMarking()).isEqualByComparingTo(new BigDecimal("0.25"));

            test.setNegativeMarking(BigDecimal.ONE);
            assertThat(test.getNegativeMarking()).isEqualByComparingTo(BigDecimal.ONE);
        }

        @org.junit.jupiter.api.Test
        @DisplayName("getNegativeMarking returns ZERO for null")
        void entityReturnsZeroForNull() {
            learniq_backend.model.Test test = new learniq_backend.model.Test();
            test.setNegativeMarking(null);
            assertThat(test.getNegativeMarking()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // ─── TEST HELPERS ────────────────────────────────────────────────────────

    private learniq_backend.model.Test createTestWithPenalty(BigDecimal penalty) {
        learniq_backend.model.Test test = new learniq_backend.model.Test();
        test.setTitle("Scoring Test " + UUID.randomUUID());
        test.setCategory("JAVA");
        test.setTestType("PRACTICE");
        test.setStatus("ACTIVE");
        test.setDurationMinutes(15);
        test.setQuestionCount(10);
        test.setNegativeMarking(penalty);
        return testRepository.save(test);
    }

    private List<Question> seedQuestionsForTest(learniq_backend.model.Test test, int count) {
        List<Question> existing = questionRepository.findRandomByCategory("JAVA", count);
        if (existing.size() >= count) {
            test.setQuestions(new ArrayList<>(existing));
            for (Question q : existing) {
                if (q.getTests() == null) q.setTests(new ArrayList<>());
                if (!q.getTests().contains(test)) q.getTests().add(test);
            }
            testRepository.save(test);
            return existing;
        }

        // Fallback: create ad-hoc questions if category lacks enough
        List<Question> created = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Question q = new Question();
            q.setQuestionText("Q" + i + " " + UUID.randomUUID());
            q.setCategory("JAVA");
            q.setOptionA("Alpha");
            q.setOptionB("Beta");
            q.setOptionC("Gamma");
            q.setOptionD("Delta");
            q.setCorrectAnswer("Alpha");
            q.setDifficultyLevel("Easy");
            Question savedQ = questionRepository.save(q);
            created.add(savedQ);
        }
        test.setQuestions(created);
        for (Question q : created) {
            if (q.getTests() == null) q.setTests(new ArrayList<>());
            q.getTests().add(test);
        }
        testRepository.save(test);
        return created;
    }

    private TestAttempt createAttemptForTest(learniq_backend.model.Test test) {
        User user = userRepository.findByEmail("student1@learniq.com")
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail("test_scoring_" + UUID.randomUUID() + "@learniq.com");
                    u.setName("Test Student");
                    u.setPassword("hashed");
                    u.setRole(User.Role.STUDENT);
                    return userRepository.save(u);
                });

        TestAttempt attempt = new TestAttempt();
        attempt.setTest(test);
        attempt.setUser(user);
        attempt.setUserEmail(user.getEmail());
        attempt.setUserName(user.getName());
        attempt.setStatus(TestAttempt.Status.IN_PROGRESS);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setEndTime(LocalDateTime.now().plusMinutes(test.getDurationMinutes()));
        attempt.setAnswers(new ArrayList<>());
        attempt.setTotalQuestions(test.getQuestionCount());
        attempt.setScorePercent(-1);
        return testAttemptRepository.save(attempt);
    }
}
