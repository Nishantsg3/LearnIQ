package learniq_backend.controller;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.model.TestAttempt;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.service.TestLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/tests")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TestController {

    private final TestRepository testRepository;
    private final learniq_backend.repository.QuestionRepository questionRepository;
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final learniq_backend.repository.AttemptAnswerRepository attemptAnswerRepository;
    private final TestLifecycleService testLifecycleService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // ─── GET ALL ────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Test>> getAllTests() {
        try {
            List<Test> tests = testRepository.findAll();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }


    // ─── GET ONE ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id, Authentication authentication) {
        return testRepository.findById(id)
                .map(test -> {
                    testLifecycleService.syncTestLifecycle(test);
                    return test;
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── GET ACTIVE (Time-controlled MAIN tests) ────────────────────────────────

    @GetMapping("/active")
    public ResponseEntity<List<Test>> getActiveTests() {
        LocalDateTime now = LocalDateTime.now();
        return ResponseEntity.ok(testRepository.findAll().stream()
                .filter(t -> "MAIN".equalsIgnoreCase(t.getTestType()) && testLifecycleService.isActuallyActive(t, now))
                .toList());
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createTest(@RequestBody learniq_backend.dto.CreateTestRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        }
        
        String testType = request.testType() != null ? request.testType().toUpperCase() : "PRACTICE";
        
        // 1. Validation Logic
        if ("MAIN".equals(testType)) {
            if (request.startTime() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Start time is required for MAIN tests"));
            }
        }

        try {
            Test test = new Test();
            test.setTitle(request.title());
            String cat = request.category() != null ? request.category() : "JAVA";
            test.setCategory(cat.replace("_", ".").toUpperCase());
            test.setTestType(testType);
            
            if ("MAIN".equals(testType)) {
                test.setStartTime(request.startTime());
            } else {
                test.setStartTime(null);
            }

            int count = request.totalQuestions() != null ? request.totalQuestions() : 10;
            test.setQuestionCount(count);
            
            if (request.duration() != null && request.duration() > 0) {
                test.setDurationMinutes(request.duration());
            } else {
                test.setDurationMinutes((int) Math.ceil(count * 1.5));
            }

            if ("MAIN".equals(testType) && test.getStartTime() != null) {
                test.setEndTime(test.getStartTime().plusMinutes(test.getDurationMinutes()));
            }

            test.setStatus("ACTIVE");
            test.setStartedAt(LocalDateTime.now());
            test.setDescription(request.description());

            // 2. RANDOM QUESTION SELECTION (EXACT COUNT)
            System.out.println("[AUDIT] ATTEMPTING SELECTION - Category: " + test.getCategory() + " | Requested: " + count);
            List<Question> selectedQs;
            if ("ALL".equalsIgnoreCase(test.getCategory())) {
                selectedQs = questionRepository.findRandom(count);
            } else {
                selectedQs = questionRepository.findRandomByCategory(test.getCategory(), count);
            }
            
            System.out.println("[AUDIT] SELECTION RESULT - Found: " + selectedQs.size());
            
            if (selectedQs.size() < count) {
                System.out.println("[AUDIT] FAILURE - Not enough questions for " + test.getCategory());
                return ResponseEntity.badRequest().body(Map.of("message", "Not enough questions available. Found only " + selectedQs.size()));
            }

            test.setQuestionCount(selectedQs.size());
            test.setQuestions(new ArrayList<>(selectedQs));

            // 🔥 Bidirectional sync to ensure join table is populated correctly
            for (Question q : selectedQs) {
                if (q.getTests() == null) q.setTests(new ArrayList<>());
                if (!q.getTests().contains(test)) {
                    q.getTests().add(test);
                }
            }

            long qCountBefore = questionRepository.count();
            System.out.println("[AUDIT] TEST CREATION - Total Questions Available: " + qCountBefore);

            Test savedTest = testRepository.save(test);
            
            long qCountAfter = questionRepository.count();
            System.out.println("API [POST /create] - Generated Test ID: " + savedTest.getId() + " with " + selectedQs.size() + " questions.");
            System.out.println("[AUDIT] TEST CREATION COMPLETE - Questions After: " + qCountAfter);
            return ResponseEntity.ok(savedTest);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to generate test: " + e.getMessage()));
        }
    }

    // ─── GO LIVE (admin override) ────────────────────────────────────────────────

    @PostMapping("/{id}/live")
    public ResponseEntity<?> goLive(@PathVariable Long id) {
        return testRepository.findById(id)
                .map(test -> {
                    test.setStatus("ACTIVE");
                    test.setStartedAt(LocalDateTime.now());
                    return ResponseEntity.ok(testRepository.save(test));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── LEADERBOARD ────────────────────────────────────────────────────────────

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> getTestLeaderboard(@PathVariable Long id, Authentication authentication) {
        return testRepository.findById(id).map(test -> {
            if (!"MAIN".equalsIgnoreCase(test.getTestType())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Leaderboard is only available for MAIN tests."));
            }

            List<TestAttempt> attempts = testAttemptRepository.findByTestIdAndSubmitted(id, true);
            
            // Sort by score descending
            attempts.sort((a, b) -> Double.compare(b.getScorePercent(), a.getScorePercent()));

            List<learniq_backend.dto.LeaderboardEntry> leaderboard = new ArrayList<>();
            int rank = 1;
            String userEmail = authentication != null ? authentication.getName() : null;
            boolean isAdmin = isAdmin(authentication);
            boolean isExpired = test.getEndTime() != null && LocalDateTime.now().isAfter(test.getEndTime());

            for (TestAttempt attempt : attempts) {
                // Resolve email from User entity to ensure learniq.com address is shown
                String email = (attempt.getUser() != null) ? attempt.getUser().getEmail() : attempt.getUserEmail();
                
                learniq_backend.dto.LeaderboardEntry entry = new learniq_backend.dto.LeaderboardEntry(
                    rank++,
                    attempt.getUserName(),
                    email,
                    attempt.getScorePercent()
                );

                // Privacy Rule: Students only see themselves if test is NOT expired
                if (isAdmin || isExpired) {
                    leaderboard.add(entry);
                } else if (email != null && email.equalsIgnoreCase(userEmail)) {
                    leaderboard.add(entry);
                }
            }

            return ResponseEntity.ok(leaderboard);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        if ("ARCHIVED".equalsIgnoreCase(test.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot toggle active state on an archived test."));
        }

        String nextStatus = "ACTIVE".equalsIgnoreCase(test.getStatus()) ? "ARCHIVED" : "ACTIVE";
        test.setStatus(nextStatus);
        testRepository.save(test);

        return ResponseEntity.ok(test);
    }





    // ─── UPDATE ─────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTest(@PathVariable Long id, @RequestBody learniq_backend.dto.CreateTestRequest request) {
        return testRepository.findById(id)
                .map(test -> {
                    if ("ARCHIVED".equalsIgnoreCase(test.getStatus())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot update an archived test."));
                    }

                    if (request.title() != null) test.setTitle(request.title());
                    if (request.category() != null) {
                        test.setCategory(request.category().replace("_", ".").toUpperCase());
                    }
                    if (request.sectionType() != null) test.setSectionType(request.sectionType());
                    if (request.difficultyLevel() != null) test.setDifficultyLevel(request.difficultyLevel());
                    if (request.scheduledAt() != null) test.setScheduledAt(request.scheduledAt());
                    if (request.startTime() != null) test.setStartTime(request.startTime());
                    if (request.description() != null) test.setDescription(request.description());
                    if (request.testType() != null) test.setTestType(request.testType().toUpperCase());
                    if (request.status() != null) test.setStatus(request.status().toUpperCase());
                    if (request.duration() != null) test.setDurationMinutes(request.duration());

                    if ("MAIN".equalsIgnoreCase(test.getTestType()) && test.getStartTime() != null) {
                        test.setEndTime(test.getStartTime().plusMinutes(test.getDurationMinutes()));
                    }

                    return ResponseEntity.ok(testRepository.save(test));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteTest(@PathVariable Long id) {
        try {
            System.out.println("[AUDIT] PHYSICAL WIPE INITIATED - Test ID: " + id);
            
            // 1. Wipe answers (Correct table name: attempt_answers)
            jdbcTemplate.update("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id = ?)", id);
            
            // 2. Wipe attempts (Correct table name: test_attempts)
            jdbcTemplate.update("DELETE FROM test_attempts WHERE test_id = ?", id);
            
            // 3. Wipe join table
            jdbcTemplate.update("DELETE FROM test_questions WHERE test_id = ?", id);
            
            // 4. Wipe test
            int deleted = jdbcTemplate.update("DELETE FROM test WHERE id = ?", id);
            
            if (deleted > 0) {
                System.out.println("[AUDIT] WIPE SUCCESSFUL - Test ID: " + id);
                return ResponseEntity.ok(Map.of("message", "Record purged", "status", "DELETED"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("[CRITICAL] Wipe Failed for Test " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Purge failed: " + e.getMessage()));
        }
    }


    // ─── HELPERS ────────────────────────────────────────────────────────────────

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
