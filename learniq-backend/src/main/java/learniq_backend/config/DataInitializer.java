package learniq_backend.config;

import learniq_backend.model.User;
import learniq_backend.model.Question;
import learniq_backend.repository.UserRepository;
import learniq_backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.io.InputStream;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${app.seed.admin.email:admin@learniq.com}")
    private String adminEmail;

    @Value("${app.seed.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.seed.admin.name:LearnIQ Admin}")
    private String adminName;

    @Override
    public void run(String... args) {
        // 1. Seed Admin
        if (!userRepository.existsByRole(User.Role.ADMIN)) {
            User admin = User.builder()
                    .name(adminName)
                    .email(adminEmail.toLowerCase())
                    .password(passwordEncoder.encode(adminPassword))
                    .role(User.Role.ADMIN)
                    .isVerified(true)
                    .build();

            userRepository.save(admin);
            System.out.println("Initial admin account created: " + adminEmail);
        }

        // 2. Seed Demo Students (only if no students exist)
        if (userRepository.countByRole(User.Role.STUDENT) == 0) {
            userRepository.save(User.builder()
                    .name("Demo Student")
                    .email("student1@learniq.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(User.Role.STUDENT)
                    .isVerified(true)
                    .build());
            System.out.println("Demo student account created: student1@learniq.com");
        }

        // 3. Seed Question Bank (only if bank is low)
        if (questionRepository.findByTestIsNull().size() < 50) {
            String[] files = {"seed_1.json", "seed_2.json", "seed_3.json", "seed_4.json"};
            for (String file : files) {
                try (InputStream is = new ClassPathResource(file).getInputStream()) {
                    List<Question> qs = objectMapper.readValue(is, new TypeReference<List<Question>>(){});
                    questionRepository.saveAll(qs);
                } catch (Exception e) {
                    System.err.println("Note: Could not load seed file " + file + " (this is fine for production)");
                }
            }
        }
    }
}
