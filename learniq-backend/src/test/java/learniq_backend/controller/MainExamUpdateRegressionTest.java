package learniq_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:main_update_reg_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class MainExamUpdateRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private List<Question> createAndPersistQuestions(int count) {
        List<Question> questions = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Question q = Question.builder()
                    .questionText("Regression Q " + i + " " + UUID.randomUUID())
                    .category("JAVA")
                    .difficultyLevel("Medium")
                    .optionA("Option A")
                    .optionB("Option B")
                    .optionC("Option C")
                    .optionD("Option D")
                    .correctAnswer("Option A")
                    .build();
            questions.add(questionRepository.save(q));
        }
        return questions;
    }

    private Test createPracticeTestWithQuestions(int questionCount) {
        Test test = new Test();
        test.setTitle("Practice Test " + UUID.randomUUID());
        test.setCategory("JAVA");
        test.setTestType("PRACTICE");
        test.setStatus("ACTIVE");
        test.setDurationMinutes(questionCount > 0 ? (int) Math.ceil(questionCount * 1.5) : 15);
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

    private Test createMainTestWithQuestions(int questionCount, int durationMinutes) {
        Test test = new Test();
        test.setTitle("MAIN Test " + UUID.randomUUID());
        test.setCategory("JAVA");
        test.setTestType("MAIN");
        test.setStatus("ACTIVE");
        test.setDurationMinutes(durationMinutes);
        test.setQuestionCount(questionCount);
        test.setStartTime(LocalDateTime.now().plusHours(1));
        test.setEndTime(test.getStartTime().plusMinutes(durationMinutes));
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
    @WithMockUser(roles = "ADMIN")
    @DisplayName("2.a: PRACTICE test with 10 questions -> PUT update testType to MAIN with duration 60 is REJECTED with 400")
    void shouldRejectConvertingPracticeWith10QuestionsToMain() throws Exception {
        Test practiceTest = createPracticeTestWithQuestions(10);

        String updateJson = """
            {
                "testType": "MAIN",
                "duration": 60
            }
            """;

        mockMvc.perform(put("/api/v1/tests/" + practiceTest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("2.b: PRACTICE test with 50 actual questions linked -> PUT update testType to MAIN with duration 60 is ACCEPTED with 200")
    void shouldAcceptConvertingPracticeWith50QuestionsToMain() throws Exception {
        Test practiceTest = createPracticeTestWithQuestions(50);

        String updateJson = """
            {
                "testType": "MAIN",
                "duration": 60
            }
            """;

        mockMvc.perform(put("/api/v1/tests/" + practiceTest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.testType").value("MAIN"))
                .andExpect(jsonPath("$.durationMinutes").value(60));

        Test updated = testRepository.findById(practiceTest.getId()).orElseThrow();
        assertThat(updated.getTestType()).isEqualTo("MAIN");
        assertThat(updated.getDurationMinutes()).isEqualTo(60);
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("2.c: Existing MAIN test (50 questions, 60 min) -> PUT update title/description/negativeMarking is ACCEPTED with 200")
    void shouldAcceptUpdatingExistingMainTestDetails() throws Exception {
        Test mainTest = createMainTestWithQuestions(50, 60);

        String updateJson = """
            {
                "title": "Updated MAIN Title",
                "description": "Updated Description for MAIN exam",
                "negativeMarking": 0.25
            }
            """;

        mockMvc.perform(put("/api/v1/tests/" + mainTest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated MAIN Title"))
                .andExpect(jsonPath("$.description").value("Updated Description for MAIN exam"))
                .andExpect(jsonPath("$.negativeMarking").value(0.25));

        Test updated = testRepository.findById(mainTest.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Updated MAIN Title");
        assertThat(updated.getDescription()).isEqualTo("Updated Description for MAIN exam");
        assertThat(updated.getNegativeMarking()).isEqualByComparingTo(new BigDecimal("0.25"));
        assertThat(updated.getTestType()).isEqualTo("MAIN");
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("2.d: Existing MAIN test -> PUT update duration to 45 (non-60) is REJECTED with 400")
    void shouldRejectUpdatingMainDurationToNon60() throws Exception {
        Test mainTest = createMainTestWithQuestions(50, 60);

        String updateJson = """
            {
                "duration": 45
            }
            """;

        mockMvc.perform(put("/api/v1/tests/" + mainTest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 60 minutes duration"));
    }

    @org.junit.jupiter.api.Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("2.e: MAIN test update with inconsistent linked questions (< 50) is REJECTED with 400")
    void shouldRejectUpdatingMainTestWithInconsistentLinkedQuestions() throws Exception {
        Test mainTest = createMainTestWithQuestions(50, 60);

        // Simulate question removal so linked count drops below 50 (Test owns the join table)
        List<Question> reducedQuestions = new ArrayList<>(mainTest.getQuestions().subList(0, 40));
        mainTest.setQuestions(reducedQuestions);
        mainTest.setQuestionCount(40);
        testRepository.save(mainTest);

        String updateJson = """
            {
                "title": "Attempted Title Update With 40 Questions"
            }
            """;

        mockMvc.perform(put("/api/v1/tests/" + mainTest.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("MAIN examinations must have exactly 50 questions"));
    }
}
