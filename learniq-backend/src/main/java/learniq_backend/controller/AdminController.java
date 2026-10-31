package learniq_backend.controller;

import learniq_backend.model.Test;
import learniq_backend.model.User;
import learniq_backend.model.TestAttempt;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {
    private final learniq_backend.service.TestLifecycleService testLifecycleService;
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        List<Test> allTests = testRepository.findAll();
        
        long activeCount = 0;
        long practiceCount = 0;
        long mainCount = 0;

        for (Test t : allTests) {
            if (testLifecycleService.isActuallyActive(t, now)) {
                activeCount++;
                if ("PRACTICE".equalsIgnoreCase(t.getTestType())) {
                    practiceCount++;
                } else if ("MAIN".equalsIgnoreCase(t.getTestType())) {
                    mainCount++;
                }
            }
        }
        
        long studentCount = userRepository.countByRole(User.Role.STUDENT);
        long questionCount = questionRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalAssessments", activeCount,
                "practiceTests", practiceCount,
                "mainTests", mainCount,
                "studentCount", studentCount,
                "questionCount", questionCount
        ));
    }

    @GetMapping("/students")
    public ResponseEntity<List<User>> getStudents() {
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/tests")
    public ResponseEntity<List<Test>> getAllTests() {
        return ResponseEntity.ok(testRepository.findAll());
    }

    @PutMapping("/tests/{id}/status")
    public ResponseEntity<?> updateTestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");

        List<String> allowed = List.of("DRAFT", "ACTIVE", "SCHEDULED", "ARCHIVED");
        if (newStatus == null || !allowed.contains(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid status. Allowed: DRAFT, ACTIVE, SCHEDULED, ARCHIVED"));
        }

        Test test = testRepository.findById(id)
                .orElse(null);
        if (test == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Test not found"));
        }

        test.setStatus(newStatus);

        // Auto-set startedAt when going ACTIVE
        if ("ACTIVE".equals(newStatus) && test.getStartedAt() == null) {
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

        User admin = new User();
        admin.setName(request.name().trim());
        admin.setEmail(request.email().trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(request.password())); // BCrypt hashed
        admin.setRole(User.Role.ADMIN);
        admin.setVerified(true); // Admins created by other admins are pre-verified

        userRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Admin account created successfully"));
    }

    @GetMapping("/tests/{testId}/analytics")
    public ResponseEntity<?> getTestAnalytics(@PathVariable Long testId) {
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"MAIN".equalsIgnoreCase(test.getTestType())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Analytics only available for MAIN tests"));
        }

        List<learniq_backend.model.TestAttempt> attempts = testAttemptRepository.findByTestIdAndStatus(testId, TestAttempt.Status.SUBMITTED);
        long totalStudents = userRepository.countByRole(User.Role.STUDENT);
        
        long totalAttempts = attempts.size();
        if (totalAttempts == 0) {
            return ResponseEntity.ok(new learniq_backend.dto.TestAnalyticsResponse(
                test.getId(), test.getTitle(), test.getCategory(), test.getDurationMinutes(),
                0, 0.0, 0.0, 0.0, 0, 0.0, 0.0
            ));
        }

        double sum = 0;
        double max = -1;
        double min = 101;
        long passCount = 0;
        java.util.Set<String> uniqueStudents = new java.util.HashSet<>();

        for (learniq_backend.model.TestAttempt att : attempts) {
            double score = att.getScorePercent();
            sum += score;
            if (score > max) max = score;
            if (score < min) min = score;
            if (score >= 50) passCount++;
            
            // Resolve email from User entity to avoid old migration data
            String email = (att.getUser() != null) ? att.getUser().getEmail() : att.getUserEmail();
            uniqueStudents.add(email);
        }

        double avg = sum / totalAttempts;
        double passPct = (double) passCount / totalAttempts * 100.0;
        double participationRate = totalStudents > 0 ? (double) uniqueStudents.size() / totalStudents * 100.0 : 0.0;

        return ResponseEntity.ok(new learniq_backend.dto.TestAnalyticsResponse(
            test.getId(), test.getTitle(), test.getCategory(), test.getDurationMinutes(),
            totalAttempts, 
            Math.round(avg * 100.0) / 100.0, 
            max, 
            min, 
            uniqueStudents.size(),
            Math.round(passPct * 100.0) / 100.0,
            Math.round(participationRate * 100.0) / 100.0
        ));
    }

    @GetMapping("/tests/archived")
    public ResponseEntity<?> getArchivedTests() {
        LocalDateTime now = LocalDateTime.now();
        List<Test> all = testRepository.findAll();
        
        // Archived tests are those EXPLICITLY archived OR technically expired
        List<Test> archived = all.stream()
                .filter(t -> "ARCHIVED".equalsIgnoreCase(t.getStatus()) || !testLifecycleService.isActuallyActive(t, now))
                .toList();

        List<Map<String, Object>> result = archived.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("title", t.getTitle());
            map.put("category", t.getCategory());
            map.put("testType", t.getTestType());
            map.put("createdAt", t.getCreatedAt());
            map.put("attemptCount", testAttemptRepository.countByTestId(t.getId()));
            map.put("archived", true);
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/tests/{id:\\d+}")
    public ResponseEntity<?> deleteTest(@PathVariable Long id) {
        testLifecycleService.deleteTestSafely(id);
        return ResponseEntity.ok(Map.of("message", "Test deleted successfully", "status", "DELETED"));
    }

    @DeleteMapping("/students/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    if (user.getRole() == User.Role.ADMIN) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete admin accounts"));
                    }
                    
                    // 1. Delete dependent attempt_answers first
                    jdbcTemplate.update(
                        "DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE user_id = ? OR (user_id IS NULL AND LOWER(user_email) = LOWER(?)))",
                        user.getId(), user.getEmail()
                    );

                    // 2. Delete associated test_attempts second
                    jdbcTemplate.update(
                        "DELETE FROM test_attempts WHERE user_id = ? OR (user_id IS NULL AND LOWER(user_email) = LOWER(?))",
                        user.getId(), user.getEmail()
                    );

                    // 3. Delete the user through JPA last
                    userRepository.delete(user);
                    
                    System.out.println("[Admin] Student account deleted: " + id + " (" + user.getEmail() + ")");
                    return ResponseEntity.ok(Map.of("message", "Student account and associated data removed successfully"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Student not found")));
    }
}
