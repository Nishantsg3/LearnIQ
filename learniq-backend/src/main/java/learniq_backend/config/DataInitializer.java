package learniq_backend.config;

import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.password}")
    private String adminPassword;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.name}")
    private String adminName;

    @Override
    public void run(String... args) throws Exception {
        if (adminEmail == null || adminPassword == null || "none".equals(adminEmail)) {
            System.out.println("[INITIALIZER] Admin seeding skipped: Config missing.");
            return;
        }

        Optional<User> existingAdmin = userRepository.findByEmail(adminEmail);

        User admin = existingAdmin.orElse(new User());

        admin.setName(adminName);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(User.Role.ADMIN);
        admin.setVerified(true);

        userRepository.save(admin);

        System.out.println("[INITIALIZER] Admin account verified/created: " + adminEmail);
    }
}
