package learniq_backend;

import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.service.AttemptService;
import learniq_backend.service.EmailService;
import learniq_backend.service.LifecycleScheduler;
import learniq_backend.service.TestLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:attempt_concurrency_test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=true",
        "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class AttemptConcurrencyIntegrationTest {

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private TestLifecycleService testLifecycleService;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private AttemptAnswerRepository attemptAnswerRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private LifecycleScheduler lifecycleScheduler;

    private User testUser;
    private learniq_backend.model.Test sampleTest;
    private Question q1;
    private Question q2;

    @BeforeEach
    void setUp() {
        attemptAnswerRepository.deleteAll();
        testAttemptRepository.deleteAll();
        testRepository.deleteAll();
        questionRepository.hardDeleteAll();
        userRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        testUser = User.builder()
                .name("Alice Test")
                .email("alice.concurrency." + suffix + "@test.com")
                .password("encoded_pass")
                .role(User.Role.STUDENT)
                .build();
        testUser = userRepository.save(testUser);

        q1 = Question.builder()
                .questionText("Question 1 (" + suffix + "): What is 2 + 2?")
                .optionA("3")
                .optionB("4")
                .optionC("5")
                .optionD("6")
                .correctAnswer("4")
                .category("Math")
                .difficultyLevel("Easy")
                .build();
        q1 = questionRepository.save(q1);

        q2 = Question.builder()
                .questionText("Question 2 (" + suffix + "): What is 3 + 3?")
                .optionA("5")
                .optionB("6")
                .optionC("7")
                .optionD("8")
                .correctAnswer("6")
                .category("Math")
                .difficultyLevel("Easy")
                .build();
        q2 = questionRepository.save(q2);

        sampleTest = learniq_backend.model.Test.builder()
                .title("Concurrency Verification Assessment " + suffix)
                .category("Math")
                .sectionType("Multiple Choice")
                .difficultyLevel("Easy")
                .questionCount(2)
                .durationMinutes(30)
                .testType("PRACTICE")
                .status("ACTIVE")
                .questions(List.of(q1, q2))
                .build();
        sampleTest = testRepository.save(sampleTest);
    }

    private TestAttempt createInProgressAttempt() {
        TestAttempt attempt = TestAttempt.builder()
                .userEmail(testUser.getEmail())
                .userName(testUser.getName())
                .user(testUser)
                .test(sampleTest)
                .status(TestAttempt.Status.IN_PROGRESS)
                .submitted(false)
                .startedAt(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(1))
                .totalQuestions(2)
                .testType("PRACTICE")
                .answers(new ArrayList<>())
                .build();
        return testAttemptRepository.save(attempt);
    }

    /**
     * Inspects the target thread's stack trace to verify it is genuinely blocked waiting on H2's database row lock.
     * In H2 MVStore, a transaction blocked on a row lock waits inside Transaction.waitForThisToEnd.
     */
    private boolean isThreadWaitingOnH2Lock(Thread thread) {
        if (thread == null) return false;
        for (StackTraceElement el : thread.getStackTrace()) {
            if (el.getClassName().contains("org.h2") &&
                    (el.getMethodName().contains("waitForThisToEnd") ||
                     el.getMethodName().contains("lock") ||
                     el.getClassName().contains("MVTable") ||
                     el.getClassName().contains("MVSecondaryIndex"))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Actively waits until the target thread enters H2's database row lock wait mechanism.
     */
    private void awaitThreadWaitingOnDbLock(AtomicReference<Thread> threadRef, long timeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            Thread t = threadRef.get();
            if (t != null && isThreadWaitingOnH2Lock(t)) {
                return;
            }
            Thread.sleep(10);
        }
        throw new AssertionError("Thread did not reach H2 database row lock wait within " + timeoutMs + "ms");
    }

    @Test
    @DisplayName("Concurrent race: saveProgress and submitAttempt race on separate threads and transactions")
    void testConcurrentSaveProgressAndSubmitAttemptRace() throws Exception {
        TestAttempt attempt = createInProgressAttempt();
        Long attemptId = attempt.getId();

        Map<String, String> submitAnswers = Map.of(
                q1.getId().toString(), "B", // "B" maps to optionB "4" (correct)
                q2.getId().toString(), "B"  // "B" maps to optionB "6" (correct)
        );

        Map<String, String> progressAnswers = Map.of(
                q1.getId().toString(), "A", // optionA "3" (wrong)
                q2.getId().toString(), "A"  // optionA "5" (wrong)
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        try {
            Future<TestAttempt> submitFuture = executor.submit(() -> {
                boolean ready = startLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for startLatch");
                return attemptService.submitAttempt(attemptId, submitAnswers);
            });

            Future<TestAttempt> progressFuture = executor.submit(() -> {
                boolean ready = startLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for startLatch");
                return attemptService.saveProgress(attemptId, progressAnswers);
            });

            // Trigger both concurrent operations simultaneously
            startLatch.countDown();

            TestAttempt submitResult = submitFuture.get(10, TimeUnit.SECONDS);
            TestAttempt progressResult = progressFuture.get(10, TimeUnit.SECONDS);

            assertNotNull(submitResult);
            assertNotNull(progressResult);

            // Re-fetch persisted state from fresh database read
            TestAttempt persisted = testAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new AssertionError("Persisted attempt not found"));

            // Core Invariants:
            // 1. Attempt must be finalized as SUBMITTED regardless of thread interleaving
            assertTrue(persisted.isSubmitted(), "Attempt must be marked submitted");
            assertEquals(TestAttempt.Status.SUBMITTED, persisted.getStatus(), "Status must be SUBMITTED");
            assertNotNull(persisted.getSubmittedAt(), "submittedAt must be populated");

            // 2. Answers in database must be consistent and not overwritten by stale progress
            List<AttemptAnswer> answersInDb = attemptAnswerRepository.findByAttemptId(attemptId);
            assertFalse(answersInDb.isEmpty(), "Persisted answers must exist");
            assertEquals(2, answersInDb.size(), "Should have exactly 2 answers");
            for (AttemptAnswer ans : answersInDb) {
                assertEquals("B", ans.getSelectedOption(), "Persisted answers must reflect submission answers");
                assertTrue(ans.isCorrect(), "Answers must be marked correct");
            }
            assertEquals(100, persisted.getScorePercent(), "Score must reflect finalized answers");

            // 3. Once submitted, subsequent progress save must be rejected and leave attempt intact
            attemptService.saveProgress(attemptId, Map.of(q1.getId().toString(), "C"));

            TestAttempt postProgressCheck = testAttemptRepository.findById(attemptId).orElseThrow();
            assertTrue(postProgressCheck.isSubmitted());
            assertEquals(TestAttempt.Status.SUBMITTED, postProgressCheck.getStatus());

            List<AttemptAnswer> postAnswers = attemptAnswerRepository.findByAttemptId(attemptId);
            for (AttemptAnswer ans : postAnswers) {
                assertNotEquals("C", ans.getSelectedOption(), "Post-submission progress save must not alter answers");
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Deterministic lock coordination: submitAttempt holds lock, saveProgress waits and is blocked")
    void testDeterministicSubmitHoldsLockWhileSaveProgressWaits() throws Exception {
        TestAttempt attempt = createInProgressAttempt();
        Long attemptId = attempt.getId();

        Map<String, String> submitAnswers = Map.of(
                q1.getId().toString(), "B",
                q2.getId().toString(), "B"
        );

        Map<String, String> progressAnswers = Map.of(
                q1.getId().toString(), "A",
                q2.getId().toString(), "A"
        );

        CountDownLatch submitLockedLatch = new CountDownLatch(1);
        AtomicReference<Thread> progressThreadRef = new AtomicReference<>();
        AtomicBoolean submitTxCommitted = new AtomicBoolean(false);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            // Thread 1: Acquires lock via findByIdWithLock, signals Thread 2, waits until Thread 2 blocks on row lock, then commits submission
            Future<TestAttempt> submitFuture = executor.submit(() -> {
                return txTemplate.execute(status -> {
                    TestAttempt lockedAttempt = testAttemptRepository.findByIdWithLock(attemptId)
                            .orElseThrow(() -> new RuntimeException("Attempt not found"));

                    // Signal that submit transaction currently holds the row lock
                    submitLockedLatch.countDown();

                    // Explicitly verify and wait until Thread 2 is genuinely blocked waiting on H2's row lock
                    try {
                        awaitThreadWaitingOnDbLock(progressThreadRef, 5000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }

                    TestAttempt submitted = attemptService.finalizeAndSubmit(lockedAttempt, submitAnswers);
                    submitTxCommitted.set(true);
                    return submitted;
                });
            });

            // Thread 2: Waits for Thread 1 to acquire lock, then calls saveProgress (which blocks on findByIdWithLock)
            Future<TestAttempt> progressFuture = executor.submit(() -> {
                progressThreadRef.set(Thread.currentThread());
                boolean ready = submitLockedLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for submit lock signal");

                TestAttempt result = attemptService.saveProgress(attemptId, progressAnswers);
                // When saveProgress returns, submit transaction MUST have already committed
                assertTrue(submitTxCommitted.get(), "saveProgress must not complete before submit transaction has committed");
                return result;
            });

            TestAttempt submitResult = submitFuture.get(10, TimeUnit.SECONDS);
            TestAttempt progressResult = progressFuture.get(10, TimeUnit.SECONDS);

            assertNotNull(submitResult);
            assertNotNull(progressResult);

            // Assert that the result returned by the blocked saveProgress() call reflects the submitted state after it resumes
            assertTrue(progressResult.isSubmitted(), "Blocked saveProgress must return attempt marked submitted once unblocked");
            assertEquals(TestAttempt.Status.SUBMITTED, progressResult.getStatus(), "Blocked saveProgress must return attempt in SUBMITTED status");
            assertEquals(100, progressResult.getScorePercent(), "Blocked saveProgress return value must reflect submission score");

            // Verify final persisted database state
            TestAttempt finalAttempt = testAttemptRepository.findById(attemptId).orElseThrow();
            assertTrue(finalAttempt.isSubmitted(), "Attempt must remain submitted");
            assertEquals(TestAttempt.Status.SUBMITTED, finalAttempt.getStatus());
            assertEquals(100, finalAttempt.getScorePercent(), "Score must reflect finalized submission");
            assertEquals(2, finalAttempt.getCorrectCount());

            List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attemptId);
            assertEquals(2, answers.size());
            for (AttemptAnswer ans : answers) {
                assertEquals("B", ans.getSelectedOption(), "Answers must reflect submission, not delayed progress save");
                assertTrue(ans.isCorrect());
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Deterministic lock coordination: saveProgress holds lock, submitAttempt waits and finalizes")
    void testDeterministicSaveProgressHoldsLockWhileSubmitWaits() throws Exception {
        TestAttempt attempt = createInProgressAttempt();
        Long attemptId = attempt.getId();

        Map<String, String> submitAnswers = Map.of(
                q1.getId().toString(), "B",
                q2.getId().toString(), "B"
        );

        Map<String, String> progressAnswers = Map.of(
                q1.getId().toString(), "A",
                q2.getId().toString(), "A"
        );

        CountDownLatch progressLockedLatch = new CountDownLatch(1);
        AtomicReference<Thread> submitThreadRef = new AtomicReference<>();
        AtomicBoolean progressTxCommitted = new AtomicBoolean(false);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            // Thread 1: Acquires lock for progress, signals Thread 2, waits until Thread 2 blocks on row lock, saves progress, commits
            Future<TestAttempt> progressFuture = executor.submit(() -> {
                return txTemplate.execute(status -> {
                    TestAttempt lockedAttempt = testAttemptRepository.findByIdWithLock(attemptId)
                            .orElseThrow(() -> new RuntimeException("Attempt not found"));

                    progressLockedLatch.countDown();

                    // Explicitly verify and wait until Thread 2 is genuinely blocked waiting on H2's row lock
                    try {
                        awaitThreadWaitingOnDbLock(submitThreadRef, 5000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }

                    // Save progress within this transaction
                    TestAttempt saved = attemptService.saveProgress(attemptId, progressAnswers);
                    progressTxCommitted.set(true);
                    return saved;
                });
            });

            // Thread 2: Waits for Thread 1 to acquire lock, calls submitAttempt (which blocks on findByIdWithLock)
            Future<TestAttempt> submitFuture = executor.submit(() -> {
                submitThreadRef.set(Thread.currentThread());
                boolean ready = progressLockedLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for progress lock signal");

                TestAttempt result = attemptService.submitAttempt(attemptId, submitAnswers);
                assertTrue(progressTxCommitted.get(), "submitAttempt must not complete before progress transaction has committed");
                return result;
            });

            TestAttempt progressResult = progressFuture.get(10, TimeUnit.SECONDS);
            TestAttempt submitResult = submitFuture.get(10, TimeUnit.SECONDS);

            assertNotNull(progressResult);
            assertNotNull(submitResult);

            assertTrue(submitResult.isSubmitted(), "submitAttempt result must be submitted");
            assertEquals(TestAttempt.Status.SUBMITTED, submitResult.getStatus());
            assertEquals(100, submitResult.getScorePercent());

            TestAttempt finalAttempt = testAttemptRepository.findById(attemptId).orElseThrow();
            assertTrue(finalAttempt.isSubmitted(), "Attempt must be submitted");
            assertEquals(TestAttempt.Status.SUBMITTED, finalAttempt.getStatus());
            assertEquals(100, finalAttempt.getScorePercent());

            List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attemptId);
            assertEquals(2, answers.size());
            for (AttemptAnswer ans : answers) {
                assertEquals("B", ans.getSelectedOption(), "Finalized answers must override earlier progress");
                assertTrue(ans.isCorrect());
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Concurrent submit with pre-existing in-progress answers: verifies atomic finalization")
    void testConcurrentSubmitWithPreExistingAnswers() throws Exception {
        TestAttempt attempt = createInProgressAttempt();
        Long attemptId = attempt.getId();

        // Save pre-existing in-progress answers first
        attemptService.saveProgress(attemptId, Map.of(q1.getId().toString(), "A"));

        List<AttemptAnswer> initialAnswers = attemptAnswerRepository.findByAttemptId(attemptId);
        assertEquals(1, initialAnswers.size());
        assertEquals("A", initialAnswers.get(0).getSelectedOption());

        Map<String, String> submitAnswers = Map.of(
                q1.getId().toString(), "B",
                q2.getId().toString(), "B"
        );

        Map<String, String> staleProgressAnswers = Map.of(
                q1.getId().toString(), "A",
                q2.getId().toString(), "A"
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        try {
            Future<TestAttempt> submitFuture = executor.submit(() -> {
                boolean ready = startLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for startLatch");
                return attemptService.submitAttempt(attemptId, submitAnswers);
            });

            Future<TestAttempt> progressFuture = executor.submit(() -> {
                boolean ready = startLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for startLatch");
                return attemptService.saveProgress(attemptId, staleProgressAnswers);
            });

            startLatch.countDown();

            TestAttempt submitResult = submitFuture.get(10, TimeUnit.SECONDS);
            TestAttempt progressResult = progressFuture.get(10, TimeUnit.SECONDS);

            assertNotNull(submitResult);
            assertNotNull(progressResult);

            TestAttempt persisted = testAttemptRepository.findById(attemptId).orElseThrow();
            assertTrue(persisted.isSubmitted());
            assertEquals(TestAttempt.Status.SUBMITTED, persisted.getStatus());
            assertEquals(100, persisted.getScorePercent());

            List<AttemptAnswer> finalAnswers = attemptAnswerRepository.findByAttemptId(attemptId);
            assertEquals(2, finalAnswers.size());
            for (AttemptAnswer ans : finalAnswers) {
                assertEquals("B", ans.getSelectedOption(), "Stale progress must not overwrite finalized answers");
                assertTrue(ans.isCorrect());
            }
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Post-submission invariant: saveProgress is completely blocked after submission succeeds")
    void testSaveProgressBlockedAfterSubmission() {
        TestAttempt attempt = createInProgressAttempt();
        Long attemptId = attempt.getId();

        Map<String, String> submitAnswers = Map.of(
                q1.getId().toString(), "B",
                q2.getId().toString(), "B"
        );

        TestAttempt submitted = attemptService.submitAttempt(attemptId, submitAnswers);
        assertTrue(submitted.isSubmitted());
        assertEquals(TestAttempt.Status.SUBMITTED, submitted.getStatus());
        assertEquals(100, submitted.getScorePercent());

        // Now attempt to overwrite answers with a later saveProgress
        Map<String, String> rogueProgress = Map.of(
                q1.getId().toString(), "A",
                q2.getId().toString(), "A"
        );
        TestAttempt afterRogue = attemptService.saveProgress(attemptId, rogueProgress);
        assertTrue(afterRogue.isSubmitted());

        TestAttempt persisted = testAttemptRepository.findById(attemptId).orElseThrow();
        assertTrue(persisted.isSubmitted());
        assertEquals(TestAttempt.Status.SUBMITTED, persisted.getStatus());
        assertEquals(100, persisted.getScorePercent());

        List<AttemptAnswer> answers = attemptAnswerRepository.findByAttemptId(attemptId);
        assertEquals(2, answers.size());
        for (AttemptAnswer ans : answers) {
            assertEquals("B", ans.getSelectedOption());
            assertTrue(ans.isCorrect());
        }
    }

    @Test
    @DisplayName("Deterministic parent-row lock coordination: Student acquires read lock first, Admin deleteTestSafely is blocked and rejected with 400")
    void testConcurrentStudentFirstLockBlocksAdminDeletion() throws Exception {
        Long testId = sampleTest.getId();

        CountDownLatch studentLockedLatch = new CountDownLatch(1);
        AtomicReference<Thread> adminThreadRef = new AtomicReference<>();
        AtomicBoolean studentTxCommitted = new AtomicBoolean(false);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            // Thread 1 (Student): Acquires read lock, signals Thread 2, waits until Thread 2 is blocked on row lock, then completes attempt creation
            Future<TestAttempt> studentFuture = executor.submit(() -> {
                return txTemplate.execute(status -> {
                    // 1. Acquire read lock on test row
                    learniq_backend.model.Test lockedTest = testRepository.findByIdWithReadLock(testId)
                            .orElseThrow(() -> new RuntimeException("Test not found"));

                    // Signal that student holds row lock
                    studentLockedLatch.countDown();

                    // Wait until Admin thread is genuinely waiting on the row lock
                    try {
                        awaitThreadWaitingOnDbLock(adminThreadRef, 5000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }

                    // Create attempt and commit
                    TestAttempt created = attemptService.startOrResumeAttempt(testUser.getEmail(), testId);
                    studentTxCommitted.set(true);
                    return created;
                });
            });

            // Thread 2 (Admin): Waits for student lock signal, calls deleteTestSafely (blocks on findByIdWithWriteLock)
            Future<Boolean> adminFuture = executor.submit(() -> {
                adminThreadRef.set(Thread.currentThread());
                boolean ready = studentLockedLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for student lock signal");

                try {
                    testLifecycleService.deleteTestSafely(testId);
                    return false; // Should not reach here
                } catch (ResponseStatusException ex) {
                    // Must be blocked and rejected with 400 Bad Request
                    assertTrue(studentTxCommitted.get(), "Admin delete must unblock only after student transaction has committed");
                    assertEquals(400, ex.getStatusCode().value(), "Expected HTTP 400 when deleting test with existing attempts");
                    assertTrue(ex.getReason().contains("Cannot delete assessment with existing student attempts"),
                            "Expected archive guidance message");
                    return true;
                }
            });

            TestAttempt studentResult = studentFuture.get(10, TimeUnit.SECONDS);
            Boolean adminResult = adminFuture.get(10, TimeUnit.SECONDS);

            assertNotNull(studentResult, "Student attempt must be successfully created");
            assertTrue(adminResult, "Admin deletion must be rejected with 400 Bad Request");

            // Final state verification
            assertTrue(testRepository.existsById(testId), "Test must still exist in DB");
            assertTrue(testAttemptRepository.countByTestId(testId) >= 1, "Student attempt must be safely preserved in DB");
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    @DisplayName("Deterministic parent-row lock coordination: Admin acquires write lock first, Student attempt creation is blocked and rejected with 404")
    void testConcurrentAdminFirstLockBlocksStudentAttempt() throws Exception {
        // Create an isolated unused test with questions
        learniq_backend.model.Test unusedTest = learniq_backend.model.Test.builder()
                .title("Unused Concurrency Test " + UUID.randomUUID())
                .category("CONCURRENCY")
                .sectionType("Multiple Choice")
                .difficultyLevel("Easy")
                .durationMinutes(30)
                .testType("PRACTICE")
                .status("ACTIVE")
                .questions(List.of(q1, q2))
                .build();
        unusedTest = testRepository.save(unusedTest);
        Long testId = unusedTest.getId();

        CountDownLatch adminLockedLatch = new CountDownLatch(1);
        AtomicReference<Thread> studentThreadRef = new AtomicReference<>();
        AtomicBoolean adminTxCommitted = new AtomicBoolean(false);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            // Thread 1 (Admin): Acquires write lock on unused test, signals Thread 2, waits until Student is blocked on row lock, then deletes test
            Future<Boolean> adminFuture = executor.submit(() -> {
                return txTemplate.execute(status -> {
                    learniq_backend.model.Test lockedTest = testRepository.findByIdWithWriteLock(testId)
                            .orElseThrow(() -> new RuntimeException("Test not found"));

                    adminLockedLatch.countDown();

                    try {
                        awaitThreadWaitingOnDbLock(studentThreadRef, 5000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }

                    testLifecycleService.deleteTestSafely(testId);
                    adminTxCommitted.set(true);
                    return true;
                });
            });

            // Thread 2 (Student): Waits for admin lock signal, calls startOrResumeAttempt (blocks on findByIdWithReadLock)
            Future<Boolean> studentFuture = executor.submit(() -> {
                studentThreadRef.set(Thread.currentThread());
                boolean ready = adminLockedLatch.await(5, TimeUnit.SECONDS);
                assertTrue(ready, "Thread timed out waiting for admin lock signal");

                try {
                    attemptService.startOrResumeAttempt(testUser.getEmail(), testId);
                    return false; // Should not reach here
                } catch (ResponseStatusException ex) {
                    // Must be unblocked after delete and rejected because test no longer exists
                    assertTrue(adminTxCommitted.get(), "Student must unblock only after admin deletion has committed");
                    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode(), "Expected HTTP 404 NOT_FOUND status code");
                    assertTrue(ex.getReason() != null && ex.getReason().contains("not found"), "Expected assessment not found exception");
                    return true;
                }
            });

            Boolean adminResult = adminFuture.get(10, TimeUnit.SECONDS);
            Boolean studentResult = studentFuture.get(10, TimeUnit.SECONDS);

            assertTrue(adminResult, "Admin deletion must succeed");
            assertTrue(studentResult, "Student attempt must be cleanly rejected with not found");

            // Final state verification
            assertFalse(testRepository.existsById(testId), "Test must be deleted from DB");
            assertEquals(0, testAttemptRepository.countByTestId(testId), "Zero attempts must exist for deleted test");
        } finally {
            executor.shutdownNow();
        }
    }
}
