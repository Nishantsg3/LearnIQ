package learniq_backend.config;

import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class CredentialExposureRemediationTest {

    private static final String TEST_JWT_SECRET = "test-only-jwt-secret-not-for-production-minimum-32-chars-long";

    /**
     * Test suite verifying default behavior (property absent or false):
     * The runner bean MUST NOT be registered in the application context.
     */
    @Nested
    @SpringBootTest
    @TestPropertySource(properties = {
            "spring.datasource.url=jdbc:h2:mem:credential_remediation_test;DB_CLOSE_DELAY=-1",
            "spring.datasource.driverClassName=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "APP_JWT_SECRET=" + TEST_JWT_SECRET,
            "app.jwt.secret=" + TEST_JWT_SECRET
    })
    class DisabledByDefaultTests {

        @Autowired
        private ApplicationContext context;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private DataSource dataSource;

        @Test
        @DisplayName("OPS-00: Verify DisabledByDefaultTests runs on isolated in-memory H2 datasource")
        void verifyIsolatedInMemoryDatasource() throws Exception {
            try (Connection conn = dataSource.getConnection()) {
                String actualJdbcUrl = conn.getMetaData().getURL();
                assertNotNull(actualJdbcUrl, "JDBC URL must not be null");
                assertTrue(actualJdbcUrl.startsWith("jdbc:h2:mem:credential_remediation_test"),
                        "Expected in-memory datasource URL but got: " + actualJdbcUrl);
                assertFalse(actualJdbcUrl.contains("file:"),
                        "Connection must NOT connect to file-backed database: " + actualJdbcUrl);
            }
        }

        @Test
        @DisplayName("OPS-01: CredentialExposureRemediation bean is NOT registered when property is absent / default")
        void runnerNotRegisteredByDefault() {
            assertFalse(context.containsBean("credentialExposureRemediation"),
                    "CredentialExposureRemediation bean must NOT be registered when property is absent");
        }

        @Test
        @DisplayName("OPS-01: Ordinary startup does NOT clear in-flight legitimate OTP or reset tokens")
        void ordinaryStartupPreservesActiveTokens() {
            String testEmail = "inflight.candidate." + UUID.randomUUID() + "@learniq.test";
            String sampleOtp = "456789";
            String sampleResetToken = "valid-reset-token-" + UUID.randomUUID();
            LocalDateTime futureExpiry = LocalDateTime.now().plusMinutes(30);

            User student = new User();
            student.setName("Inflight Candidate");
            student.setEmail(testEmail);
            student.setPassword("$2a$10$hashedPasswordSample12345");
            student.setRole(User.Role.STUDENT);
            student.setVerified(false);
            student.setOtp(sampleOtp);
            student.setOtpExpiry(futureExpiry);
            student.setResetToken(sampleResetToken);
            student.setResetTokenExpiry(futureExpiry);

            student = userRepository.save(student);
            Long userId = student.getId();

            try {
                // Verify tokens are present and intact
                User reloaded = userRepository.findById(userId).orElse(null);
                assertNotNull(reloaded);
                assertEquals(sampleOtp, reloaded.getOtp());
                assertEquals(sampleResetToken, reloaded.getResetToken());
                assertNotNull(reloaded.getOtpExpiry());
                assertNotNull(reloaded.getResetTokenExpiry());
            } finally {
                userRepository.deleteById(userId);
            }
        }
    }

    /**
     * Test suite verifying explicit false configuration:
     * The runner bean MUST NOT be registered.
     */
    @Nested
    @SpringBootTest
    @TestPropertySource(properties = {
            "spring.datasource.url=jdbc:h2:mem:credential_remediation_test;DB_CLOSE_DELAY=-1",
            "spring.datasource.driverClassName=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "APP_JWT_SECRET=" + TEST_JWT_SECRET,
            "app.jwt.secret=" + TEST_JWT_SECRET,
            "app.security.cleanup-legacy-tokens=false",
            "APP_SECURITY_CLEANUP_LEGACY_TOKENS=false"
    })
    class ExplicitlyDisabledTests {

        @Autowired
        private ApplicationContext context;

        @Test
        @DisplayName("OPS-01: CredentialExposureRemediation bean is NOT registered when property is explicitly false")
        void runnerNotRegisteredWhenExplicitlyFalse() {
            assertFalse(context.containsBean("credentialExposureRemediation"),
                    "CredentialExposureRemediation bean must NOT be registered when property is false");
        }
    }

    /**
     * Test suite verifying deliberate execution when enabled:
     * The runner bean IS registered and successfully nulls exposed credentials.
     */
    @Nested
    @SpringBootTest
    @TestPropertySource(properties = {
            "spring.datasource.url=jdbc:h2:mem:credential_remediation_test;DB_CLOSE_DELAY=-1",
            "spring.datasource.driverClassName=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "APP_JWT_SECRET=" + TEST_JWT_SECRET,
            "app.jwt.secret=" + TEST_JWT_SECRET,
            "app.security.cleanup-legacy-tokens=true",
            "APP_SECURITY_CLEANUP_LEGACY_TOKENS=true"
    })
    class DeliberatelyEnabledTests {

        @Autowired
        private ApplicationContext context;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private DataSource dataSource;

        @Test
        @DisplayName("OPS-00: Verify DeliberatelyEnabledTests runs on isolated in-memory H2 datasource")
        void verifyIsolatedInMemoryDatasource() throws Exception {
            try (Connection conn = dataSource.getConnection()) {
                String actualJdbcUrl = conn.getMetaData().getURL();
                assertNotNull(actualJdbcUrl, "JDBC URL must not be null");
                assertTrue(actualJdbcUrl.startsWith("jdbc:h2:mem:credential_remediation_test"),
                        "Expected in-memory datasource URL but got: " + actualJdbcUrl);
                assertFalse(actualJdbcUrl.contains("file:"),
                        "Connection must NOT connect to file-backed database: " + actualJdbcUrl);
            }
        }

        @Test
        @DisplayName("OPS-01: CredentialExposureRemediation bean IS registered when property is true")
        void runnerRegisteredWhenPropertyTrue() {
            assertTrue(context.containsBean("credentialExposureRemediation"),
                    "CredentialExposureRemediation bean must be registered when property is true");
        }

        @Test
        @DisplayName("OPS-01: Deliberately enabling cleanup runner nulls exposed credentials properly")
        void deliberateCleanupExecutionNullsCredentials() {
            // Create user with tokens
            String targetEmail = "cleanup.target." + UUID.randomUUID() + "@learniq.test";
            User target = new User();
            target.setName("Target Candidate");
            target.setEmail(targetEmail);
            target.setPassword("$2a$10$hashedPasswordSample12345");
            target.setRole(User.Role.STUDENT);
            target.setVerified(true);
            target.setOtp("987123");
            target.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            target.setResetToken("legacy-token-" + UUID.randomUUID());
            target.setResetTokenExpiry(LocalDateTime.now().plusMinutes(20));

            target = userRepository.save(target);
            Long userId = target.getId();

            try {
                // Obtain the registered runner bean and invoke it explicitly
                CredentialExposureRemediation runner = context.getBean(CredentialExposureRemediation.class);
                runner.run();

                User sanitized = userRepository.findById(userId).orElse(null);
                assertNotNull(sanitized);
                assertNull(sanitized.getOtp(), "OTP must be nulled after runner execution");
                assertNull(sanitized.getOtpExpiry(), "OTP expiry must be nulled after runner execution");
                assertNull(sanitized.getResetToken(), "Reset token must be nulled after runner execution");
                assertNull(sanitized.getResetTokenExpiry(), "Reset token expiry must be nulled after runner execution");

                // Core user attributes must remain untouched
                assertEquals("Target Candidate", sanitized.getName());
                assertEquals(targetEmail, sanitized.getEmail());
                assertEquals(User.Role.STUDENT, sanitized.getRole());
                assertTrue(sanitized.isVerified());
            } finally {
                userRepository.deleteById(userId);
            }
        }
    }
}
