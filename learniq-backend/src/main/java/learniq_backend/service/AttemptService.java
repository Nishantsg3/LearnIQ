package learniq_backend.service;

import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.dto.TestAttemptResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final TestAttemptRepository testAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // =========================================================
    // 🚀 START / RESUME ATTEMPT (FINAL FIXED)
    // =========================================================
    @Transactional
    public TestAttempt startOrResumeAttempt(String userEmail, Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Assessment [ID: " + testId + "] not found. Please refresh."));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User profile [" + userEmail + "] not found."));

        // 1. Fetch questions early to validate
        List<Question> questions = questionRepository.findByTestId(test.getId());
        if (questions.isEmpty()) {
            System.err.println("[CRITICAL] MAIN INITIALIZATION FAILED: Test " + testId + " has NO questions.");
            throw new RuntimeException("This assessment has no questions assigned yet. Please contact your administrator.");
        }
        
        System.out.println("[ATTEMPT] Initializing lifecycle for " + userEmail + " on Test: " + test.getTitle() + " (Type: " + test.getTestType() + ")");

        // 2. Comprehensive check for existing IN_PROGRESS attempt
        // We check by both UserId (modern) and UserEmail (legacy/safety fallback)
        Optional<TestAttempt> existingOpt = testAttemptRepository
                .findFirstByUserIdAndTestIdAndStatus(user.getId(), testId, TestAttempt.Status.IN_PROGRESS);
        
        if (existingOpt.isEmpty()) {
            existingOpt = testAttemptRepository
                .findFirstByUserEmailAndTestIdAndStatusOrderByStartedAtDesc(userEmail, testId, TestAttempt.Status.IN_PROGRESS);
        }

        if (existingOpt.isPresent()) {
            TestAttempt active = existingOpt.get();

            // Auto-link user if missing (legacy data cleanup)
            if (active.getUser() == null) active.setUser(user);

            // Check for individual session expiration
            if (active.getEndTime() != null && LocalDateTime.now().isAfter(active.getEndTime())) {
                System.out.println("[AUTO-SUBMIT] Active attempt " + active.getId() + " expired on resume. Finalizing...");
                return finalizeAndSubmit(active, null);
            }

            // Resume Logic: If Main, we handle "Timer Resume"
            if ("MAIN".equalsIgnoreCase(test.getTestType())) {
                if (active.getRemainingSeconds() != null) {
                    active.setEndTime(LocalDateTime.now().plusSeconds(active.getRemainingSeconds()));
                    active.setRemainingSeconds(null); 
                    return testAttemptRepository.save(active);
                }
            }
            return active;
        }

        // 3. New Attempt Validation logic
        if ("MAIN".equalsIgnoreCase(test.getTestType())) {
            // Use Instant for deterministic UTC comparison
            Instant now = Instant.now();
            
            // Start Window Logic
            LocalDateTime rawStart = test.getStartTime() != null ? test.getStartTime() : test.getCreatedAt();
            Instant startInstant = rawStart.atZone(ZoneOffset.UTC).toInstant();
            
            // End Window Logic
            LocalDateTime rawEnd = test.getEndTime();
            if (rawEnd == null && rawStart != null) {
                rawEnd = rawStart.plusMinutes(test.getDurationMinutes());
            }
            Instant endInstant = rawEnd != null ? rawEnd.atZone(ZoneOffset.UTC).toInstant() : null;

            // Logic: DENY if early OR late
            if (now.isBefore(startInstant)) {
                throw new RuntimeException("Access Denied: This assessment is scheduled to start at " + rawStart + " (Server Time: " + now + ")");
            }
            if (endInstant != null && now.isAfter(endInstant)) {
                throw new RuntimeException("Access Denied: The window to participate in this assessment has closed.");
            }
            
            // One-attempt rule for MAIN
            if (testAttemptRepository.existsByUserEmailAndTestIdAndSubmitted(userEmail, testId, true)) {
                throw new RuntimeException("Assessment Policy: You have already submitted an attempt for this main evaluation.");
            }
        }

        // 4. Create fresh attempt
        LocalDateTime nowLocal = LocalDateTime.now();
        TestAttempt attempt = new TestAttempt();
        attempt.setUser(user);
        attempt.setUserEmail(userEmail);
        attempt.setUserName(user.getName());
        attempt.setTest(test);
        attempt.setStartedAt(nowLocal);
        
        // Individual duration
        attempt.setEndTime(nowLocal.plusMinutes(test.getDurationMinutes()));
        attempt.setStatus(TestAttempt.Status.IN_PROGRESS);
        attempt.setScorePercent(-1);
        attempt.setTotalQuestions(questions.size());
        attempt.setAnswers(new ArrayList<>());

        return testAttemptRepository.save(attempt);
    }

    @Transactional
    public void abandonAttempt(Long attemptId) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        Test test = attempt.getTest();
        
        if ("PRACTICE".equalsIgnoreCase(test.getTestType())) {
            // Rule 3 & 4: Practice abandoned = Wipe
            System.out.println("[ABANDON] Wiping Practice Attempt " + attemptId);
            // Delete child answers first
            attemptAnswerRepository.deleteAll(attempt.getAnswers());
            testAttemptRepository.delete(attempt);
        } else {
            // Rule 5: Main abandoned = Pause timer and save state
            System.out.println("[PAUSE] Saving Main Attempt " + attemptId + " for resumption.");
            long remaining = Duration.between(LocalDateTime.now(), attempt.getEndTime()).getSeconds();
            attempt.setRemainingSeconds((int) Math.max(0, remaining));
            testAttemptRepository.save(attempt);
        }
    }

    // =========================================================
    public long getRemainingSeconds(Long attemptId) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.getEndTime() == null) return 0;

        long remaining = Duration.between(LocalDateTime.now(), attempt.getEndTime()).getSeconds();
        return Math.max(0, remaining);
    }

    public TestAttempt getAttemptById(Long id) {
        return testAttemptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
    }

    // =========================================================
    // ✅ SUBMIT ATTEMPT
    // =========================================================
    @Transactional
    public TestAttempt submitAttempt(Long attemptId, Map<String, String> answers) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.isSubmitted() || attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            return attempt;
        }

        return finalizeAndSubmit(attempt, answers);
    }

    @Transactional
    public TestAttempt finalizeAndSubmit(TestAttempt attempt, Map<String, String> answers) {
        if (attempt.getAnswers() == null) {
            attempt.setAnswers(new ArrayList<>());
        } else if (answers != null) {
            // Only clear if we are providing fresh answers from frontend
            attempt.getAnswers().clear();
        }

        List<Question> questions = questionRepository.findByTestId(
                attempt.getTest().getId()
        );

        if (questions.isEmpty()) {
            System.err.println("[CRITICAL] Test " + attempt.getTest().getId() + " has 0 questions linked!");
        }

        int correctCount = 0;
        int attemptedCount = 0;

        for (Question q : questions) {
            String selected = null;
            if (answers != null) {
                selected = answers.get(String.valueOf(q.getId()));
            } else if (attempt.getAnswers() != null) {
                // AUTO-SUBMIT: Look for previously saved answer in the DB
                selected = attempt.getAnswers().stream()
                        .filter(a -> a.getQuestionId().equals(q.getId()))
                        .map(AttemptAnswer::getSelectedOption)
                        .findFirst()
                        .orElse(null);
            }

            if (selected != null && !selected.isEmpty()) attemptedCount++;
            // 🔥 Map LABEL (A, B, C, D) to actual TEXT for comparison
            String selectedText = null;
            if ("A".equalsIgnoreCase(selected)) selectedText = q.getOptionA();
            else if ("B".equalsIgnoreCase(selected)) selectedText = q.getOptionB();
            else if ("C".equalsIgnoreCase(selected)) selectedText = q.getOptionC();
            else if ("D".equalsIgnoreCase(selected)) selectedText = q.getOptionD();
            else selectedText = selected; // Fallback

            boolean isCorrect = (selected != null && selected.equalsIgnoreCase(q.getCorrectAnswer())) ||
                                (selectedText != null && selectedText.equalsIgnoreCase(q.getCorrectAnswer()));

            if (isCorrect) correctCount++;

            AttemptAnswer ans = new AttemptAnswer();
            ans.setQuestionId(q.getId());
            ans.setSelectedOption(selected);
            ans.setCorrectOption(q.getCorrectAnswer());
            ans.setCorrect(isCorrect);
            ans.setAttempt(attempt);

            if (answers != null) {
                attempt.getAnswers().add(ans);
            } else {
                boolean exists = attempt.getAnswers().stream().anyMatch(a -> a.getQuestionId().equals(q.getId()));
                if (!exists) attempt.getAnswers().add(ans);
            }
        }

        int total = questions.size();
        int score = total > 0 ? (int)((correctCount * 100.0) / total) : 0;

        attempt.setTotalQuestions(total);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(total - correctCount);
        attempt.setAttemptedCount(attemptedCount);
        attempt.setScorePercent(score);

        attempt.setStatus(TestAttempt.Status.SUBMITTED);
        attempt.setSubmitted(true);
        attempt.setSubmittedAt(LocalDateTime.now());

        TestAttempt saved = testAttemptRepository.save(attempt);

        // 🔥 AUTOMATIC RESULTS EMAIL (Only for MAIN tests)
        if ("MAIN".equalsIgnoreCase(attempt.getTest().getTestType())) {
            try {
                // Calculate Rank
                long betterAttempts = testAttemptRepository.countByTestIdAndScorePercentGreaterThanAndStatus(
                        attempt.getTest().getId(), 
                        attempt.getScorePercent(), 
                        TestAttempt.Status.SUBMITTED
                );
                int rank = (int) betterAttempts + 1;

                // Calculate Time Taken
                Duration duration = Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt());
                long minutes = duration.toMinutes();
                long seconds = duration.minusMinutes(minutes).getSeconds();
                String timeString = String.format("%dm %ds", minutes, seconds);

                String analysisLink = frontendUrl + "/results/" + attempt.getId();

                emailService.sendTestResultEmail(
                        attempt.getUserEmail(),
                        attempt.getUserName(),
                        attempt.getTest().getTitle(),
                        attempt.getScorePercent(),
                        attempt.getCorrectCount(),
                        attempt.getWrongCount(),
                        rank,
                        timeString,
                        analysisLink
                );
            } catch (Exception e) {
                System.err.println("[EmailService] Failed to send auto-result email: " + e.getMessage());
            }
        }

        return saved;
    }

    // =========================================================
    // ✅ GET ATTEMPTS (WITH AUTOMATIC CLEANUP)
    // =========================================================
    @Transactional
    public List<TestAttemptResponse> getUserAttempts(String email) {

        // 🔥 CRITICAL: Cleanup expired attempts before returning data
        // This ensures the dashboard doesn't show "Resume" for tests that are already over.
        cleanupExpiredAttempts(email);

        List<TestAttempt> attempts = testAttemptRepository.findByUserEmail(email);

        // Sort by date (latest first)
        attempts.sort((a, b) -> {
            LocalDateTime t1 = a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getStartedAt();
            LocalDateTime t2 = b.getSubmittedAt() != null ? b.getSubmittedAt() : b.getStartedAt();
            return t2.compareTo(t1);
        });

        return attempts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void cleanupExpiredAttempts(String email) {
        List<TestAttempt> activeAttempts = testAttemptRepository.findAllByUserEmailAndStatus(email, TestAttempt.Status.IN_PROGRESS);
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;

        for (TestAttempt a : activeAttempts) {
            boolean isExpired = a.getEndTime() != null && now.isAfter(a.getEndTime());

            // 🔥 USER RULE: If Practice test and not resumed/no-progress for 5 minutes, cleanup so they can START fresh.
            // 🔥 USER RULE: If Practice test has NO progress, delete it immediately when they hit dashboard
            // so they see "START" instead of "RESUME".
            boolean isPractice = a.getTest() != null && "PRACTICE".equalsIgnoreCase(a.getTest().getTestType());
            boolean isAbandoned = isPractice && (a.getAnswers() == null || a.getAnswers().isEmpty());

            if (isExpired || isAbandoned) {
                boolean hasAnswers = a.getAnswers() != null && !a.getAnswers().isEmpty();

                if (!hasAnswers || isAbandoned) {
                    // Delete empty or stale abandoned practice attempts to allow fresh START
                    System.out.println("[CLEANUP] Removing stale/empty attempt: " + a.getId());
                    // Clear the relationship first to avoid constraint issues
                    a.getAnswers().clear();
                    testAttemptRepository.delete(a);
                } else {
                    // Auto-submit expired attempts that have actual progress
                    System.out.println("[CLEANUP] Auto-submitting expired attempt: " + a.getId());
                    finalizeAndSubmit(a, null);
                }
                changed = true;
            }
        }
        if (changed) {
            testAttemptRepository.flush();
        }
    }

    // =========================================================
    public TestAttemptResponse mapToResponse(TestAttempt attempt) {

        TestAttemptResponse res = new TestAttemptResponse();

        res.setId(attempt.getId());
        if (attempt.getTest() != null) {
            res.setTestId(attempt.getTest().getId());
            res.setTestTitle(attempt.getTest().getTitle());
            res.setCategory(attempt.getTest().getCategory());
            res.setTestType(attempt.getTest().getTestType());
        }
        res.setUserId(attempt.getUser() != null ? attempt.getUser().getId() : null);
        res.setScorePercent(attempt.getScorePercent());
        res.setCorrectCount(attempt.getCorrectCount());
        res.setWrongCount(attempt.getWrongCount());
        res.setTotalQuestions(attempt.getTotalQuestions());
        res.setAttemptedCount(attempt.getAttemptedCount());
        res.setStartedAt(attempt.getStartedAt());
        res.setSubmittedAt(attempt.getSubmittedAt());
        res.setStatus(attempt.getStatus() != null ? attempt.getStatus().name() : "IN_PROGRESS");
        res.setSubmitted(attempt.isSubmitted());

        // 🔥 POPULATE ANSWER KEY / REVIEWS
        List<TestAttemptResponse.AnswerReview> reviews = new ArrayList<>();
        if (attempt.getTest() != null) {
            List<Question> questions = questionRepository.findByTestId(attempt.getTest().getId());

            for (Question q : questions) {
                TestAttemptResponse.AnswerReview ar = new TestAttemptResponse.AnswerReview();
                ar.setQuestionId(q.getId());
                ar.setQuestionText(q.getQuestionText());
                ar.setOptionA(q.getOptionA());
                ar.setOptionB(q.getOptionB());
                ar.setOptionC(q.getOptionC());
                ar.setOptionD(q.getOptionD());
                ar.setCorrectAnswer(q.getCorrectAnswer());

                // Find user's specific answer for this question
                attempt.getAnswers().stream()
                        .filter(a -> a.getQuestionId().equals(q.getId()))
                        .findFirst()
                        .ifPresent(userAns -> {
                            ar.setSelectedOption(userAns.getSelectedOption());
                            ar.setCorrect(userAns.isCorrect());
                        });

                reviews.add(ar);
            }
        }
        res.setAnswerReviews(reviews);

        return res;
    }

    // =========================================================
    @Transactional
    public TestAttempt saveProgress(Long attemptId, Map<String, String> answers) {

        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (answers != null) {
            for (Map.Entry<String, String> entry : answers.entrySet()) {

                Long qId = Long.valueOf(entry.getKey());
                String selected = entry.getValue();

                AttemptAnswer existing = attempt.getAnswers().stream()
                        .filter(a -> a.getQuestionId().equals(qId))
                        .findFirst()
                        .orElse(null);

                if (existing != null) {
                    existing.setSelectedOption(selected);
                } else {
                    AttemptAnswer ans = new AttemptAnswer();
                    ans.setQuestionId(qId);
                    ans.setSelectedOption(selected);
                    ans.setAttempt(attempt);
                    attempt.getAnswers().add(ans);
                }
            }
        }

        return testAttemptRepository.save(attempt);
    }
}