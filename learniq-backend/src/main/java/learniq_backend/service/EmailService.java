package learniq_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("LearnIQ - Your Registration OTP");
            message.setText("Welcome to LearnIQ!\n\nYour OTP for registration is: " + otp + "\n\nThis OTP is valid for 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + toEmail + ". Check configs.");
            e.printStackTrace();
        }
    }

    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("LearnIQ - Password Reset Request");
            message.setText("You requested a password reset for LearnIQ.\n\nClick the link below to reset your password:\n" + resetLink + "\n\nThis link is valid for 15 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send Password Reset email to " + toEmail + ". Check configs.");
            e.printStackTrace();
        }
    }
}
