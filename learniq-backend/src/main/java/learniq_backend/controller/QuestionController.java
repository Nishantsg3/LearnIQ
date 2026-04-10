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
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/questions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final TestRepository testRepository;
    private final learniq_backend.service.AttemptService attemptService;

    // ─── BANK ENDPOINTS ────────────────────────────────────────────────────────

    @GetMapping("/bank")
    public ResponseEntity<List<Question>> getBankQuestions() {
        return ResponseEntity.ok(questionRepository.findByTestIsNull());
    }

    @PostMapping("/bank")
    public ResponseEntity<Question> createBankQuestion(@RequestBody Question question) {
        question.setTest(null);
        return ResponseEntity.ok(questionRepository.save(question));
    }

    // ─── QUESTIONS BY TEST ─────────────────────────────────────────────────────

    @GetMapping("/test/{testId}")
    public ResponseEntity<List<Question>> getQuestionsByTest(@PathVariable Long testId) {
        return testRepository.findById(testId)
                .map(test -> ResponseEntity.ok(questionRepository.findByTestId(testId)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── ATTEMPT: START & WINDOW CHECK ─────────────────────────────────────────

    @GetMapping("/test/{testId}/attempt")
    public ResponseEntity<?> getQuestionsForAttempt(@PathVariable Long testId, Authentication authentication) {
        Optional<Test> testOpt = testRepository.findById(testId);
        if (testOpt.isEmpty()) return ResponseEntity.notFound().build();

        Test test = testOpt.get();
        String userEmail = authentication.getName();
        LocalDateTime now = LocalDateTime.now();

        // 1. Status Check
        if (!"LIVE".equalsIgnoreCase(test.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "This test is not currently live."));
        }

        // 2. Strict Entry Rule: startedAt + duration
        if (test.getStartedAt() != null) {
            LocalDateTime entryDeadline = test.getStartedAt().plusMinutes(test.getDurationMinutes());
            if (!now.isBefore(entryDeadline)) {
                return ResponseEntity.badRequest().body(Map.of("message", "The entry window for this test has closed."));
            }
        }

        // 3. Initialize/Resume Attempt (No in-memory maps)
        try {
            attemptService.startOrResumeAttempt(userEmail, testId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        List<QuestionAttemptView> items = questionRepository.findByTestId(testId).stream()
                .map(q -> new QuestionAttemptView(q.getId(), q.getQuestionText(),
                        q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()))
                .toList();

        return ResponseEntity.ok(items);
    }

    // ─── TIMER SYNC ────────────────────────────────────────────────────────────

    @GetMapping("/test/{testId}/time")
    public ResponseEntity<?> getRemainingTime(@PathVariable Long testId, Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, testId);
            long remaining = attemptService.getRemainingSeconds(attempt.getId());
            return ResponseEntity.ok(Map.of("remainingTime", remaining));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── ATTEMPT: START (creates dummy result for immediate UI sync) ──────────
    @PostMapping("/test/{testId}/start-attempt")
    public ResponseEntity<?> startAttempt(@PathVariable Long testId, Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, testId);
            String msg = attempt.getSubmittedAt() == null ? "Attempt initialized" : "Attempt resumed";
            return ResponseEntity.ok(Map.of("message", msg, "attemptId", attempt.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── ATTEMPT: SUBMIT (updates initialized result) ──────────────────────────
    @PostMapping("/test/{testId}/submit")
    public ResponseEntity<?> submitTest(@PathVariable Long testId,
                                        @RequestBody SubmissionRequest request,
                                        Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, testId);
            TestAttempt submitted = attemptService.submitAttempt(attempt.getId(), request.answers());

            List<AnalysisItem> analysis = submitted.getAnswers().stream()
                    .map(ans -> {
                        Question q = questionRepository.findById(ans.getQuestionId()).orElse(null);
                        return new AnalysisItem(ans.getQuestionId(), q != null ? q.getQuestionText() : "Unknown",
                                ans.getSelectedOption(), q != null ? q.getCorrectAnswer() : "Unknown", ans.isCorrect());
                    }).toList();

            return ResponseEntity.ok(new SubmissionResult(
                    submitted.getId(),
                    testId, submitted.getTest().getTitle(), submitted.getTotalQuestions(),
                    submitted.getCorrectCount(), submitted.getWrongCount(), submitted.getScorePercent(),
                    submitted.getSubmittedAt(), analysis));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─── RECORDS ──────────────────────────────────────────────────────────────

    public record QuestionAttemptView(Long id, String questionText, String optionA, String optionB, String optionC, String optionD) {}
    public record SubmissionRequest(Map<String, String> answers) {}
    public record AnalysisItem(Long questionId, String questionText, String selectedAnswer, String correctAnswer, boolean correct) {}
    public record SubmissionResult(Long id, Long testId, String testTitle, int totalQuestions, int correctCount, int wrongCount, int scorePercent, LocalDateTime submittedAt, List<AnalysisItem> analysis) {}
}
