package learniq_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@TestPropertySource(properties = "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long")
class LearniqBackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	@DisplayName("Application startup fails fast when APP_JWT_SECRET is missing or blank")
	void startupFailsFastWithoutJwtSecret() {
		Exception ex = assertThrows(Exception.class, () -> {
			new SpringApplicationBuilder(LearniqBackendApplication.class)
					.properties("app.jwt.secret=", "server.port=0")
					.run();
		});

		Throwable rootCause = ex;
		while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
			rootCause = rootCause.getCause();
		}
		assertTrue(rootCause instanceof IllegalStateException, "Expected root cause to be IllegalStateException");
		assertTrue(rootCause.getMessage().contains("missing or blank"), "Expected missing/blank error message");
	}

}
