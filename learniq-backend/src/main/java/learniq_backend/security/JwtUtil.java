package learniq_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;
    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

    public JwtUtil(@Value("${app.jwt.secret:}") String secret) {

        // ✅ fallback if env variable fails
        if (secret == null || secret.isEmpty()) {
            secret = "learniq-super-secret-key-2026-very-long-secret-key-please-change-this";
        }

        // ✅ enforce minimum length (required by jjwt)
        if (secret.length() < 32) {
            // Use safe fallback instead of throwing to prevent application crash
            System.err.println("WARNING: JWT secret is too short (<32 chars). Falling back to secure default.");
            secret = "learniq-super-secret-key-2026-very-long-secret-key-please-change-this";
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
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
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
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