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
        if (isInvalidCredential(adminEmail) || isInvalidCredential(adminPassword)) {
            System.out.println("[INITIALIZER] Admin seeding skipped: Configuration missing or set to placeholder.");
            return;
        }

        String targetEmail = adminEmail.trim();
        String targetPassword = adminPassword.trim();
        String targetName = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "Administrator";

        Optional<User> existingAdmin = userRepository.findByEmail(targetEmail);

        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            String pwd = admin.getPassword();
            if (pwd != null && !pwd.startsWith("$2a$") && !pwd.startsWith("$2b$") && !pwd.startsWith("$2y$")) {
                if (java.security.MessageDigest.isEqual(
                        pwd.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        targetPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
                    admin.setPassword(passwordEncoder.encode(targetPassword));
                    userRepository.save(admin);
                    System.out.println("[INITIALIZER] Upgraded seeded admin password to BCrypt hash: " + targetEmail);
                }
            } else {
                System.out.println("[INITIALIZER] Admin account already exists: " + targetEmail);
            }
            return;
        }

        User admin = new User();
        admin.setName(targetName);
        admin.setEmail(targetEmail);
        admin.setPassword(passwordEncoder.encode(targetPassword));
        admin.setRole(User.Role.ADMIN);
        admin.setVerified(true);

        userRepository.save(admin);
        System.out.println("[INITIALIZER] Admin account created: " + targetEmail);
    }

    private boolean isInvalidCredential(String value) {
        if (value == null) return true;
        String trimmed = value.trim();
        return trimmed.isEmpty() || "none".equalsIgnoreCase(trimmed);
    }

    void setAdminCredentials(String email, String password, String name) {
        this.adminEmail = email;
        this.adminPassword = password;
        this.adminName = name;
    }
}
