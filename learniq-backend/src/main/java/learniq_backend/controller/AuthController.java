package learniq_backend.controller;

import jakarta.validation.Valid;
import learniq_backend.dto.ForgotPasswordRequest;
import learniq_backend.dto.LoginRequest;
import learniq_backend.dto.RegisterRequest;
import learniq_backend.dto.ResetPasswordRequest;
import learniq_backend.dto.ResendOtpRequest;
import learniq_backend.dto.VerifyOtpRequest;
import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import learniq_backend.security.JwtUtil;
import learniq_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Value("${app.env:dev}")
    private String appEnv;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        String otp = generateOtp();

        // Bypassing OTP for faster registration (Temporary)
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password())); // Encoded password
        user.setRole(User.Role.STUDENT);
        user.setVerified(true); // 🔥 Auto-verify
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        System.out.println("\n=============================================");
        System.out.println("  OTP BYPASSED: User marked as Verified");
        System.out.println("  Email: " + user.getEmail());
        System.out.println("=============================================\n");

        /* 
        // Skip Email Sending (Bypassed)
        try {
            emailService.sendRegistrationOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            // Log error
        }
        */

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "Registration successful! You can now log in immediately.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        if (request.email() == null || request.otp() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.email().trim().toLowerCase());
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Account not found"));
        }
        
        User user = userOpt.get();
        if (user.isVerified()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is already verified"));
        }
        
        if (user.getOtp() == null || !user.getOtp().equals(request.otp().trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid OTP"));
        }
        
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP has expired. Please register again."));
        }
        
        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        if (request.email() == null) {
             return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.email().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Account not found"));
        }

        User user = userOpt.get();
        if (user.isVerified()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is already verified"));
        }

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        System.out.println("\n-------------------------------------------");
        System.out.println("  OTP RESENT: " + otp);
        System.out.println("  Email: " + user.getEmail());
        System.out.println("-------------------------------------------\n");

        try {
            emailService.sendRegistrationOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            // Log error but proceed as we have console fallback
        }

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "New OTP has been sent to your email.");
        if (!"prod".equalsIgnoreCase(appEnv)) {
            response.put("otp", otp);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> studentLogin(@Valid @RequestBody LoginRequest request) {
        return authenticate(request, User.Role.STUDENT);
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody LoginRequest request) {
        return authenticate(request, User.Role.ADMIN);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        log.info("[AUTH] Password reset requested for email: {}", email);

        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            String token = UUID.randomUUID().toString();
            log.info("[AUTH] Generated reset token for {}: {}", email, token);
            
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);
            
            // Send Reset Link via Email.
            String resetLink = frontendUrl + "/reset-password/" + token;
            log.info("[AUTH] Dispatching reset email to {} with link: {}", email, resetLink);
            emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
        }, () -> {
            log.warn("[AUTH] Password reset requested for non-existent email: {}", email);
        });

        return ResponseEntity.ok(Map.of("message", "Reset link sent if email exists"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByResetToken(request.token().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));
        }

        User user = userOpt.get();
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));
        }

        user.setPassword(passwordEncoder.encode(request.password())); // Encoded password
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }

        return userRepository.findByEmail(authentication.getName())
                .map(user -> ResponseEntity.ok(Map.of(
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                )))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return ResponseEntity.badRequest().body(errors);
    }

    private ResponseEntity<?> authenticate(LoginRequest request, User.Role expectedRole) {
        Optional<User> userOpt = userRepository.findByEmail(request.email().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        
        // 🔥 DEBUG LOGS
        System.out.println("\n--- LOGIN DEBUG ---");
        System.out.println("LOGIN INPUT: " + request.password());
        System.out.println("DB PASSWORD: " + user.getPassword());
        System.out.println("-------------------\n");

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }
        
        /* 
        if (!user.isVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Please verify your email before logging in."));
        }
        */

        if (expectedRole == User.Role.STUDENT && user.getRole() == User.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Use the admin login portal"));
        }

        if (expectedRole == User.Role.ADMIN && user.getRole() == User.Role.STUDENT) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Invalid admin credentials"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole().name(),
                "name", user.getName()
        ));
    }
    
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
