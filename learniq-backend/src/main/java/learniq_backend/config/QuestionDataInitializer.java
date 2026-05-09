package learniq_backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.Question;
import learniq_backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class QuestionDataInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        if (questionRepository.count() > 0) {
            System.out.println("Questions already present, skipping seeding.");
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
                }
            }
        }

        if (!allQuestions.isEmpty()) {
            questionRepository.saveAll(allQuestions);
            System.out.println("Successfully seeded " + allQuestions.size() + " normalized questions.");
        }
    }
}
