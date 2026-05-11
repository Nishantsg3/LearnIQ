package learniq_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    @Value("${spring.mail.from}")
    private String fromEmail;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("[EMAIL-SERVICE] Starting. Auth User: {}, Verified Sender: {}", smtpUsername, fromEmail);
    }

    private static final String BRAND_COLOR = "#8b5cf6";
    private static final String DARK_BG = "#0d0d10";
    private static final String CARD_BG = "#16161a";

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(new InternetAddress(fromEmail, "LearnIQ"));
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        mailSender.send(message);
    }

    private String getBaseTemplate(String content) {
        return "<html><body style=\"background-color: " + DARK_BG + "; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px;\">" +
               "<div style=\"max-width: 600px; margin: 0 auto; background-color: " + CARD_BG + "; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); shadow: 0 10px 30px rgba(0,0,0,0.5);\">" +
               "  <div style=\"padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);\">" +
               "    <div style=\"font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;\">" +
               "      <span style=\"color: #ffffff;\">LEARN</span><span style=\"color: " + BRAND_COLOR + ";\">IQ</span>" +
               "    </div>" +
               "  </div>" +
               "  <div style=\"padding: 40px;\">" +
               content +
               "  </div>" +
               "  <div style=\"padding: 20px; text-align: center; background-color: rgba(0,0,0,0.2); color: rgba(255,255,255,0.3); font-size: 11px; font-weight: 700; letter-spacing: 1px;\">" +
               "    LEARNIQ © 2026 • PRECISION IN ASSESSMENT" +
               "  </div>" +
               "</div></body></html>";
    }



    public boolean sendRegistrationOtpEmail(String toEmail, String otp) {
        try {
            String content = "<h2 style=\"margin: 0 0 20px; font-size: 22px;\">Verify Your Account</h2>" +
                             "<p style=\"color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 30px;\">Welcome to LearnIQ! Use the verification code below to complete your registration.</p>" +
                             "<div style=\"background: rgba(139, 92, 246, 0.1); border: 1px solid " + BRAND_COLOR + "; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;\">" +
                             "  <span style=\"font-size: 32px; font-weight: 900; letter-spacing: 8px; color: " + BRAND_COLOR + ";\">" + otp + "</span>" +
                             "</div>" +
                             "<p style=\"color: rgba(255,255,255,0.4); font-size: 13px;\">This code will expire in 5 minutes.</p>";
            
            sendHtmlEmail(toEmail, "Verify Your LearnIQ Account", getBaseTemplate(content));
            return true;
        } catch (Exception e) {
            log.error("[MAIL] Registration email failed to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }

    public boolean sendResetPasswordEmail(String toEmail, String resetLink) {
        log.info("[EMAIL-SERVICE] sendResetPasswordEmail invoked for: {}", toEmail);
        try {
            String content = "<h2 style=\"margin: 0 0 20px; font-size: 22px;\">Reset Your Password</h2>" +
                             "<p style=\"color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 30px;\">We received a request to reset your LearnIQ password. Click the button below to proceed.</p>" +
                             "<div style=\"text-align: center; margin-bottom: 30px;\">" +
                             "  <a href=\"" + resetLink + "\" style=\"background-color: " + BRAND_COLOR + "; color: #ffffff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; transition: transform 0.2s;\">RESET PASSWORD</a>" +
                             "</div>" +
                             "<p style=\"color: rgba(255,255,255,0.4); font-size: 13px;\">If you didn't request this, you can safely ignore this email.</p>";
            
            log.info("[EMAIL-SERVICE] Attempting SMTP send to: {}", toEmail);
            sendHtmlEmail(toEmail, "Reset Your LearnIQ Password", getBaseTemplate(content));
            log.info("[EMAIL-SERVICE] SMTP send successful to: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("[EMAIL-SERVICE] SMTP send FAILED to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }

    public boolean sendTestResultEmail(String toEmail, String studentName, String testName, int score, int correct, int wrong, int rank, String timeTaken, String analysisLink) {
        try {
            String content = "<h2 style=\"margin: 0 0 10px; font-size: 22px;\">Performance Summary</h2>" +
                             "<p style=\"color: " + BRAND_COLOR + "; font-weight: 700; margin-bottom: 25px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;\">" + testName + "</p>" +
                             "<p style=\"color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 30px;\">Hello " + studentName + ", your assessment is complete. Here is your preliminary result.</p>" +
                             
                             "<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;\">" +
                             "  <div style=\"background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);\">" +
                             "    <div style=\"font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase;\">Score</div>" +
                             "    <div style=\"font-size: 24px; font-weight: 900; color: #ffffff;\">" + score + "%</div>" +
                             "  </div>" +
                             "  <div style=\"background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);\">" +
                             "    <div style=\"font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase;\">Rank</div>" +
                             "    <div style=\"font-size: 24px; font-weight: 900; color: " + BRAND_COLOR + ";\">#" + rank + "</div>" +
                             "  </div>" +
                             "</div>" +
 
                             "<div style=\"margin-bottom: 30px;\">" +
                             "  <div style=\"display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;\">" +
                             "    <span style=\"color: rgba(255,255,255,0.5);\">Correct Answers</span>" +
                             "    <span style=\"color: #4ade80; font-weight: 700;\">" + correct + "</span>" +
                             "  </div>" +
                             "  <div style=\"display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;\">" +
                             "    <span style=\"color: rgba(255,255,255,0.5);\">Wrong Answers</span>" +
                             "    <span style=\"color: #f87171; font-weight: 700;\">" + wrong + "</span>" +
                             "  </div>" +
                             "  <div style=\"display: flex; justify-content: space-between; font-size: 13px;\">" +
                             "    <span style=\"color: rgba(255,255,255,0.5);\">Time Taken</span>" +
                             "    <span style=\"color: #ffffff; font-weight: 700;\">" + timeTaken + "</span>" +
                             "  </div>" +
                             "</div>" +
 
                             "<div style=\"text-align: center; margin-bottom: 10px;\">" +
                             "  <a href=\"" + analysisLink + "\" style=\"background-color: " + BRAND_COLOR + "; color: #ffffff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;\">VIEW DETAILED ANALYSIS</a>" +
                             "</div>";
            
            sendHtmlEmail(toEmail, "Test Result: " + testName, getBaseTemplate(content));
            return true;
        } catch (Exception e) {
            log.error("[MAIL] Test result email failed to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }
}
