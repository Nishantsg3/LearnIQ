package learniq_backend.controller;

import learniq_backend.model.Test;
import learniq_backend.model.User;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import learniq_backend.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
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

    @PutMapping("/tests/{id}/status")
    public ResponseEntity<?> updateTestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");

        List<String> allowed = List.of("DRAFT", "LIVE", "SCHEDULED");
        if (newStatus == null || !allowed.contains(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid status. Allowed: DRAFT, LIVE, SCHEDULED"));
        }

        Test test = testRepository.findById(id)
                .orElse(null);
        if (test == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Test not found"));
        }

        test.setStatus(newStatus);

        // Auto-set startedAt when going LIVE
        if ("LIVE".equals(newStatus) && test.getStartedAt() == null) {
            test.setStartedAt(LocalDateTime.now());
        }

        testRepository.save(test);
        System.out.println("[Admin] Test " + id + " status updated to " + newStatus);

        return ResponseEntity.ok(Map.of(
            "id", test.getId(),
            "title", test.getTitle(),
            "status", test.getStatus()
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
