package learniq_backend.service;

import org.springframework.stereotype.Service;

/**
 * EmailService is temporarily disabled (OTP bypass mode).
 * JavaMailSender is not configured, so all email methods are no-ops.
 * Re-enable by injecting JavaMailSender and restoring implementations.
 */
@Service
public class EmailService {

    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        System.out.println("[EmailService] BYPASSED - sendRegistrationOtpEmail to: " + toEmail);
    }

    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        System.out.println("[EmailService] BYPASSED - sendResetPasswordEmail to: " + toEmail);
    }
}
