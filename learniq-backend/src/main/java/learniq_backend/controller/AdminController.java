package learniq_backend.controller;

import learniq_backend.model.User;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import learniq_backend.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        long totalTests = testRepository.count();
        long totalQuestions = questionRepository.count();
        long liveTests = testRepository.countByStatus("LIVE");
        long totalStudents = userRepository.countByRole(User.Role.STUDENT);

        return ResponseEntity.ok(Map.of(
                "totalTests", totalTests,
                "totalQuestions", totalQuestions,
                "liveTests", liveTests,
                "totalStudents", totalStudents
        ));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        User admin = User.builder()
                .name(request.name().trim())
                .email(request.email().trim().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.ADMIN)
                .isVerified(true) // Admins created by other admins are pre-verified
                .build();

        userRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Admin account created successfully"));
    }
}
