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
@RequiredArgsConstructor
public class TestController {

    private final TestRepository testRepository;
    private final learniq_backend.repository.QuestionRepository questionRepository;
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final learniq_backend.repository.AttemptAnswerRepository attemptAnswerRepository;
    private final TestLifecycleService testLifecycleService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // ─── GET COUNTS (Lightweight summary for Dashboard) ─────────────────────────

    @GetMapping("/counts")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Integer>> getTestCounts() {
        LocalDateTime now = LocalDateTime.now();
        List<Test> tests = testRepository.findAll();
        int practice = 0;
        int liveMain = 0;
        int scheduled = 0;

        for (Test t : tests) {
            String status = t.getStatus() != null ? t.getStatus().toUpperCase() : "";
            if ("ARCHIVED".equals(status)) continue;

            String type = t.getTestType() != null ? t.getTestType().toUpperCase() : "";
            if ("PRACTICE".equals(type) && ("ACTIVE".equals(status) || "LIVE".equals(status))) {
                practice++;
            } else if ("MAIN".equals(type)) {
                LocalDateTime start = t.getStartTime() != null ? t.getStartTime() : t.getScheduledAt();
                int duration = t.getDurationMinutes() > 0 ? t.getDurationMinutes() : 60;
                LocalDateTime end = t.getEndTime() != null ? t.getEndTime() : (start != null ? start.plusMinutes(duration) : null);

                if ("SCHEDULED".equals(status) || (start != null && now.isBefore(start))) {
                    scheduled++;
                } else if (start != null && !now.isBefore(start) && (end == null || !now.isAfter(end))) {
                    liveMain++;
                } else if (("ACTIVE".equals(status) || "LIVE".equals(status)) && (end == null || !now.isAfter(end))) {
                    liveMain++;
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "practice", practice,
            "liveMain", liveMain,
            "scheduled", scheduled
        ));
    }

    // ─── GET ALL ────────────────────────────────────────────────────────────────

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Test>> getAllTests() {
        try {
            List<Test> tests = testRepository.findAll();
            return ResponseEntity.ok(tests != null ? tests : Collections.emptyList());
        } catch (Exception e) {
            System.err.println("[TestController] Error fetching tests: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }


    // ─── GET ONE ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Transactional
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
    @Transactional(readOnly = true)
    public ResponseEntity<List<Test>> getActiveTests() {
        LocalDateTime now = LocalDateTime.now();
        return ResponseEntity.ok(testRepository.findAll().stream()
                .filter(t -> "MAIN".equalsIgnoreCase(t.getTestType()) && testLifecycleService.isActuallyActive(t, now))
                .toList());
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────────

    @PostMapping
    @Transactional
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
                test.setDurationMinutes(count > 0 ? (int) Math.ceil(count * 1.5) : 60);
            }

            if ("MAIN".equals(testType) && test.getStartTime() != null) {
                int duration = test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
                test.setEndTime(test.getStartTime().plusMinutes(duration));
            }

            test.setStatus("ACTIVE");
            test.setStartedAt(LocalDateTime.now());
            test.setDescription(request.description());

            // 2. QUESTION SELECTION
            System.out.println("[AUDIT] ATTEMPTING SELECTION - Category: " + test.getCategory() + " | Requested: " + count);
            List<Question> selectedQs;
            if (request.questionIds() != null && !request.questionIds().isEmpty()) {
                selectedQs = questionRepository.findAllById(request.questionIds());
            } else if ("ALL".equalsIgnoreCase(test.getCategory())) {
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
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[TestController] Create Test Failure: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", sanitizeErrorMessage(e, "Failed to generate test. Please try again.")));
        }
    }

    // ─── GO LIVE (admin override) ────────────────────────────────────────────────

    @PostMapping("/{id}/live")
    @Transactional
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
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTestLeaderboard(@PathVariable Long id, Authentication authentication) {
        return testRepository.findById(id).map(test -> {
            if (!"MAIN".equalsIgnoreCase(test.getTestType())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Leaderboard is only available for MAIN tests."));
            }

            List<TestAttempt> attempts = testAttemptRepository.findByTestIdAndStatus(id, TestAttempt.Status.SUBMITTED);
            
            // Sort by score descending
            attempts.sort((a, b) -> Double.compare(b.getScorePercent(), a.getScorePercent()));

            List<learniq_backend.dto.LeaderboardEntry> leaderboard = new ArrayList<>();
            int rank = 1;
            int displayRank = 1;
            double lastScore = -1.0;
            String userEmail = authentication != null ? authentication.getName() : null;
            boolean isAdmin = isAdmin(authentication);
            boolean isExpired = test.getEndTime() != null && LocalDateTime.now().isAfter(test.getEndTime());

            for (TestAttempt attempt : attempts) {
                double score = attempt.getScorePercent();
                if (score != lastScore) {
                    displayRank = rank;
                    lastScore = score;
                }
                rank++;

                // Resolve email and name from User entity to ensure learniq.com address is shown
                String email = (attempt.getUser() != null && attempt.getUser().getEmail() != null)
                        ? attempt.getUser().getEmail() : (attempt.getUserEmail() != null ? attempt.getUserEmail() : "");
                String name = (attempt.getUser() != null && attempt.getUser().getName() != null)
                        ? attempt.getUser().getName() : (attempt.getUserName() != null ? attempt.getUserName() : "Candidate");
                
                learniq_backend.dto.LeaderboardEntry entry = new learniq_backend.dto.LeaderboardEntry(
                    displayRank,
                    name,
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
    @Transactional
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
    @Transactional
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
                    if (request.duration() != null && request.duration() > 0) test.setDurationMinutes(request.duration());

                    if ("PRACTICE".equalsIgnoreCase(test.getTestType())) {
                        test.setStartTime(null);
                        test.setEndTime(null);
                    } else if (test.getStartTime() != null) {
                        int duration = test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
                        test.setEndTime(test.getStartTime().plusMinutes(duration));
                    }

                    return ResponseEntity.ok(testRepository.save(test));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTest(@PathVariable Long id) {
        testLifecycleService.deleteTestSafely(id);
        return ResponseEntity.ok(Map.of("message", "Record purged", "status", "DELETED"));
    }


    // ─── HELPERS ────────────────────────────────────────────────────────────────

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private String sanitizeErrorMessage(Exception e, String defaultMessage) {
        if (e instanceof org.springframework.dao.DataAccessException ||
            e instanceof jakarta.persistence.PersistenceException ||
            e instanceof java.sql.SQLException) {
            return "A database error occurred. Please try again later.";
        }
        String msg = e.getMessage();
        if (msg == null || msg.isBlank() || msg.contains("SQL") || msg.contains("table") || msg.contains("hibernate") || msg.contains("jdbc") || msg.contains("database")) {
            return defaultMessage;
        }
        return msg;
    }
}
