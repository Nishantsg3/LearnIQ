package learniq_backend.security;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import learniq_backend.controller.AuthController;
import learniq_backend.dto.ForgotPasswordRequest;
import learniq_backend.dto.ResendOtpRequest;
import learniq_backend.dto.ResetPasswordRequest;
import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import learniq_backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService mockEmailService;

    @Mock
    private JavaMailSender mailSender;

    private PasswordEncoder passwordEncoder;
    private AuthController authController;

    private User testUser;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authController = new AuthController(
                userRepository,
                jwtUtil,
                mockEmailService,
                passwordEncoder
        );
        ReflectionTestUtils.setField(authController, "frontendUrl", "https://learniq-frontend-7oyn.onrender.com");
        ReflectionTestUtils.setField(authController, "appEnv", "dev");
        ReflectionTestUtils.setField(authController, "activeProfile", "dev");

        testUser = new User();
        testUser.setId(42L);
        testUser.setName("Test Student");
        testUser.setEmail("student@learniq.com");
        testUser.setPassword(passwordEncoder.encode("OldPassword@123"));
        testUser.setRole(User.Role.STUDENT);
        testUser.setVerified(true);
    }

    // =========================================================================
    // 1. EmailService Fail-Closed & Mock Mode Tests
    // =========================================================================

    @Test
    @DisplayName("EmailService fails closed in production profile when SMTP username is 'none'")
    void testEmailServiceFailsClosedInProdWhenSmtpUnconfigured() {
        EmailService service = new EmailService(mailSender, "none", "learniq.main@gmail.com", "prod");

        assertFalse(service.isSmtpConfigured(), "Should detect SMTP is not configured");
        assertTrue(service.isProductionEnvironment(), "Should detect production environment");

        boolean sent = service.sendResetPasswordEmail("user@example.com", "https://learniq.com/reset-password/xyz");

        assertFalse(sent, "In production, missing SMTP configuration must return false (fail-closed)");
        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("EmailService fails closed in production profile when SMTP username is blank or null")
    void testEmailServiceFailsClosedInProdWhenSmtpUsernameIsBlank() {
        EmailService service = new EmailService(mailSender, "   ", "learniq.main@gmail.com", "prod");

        assertFalse(service.isSmtpConfigured());
        boolean sent = service.sendResetPasswordEmail("user@example.com", "https://learniq.com/reset-password/xyz");

        assertFalse(sent, "In production, blank SMTP username must fail closed");
        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("EmailService allows mock email delivery in development profile when SMTP is unconfigured")
    void testEmailServiceAllowsMockInDevWhenSmtpUnconfigured() {
        EmailService service = new EmailService(mailSender, "none", "learniq.main@gmail.com", "dev");

        assertFalse(service.isSmtpConfigured());
        assertFalse(service.isProductionEnvironment());

        boolean sent = service.sendResetPasswordEmail("user@example.com", "https://learniq.com/reset-password/xyz");

        assertTrue(sent, "In development, mock email delivery is permitted for testing");
        verifyNoInteractions(mailSender);
    }

    @Test
    @DisplayName("EmailService handles SMTP exceptions safely and returns false without leaking")
    void testEmailServiceSmtpExceptionReturnsFalse() {
        EmailService service = new EmailService(mailSender, "smtp-user-key", "learniq.main@gmail.com", "prod");
        Session session = Session.getInstance(new Properties());
        MimeMessage mimeMessage = new MimeMessage(session);

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("550 5.7.1 Sender address rejected: Domain not verified"))
                .when(mailSender).send(any(MimeMessage.class));

        boolean sent = service.sendResetPasswordEmail("user@example.com", "https://learniq.com/reset-password/xyz");

        assertFalse(sent, "SMTP transport exception must be caught and return false");
    }

    @Test
    @DisplayName("EmailService successfully dispatches email when SMTP is properly configured")
    void testEmailServiceSmtpSuccessReturnsTrue() {
        EmailService service = new EmailService(mailSender, "smtp-user-key", "verified@learniq.com", "prod");
        Session session = Session.getInstance(new Properties());
        MimeMessage mimeMessage = new MimeMessage(session);

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        boolean sent = service.sendResetPasswordEmail("user@example.com", "https://learniq.com/reset-password/xyz");

        assertTrue(sent, "Successful SMTP dispatch must return true");
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    // =========================================================================
    // 2. AuthController Forgot-Password Security Tests
    // =========================================================================

    @Test
    @DisplayName("Forgot-password for non-existent email returns generic success (anti-enumeration)")
    void testForgotPasswordNonExistentEmailReturnsGenericSuccess() {
        when(userRepository.findByEmail("unknown@learniq.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.forgotPassword(new ForgotPasswordRequest("unknown@learniq.com"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.get("message").contains("If an account is associated with this email"));
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(mockEmailService);
    }

    @Test
    @DisplayName("Forgot-password returns 500 when email delivery fails and does not leak internal error")
    void testForgotPasswordEmailDeliveryFailureReturns500GenericError() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mockEmailService.sendResetPasswordEmail(eq(testUser.getEmail()), anyString())).thenReturn(false);

        ResponseEntity<?> response = authController.forgotPassword(new ForgotPasswordRequest(testUser.getEmail()));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Failed to send reset email. Please try again later.", body.get("message"));
    }

    @Test
    @DisplayName("Forgot-password response never leaks raw reset token or reset URL")
    void testForgotPasswordResponseNeverLeaksResetToken() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mockEmailService.sendResetPasswordEmail(eq(testUser.getEmail()), anyString())).thenReturn(true);

        ResponseEntity<?> response = authController.forgotPassword(new ForgotPasswordRequest(testUser.getEmail()));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);

        // Body must NOT contain "token" or "resetLink"
        assertFalse(body.containsKey("token"), "Response body must not contain reset token");
        assertFalse(body.containsKey("resetLink"), "Response body must not contain reset link");
        assertTrue(body.get("message").contains("If an account is associated with this email"));

        // Verify token saved to user record
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertNotNull(savedUser.getResetToken(), "Reset token should be saved in DB");
        assertNotNull(savedUser.getResetTokenExpiry(), "Reset token expiry should be saved in DB");
        assertTrue(savedUser.getResetTokenExpiry().isAfter(LocalDateTime.now().plusMinutes(14)),
                "Reset token expiry should be ~15 minutes from now");
    }

    // =========================================================================
    // 3. AuthController Reset-Password Token Invalidation & Expiry Tests
    // =========================================================================

    @Test
    @DisplayName("Reset-password succeeds with valid token, updates password, and invalidates token (single-use)")
    void testResetPasswordWithValidTokenSucceedsAndInvalidatesToken() {
        String token = "valid-secure-uuid-token";
        testUser.setResetToken(token);
        testUser.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(testUser));

        ResponseEntity<?> response = authController.resetPassword(
                new ResetPasswordRequest(token, "BrandNewPassword@2026")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Password reset successful", body.get("message"));

        // Verify user was updated and token invalidated
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();

        assertNull(saved.getResetToken(), "Reset token must be cleared to prevent reuse");
        assertNull(saved.getResetTokenExpiry(), "Reset token expiry must be cleared");
        assertTrue(passwordEncoder.matches("BrandNewPassword@2026", saved.getPassword()),
                "New password must be encoded and match");
    }

    @Test
    @DisplayName("Reset-password rejects reuse of an already-used token")
    void testResetPasswordRejectsTokenReuse() {
        String token = "already-used-token";
        // Once used, resetToken is set to null in DB, so findByResetToken returns empty
        when(userRepository.findByResetToken(token)).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.resetPassword(
                new ResetPasswordRequest(token, "AnotherPassword@2026")
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid or expired reset token", body.get("message"));
    }

    @Test
    @DisplayName("Reset-password rejects expired reset token")
    void testResetPasswordRejectsExpiredToken() {
        String token = "expired-token";
        testUser.setResetToken(token);
        testUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(2)); // Expired 2 mins ago

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(testUser));

        ResponseEntity<?> response = authController.resetPassword(
                new ResetPasswordRequest(token, "NewPassword@123")
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertEquals("Invalid or expired reset token", body.get("message"));
        verify(userRepository, never()).save(any(User.class));
    }

    // =========================================================================
    // 4. Production Environment Secret Protection Tests
    // =========================================================================

    @Test
    @DisplayName("Resend OTP in production profile omits OTP from HTTP response payload")
    void testResendOtpInProdProfileOmitsOtpFromResponse() {
        ReflectionTestUtils.setField(authController, "activeProfile", "prod");
        ReflectionTestUtils.setField(authController, "appEnv", "prod");

        testUser.setVerified(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ResponseEntity<?> response = authController.resendOtp(new ResendOtpRequest(testUser.getEmail()));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertFalse(body.containsKey("otp"), "In production, OTP must never be returned in JSON response");
        assertEquals("New OTP has been sent to your email.", body.get("message"));
    }

    @Test
    @DisplayName("Resend OTP in development profile includes OTP in response for local testing")
    void testResendOtpInDevProfileIncludesOtpInResponse() {
        ReflectionTestUtils.setField(authController, "activeProfile", "dev");
        ReflectionTestUtils.setField(authController, "appEnv", "dev");

        testUser.setVerified(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ResponseEntity<?> response = authController.resendOtp(new ResendOtpRequest(testUser.getEmail()));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("otp"), "In development, OTP can be returned for developer convenience");
    }
}
