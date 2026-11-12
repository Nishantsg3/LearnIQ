package learniq_backend.config;

import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:question_initializer_safety_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class QuestionDataInitializerSafetyTest {

    @Autowired
    private QuestionDataInitializer questionDataInitializer;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestRepository testRepository;

    @org.junit.jupiter.api.Test
    @DisplayName("SAFETY-01: Pre-existing questions linked to tests are preserved when initializer runs (no deleteAll, no foreign key violation, count preserved)")
    @Transactional
    void preExistingQuestionsLinkedToTestsPreserved() throws Exception {
        // Create custom questions linked to an active Test entity
        Question customQ1 = Question.builder()
                .questionText("Safety Test Question 1: What is polymorphism?")
                .optionA("Many forms")
                .optionB("Single form")
                .optionC("No form")
                .optionD("None")
                .correctAnswer("A")
                .category("Java")
                .difficultyLevel("Easy")
                .build();

        Question customQ2 = Question.builder()
                .questionText("Safety Test Question 2: What is encapsulation?")
                .optionA("Data binding")
                .optionB("Data hiding")
                .optionC("Both A and B")
                .optionD("None")
                .correctAnswer("C")
                .category("Java")
                .difficultyLevel("Easy")
                .build();

        customQ1 = questionRepository.save(customQ1);
        customQ2 = questionRepository.save(customQ2);

        Test testExam = new Test();
        testExam.setTitle("Pre-Existing Exam Linked To Questions");
        testExam.setCategory("Java");
        testExam.setDurationMinutes(45);
        testExam.setQuestionCount(2);
        testExam.setStatus("ACTIVE");
        testExam.setQuestions(new ArrayList<>(List.of(customQ1, customQ2)));

        Test savedTest = testRepository.save(testExam);

        long questionCountBefore = questionRepository.count();
        assertTrue(questionCountBefore >= 2, "Questions must exist before running initializer");

        // Run the initializer - must NOT wipe the catalog or delete pre-existing questions
        assertDoesNotThrow(() -> questionDataInitializer.run());

        // Verify counts and relationships are 100% preserved
        long questionCountAfter = questionRepository.count();
        assertEquals(questionCountBefore, questionCountAfter,
                "Question count must be strictly preserved without deletion or duplicate insertion");

        assertTrue(questionRepository.existsById(customQ1.getId()), "Question 1 must still exist");
        assertTrue(questionRepository.existsById(customQ2.getId()), "Question 2 must still exist");

        List<Question> linkedQuestions = questionRepository.findByTestId(savedTest.getId());
        assertEquals(2, linkedQuestions.size(), "Linked test questions must remain intact without FK violations");
    }

    @org.junit.jupiter.api.Test
    @DisplayName("SAFETY-02: Running initializer multiple times is idempotent (no duplicate key exception)")
    void runningInitializerMultipleTimesIsIdempotent() {
        long countInitial = questionRepository.count();

        // Run multiple times in succession
        assertDoesNotThrow(() -> questionDataInitializer.run(), "Run 1 must not throw any exception");
        long countAfterRun1 = questionRepository.count();
        assertEquals(countInitial, countAfterRun1, "Count must remain consistent");

        assertDoesNotThrow(() -> questionDataInitializer.run(), "Run 2 must not throw duplicate key or unique constraint violation");
        long countAfterRun2 = questionRepository.count();
        assertEquals(countAfterRun1, countAfterRun2, "Second run must be idempotent");

        assertDoesNotThrow(() -> questionDataInitializer.run(), "Run 3 must also be idempotent");
        long countAfterRun3 = questionRepository.count();
        assertEquals(countAfterRun2, countAfterRun3, "Third run must be idempotent");
    }

    @org.junit.jupiter.api.Test
    @DisplayName("SAFETY-03: Null question text on existing row does not trigger table wipe")
    void nullQuestionTextOnExistingRowDoesNotTriggerTableWipe() throws Exception {
        // Insert a question with null questionText (simulating legacy/corrupted data)
        Question nullTextQuestion = Question.builder()
                .questionText(null)
                .category("Unassigned")
                .difficultyLevel("Easy")
                .build();

        nullTextQuestion = questionRepository.save(nullTextQuestion);
        assertNotNull(nullTextQuestion.getId(), "Corrupted/null question must be persisted");

        long countBefore = questionRepository.count();
        assertTrue(countBefore > 0, "Catalog must have questions including the null-text question");

        // Prior buggy implementation had:
        // if (sample.isPresent() && sample.get().getQuestionText() == null) questionRepository.deleteAll();
        // The safe implementation must never wipe the table!
        assertDoesNotThrow(() -> questionDataInitializer.run(), "Initializer must not throw when encountering null text");

        long countAfter = questionRepository.count();
        assertEquals(countBefore, countAfter, "Catalog must NOT be wiped when existing question text is null");
        assertTrue(questionRepository.existsById(nullTextQuestion.getId()),
                "Question with null questionText must remain in repository and not be deleted");
    }
}
