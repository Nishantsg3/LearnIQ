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

        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            String pwd = admin.getPassword();
            if (pwd != null && !pwd.startsWith("$2a$") && !pwd.startsWith("$2b$") && !pwd.startsWith("$2y$")) {
                if (adminPassword != null && java.security.MessageDigest.isEqual(
                        pwd.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        adminPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    userRepository.save(admin);
                    System.out.println("[INITIALIZER] Upgraded seeded admin password to BCrypt hash: " + adminEmail);
                }
            } else {
                System.out.println("[INITIALIZER] Admin account already exists: " + adminEmail);
            }
            return;
        }

        User admin = new User();
        admin.setName(adminName);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(User.Role.ADMIN);
        admin.setVerified(true);

        userRepository.save(admin);
        System.out.println("[INITIALIZER] Admin account created: " + adminEmail);
    }
}
