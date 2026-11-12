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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuestionDataInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        if (questionRepository.count() > 0) {
            log.info("Questions already present in database (count: {}). Seeding skipped to preserve existing catalog.", questionRepository.count());
            return;
        }

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

        List<Question> validQuestions = new ArrayList<>();
        Set<String> seenTexts = new HashSet<>();

        for (Question q : allQuestions) {
            if (q == null || q.getQuestionText() == null || q.getQuestionText().trim().isEmpty()) {
                log.warn("Skipping invalid seed question with null or blank questionText");
                continue;
            }
            String trimmedText = q.getQuestionText().trim();
            if (seenTexts.add(trimmedText) && !questionRepository.existsByQuestionText(trimmedText)) {
                q.setQuestionText(trimmedText);
                validQuestions.add(q);
            }
        }

        if (!validQuestions.isEmpty()) {
            questionRepository.saveAll(validQuestions);
            log.info("Successfully seeded {} normalized questions.", validQuestions.size());
        }
    }
}
