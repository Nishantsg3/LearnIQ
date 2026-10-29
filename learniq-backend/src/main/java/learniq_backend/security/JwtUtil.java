package learniq_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Set;

@Component
public class JwtUtil {

    private static final int MIN_SECRET_LENGTH = 32;

    private static final String COMMITTED_DEV_SECRET =
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private static final Set<String> INSECURE_COMMITTED_DEFAULTS = Set.of(
            "learniq-super-secret-key-2026-very-long-secret-key-please-change-this",
            "your_jwt_secret_key_minimum_32_characters_long_example"
    );

    private final Key key;
    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

    @Autowired
    public JwtUtil(@Value("${app.jwt.secret:}") String secret,
                   @Value("${spring.profiles.active:dev}") String activeProfile) {
        validateSecret(secret, activeProfile);
        this.key = Keys.hmacShaKeyFor(secret.trim().getBytes(StandardCharsets.UTF_8));
    }

    public JwtUtil(String secret) {
        this(secret, "dev");
    }

    private static void validateSecret(String secret, String activeProfile) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret ('app.jwt.secret') is missing or blank. Please set APP_JWT_SECRET.");
        }

        String trimmed = secret.trim();

        if (trimmed.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("JWT secret ('app.jwt.secret') is too short ("
                    + trimmed.length() + " chars). Minimum length is " + MIN_SECRET_LENGTH + " characters.");
        }

        if (trimmed.toLowerCase().contains("please-change-this") || INSECURE_COMMITTED_DEFAULTS.contains(trimmed)) {
            throw new IllegalStateException("JWT secret ('app.jwt.secret') matches a known insecure default. A secure secret must be configured.");
        }

        if (COMMITTED_DEV_SECRET.equals(trimmed)) {
            throw new IllegalStateException("Committed development JWT secret cannot be used. Set a unique APP_JWT_SECRET.");
        }
    }

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}