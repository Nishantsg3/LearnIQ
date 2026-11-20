package learniq_backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import learniq_backend.dto.StudentSummaryDTO;
import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:admin_security_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class AdminControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DataSource dataSource;

    private User testStudent;
    private String studentEmail;

    @Test
    @DisplayName("SEC-00: Verify test execution runs on isolated in-memory H2 datasource")
    void verifyIsolatedInMemoryDatasource() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            String actualJdbcUrl = conn.getMetaData().getURL();
            assertNotNull(actualJdbcUrl, "JDBC URL must not be null");
            assertTrue(actualJdbcUrl.startsWith("jdbc:h2:mem:admin_security_test"),
                    "Connection must point to isolated in-memory DB 'jdbc:h2:mem:admin_security_test', but was: " + actualJdbcUrl);
            assertFalse(actualJdbcUrl.contains("file:"),
                    "Connection must NOT connect to file-backed database: " + actualJdbcUrl);
        }
    }

    @BeforeEach
    void setUp() {
        studentEmail = "sec01.student." + UUID.randomUUID() + "@learniq.test";

        testStudent = new User();
        testStudent.setName("Sec01 Candidate");
        testStudent.setEmail(studentEmail);
        testStudent.setPassword("$2a$10$secretHashedPasswordValue12345");
        testStudent.setRole(User.Role.STUDENT);
        testStudent.setVerified(true);
        testStudent.setOtp("987654");
        testStudent.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        testStudent.setResetToken("sec-reset-token-" + UUID.randomUUID());
        testStudent.setResetTokenExpiry(LocalDateTime.now().plusHours(1));

        testStudent = userRepository.save(testStudent);
    }

    @AfterEach
    void tearDown() {
        if (testStudent != null && testStudent.getId() != null) {
            userRepository.deleteById(testStudent.getId());
        }
    }

    @Test
    @DisplayName("SEC-01: GET /api/v1/admin/students returns 401 or 403 when unauthenticated")
    void getStudentsUnauthenticatedReturnsUnauthorizedOrForbidden() throws Exception {
        int status = mockMvc.perform(get("/api/v1/admin/students"))
                .andReturn()
                .getResponse()
                .getStatus();

        assertTrue(status == 401 || status == 403,
                "Expected HTTP 401 or 403 for unauthenticated access, but received: " + status);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("SEC-01: GET /api/v1/admin/students returns 403 Forbidden for STUDENT role")
    void getStudentsAsStudentReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("SEC-01: GET /api/v1/admin/students returns 200 OK and excludes all sensitive credential fields")
    void getStudentsAsAdminReturnsAllowlistedFieldsWithoutCredentials() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        String jsonContent = result.getResponse().getContentAsString();
        JsonNode rootNode = objectMapper.readTree(jsonContent);

        assertTrue(rootNode.isArray(), "Response body must be an array of students");

        // Find our test student in the returned list
        JsonNode matchingStudentNode = null;
        for (JsonNode studentNode : rootNode) {
            if (studentEmail.equals(studentNode.path("email").asText())) {
                matchingStudentNode = studentNode;
                break;
            }
        }

        assertNotNull(matchingStudentNode, "Target student record must be present in directory");

        // 1. Verify allowlisted properties exist
        assertTrue(matchingStudentNode.hasNonNull("id"), "Missing allowlisted field: id");
        assertTrue(matchingStudentNode.hasNonNull("name"), "Missing allowlisted field: name");
        assertTrue(matchingStudentNode.hasNonNull("email"), "Missing allowlisted field: email");
        assertTrue(matchingStudentNode.hasNonNull("role"), "Missing allowlisted field: role");
        assertTrue(matchingStudentNode.hasNonNull("createdAt"), "Missing allowlisted field: createdAt");
        assertTrue(matchingStudentNode.has("isVerified"), "Missing allowlisted field: isVerified");

        assertEquals(testStudent.getId(), matchingStudentNode.get("id").asLong());
        assertEquals("Sec01 Candidate", matchingStudentNode.get("name").asText());
        assertEquals(studentEmail, matchingStudentNode.get("email").asText());
        assertEquals("STUDENT", matchingStudentNode.get("role").asText());
        assertTrue(matchingStudentNode.get("isVerified").asBoolean());

        // 2. Strictly verify credential fields DO NOT exist
        assertFalse(matchingStudentNode.has("password"), "Leaked sensitive field in response: password");
        assertFalse(matchingStudentNode.has("otp"), "Leaked sensitive field in response: otp");
        assertFalse(matchingStudentNode.has("otpExpiry"), "Leaked sensitive field in response: otpExpiry");
        assertFalse(matchingStudentNode.has("resetToken"), "Leaked sensitive field in response: resetToken");
        assertFalse(matchingStudentNode.has("resetTokenExpiry"), "Leaked sensitive field in response: resetTokenExpiry");

        // 3. String-level sanity checks across the entire student payload
        String studentJson = matchingStudentNode.toString();
        assertFalse(studentJson.contains("password"), "Student payload string contains 'password'");
        assertFalse(studentJson.contains("otp"), "Student payload string contains 'otp'");
        assertFalse(studentJson.contains("resetToken"), "Student payload string contains 'resetToken'");
    }

    @Test
    @DisplayName("SEC-01: Defense-in-depth @JsonIgnore prevents credential serialization on raw User entity")
    void rawUserEntitySerializationExcludesCredentials() throws Exception {
        User rawUser = new User();
        rawUser.setId(999L);
        rawUser.setName("Direct Serialized");
        rawUser.setEmail("direct.raw@learniq.test");
        rawUser.setPassword("$2a$10$someSecretHashedPassword");
        rawUser.setRole(User.Role.STUDENT);
        rawUser.setVerified(true);
        rawUser.setOtp("654321");
        rawUser.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        rawUser.setResetToken("raw-reset-token-value");
        rawUser.setResetTokenExpiry(LocalDateTime.now().plusHours(2));

        String serialized = objectMapper.writeValueAsString(rawUser);
        JsonNode node = objectMapper.readTree(serialized);

        // Verify allowlisted / general properties
        assertEquals(999L, node.path("id").asLong());
        assertEquals("Direct Serialized", node.path("name").asText());
        assertEquals("direct.raw@learniq.test", node.path("email").asText());

        // Defense-in-depth: Verify @JsonIgnore prevented all sensitive fields from appearing
        assertFalse(node.has("password"), "User entity failed @JsonIgnore on password");
        assertFalse(node.has("otp"), "User entity failed @JsonIgnore on otp");
        assertFalse(node.has("otpExpiry"), "User entity failed @JsonIgnore on otpExpiry");
        assertFalse(node.has("resetToken"), "User entity failed @JsonIgnore on resetToken");
        assertFalse(node.has("resetTokenExpiry"), "User entity failed @JsonIgnore on resetTokenExpiry");

        assertFalse(serialized.contains("password"));
        assertFalse(serialized.contains("otp"));
        assertFalse(serialized.contains("resetToken"));
    }

    @Test
    @DisplayName("SEC-01: StudentSummaryDTO.fromEntity maps null safely and retains all allowlisted properties")
    void studentSummaryDTOMappingTest() {
        assertNull(StudentSummaryDTO.fromEntity(null));

        StudentSummaryDTO dto = StudentSummaryDTO.fromEntity(testStudent);
        assertNotNull(dto);
        assertEquals(testStudent.getId(), dto.id());
        assertEquals(testStudent.getName(), dto.name());
        assertEquals(testStudent.getEmail(), dto.email());
        assertEquals(testStudent.getRole(), dto.role());
        assertEquals(testStudent.getCreatedAt(), dto.createdAt());
        assertEquals(testStudent.isVerified(), dto.isVerified());
    }
}
