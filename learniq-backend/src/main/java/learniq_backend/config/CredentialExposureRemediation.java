package learniq_backend.config;

import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup remediation runner that scans for historical, potentially exposed
 * OTP or password reset tokens and securely invalidates them by nulling them out.
 *
 * Controlled by the explicit configuration property `app.security.cleanup-legacy-tokens=true`.
 * Disabled by default to prevent accidental token invalidation of legitimate
 * in-flight user sessions during routine restarts or redeployments.
 *
 * In accordance with zero-leakage security constraints, sensitive credential
 * values are never logged or printed.
 */
@Component
@Order(12)
@ConditionalOnProperty(name = "app.security.cleanup-legacy-tokens", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class CredentialExposureRemediation implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<User> exposedUsers = userRepository.findAll().stream()
                .filter(u -> u.getOtp() != null || u.getResetToken() != null)
                .toList();

        if (exposedUsers.isEmpty()) {
            log.info("[CREDENTIAL-REMEDIATION] No exposed OTP or password reset credentials found in database.");
            return;
        }

        int count = 0;
        for (User u : exposedUsers) {
            u.setOtp(null);
            u.setOtpExpiry(null);
            u.setResetToken(null);
            u.setResetTokenExpiry(null);
            count++;
        }
        userRepository.saveAll(exposedUsers);
        log.warn("[CREDENTIAL-REMEDIATION] Securely invalidated exposed credentials across {} user account(s).", count);
    }
}
