package learniq_backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.model.Question;
import learniq_backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class QuestionDataInitializer implements CommandLineRunner {

    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;

    @Override
    public void run(String... args) throws Exception {
        if (questionRepository.count() == 0) {
            String[] seedFiles = {"seed_1.json", "seed_2.json", "seed_3.json", "seed_4.json"};
            int totalSeeded = 0;

            for (String fileName : seedFiles) {
                Resource resource = resourceLoader.getResource("classpath:" + fileName);
                if (resource.exists()) {
                    List<Question> questions = objectMapper.readValue(
                        resource.getInputStream(),
                        new TypeReference<List<Question>>() {}
                    );
                    questionRepository.saveAll(questions);
                    totalSeeded += questions.size();
                }
            }
            System.out.println("Questions seeded: " + totalSeeded);
        } else {
            System.out.println("Question bank already populated, skipping seeding.");
        }
    }
}
