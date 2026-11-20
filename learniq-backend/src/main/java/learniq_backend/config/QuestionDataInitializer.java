package learniq_backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.Question;
import learniq_backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestionDataInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        List<Question> allQuestions = new ArrayList<>();

        for (int i = 1; i <= 4; i++) {
            String fileName = "seed_" + i + ".json";
            try (InputStream is = getClass().getResourceAsStream("/" + fileName)) {
                if (is != null) {
                    List<Question> questions = mapper.readValue(is, new TypeReference<List<Question>>() {});
                    allQuestions.addAll(questions);
                } else {
                    log.warn("Seed resource not found: /{}", fileName);
                }
            } catch (Exception e) {
                log.error("Failed to load seed file: {}", fileName, e);
            }
        }

        List<Question> existingQuestions = questionRepository.findAll();
        Map<String, Question> existingByText = new HashMap<>();
        for (Question eq : existingQuestions) {
            if (eq.getQuestionText() != null) {
                existingByText.put(eq.getQuestionText().trim(), eq);
            }
        }

        List<Question> toInsert = new ArrayList<>();
        List<Question> toRestore = new ArrayList<>();
        Set<String> processedTexts = new HashSet<>();

        for (Question sq : allQuestions) {
            if (sq == null || sq.getQuestionText() == null || sq.getQuestionText().trim().isEmpty()) {
                continue;
            }
            String trimmedText = sq.getQuestionText().trim();
            if (!processedTexts.add(trimmedText)) {
                continue;
            }

            Question existing = existingByText.get(trimmedText);
            if (existing == null) {
                sq.setQuestionText(trimmedText);
                toInsert.add(sq);
            } else if (existing.isDeleted()) {
                existing.setDeleted(false);
                toRestore.add(existing);
            }
        }

        if (!toInsert.isEmpty()) {
            questionRepository.saveAll(toInsert);
            log.info("Successfully seeded {} missing baseline questions into database. Total in DB: {}",
                    toInsert.size(), questionRepository.count());
        }
        if (!toRestore.isEmpty()) {
            questionRepository.saveAll(toRestore);
            log.info("Successfully restored {} previously soft-deleted seed questions.", toRestore.size());
        }
        if (toInsert.isEmpty() && toRestore.isEmpty()) {
            log.info("Question catalog verification complete. All {} baseline seed questions are active in repository (Total in DB: {}).",
                    allQuestions.size(), existingQuestions.size());
        }
    }
}
