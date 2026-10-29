package learniq_backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilTest {

    private static final String VALID_TEST_SECRET = "test-custom-jwt-secret-key-minimum-32-chars-long";
    private static final String COMMITTED_DEV_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @Test
    @DisplayName("Constructor throws IllegalStateException when secret is null")
    void testMissingSecretThrowsIllegalStateException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(null));
        assertTrue(ex.getMessage().contains("missing or blank"), "Expected missing/blank error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException when secret is empty string")
    void testEmptySecretThrowsIllegalStateException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(""));
        assertTrue(ex.getMessage().contains("missing or blank"), "Expected missing/blank error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException when secret is whitespace only")
    void testBlankSecretThrowsIllegalStateException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil("   \t\n  "));
        assertTrue(ex.getMessage().contains("missing or blank"), "Expected missing/blank error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException when secret is shorter than 32 characters")
    void testTooShortSecretThrowsIllegalStateException() {
        String shortSecret = "too-short-key";
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(shortSecret));
        assertTrue(ex.getMessage().contains("too short"), "Expected too short error message");
        assertFalse(ex.getMessage().contains(shortSecret), "Error message must never expose secret");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException for known insecure fallback string")
    void testInsecureHardcodedFallbackSecretThrows() {
        String insecure = "learniq-super-secret-key-2026-very-long-secret-key-please-change-this";
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(insecure));
        assertTrue(ex.getMessage().contains("insecure default"), "Expected insecure default error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException for any secret containing 'please-change-this'")
    void testInsecurePatternThrows() {
        String insecure = "my-custom-test-secret-please-change-this-now-1234";
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(insecure));
        assertTrue(ex.getMessage().contains("insecure default"), "Expected insecure default error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException for example placeholder from env example")
    void testInsecureExampleSecretThrows() {
        String insecure = "your_jwt_secret_key_minimum_32_characters_long_example";
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtUtil(insecure));
        assertTrue(ex.getMessage().contains("insecure default"), "Expected insecure default error message");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException when committed dev secret is used in dev profile")
    void testCommittedDevSecretInDevProfileThrows() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtUtil(COMMITTED_DEV_SECRET, "dev")
        );
        assertTrue(ex.getMessage().contains("Committed development JWT secret cannot be used"),
                "Expected rejection of committed dev secret in dev profile");
    }

    @Test
    @DisplayName("Constructor throws IllegalStateException when committed dev secret is used in production profile")
    void testCommittedDevSecretInProductionProfileThrows() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtUtil(COMMITTED_DEV_SECRET, "prod")
        );
        assertTrue(ex.getMessage().contains("Committed development JWT secret cannot be used"),
                "Expected rejection of committed dev secret in prod profile");
    }

    @Test
    @DisplayName("Validation fails for an expired token")
    void testExpiredTokenValidationFails() {
        String testSecret = "test-custom-jwt-secret-key-minimum-32-chars-long";
        JwtUtil util = new JwtUtil(testSecret);

        java.security.Key key = io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                testSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String expiredToken = io.jsonwebtoken.Jwts.builder()
                .setSubject("expired@learniq.org")
                .claim("role", "STUDENT")
                .setIssuedAt(new java.util.Date(System.currentTimeMillis() - 1000 * 60 * 60 * 2)) // 2 hours ago
                .setExpiration(new java.util.Date(System.currentTimeMillis() - 1000 * 60 * 60)) // expired 1 hour ago
                .signWith(key)
                .compact();

        assertFalse(util.validateToken(expiredToken), "Expired token must fail validation");
    }

    @Test
    @DisplayName("Valid secret allows token generation, claim extraction, and validation")
    void testValidSecretOperations() {
        JwtUtil util = new JwtUtil(VALID_TEST_SECRET, "prod");
        String email = "student@learniq.org";
        String role = "STUDENT";

        String token = util.generateToken(email, role);
        assertNotNull(token);
        assertTrue(util.validateToken(token));
        assertEquals(email, util.extractEmail(token));
        assertEquals(role, util.extractRole(token));
    }

    @Test
    @DisplayName("Validation fails for tampered or invalid tokens")
    void testTokenValidationFailures() {
        JwtUtil util = new JwtUtil(VALID_TEST_SECRET);
        String token = util.generateToken("user@learniq.org", "ADMIN");

        assertFalse(util.validateToken(token + "tampered"));
        assertFalse(util.validateToken("not-a-jwt"));
        assertFalse(util.validateToken(""));
    }

    @Test
    @DisplayName("Validation fails when token was signed with a different key")
    void testTokenSignedWithDifferentKeyFails() {
        JwtUtil util1 = new JwtUtil("first-valid-jwt-signing-secret-key-11111111");
        JwtUtil util2 = new JwtUtil("second-valid-jwt-signing-secret-key-22222222");

        String token = util1.generateToken("user@learniq.org", "STUDENT");
        assertTrue(util1.validateToken(token));
        assertFalse(util2.validateToken(token));
    }
}
