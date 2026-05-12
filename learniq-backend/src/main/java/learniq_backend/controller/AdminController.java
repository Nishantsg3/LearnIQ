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
import java.util.HashMap;
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
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final learniq_backend.repository.AttemptAnswerRepository attemptAnswerRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        System.out.println("\n--- [DEBUG] SYSTEM STATS AUDIT ---");
        List<Test> allTests = testRepository.findAll();
        System.out.println("TOTAL RECORDS IN DB: " + allTests.size());
        allTests.forEach(t -> System.out.println(" - ID: " + t.getId() + " | TITLE: " + t.getTitle() + " | STATUS: " + t.getStatus()));
        
        long activeCount = testRepository.countByStatus("ACTIVE");
        long practiceCount = allTests.stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()) && "PRACTICE".equalsIgnoreCase(t.getTestType()))
                .count();
        long mainCount = allTests.stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()) && "MAIN".equalsIgnoreCase(t.getTestType()))
                .count();
        
        long studentCount = userRepository.countByRole(User.Role.STUDENT);
        long questionCount = questionRepository.count();

        System.out.println("CALCULATED ACTIVE: " + activeCount);
        System.out.println("----------------------------------\n");

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
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .map(u -> {
                    // Backfill missing dates for legacy accounts to 'Today' (May 5, 2026)
                    if (u.getCreatedAt() == null) {
                        u.setCreatedAt(LocalDateTime.of(2026, 5, 5, 10, 0));
                        userRepository.save(u);
                    }
                    return u;
                })
                .toList();
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
        admin.setPassword(request.password()); // 🔥 Plain text for prototype
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

        List<learniq_backend.model.TestAttempt> attempts = testAttemptRepository.findByTestIdAndSubmitted(testId, true);
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
        List<Test> archived = testRepository.findByStatus("ARCHIVED");
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

    @DeleteMapping("/tests/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteTest(@PathVariable Long id) {
        try {
            System.out.println("[AUDIT] PHYSICAL WIPE INITIATED - Test ID: " + id);
            
            // 1. Wipe answers
            jdbcTemplate.update("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id = ?)", id);
            
            // 2. Wipe attempts
            jdbcTemplate.update("DELETE FROM test_attempts WHERE test_id = ?", id);
            
            // 3. Wipe join table
            jdbcTemplate.update("DELETE FROM test_questions WHERE test_id = ?", id);
            
            // 3.5 Wipe legacy foreign key
            jdbcTemplate.update("UPDATE question SET test_id = NULL WHERE test_id = ?", id);
            
            // 4. Wipe test
            int deleted = jdbcTemplate.update("DELETE FROM test WHERE id = ?", id);
            
            if (deleted > 0) {
                System.out.println("[AUDIT] WIPE SUCCESSFUL - Test ID: " + id);
                return ResponseEntity.ok(Map.of("message", "Test and all associated history permanently removed", "status", "DELETED"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Test not found"));
            }
        } catch (Exception e) {
            System.err.println("[CRITICAL] Wipe Failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Purge failed: " + e.getMessage()));
        }
    }


    @PostMapping("/attempts/reset")
    public ResponseEntity<?> resetAttempts() {
        try {
            long count = testAttemptRepository.count();
            testAttemptRepository.deleteAll();
            System.out.println("[ADMIN] All test attempts reset. Total cleared: " + count);
            return ResponseEntity.ok(Map.of("message", "All test attempts and answers have been cleared.", "count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to reset attempts: " + e.getMessage()));
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/tests/purge-by-name")
    public ResponseEntity<?> purgeByName(@RequestParam String name) {
        System.out.println("[AUDIT] SUPER PURGE INITIATED - Name Pattern: " + name);
        
        // 1. Wipe answers
        jdbcTemplate.update("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER(?)))", name);
        
        // 2. Wipe attempts
        jdbcTemplate.update("DELETE FROM test_attempts WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER(?))", name);
        
        // 3. Wipe join table
        jdbcTemplate.update("DELETE FROM test_questions WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER(?))", name);
        
        // 3.5 Wipe legacy foreign key
        jdbcTemplate.update("UPDATE question SET test_id = NULL WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER(?))", name);
        
        // 4. Wipe tests
        int deleted = jdbcTemplate.update("DELETE FROM test WHERE LOWER(title) = LOWER(?)", name);
        
        return ResponseEntity.ok(Map.of("message", "Purged " + deleted + " records matching '" + name + "'"));
    }

    @DeleteMapping("/students/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    if (user.getRole() == User.Role.ADMIN) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete admin accounts"));
                    }
                    
                    // 1. Delete associated attempts to avoid integrity violations
                    // Since TestAttempt usually has @ManyToOne to User
                    List<learniq_backend.model.TestAttempt> attempts = testAttemptRepository.findByUserId(id);
                    testAttemptRepository.deleteAll(attempts);
                    
                    // 2. Delete the user
                    userRepository.delete(user);
                    
                    System.out.println("[Admin] Student account deleted: " + id + " (" + user.getEmail() + ")");
                    return ResponseEntity.ok(Map.of("message", "Student account and associated data removed successfully"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Student not found")));
    }
}
