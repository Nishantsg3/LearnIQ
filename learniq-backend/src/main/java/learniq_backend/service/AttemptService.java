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
import java.time.ZoneId;
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
            // Use Instant for deterministic comparison
            Instant now = Instant.now();
            ZoneId istZone = ZoneId.of("Asia/Kolkata");
            
            // Start Window Logic: Treat rawStart as IST local time
            LocalDateTime rawStart = test.getStartTime() != null ? test.getStartTime() : test.getCreatedAt();
            Instant startInstant = rawStart.atZone(istZone).toInstant();
            
            // End Window Logic: Treat rawEnd as IST local time
            LocalDateTime rawEnd = test.getEndTime();
            if (rawEnd == null && rawStart != null) {
                rawEnd = rawStart.plusMinutes(test.getDurationMinutes());
            }
            Instant endInstant = rawEnd != null ? rawEnd.atZone(istZone).toInstant() : null;

            // Logic: DENY if early OR late
            if (now.isBefore(startInstant)) {
                throw new RuntimeException("Access Denied: This assessment is scheduled to start at " + rawStart + " (Server Time: " + now + ")");
            }
            if (endInstant != null && now.isAfter(endInstant)) {
                throw new RuntimeException("Access Denied: The window to participate in this assessment has closed.");
            }
            
            // One-attempt rule for MAIN
            boolean alreadySubmitted = testAttemptRepository.existsByUserEmailAndTestIdAndSubmitted(userEmail, testId, true);
            if (!alreadySubmitted) {
                alreadySubmitted = testAttemptRepository.findFirstByUserIdAndTestIdAndStatus(user.getId(), testId, TestAttempt.Status.SUBMITTED).isPresent();
            }
            if (alreadySubmitted) {
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
        // Denormalise testType so history is always visible even if the Test FK is stale
        attempt.setTestType(test.getTestType());

        return testAttemptRepository.save(attempt);
    }

    @Transactional
    public void abandonAttempt(Long attemptId) {
        TestAttempt attempt = testAttemptRepository.findByIdWithLock(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        if (attempt.getStatus() != TestAttempt.Status.IN_PROGRESS) {
            System.out.println("[WARNING] Blocked abandonAttempt for non-IN_PROGRESS attempt: " + attemptId);
            return;
        }
        
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
        TestAttempt attempt = testAttemptRepository.findByIdWithLock(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        // 🔥 STRONGER IDEMPOTENCY: Check both boolean flag and status
        if (attempt.isSubmitted() || attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            System.out.println("[IDEMPOTENCY] submitAttempt blocked for " + attemptId + " (already submitted)");
            return attempt;
        }

        return finalizeAndSubmit(attempt, answers);
    }

    @Transactional
    public TestAttempt finalizeAndSubmit(TestAttempt attempt, Map<String, String> answers) {
        // 🔥 IDEMPOTENCY GATE: If already submitted, do not process again
        if (attempt.isSubmitted() || attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            System.out.println("[IDEMPOTENCY] Attempt " + attempt.getId() + " already finalized. Skipping duplicate logic.");
            return attempt;
        }

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
                LocalDateTime end = attempt.getSubmittedAt();
                LocalDateTime start = attempt.getStartedAt();
                if (start == null) start = end.minusMinutes(1); // Safety fallback
                
                Duration duration = Duration.between(start, end);
                long minutes = Math.max(0, duration.toMinutes());
                long seconds = Math.max(0, duration.minusMinutes(minutes).getSeconds());
                
                // If 0:00 (race condition), show at least 1s for UX
                if (minutes == 0 && seconds == 0) seconds = 1;
                
                String timeString = String.format("%dm %ds", minutes, seconds);

                String analysisLink = frontendUrl + "/results/" + attempt.getId();

                // Extract fields to local variables to safely pass to background thread
                String emailRecipient = attempt.getUserEmail();
                String studentName = attempt.getUserName();
                String testTitle = attempt.getTest().getTitle();
                int scoreVal = attempt.getScorePercent();
                int correctVal = attempt.getCorrectCount();
                int wrongVal = attempt.getWrongCount();
                int finalRank = rank;
                String finalTimeString = timeString;
                String finalAnalysisLink = analysisLink;

                new Thread(() -> {
                    try {
                        emailService.sendTestResultEmail(
                                emailRecipient,
                                studentName,
                                testTitle,
                                scoreVal,
                                correctVal,
                                wrongVal,
                                finalRank,
                                finalTimeString,
                                finalAnalysisLink
                        );
                    } catch (Exception e) {
                        System.err.println("[Email Thread] Failed to send auto-result email: " + e.getMessage());
                    }
                }).start();
            } catch (Exception e) {
                System.err.println("[EmailService] Failed to initialize email thread: " + e.getMessage());
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

        Optional<User> userOpt = userRepository.findByEmail(email);
        List<TestAttempt> attempts;
        if (userOpt.isPresent()) {
            attempts = testAttemptRepository.findByUserId(userOpt.get().getId());
        } else {
            attempts = testAttemptRepository.findByUserEmail(email);
        }

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
        Optional<User> userOpt = userRepository.findByEmail(email);
        List<TestAttempt> activeAttempts;
        if (userOpt.isPresent()) {
            activeAttempts = testAttemptRepository.findAllByUserIdAndStatus(userOpt.get().getId(), TestAttempt.Status.IN_PROGRESS);
        } else {
            activeAttempts = testAttemptRepository.findAllByUserEmailAndStatus(email, TestAttempt.Status.IN_PROGRESS);
        }

        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;

        for (TestAttempt a : activeAttempts) {
            Optional<TestAttempt> lockedOpt = testAttemptRepository.findByIdWithLock(a.getId());
            if (lockedOpt.isEmpty()) continue;
            TestAttempt locked = lockedOpt.get();

            if (locked.getStatus() != TestAttempt.Status.IN_PROGRESS) {
                continue;
            }

            boolean isExpired = locked.getEndTime() != null && now.isAfter(locked.getEndTime());
            boolean isPractice = locked.getTest() != null && "PRACTICE".equalsIgnoreCase(locked.getTest().getTestType());
            // An attempt is only considered abandoned if it is expired AND has no answers
            boolean isAbandoned = isPractice && isExpired && (locked.getAnswers() == null || locked.getAnswers().isEmpty());

            if (isExpired || isAbandoned) {
                boolean hasAnswers = locked.getAnswers() != null && !locked.getAnswers().isEmpty();

                if (isPractice && (!hasAnswers || isAbandoned)) {
                    // Delete empty or stale abandoned practice attempts to allow fresh START
                    System.out.println("[CLEANUP] Removing stale/empty practice attempt: " + locked.getId());
                    // Clear the relationship first to avoid constraint issues
                    locked.getAnswers().clear();
                    testAttemptRepository.delete(locked);
                } else {
                    // Auto-submit expired attempts (all Main tests, and Practice tests with answers)
                    System.out.println("[CLEANUP] Auto-submitting expired attempt: " + locked.getId());
                    finalizeAndSubmit(locked, null);
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
            // Use live value from Test entity
            res.setTestType(attempt.getTest().getTestType());
        } else {
            // Fallback to denormalized copy stored on the attempt itself
            res.setTestType(attempt.getTestType());
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

        if (attempt.getTest() != null && "MAIN".equalsIgnoreCase(attempt.getTest().getTestType()) && attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            long betterAttempts = testAttemptRepository.countByTestIdAndScorePercentGreaterThanAndStatus(
                    attempt.getTest().getId(), 
                    attempt.getScorePercent(), 
                    TestAttempt.Status.SUBMITTED
            );
            res.setRank((int) betterAttempts + 1);
            long totalPart = testAttemptRepository.countByTestIdAndStatus(attempt.getTest().getId(), TestAttempt.Status.SUBMITTED);
            res.setTotalParticipants((int) totalPart);
        } else {
            res.setRank(1);
            res.setTotalParticipants(1);
        }

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

    @Transactional
    public TestAttempt saveProgress(Long attemptId, Map<String, String> answers) {

        TestAttempt attempt = testAttemptRepository.findByIdWithLock(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.isSubmitted() || attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            System.out.println("[WARNING] Attempt " + attemptId + " is already submitted. Blocking progress save.");
            return attempt;
        }

        if (answers != null && !answers.isEmpty()) {
            List<AttemptAnswer> existingAnswers = attemptAnswerRepository.findByAttemptId(attemptId);
            for (Map.Entry<String, String> entry : answers.entrySet()) {

                Long qId = Long.valueOf(entry.getKey());
                String selected = entry.getValue();

                AttemptAnswer existing = existingAnswers.stream()
                        .filter(a -> a.getQuestionId().equals(qId))
                        .findFirst()
                        .orElse(null);

                if (existing != null) {
                    existing.setSelectedOption(selected);
                    attemptAnswerRepository.save(existing);
                } else {
                    AttemptAnswer ans = new AttemptAnswer();
                    ans.setQuestionId(qId);
                    ans.setSelectedOption(selected);
                    ans.setAttempt(attempt);
                    attemptAnswerRepository.save(ans);
                }
            }
        }

        return attempt;
    }
}