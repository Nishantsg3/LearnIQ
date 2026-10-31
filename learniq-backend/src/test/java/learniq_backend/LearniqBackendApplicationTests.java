package learniq_backend;

import learniq_backend.exception.GlobalExceptionHandler;
import learniq_backend.model.AttemptAnswer;
import learniq_backend.model.Question;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.AttemptAnswerRepository;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import org.hibernate.LockMode;
import org.hibernate.dialect.PostgreSQLDialect;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long")
class LearniqBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TestRepository testRepository;

	@Autowired
	private TestAttemptRepository testAttemptRepository;

	@Autowired
	private AttemptAnswerRepository attemptAnswerRepository;

	@Autowired
	private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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

	@Test
	@DisplayName("REL-02: Production profile binds HikariCP connection pool settings accurately")
	void testProductionProfileHikariPoolConfiguration() {
		try (org.springframework.context.ConfigurableApplicationContext context = new SpringApplicationBuilder(LearniqBackendApplication.class)
				.web(org.springframework.boot.WebApplicationType.NONE)
				.profiles("prod")
				.properties(
						"spring.datasource.url=jdbc:h2:mem:prodbindtest;DB_CLOSE_DELAY=-1",
						"spring.datasource.driver-class-name=org.h2.Driver",
						"spring.datasource.username=sa",
						"spring.datasource.password=",
						"spring.jpa.hibernate.ddl-auto=none",
						"APP_JWT_SECRET=test-only-jwt-secret-not-for-production-minimum-32-chars-long",
						"app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
				)
				.run()) {

			javax.sql.DataSource dataSource = context.getBean(javax.sql.DataSource.class);
			assertInstanceOf(com.zaxxer.hikari.HikariDataSource.class, dataSource, "Expected HikariDataSource instance");
			com.zaxxer.hikari.HikariDataSource hikariDataSource = (com.zaxxer.hikari.HikariDataSource) dataSource;

			assertEquals(5, hikariDataSource.getMaximumPoolSize(), "maximum-pool-size should be 5");
			assertEquals(0, hikariDataSource.getMinimumIdle(), "minimum-idle should be 0");
			assertEquals(120000L, hikariDataSource.getIdleTimeout(), "idle-timeout should be 120000ms");
			assertEquals(1800000L, hikariDataSource.getMaxLifetime(), "max-lifetime should be 1800000ms");
			assertEquals(0L, hikariDataSource.getKeepaliveTime(), "keepalive-time should be 0ms");
			assertEquals(25000L, hikariDataSource.getConnectionTimeout(), "connection-timeout should be 25000ms");
		}
	}

	// =========================================================================
	// ERR-01: NoResourceFoundException and Exception Handler Tests
	// =========================================================================

	@Test
	@DisplayName("ERR-01: GET / (root route) returns 404 with generic resource not found message")
	void testRootRouteReturns404() throws Exception {
		mockMvc.perform(get("/"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found"))
				.andExpect(jsonPath("$.exception").doesNotExist());
	}

	@Test
	@DisplayName("ERR-01: GET /api/v1/auth/non-existent-endpoint returns 404 with generic resource not found message")
	void testUnknownApiEndpointReturns404() throws Exception {
		mockMvc.perform(get("/api/v1/auth/non-existent-endpoint"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found"))
				.andExpect(jsonPath("$.exception").doesNotExist());
	}

	@Test
	@DisplayName("ERR-01: GlobalExceptionHandler handleAllExceptions masks internal details and returns 500 without 'exception' class")
	void testHandleAllExceptionsMasksInternalDetails() {
		GlobalExceptionHandler handler = new GlobalExceptionHandler();
		Exception sensitiveException = new RuntimeException("SELECT * FROM secret_table FAILED at db.internal.net:5432");

		ResponseEntity<Map<String, String>> response = handler.handleAllExceptions(sensitiveException);

		assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("An unexpected error occurred. Please try again later.", response.getBody().get("message"));
		assertFalse(response.getBody().containsKey("exception"), "Response must NOT contain 'exception' key");
		assertFalse(response.getBody().toString().contains("RuntimeException"), "Response must NOT disclose exception class name");
		assertFalse(response.getBody().toString().contains("secret_table"), "Response must NOT disclose internal exception message");
	}

	@Test
	@DisplayName("ERR-01: GlobalExceptionHandler handleNoResourceFound returns 404 with generic message")
	void testHandleNoResourceFoundDirect() {
		GlobalExceptionHandler handler = new GlobalExceptionHandler();
		NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/unknown-path");

		ResponseEntity<Map<String, String>> response = handler.handleNoResourceFound(ex);

		assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
		assertNotNull(response.getBody());
		assertEquals("Resource not found", response.getBody().get("message"));
	}

	// =========================================================================
	// ADM-03: Nuclear Wipe Endpoint Removed
	// =========================================================================

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Removed endpoint /api/v1/questions/nuclear-wipe returns 404 and is unavailable")
	void testNuclearWipeEndpointReturns404ForAdmin() throws Exception {
		mockMvc.perform(get("/api/v1/questions/nuclear-wipe"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found"))
				.andExpect(jsonPath("$.exception").doesNotExist());
	}

	@Test
	@DisplayName("ADM-03: Unauthenticated request to /api/v1/questions/nuclear-wipe is rejected")
	void testNuclearWipeEndpointAnonymousRejected() throws Exception {
		mockMvc.perform(get("/api/v1/questions/nuclear-wipe"))
				.andExpect(result -> {
					int status = result.getResponse().getStatus();
					assertTrue(status == 401 || status == 403 || status == 404,
							"Unauthenticated access to removed endpoint should be rejected or not found, got: " + status);
				});
	}

	// =========================================================================
	// ADM-03: Obsolete Bank Purge Endpoint Removed
	// =========================================================================

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Removed endpoint DELETE /api/v1/questions/bank/purge returns 404 and performs no mutations")
	void testBankPurgeEndpointReturns404AndMutatesNothing() throws Exception {
		long countBefore = questionRepository.count();

		mockMvc.perform(delete("/api/v1/questions/bank/purge"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found"))
				.andExpect(jsonPath("$.exception").doesNotExist());

		long countAfter = questionRepository.count();
		assertEquals(countBefore, countAfter, "Database records must remain unchanged after hitting removed purge route");
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Removed endpoint DELETE /api/v1/questions/bank/purge with query params returns 404")
	void testBankPurgeEndpointWithParamsReturns404() throws Exception {
		long countBefore = questionRepository.count();

		mockMvc.perform(delete("/api/v1/questions/bank/purge")
						.param("category", "JAVA")
						.param("title", "NonExistent"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Resource not found"))
				.andExpect(jsonPath("$.exception").doesNotExist());

		long countAfter = questionRepository.count();
		assertEquals(countBefore, countAfter, "Database records must remain unchanged after hitting removed purge route with params");
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Individual question deletion DELETE /api/v1/questions/{id} remains functional")
	void testIndividualQuestionDeletionRouteIntact() throws Exception {
		Question question = new Question();
		question.setQuestionText("Test question for deletion " + UUID.randomUUID());
		question.setCategory("JAVA");
		question.setDifficultyLevel("EASY");
		question.setOptionA("Option A");
		question.setOptionB("Option B");
		question.setOptionC("Option C");
		question.setOptionD("Option D");
		question.setCorrectAnswer("Option A");

		Question saved = questionRepository.save(question);
		Long questionId = saved.getId();
		assertNotNull(questionId, "Saved question must have an ID");
		assertTrue(questionRepository.existsById(questionId), "Question must exist before deletion");

		try {
			mockMvc.perform(delete("/api/v1/questions/" + questionId))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.message").value("Question deleted successfully."));

			// Question entity uses Hibernate @SQLDelete(sql = "UPDATE question SET is_deleted = true WHERE id = ?"),
			// which performs a soft-delete (setting is_deleted = true) rather than physical row removal.
			Question deleted = questionRepository.findById(questionId).orElseThrow();
			assertTrue(deleted.isDeleted(), "Question entity must have isDeleted set to true via @SQLDelete");
		} finally {
			// Clean up the created test question physically via native JDBC to guarantee test isolation
			jdbcTemplate.update("DELETE FROM question WHERE id = ?", questionId);
		}
	}

	// =========================================================================
	// ADM-01: Safe Student Deletion Tests
	// =========================================================================

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Delete student with zero attempts succeeds and removes user")
	void testDeleteStudentWithZeroAttemptsSucceeds() throws Exception {
		User student = createTestUser("student.zero." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);

		mockMvc.perform(delete("/api/v1/admin/students/" + student.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Student account and associated data removed successfully"));

		assertFalse(userRepository.existsById(student.getId()), "Student user must be removed from DB");
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Delete student with attempts and answers cleans up children in reverse FK order")
	void testDeleteStudentWithAttemptsAndAnswersSucceedsCleanly() throws Exception {
		User student = createTestUser("student.attempts." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		learniq_backend.model.Test test = createTestEntity("Test For Student Deletion " + UUID.randomUUID());
		Question q = createQuestionEntity("Sample Question " + UUID.randomUUID());

		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ans1 = createAnswerEntity(attempt, q.getId(), "A", "A", true);
		AttemptAnswer ans2 = createAnswerEntity(attempt, q.getId(), "B", "A", false);

		assertTrue(userRepository.existsById(student.getId()));
		assertTrue(testAttemptRepository.existsById(attempt.getId()));
		assertTrue(attemptAnswerRepository.existsById(ans1.getId()));
		assertTrue(attemptAnswerRepository.existsById(ans2.getId()));

		try {
			mockMvc.perform(delete("/api/v1/admin/students/" + student.getId()))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.message").value("Student account and associated data removed successfully"));

			assertFalse(userRepository.existsById(student.getId()), "Student row must be deleted");
			assertFalse(testAttemptRepository.existsById(attempt.getId()), "Student attempt row must be deleted");
			assertEquals(0, attemptAnswerRepository.findByAttemptId(attempt.getId()).size(), "Attempt answers must be deleted");
			assertTrue(testRepository.existsById(test.getId()), "Parent test must remain intact");
			assertTrue(questionRepository.existsById(q.getId()), "Question must remain intact");
		} finally {
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Delete student cleans up legacy attempts where user_id IS NULL and email matches")
	void testDeleteStudentWithLegacyNullUserIdAttemptsCleanedUp() throws Exception {
		String email = "legacy.student." + UUID.randomUUID() + "@learniq.test";
		User student = createTestUser(email, User.Role.STUDENT);
		learniq_backend.model.Test test = createTestEntity("Test Legacy Deletion " + UUID.randomUUID());
		Question q = createQuestionEntity("Legacy Question " + UUID.randomUUID());

		// Legacy attempt: user is NULL, userEmail matches student
		TestAttempt legacyAttempt = createAttemptEntity(null, email, test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ans = createAnswerEntity(legacyAttempt, q.getId(), "C", "C", true);

		try {
			mockMvc.perform(delete("/api/v1/admin/students/" + student.getId()))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.message").value("Student account and associated data removed successfully"));

			assertFalse(userRepository.existsById(student.getId()), "Student row must be deleted");
			assertFalse(testAttemptRepository.existsById(legacyAttempt.getId()), "Legacy attempt with null user_id must be deleted");
			assertEquals(0, attemptAnswerRepository.findByAttemptId(legacyAttempt.getId()).size(), "Legacy answers must be deleted");
		} finally {
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Deleting Student A preserves Student B's user, attempts, and answers completely")
	void testDeleteStudentPreservesOtherStudentsAttemptsAndData() throws Exception {
		User studentA = createTestUser("student.a." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		User studentB = createTestUser("student.b." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		learniq_backend.model.Test test = createTestEntity("Shared Test " + UUID.randomUUID());
		Question q = createQuestionEntity("Shared Question " + UUID.randomUUID());

		TestAttempt attemptA = createAttemptEntity(studentA, studentA.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ansA = createAnswerEntity(attemptA, q.getId(), "A", "A", true);

		TestAttempt attemptB = createAttemptEntity(studentB, studentB.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ansB = createAnswerEntity(attemptB, q.getId(), "B", "A", false);

		try {
			// Delete Student A
			mockMvc.perform(delete("/api/v1/admin/students/" + studentA.getId()))
					.andExpect(status().isOk());

			// Student A records must be deleted
			assertFalse(userRepository.existsById(studentA.getId()));
			assertFalse(testAttemptRepository.existsById(attemptA.getId()));
			assertEquals(0, attemptAnswerRepository.findByAttemptId(attemptA.getId()).size());

			// Student B records must be 100% preserved
			assertTrue(userRepository.existsById(studentB.getId()), "Student B must still exist");
			assertTrue(testAttemptRepository.existsById(attemptB.getId()), "Student B's attempt must still exist");
			assertEquals(1, attemptAnswerRepository.findByAttemptId(attemptB.getId()).size(), "Student B's answers must still exist");
		} finally {
			cleanupUserEntity(studentB.getId());
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Deletion of admin account is blocked with HTTP 400")
	void testDeleteStudentAdminBlocked() throws Exception {
		User admin = createTestUser("admin." + UUID.randomUUID() + "@learniq.test", User.Role.ADMIN);

		try {
			mockMvc.perform(delete("/api/v1/admin/students/" + admin.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete admin accounts"));

			assertTrue(userRepository.existsById(admin.getId()), "Admin user must not be deleted");
		} finally {
			cleanupUserEntity(admin.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-01: Deleting non-existent student returns HTTP 404")
	void testDeleteStudentNotFoundReturns404() throws Exception {
		mockMvc.perform(delete("/api/v1/admin/students/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Student not found"));
	}

	// =========================================================================
	// ADM-02: Safe Test Deletion Tests
	// =========================================================================

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Test with SUBMITTED attempt blocks deletion with HTTP 400 and archive guidance")
	void testDeleteTestWithSubmittedAttemptsBlocked() throws Exception {
		learniq_backend.model.Test test = createTestEntity("Submitted Test " + UUID.randomUUID());
		User student = createTestUser("student.sub." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.SUBMITTED);

		try {
			mockMvc.perform(delete("/api/v1/tests/" + test.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete assessment with existing student attempts. Archive the test instead."));

			assertTrue(testRepository.existsById(test.getId()), "Test must not be deleted");
			assertTrue(testAttemptRepository.existsById(attempt.getId()), "Attempt must remain intact");
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Test with IN_PROGRESS attempt blocks deletion with HTTP 400")
	void testDeleteTestWithInProgressAttemptsBlocked() throws Exception {
		learniq_backend.model.Test test = createTestEntity("In-Progress Test " + UUID.randomUUID());
		User student = createTestUser("student.prog." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.IN_PROGRESS);

		try {
			mockMvc.perform(delete("/api/v1/tests/" + test.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete assessment with existing student attempts. Archive the test instead."));

			assertTrue(testRepository.existsById(test.getId()), "Test must not be deleted");
			assertTrue(testAttemptRepository.existsById(attempt.getId()), "Attempt must remain intact");
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Test with MISSED or ABANDONED attempt blocks deletion with HTTP 400")
	void testDeleteTestWithMissedAndAbandonedAttemptsBlocked() throws Exception {
		learniq_backend.model.Test test1 = createTestEntity("Missed Test " + UUID.randomUUID());
		learniq_backend.model.Test test2 = createTestEntity("Abandoned Test " + UUID.randomUUID());
		User student = createTestUser("student.missed." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);

		TestAttempt missed = createAttemptEntity(student, student.getEmail(), test1, TestAttempt.Status.MISSED);
		TestAttempt abandoned = createAttemptEntity(student, student.getEmail(), test2, TestAttempt.Status.ABANDONED);

		try {
			mockMvc.perform(delete("/api/v1/tests/" + test1.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete assessment with existing student attempts. Archive the test instead."));

			mockMvc.perform(delete("/api/v1/tests/" + test2.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete assessment with existing student attempts. Archive the test instead."));

			assertTrue(testRepository.existsById(test1.getId()));
			assertTrue(testRepository.existsById(test2.getId()));
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test1.getId());
			cleanupTestEntity(test2.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Unused test with zero attempts is deleted successfully via DELETE /api/v1/tests/{id}")
	void testDeleteUnusedTestWithZeroAttemptsSucceeds() throws Exception {
		learniq_backend.model.Test test = createTestEntity("Unused Test " + UUID.randomUUID());
		Question q = createQuestionEntity("Test Question " + UUID.randomUUID());

		// Link question in test_questions join table
		jdbcTemplate.update("INSERT INTO test_questions (test_id, question_id) VALUES (?, ?)", test.getId(), q.getId());

		try {
			mockMvc.perform(delete("/api/v1/tests/" + test.getId()))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.status").value("DELETED"));

			assertFalse(testRepository.existsById(test.getId()), "Unused test must be deleted");
			assertEquals(0, jdbcTemplate.queryForObject("SELECT count(*) FROM test_questions WHERE test_id = ?", Integer.class, test.getId()));
			assertTrue(questionRepository.existsById(q.getId()), "Question in question bank must not be deleted");
		} finally {
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Both /api/v1/tests/{id} and /api/v1/admin/tests/{id} enforce identical safeguard behavior")
	void testBothDeletionEndpointsEnforceIdenticalBehavior() throws Exception {
		learniq_backend.model.Test testWithAttempts = createTestEntity("Test With Attempt " + UUID.randomUUID());
		learniq_backend.model.Test unusedTest = createTestEntity("Unused Admin Test " + UUID.randomUUID());
		User student = createTestUser("student.admin.endpoint." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);

		createAttemptEntity(student, student.getEmail(), testWithAttempts, TestAttempt.Status.SUBMITTED);

		try {
			// Admin endpoint blocks deletion when attempts exist
			mockMvc.perform(delete("/api/v1/admin/tests/" + testWithAttempts.getId()))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Cannot delete assessment with existing student attempts. Archive the test instead."));

			// Admin endpoint allows deletion when zero attempts exist
			mockMvc.perform(delete("/api/v1/admin/tests/" + unusedTest.getId()))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.status").value("DELETED"));

			assertTrue(testRepository.existsById(testWithAttempts.getId()));
			assertFalse(testRepository.existsById(unusedTest.getId()));
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(testWithAttempts.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Deleting non-existent test returns HTTP 404 on both endpoints")
	void testDeleteTestNotFoundReturns404() throws Exception {
		mockMvc.perform(delete("/api/v1/tests/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Test not found"));

		mockMvc.perform(delete("/api/v1/admin/tests/999999"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Test not found"));
	}

	@Test
	@DisplayName("ADM-02: Non-admin users are blocked from test deletion routes (403 forbidden without ADMIN role)")
	void testDeleteTestUnauthorizedAndForbidden() throws Exception {
		// Without token -> 403 forbidden (anonymous has no ADMIN role)
		mockMvc.perform(delete("/api/v1/tests/1"))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/admin/tests/1"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "STUDENT")
	@DisplayName("ADM-02: Student role is forbidden from test deletion routes (403)")
	void testDeleteTestForbiddenForStudent() throws Exception {
		mockMvc.perform(delete("/api/v1/tests/1"))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/admin/tests/1"))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-02: Historical attempts and answers remain unchanged when test deletion is rejected")
	void testHistoricalAttemptsAndAnswersPreservedWhenDeletionBlocked() throws Exception {
		learniq_backend.model.Test test = createTestEntity("Immutable History Test " + UUID.randomUUID());
		User student = createTestUser("history.student." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		Question q = createQuestionEntity("Immutable Question " + UUID.randomUUID());

		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ans = createAnswerEntity(attempt, q.getId(), "A", "A", true);

		long attemptCountBefore = testAttemptRepository.countByTestId(test.getId());
		long answerCountBefore = attemptAnswerRepository.count();

		try {
			mockMvc.perform(delete("/api/v1/tests/" + test.getId()))
					.andExpect(status().isBadRequest());

			assertEquals(attemptCountBefore, testAttemptRepository.countByTestId(test.getId()));
			assertEquals(answerCountBefore, attemptAnswerRepository.count());

			TestAttempt reloaded = testAttemptRepository.findById(attempt.getId()).orElseThrow();
			assertEquals(TestAttempt.Status.SUBMITTED, reloaded.getStatus());
			assertEquals(100, reloaded.getScorePercent());
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@DisplayName("ADM-02: PostgreSQL dialect translates PESSIMISTIC_READ to 'for share' and PESSIMISTIC_WRITE to 'for update'")
	void testPostgreSqlDialectPessimisticLockTranslations() {
		PostgreSQLDialect dialect = new PostgreSQLDialect();
		assertEquals(" for share", dialect.getForUpdateString(LockMode.PESSIMISTIC_READ),
				"Hibernate PostgreSQLDialect must translate PESSIMISTIC_READ to ' for share'");
		assertEquals(" for update", dialect.getForUpdateString(LockMode.PESSIMISTIC_WRITE),
				"Hibernate PostgreSQLDialect must translate PESSIMISTIC_WRITE to ' for update'");
	}

	@Test
	@WithMockUser(username = "student.missing.test@learniq.test", roles = "STUDENT")
	@DisplayName("ADM-02: Student attempting to start non-existent or deleted assessment receives HTTP 404")
	void testStartAttemptWithDeletedOrNonExistentTestReturns404() throws Exception {
		// Test attempt start via /api/v1/attempts/start
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/attempts/start")
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.content("{\"testId\":999999}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Assessment [ID: 999999] not found. Please refresh."));

		// Test attempt start via /api/v1/questions/test/{testId}/start-attempt
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/questions/test/999999/start-attempt"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Assessment [ID: 999999] not found. Please refresh."));
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Removed endpoint DELETE /api/v1/admin/tests/purge-by-name returns HTTP 404 and preserves test data")
	void testPurgeByNameEndpointRemovedAndPreservesData() throws Exception {
		learniq_backend.model.Test test = createTestEntity("Purge Target Test " + UUID.randomUUID());
		User student = createTestUser("purge.student." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		Question q = createQuestionEntity("Purge Question " + UUID.randomUUID());
		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ans = createAnswerEntity(attempt, q.getId(), "A", "A", true);

		try {
			mockMvc.perform(delete("/api/v1/admin/tests/purge-by-name").param("name", test.getTitle()))
					.andExpect(status().isNotFound())
					.andExpect(jsonPath("$.message").value("Resource not found"));

			// Verify test, attempt, and answer still exist
			assertTrue(testRepository.existsById(test.getId()), "Test must not be purged");
			assertTrue(testAttemptRepository.existsById(attempt.getId()), "Attempt must not be purged");
			assertTrue(attemptAnswerRepository.existsById(ans.getId()), "Answer must not be purged");
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	@DisplayName("ADM-03: Removed endpoint POST /api/v1/admin/attempts/reset returns HTTP 404 and preserves attempts")
	void testResetAttemptsEndpointRemovedAndPreservesData() throws Exception {
		learniq_backend.model.Test test = createTestEntity("Reset Target Test " + UUID.randomUUID());
		User student = createTestUser("reset.student." + UUID.randomUUID() + "@learniq.test", User.Role.STUDENT);
		Question q = createQuestionEntity("Reset Question " + UUID.randomUUID());
		TestAttempt attempt = createAttemptEntity(student, student.getEmail(), test, TestAttempt.Status.SUBMITTED);
		AttemptAnswer ans = createAnswerEntity(attempt, q.getId(), "A", "A", true);

		try {
			mockMvc.perform(post("/api/v1/admin/attempts/reset"))
					.andExpect(status().isNotFound())
					.andExpect(jsonPath("$.message").value("Resource not found"));

			// Verify attempt and answer still exist
			assertTrue(testAttemptRepository.existsById(attempt.getId()), "Attempt must not be reset");
			assertTrue(attemptAnswerRepository.existsById(ans.getId()), "Answer must not be reset");
		} finally {
			cleanupUserEntity(student.getId());
			cleanupTestEntity(test.getId());
			cleanupQuestionEntity(q.getId());
		}
	}

	@Test
	@WithMockUser(roles = "STUDENT")
	@DisplayName("ADM-03: Student role is forbidden from removed admin endpoints (403)")
	void testRemovedAdminEndpointsForbiddenForStudent() throws Exception {
		mockMvc.perform(delete("/api/v1/admin/tests/purge-by-name").param("name", "Test"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/v1/admin/attempts/reset"))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("ADM-03: Unauthenticated caller is forbidden from removed admin endpoints (403)")
	void testRemovedAdminEndpointsForbiddenForAnonymous() throws Exception {
		mockMvc.perform(delete("/api/v1/admin/tests/purge-by-name").param("name", "Test"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/v1/admin/attempts/reset"))
				.andExpect(status().isForbidden());
	}

	// =========================================================================
	// TEST DATA FACTORY & CLEANUP HELPERS
	// =========================================================================

	private User createTestUser(String email, User.Role role) {
		User u = new User();
		u.setName("Test User " + UUID.randomUUID());
		u.setEmail(email.trim().toLowerCase());
		u.setPassword("$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF");
		u.setRole(role);
		u.setVerified(true);
		return userRepository.save(u);
	}

	private learniq_backend.model.Test createTestEntity(String title) {
		learniq_backend.model.Test t = new learniq_backend.model.Test();
		t.setTitle(title);
		t.setCategory("GENERAL");
		t.setSectionType("Multiple Choice");
		t.setDifficultyLevel("Easy");
		t.setQuestionCount(5);
		t.setDurationMinutes(30);
		t.setTestType("PRACTICE");
		t.setStatus("ACTIVE");
		return testRepository.save(t);
	}

	private Question createQuestionEntity(String text) {
		Question q = new Question();
		q.setQuestionText(text);
		q.setCategory("GENERAL");
		q.setDifficultyLevel("EASY");
		q.setOptionA("A");
		q.setOptionB("B");
		q.setOptionC("C");
		q.setOptionD("D");
		q.setCorrectAnswer("A");
		return questionRepository.save(q);
	}

	private TestAttempt createAttemptEntity(User user, String email, learniq_backend.model.Test test, TestAttempt.Status status) {
		TestAttempt att = new TestAttempt();
		att.setUser(user);
		att.setUserEmail(email);
		att.setUserName(user != null ? user.getName() : "Legacy Student");
		att.setTest(test);
		att.setStartedAt(LocalDateTime.now().minusHours(1));
		att.setStatus(status);
		att.setSubmitted(status == TestAttempt.Status.SUBMITTED);
		att.setSubmittedAt(status == TestAttempt.Status.SUBMITTED ? LocalDateTime.now() : null);
		att.setTotalQuestions(1);
		att.setCorrectCount(1);
		att.setWrongCount(0);
		att.setScorePercent(100);
		att.setAttemptedCount(1);
		att.setTestType(test.getTestType());
		att.setAnswers(new ArrayList<>());
		return testAttemptRepository.save(att);
	}

	private AttemptAnswer createAnswerEntity(TestAttempt attempt, Long questionId, String selected, String correct, boolean isCorrect) {
		AttemptAnswer ans = new AttemptAnswer();
		ans.setAttempt(attempt);
		ans.setQuestionId(questionId);
		ans.setSelectedOption(selected);
		ans.setCorrectOption(correct);
		ans.setCorrect(isCorrect);
		return attemptAnswerRepository.save(ans);
	}

	private void cleanupUserEntity(Long userId) {
		if (userId != null) {
			jdbcTemplate.update("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE user_id = ?)", userId);
			jdbcTemplate.update("DELETE FROM test_attempts WHERE user_id = ?", userId);
			jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
		}
	}

	private void cleanupTestEntity(Long testId) {
		if (testId != null) {
			jdbcTemplate.update("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id = ?)", testId);
			jdbcTemplate.update("DELETE FROM test_attempts WHERE test_id = ?", testId);
			jdbcTemplate.update("DELETE FROM test_questions WHERE test_id = ?", testId);
			jdbcTemplate.update("DELETE FROM test WHERE id = ?", testId);
		}
	}

	private void cleanupQuestionEntity(Long questionId) {
		if (questionId != null) {
			jdbcTemplate.update("DELETE FROM test_questions WHERE question_id = ?", questionId);
			jdbcTemplate.update("DELETE FROM question WHERE id = ?", questionId);
		}
	}
}
