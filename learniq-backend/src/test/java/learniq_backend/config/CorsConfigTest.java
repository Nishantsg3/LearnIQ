package learniq_backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    @DisplayName("CORS: Exact production origin and localhost ports must be allowed")
    void testAllowedOrigins() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "https://custom-partner.learniq.org");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();

        // 1. Localhost 5173
        request.addHeader("Origin", "http://localhost:5173");
        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);
        assertEquals("http://localhost:5173", config.checkOrigin("http://localhost:5173"));

        // 2. Production Render origin
        assertEquals("https://learniq-frontend-7oyn.onrender.com", config.checkOrigin("https://learniq-frontend-7oyn.onrender.com"));

        // 3. Explicitly configured frontend origin
        assertEquals("https://custom-partner.learniq.org", config.checkOrigin("https://custom-partner.learniq.org"));
    }

    @Test
    @DisplayName("CORS: Arbitrary Render subdomains and malicious origins must be rejected")
    void testRejectedOrigins() {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "https://custom-partner.learniq.org");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);

        // 1. Unrelated Render subdomain
        assertNull(config.checkOrigin("https://attacker-app.onrender.com"));
        assertNull(config.checkOrigin("https://learniq-frontend-fake.onrender.com"));

        // 2. Arbitrary external origin
        assertNull(config.checkOrigin("https://evil-phishing.com"));

        // 3. Wildcard origin string must never match
        assertNull(config.checkOrigin("*"));
    }

    @Test
    @DisplayName("CORS: Wildcard patterns in configured frontendUrl must be ignored/rejected")
    void testWildcardInConfigIgnored() {
        CorsConfig corsConfig = new CorsConfig();
        // Attacker or operator attempts to configure wildcard in environment
        ReflectionTestUtils.setField(corsConfig, "frontendUrl", "https://*.onrender.com,https://valid-partner.com");

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        CorsConfiguration config = source.getCorsConfiguration(request);
        assertNotNull(config);

        // Valid partner without wildcard is preserved
        assertEquals("https://valid-partner.com", config.checkOrigin("https://valid-partner.com"));

        // Arbitrary Render subdomain is NOT allowed even though *.onrender.com was in config
        assertNull(config.checkOrigin("https://attacker-app.onrender.com"));
    }
}
