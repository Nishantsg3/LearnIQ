package learniq_backend.controller;

import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/questions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final TestRepository testRepository;
    private final learniq_backend.service.AttemptService attemptService;
    private final UserRepository userRepository;
    private final TestAttemptRepository testAttemptRepository;

    @GetMapping("/bank")
    public List<Question> getAllQuestions() {
        long count = questionRepository.count();
        System.out.println("[AUDIT] ACCESS - Total Questions Available: " + count);
        return questionRepository.findAll();
    }

    @GetMapping("/debug/counts")
    public Map<String, Long> getDebugCounts() {
        Map<String, Long> counts = new HashMap<>();
        for (String cat : ALLOWED_CATEGORIES) {
            counts.put(cat, (long) questionRepository.findByCategory(cat).size());
        }
        counts.put("TOTAL", questionRepository.count());
        return counts;
    }

    // ─── BANK ENDPOINTS ────────────────────────────────────────────────────────

    @GetMapping("/bank-filtered")
    public ResponseEntity<List<Question>> getBankQuestions(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(questionRepository.findByCategory(category));
        }
        return ResponseEntity.ok(questionRepository.findAll());
    }

    private static final List<String> ALLOWED_CATEGORIES = List.of("JAVA", "PYTHON", "APTITUDE", "ASP.NET", "DBMS", "CLOUD");
    private static final int MAX_PER_CATEGORY = 50;
    private static final int TOTAL_LIMIT = 300;

    @PostMapping("/bank")
    public ResponseEntity<?> createBankQuestion(@RequestBody Question question) {
        long countBefore = questionRepository.count();
        System.out.println("[AUDIT] CREATE REQUEST - Questions Before: " + countBefore);

        // 1. Total Limit Check
        if (countBefore >= TOTAL_LIMIT) {
            return ResponseEntity.badRequest().body(Map.of("message", "SCHEMA VIOLATION: Total Question Bank capacity reached (300/300)."));
        }

        // 2. Category Validation & Normalization
        if (question.getCategory() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "SCHEMA VIOLATION: Category is required."));
        }
        
        String normalizedCategory = question.getCategory().trim().replace("_", ".").toUpperCase();
        if (!ALLOWED_CATEGORIES.contains(normalizedCategory)) {
            return ResponseEntity.badRequest().body(Map.of("message", "SCHEMA VIOLATION: Category '" + normalizedCategory + "' is blocked. Allowed: " + ALLOWED_CATEGORIES));
        }
        question.setCategory(normalizedCategory);

        // 3. Category Limit Check
        long categoryCount = questionRepository.findByCategory(normalizedCategory).size();
        if (categoryCount >= MAX_PER_CATEGORY) {
            return ResponseEntity.badRequest().body(Map.of("message", "SCHEMA VIOLATION: Category '" + normalizedCategory + "' has reached its 50-question quota."));
        }

        // 4. Question Text & Uniqueness Check
        if (question.getQuestionText() == null && question.getTitle() != null) {
            question.setQuestionText(question.getTitle());
        }
        if (question.getQuestionText() == null || question.getQuestionText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "SCHEMA VIOLATION: Question title/text is required."));
        }
        if (questionRepository.existsByQuestionText(question.getQuestionText())) {
            return ResponseEntity.badRequest().body(Map.of("message", "INTEGRITY ERROR: A question with this title already exists."));
        }
        
        question.setTests(new ArrayList<>());
        Question saved = questionRepository.save(question);
        long countAfter = questionRepository.count();
        System.out.println("[AUDIT] CREATE SUCCESS - Question ID: " + saved.getId() + " - Questions After: " + countAfter);
        return ResponseEntity.ok(saved);
    }

    @PutMapping({"/{id:[0-9]+}", "/bank/{id:[0-9]+}"})
    public ResponseEntity<?> updateQuestion(@PathVariable Long id, @RequestBody Question details) {
        return questionRepository.findById(id).map(q -> {
            String newText = details.getQuestionText() != null ? details.getQuestionText() : details.getTitle();
            if (newText != null && !newText.isBlank()) {
                q.setQuestionText(newText);
            }
            if (details.getOptionA() != null) q.setOptionA(details.getOptionA());
            if (details.getOptionB() != null) q.setOptionB(details.getOptionB());
            if (details.getOptionC() != null) q.setOptionC(details.getOptionC());
            if (details.getOptionD() != null) q.setOptionD(details.getOptionD());
            if (details.getCorrectAnswer() != null) q.setCorrectAnswer(details.getCorrectAnswer());
            if (details.getCategory() != null && !details.getCategory().isBlank()) {
                String norm = details.getCategory().trim().replace("_", ".").toUpperCase();
                q.setCategory(norm);
            }
            if (details.getDifficultyLevel() != null) q.setDifficultyLevel(details.getDifficultyLevel());
            Question updated = questionRepository.save(q);
            System.out.println("[AUDIT] UPDATE SUCCESS - Question ID: " + id);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id, @RequestParam(required = false, defaultValue = "true") boolean confirm) {
        if (!questionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        questionRepository.deleteById(id);
        System.out.println("[AUDIT] DELETE SUCCESS - Question ID: " + id);
        return ResponseEntity.ok(Map.of("message", "Question deleted successfully."));
    }

    // ─── QUESTIONS BY TEST ─────────────────────────────────────────────────────

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<Question>> getQuestionsByTest(@PathVariable Long testId) {
        return testRepository.findById(testId)
                .map(test -> ResponseEntity.ok(questionRepository.findByTestId(testId)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/test/{testId}")
    public ResponseEntity<?> addQuestionToTest(@PathVariable Long testId, @RequestBody Question question) {
        return testRepository.findById(testId).map(test -> {
            if (test.getQuestions() == null) test.setQuestions(new ArrayList<>());
            test.getQuestions().add(question);
            if (question.getCategory() == null) {
                question.setCategory(test.getCategory());
            }
            Question saved = questionRepository.save(question);
            
            // Sync count
            List<Question> all = questionRepository.findByTestId(testId);
            test.setQuestionCount(all.size());
            testRepository.save(test);
            
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── ATTEMPT: START & WINDOW CHECK ─────────────────────────────────────────

    @GetMapping("/test/{testId}/attempt")
    public ResponseEntity<?> getQuestionsForAttempt(@PathVariable Long testId,
                                                    @RequestParam(required = false) Long attemptId,
                                                    Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        // ✅ FETCH BY ATTEMPT ID IF PROVIDED, OTHERWISE FALLBACK TO IN_PROGRESS ATTEMPT
        Optional<TestAttempt> attemptOpt;
        if (attemptId != null) {
            attemptOpt = testAttemptRepository.findById(attemptId)
                    .filter(a -> (a.getUser() != null && a.getUser().getId().equals(user.getId())) ||
                                 (a.getUserEmail() != null && a.getUserEmail().equalsIgnoreCase(userEmail)));
        } else {
            attemptOpt = testAttemptRepository.findFirstByUserIdAndTestIdAndStatus(
                    user.getId(), testId, TestAttempt.Status.IN_PROGRESS);
        }

        if (attemptOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Assessment not initialized. Please click 'Start' from dashboard."));
        }

        List<Question> questions = questionRepository.findByTestId(testId);
        
        // 🔥 SELF-HEALING: If test was created but questions failed to link, repair on-the-fly
        if (questions.isEmpty()) {
            Test test = testRepository.findById(testId).orElse(null);
            if (test != null) {
                int count = test.getQuestionCount() > 0 ? test.getQuestionCount() : 10;
                System.out.println("[HEALING] Test " + testId + " found empty. Attempting repair with " + count + " questions...");
                
                List<Question> selectedQs = "ALL".equalsIgnoreCase(test.getCategory())
                        ? questionRepository.findRandom(count)
                        : questionRepository.findRandomByCategory(test.getCategory(), count);
                
                if (!selectedQs.isEmpty()) {
                    test.setQuestions(new ArrayList<>(selectedQs));
                    test.setQuestionCount(selectedQs.size());
                    
                    // Bidirectional sync
                    for (Question q : selectedQs) {
                        if (q.getTests() == null) q.setTests(new ArrayList<>());
                        q.getTests().add(test);
                    }
                    
                    testRepository.save(test);
                    questions = selectedQs;
                    System.out.println("[HEALING] Repair successful for Test ID: " + testId);
                }
            }
        }
        
        final List<Question> finalQuestions = questions;

        // 🔥 DEEP REPAIR: If the attempt itself says 0 questions, sync it now
        attemptOpt.ifPresent(a -> {
            if (a.getTotalQuestions() == 0 && !finalQuestions.isEmpty()) {
                System.out.println("[HEALING] Syncing Attempt ID: " + a.getId() + " total questions to " + finalQuestions.size());
                a.setTotalQuestions(finalQuestions.size());
                testAttemptRepository.save(a);
            }
        });

        TestAttempt attempt = attemptOpt.get();

        // ─── DETERMINISTIC QUESTION ORDER ─────────────────────────────────────────
        // Each attempt stores a fixed question order (CSV of IDs) on first access.
        // All subsequent loads (resume, refresh, backend wake-up) restore that same order.
        // This completely eliminates question reshuffling.
        // ──────────────────────────────────────────────────────────────────────────
        List<Question> orderedQuestions;
        if (attempt.getQuestionOrder() != null && !attempt.getQuestionOrder().isBlank()) {
            // Restore the stored order: map from CSV IDs back to Question objects
            Map<Long, Question> byId = new HashMap<>();
            for (Question q : finalQuestions) {
                byId.put(q.getId(), q);
            }
            orderedQuestions = new ArrayList<>();
            for (String idStr : attempt.getQuestionOrder().split(",")) {
                try {
                    Long qid = Long.parseLong(idStr.trim());
                    Question q = byId.get(qid);
                    if (q != null) orderedQuestions.add(q);
                } catch (NumberFormatException ignored) {}
            }
            // Safety: if any questions were added after the order was stored, append them
            Set<Long> orderedIds = new HashSet<>();
            for (Question q : orderedQuestions) orderedIds.add(q.getId());
            for (Question q : finalQuestions) {
                if (!orderedIds.contains(q.getId())) orderedQuestions.add(q);
            }
            System.out.println("[ORDER] Restored stored question order for attempt " + attempt.getId());
        } else {
            // First access: shuffle and persist the order
            orderedQuestions = new ArrayList<>(finalQuestions);
            Collections.shuffle(orderedQuestions);
            StringBuilder orderCsv = new StringBuilder();
            for (int i = 0; i < orderedQuestions.size(); i++) {
                if (i > 0) orderCsv.append(",");
                orderCsv.append(orderedQuestions.get(i).getId());
            }
            attempt.setQuestionOrder(orderCsv.toString());
            testAttemptRepository.save(attempt);
            System.out.println("[ORDER] Stored new question order for attempt " + attempt.getId() + ": " + orderCsv);
        }

        List<QuestionAttemptView> items = orderedQuestions.stream()
                .map(q -> new QuestionAttemptView(q.getId(), q.getQuestionText(),
                        q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()))
                .toList();

        return ResponseEntity.ok(items);
    }

    // ─── TIMER SYNC ────────────────────────────────────────────────────────────

    @GetMapping("/test/{testId}/time")
    public ResponseEntity<?> getRemainingTime(@PathVariable Long testId,
                                              @RequestParam(required = false) Long attemptId,
                                              Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        Optional<TestAttempt> attemptOpt;
        if (attemptId != null) {
            attemptOpt = testAttemptRepository.findById(attemptId)
                    .filter(a -> (a.getUser() != null && a.getUser().getId().equals(user.getId())) ||
                                 (a.getUserEmail() != null && a.getUserEmail().equalsIgnoreCase(userEmail)));
        } else {
            attemptOpt = testAttemptRepository.findFirstByUserIdAndTestIdAndStatus(
                    user.getId(), testId, TestAttempt.Status.IN_PROGRESS);
        }

        if (attemptOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Assessment session inactive."));
        }

        long remaining = attemptService.getRemainingSeconds(attemptOpt.get().getId());
        return ResponseEntity.ok(Map.of("remainingTime", remaining));
    }

    // ─── ATTEMPT: START (creates dummy result for immediate UI sync) ──────────
    @PostMapping("/test/{testId}/start-attempt")
    public ResponseEntity<?> startAttempt(@PathVariable Long testId, Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, testId);
            String msg = attempt.getSubmittedAt() == null ? "Attempt initialized" : "Attempt resumed";
            return ResponseEntity.ok(Map.of("message", msg, "attemptId", attempt.getId()));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── ATTEMPT: SUBMIT (updates initialized result) ──────────────────────────
    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/test/{testId}/submit")
    public ResponseEntity<?> submitTest(@PathVariable Long testId,
                                        @RequestParam(required = false) Long attemptId,
                                        @RequestBody SubmissionRequest request,
                                        Authentication authentication) {
        System.out.println("[DEBUG] Attempting submission for Test ID: " + testId + (attemptId != null ? " Attempt ID: " + attemptId : ""));
        String userEmail = authentication.getName();
        try {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<TestAttempt> attemptOpt;
            if (attemptId != null) {
                attemptOpt = testAttemptRepository.findById(attemptId)
                        .filter(a -> (a.getUser() != null && a.getUser().getId().equals(user.getId())) ||
                                     (a.getUserEmail() != null && a.getUserEmail().equalsIgnoreCase(userEmail)));
            } else {
                attemptOpt = testAttemptRepository.findFirstByUserIdAndTestIdAndStatus(
                        user.getId(), testId, TestAttempt.Status.IN_PROGRESS);
            }

            if (attemptOpt.isEmpty() || attemptOpt.get().getStatus() == TestAttempt.Status.SUBMITTED) {
                // Idempotency: Return existing submission result if already submitted
                Optional<TestAttempt> alreadySubmitted = (attemptId != null && attemptOpt.isPresent())
                        ? attemptOpt
                        : testAttemptRepository.findFirstByUserIdAndTestIdAndStatus(user.getId(), testId, TestAttempt.Status.SUBMITTED);

                if (alreadySubmitted.isPresent()) {
                    System.out.println("[IDEMPOTENCY] Attempt already submitted for test " + testId + ". Returning existing result.");
                    TestAttempt existing = alreadySubmitted.get();
                    List<Question> testQuestions = questionRepository.findByTestId(testId);
                    Map<Long, Question> questionMap = testQuestions.stream()
                            .collect(Collectors.toMap(Question::getId, q -> q, (a, b) -> a));
                    List<AnalysisItem> analysis = existing.getAnswers().stream()
                            .map(ans -> {
                                Question q = questionMap.get(ans.getQuestionId());
                                return new AnalysisItem(ans.getQuestionId(), q != null ? q.getQuestionText() : "Unknown",
                                        ans.getSelectedOption(), q != null ? q.getCorrectAnswer() : "Unknown", ans.isCorrect());
                            }).toList();
                    String title = (existing.getTest() != null && existing.getTest().getTitle() != null)
                            ? existing.getTest().getTitle() : "Assessment";
                    return ResponseEntity.ok(new SubmissionResult(
                            existing.getId(),
                            testId, title, existing.getTotalQuestions(),
                            existing.getCorrectCount(), existing.getWrongCount(), existing.getScorePercent(),
                            existing.getSubmittedAt(), analysis));
                }
                throw new RuntimeException("Assessment already submitted.");
            }

            TestAttempt attempt = attemptOpt.get();
            TestAttempt submitted = attemptService.submitAttempt(attempt.getId(), request.answers());

            List<Question> testQuestions = questionRepository.findByTestId(testId);
            Map<Long, Question> questionMap = testQuestions.stream()
                    .collect(Collectors.toMap(Question::getId, q -> q, (a, b) -> a));

            List<AnalysisItem> analysis = submitted.getAnswers().stream()
                    .map(ans -> {
                        Question q = questionMap.get(ans.getQuestionId());
                        return new AnalysisItem(ans.getQuestionId(), q != null ? q.getQuestionText() : "Unknown",
                                ans.getSelectedOption(), q != null ? q.getCorrectAnswer() : "Unknown", ans.isCorrect());
                    }).toList();

            String title = (submitted.getTest() != null && submitted.getTest().getTitle() != null)
                    ? submitted.getTest().getTitle() : "Assessment";

            return ResponseEntity.ok(new SubmissionResult(
                    submitted.getId(),
                    testId, title, submitted.getTotalQuestions(),
                    submitted.getCorrectCount(), submitted.getWrongCount(), submitted.getScorePercent(),
                    submitted.getSubmittedAt(), analysis));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/test/{testId}/abandon")
    public ResponseEntity<?> abandonTest(@PathVariable Long testId, Authentication authentication) {
        String email = authentication.getName();
        return testAttemptRepository.findFirstByUserEmailAndTestIdAndStatusOrderByStartedAtDesc(email, testId, TestAttempt.Status.IN_PROGRESS)
                .map(attempt -> {
                    attemptService.abandonAttempt(attempt.getId());
                    return ResponseEntity.ok(Map.of("message", "Session handled."));
                })
                .orElse(ResponseEntity.ok(Map.of("message", "No active session to abandon.")));
    }

    // ─── RECORDS ──────────────────────────────────────────────────────────────

    public record QuestionAttemptView(Long id, String title, String optionA, String optionB, String optionC, String optionD) {}
    public record SubmissionRequest(Map<String, String> answers) {}
    public record AnalysisItem(Long questionId, String title, String selectedAnswer, String correctAnswer, boolean correct) {}
    public record SubmissionResult(Long id, Long testId, String testTitle, int totalQuestions, int correctCount, int wrongCount, int scorePercent, LocalDateTime submittedAt, List<AnalysisItem> analysis) {}
}
