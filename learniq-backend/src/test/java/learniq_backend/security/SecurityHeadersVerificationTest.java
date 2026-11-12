package learniq_backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long",
        "app.frontend.url=http://localhost:5173"
})
public class SecurityHeadersVerificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Verify baseline security headers on response (nosniff, DENY frame options, XSS protection 0)")
    void testBaselineSecurityHeaders() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-XSS-Protection", "0"));
    }

    @Test
    @DisplayName("CORS Preflight OPTIONS /api/v1/tests succeeds for allowed localhost origin")
    void testCorsPreflightAllowedLocalhost() throws Exception {
        mockMvc.perform(options("/api/v1/tests")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    @DisplayName("CORS Preflight OPTIONS /api/v1/tests succeeds for production frontend origin")
    void testCorsPreflightAllowedProductionOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/tests")
                        .header(HttpHeaders.ORIGIN, "https://learniq-frontend-7oyn.onrender.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://learniq-frontend-7oyn.onrender.com"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    @DisplayName("CORS Preflight OPTIONS /api/v1/tests rejects untrusted origin")
    void testCorsPreflightRejectsUntrustedOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/tests")
                        .header(HttpHeaders.ORIGIN, "https://malicious-attacker.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    @DisplayName("CORS Simple GET /api/v1/health with untrusted origin does not receive Access-Control-Allow-Origin")
    void testCorsSimpleRequestRejectsUntrustedOrigin() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .header(HttpHeaders.ORIGIN, "https://evil.com"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
