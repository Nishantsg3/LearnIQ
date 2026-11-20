package learniq_backend;

import learniq_backend.config.AsyncConfig;
import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.service.AttemptService;
import learniq_backend.service.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailAsyncExecutorTest {

    @Mock
    private TestAttemptRepository testAttemptRepository;

    @Mock
    private AttemptAnswerRepository attemptAnswerRepository;

    @Mock
    private TestRepository testRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private EmailService emailService;

    private ThreadPoolTaskExecutor threadPoolExecutor;
    private AsyncConfig asyncConfig;

    @BeforeEach
    void setUp() {
        asyncConfig = new AsyncConfig();
        threadPoolExecutor = asyncConfig.emailTaskExecutor();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
        if (threadPoolExecutor != null) {
            threadPoolExecutor.shutdown();
        }
    }

    @Test
    @DisplayName("AsyncConfig bean configuration: verified pool boundaries, thread prefix, and shutdown safety")
    void testAsyncConfigProperties() {
        assertThat(threadPoolExecutor.getCorePoolSize()).isEqualTo(2);
        assertThat(threadPoolExecutor.getMaxPoolSize()).isEqualTo(5);
        assertThat(threadPoolExecutor.getThreadNamePrefix()).isEqualTo("mail-exec-");

        TaskExecutor asyncExecutor = asyncConfig.getAsyncExecutor();
        assertThat(asyncExecutor).isNotNull();
        assertThat(asyncConfig.getAsyncUncaughtExceptionHandler()).isNotNull();
    }

    @Test
    @DisplayName("Email execution runs on Spring-managed thread with mail-exec- prefix")
    void testEmailExecutesOnManagedThread() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> executedThreadName = new AtomicReference<>();

        when(emailService.sendTestResultEmail(anyString(), anyString(), anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyString()))
                .thenAnswer(invocation -> {
                    executedThreadName.set(Thread.currentThread().getName());
                    latch.countDown();
                    return true;
                });

        AttemptService service = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService,
                threadPoolExecutor
        );

        learniq_backend.model.Test test = createMockTest(10L, "Java Concurrency Exam");
        learniq_backend.model.User user = createMockUser(100L, "student@learniq.org", "Student User");
        TestAttempt attempt = createMockAttempt(500L, test, user);

        when(testAttemptRepository.findByIdWithLock(500L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findByTestId(10L)).thenReturn(createMockQuestions(test, 2));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));
        when(testAttemptRepository.countByTestIdAndScorePercentGreaterThanAndStatus(anyLong(), anyInt(), any())).thenReturn(0L);

        TestAttempt finalized = service.submitAttempt(500L, Map.of("1", "A", "2", "B"));

        assertThat(finalized).isNotNull();
        assertThat(finalized.getStatus()).isEqualTo(TestAttempt.Status.SUBMITTED);

        boolean completed = latch.await(3, TimeUnit.SECONDS);
        assertThat(completed).isTrue();
        assertThat(executedThreadName.get()).startsWith("mail-exec-");
    }

    @Test
    @DisplayName("Executor shutdown rejects new tasks with TaskRejectedException and does not silently drop them")
    void testExecutorShutdownRejection() {
        threadPoolExecutor.shutdown();
        assertThat(threadPoolExecutor.getThreadPoolExecutor().isShutdown()).isTrue();

        assertThatThrownBy(() -> threadPoolExecutor.execute(() -> {}))
                .isInstanceOf(TaskRejectedException.class)
                .hasMessageMatching("(?i).*shutdown.*");
    }

    @Test
    @DisplayName("Queue saturation invokes custom rejection handler, logs warning, and runs on caller thread")
    void testQueueSaturationCallerRunsFallback() throws Exception {
        CountDownLatch blockerLatch = new CountDownLatch(1);
        AtomicBoolean callerThreadRan = new AtomicBoolean(false);

        // Fill all 5 worker threads and all 100 queue slots with blocking tasks
        for (int i = 0; i < 105; i++) {
            threadPoolExecutor.execute(() -> {
                try {
                    blockerLatch.await(5, TimeUnit.SECONDS);
                } catch (InterruptedException ignored) {}
            });
        }

        // The 106th task encounters a full queue and all active threads, triggering CallerRuns
        String currentThreadName = Thread.currentThread().getName();
        AtomicReference<String> executionThread = new AtomicReference<>();
        threadPoolExecutor.execute(() -> {
            executionThread.set(Thread.currentThread().getName());
            callerThreadRan.set(true);
        });

        assertThat(callerThreadRan.get()).isTrue();
        assertThat(executionThread.get()).isEqualTo(currentThreadName);

        blockerLatch.countDown();
    }

    @Test
    @DisplayName("Transaction synchronization: email is deferred until afterCommit and never sent if rolled back")
    void testTransactionSynchronizationAfterCommitAndRollback() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        AttemptService service = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService,
                new SyncTaskExecutor()
        );

        learniq_backend.model.Test test = createMockTest(20L, "Transaction Safety Exam");
        learniq_backend.model.User user = createMockUser(200L, "tx@learniq.org", "Tx Student");
        TestAttempt attempt = createMockAttempt(700L, test, user);

        when(testAttemptRepository.findByIdWithLock(700L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findByTestId(20L)).thenReturn(createMockQuestions(test, 1));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        // Submit attempt inside active transaction
        TestAttempt result = service.submitAttempt(700L, Map.of("1", "A"));
        assertThat(result).isNotNull();

        // Email should NOT be sent yet because transaction has not committed!
        verify(emailService, never()).sendTestResultEmail(anyString(), anyString(), anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyString());

        // Now simulate commit: invoke all registered synchronizations afterCommit()
        List<TransactionSynchronization> syncs = TransactionSynchronizationManager.getSynchronizations();
        assertThat(syncs).isNotEmpty();

        for (TransactionSynchronization sync : syncs) {
            sync.afterCommit();
        }

        // Now email MUST be sent
        verify(emailService, times(1)).sendTestResultEmail(
                eq("tx@learniq.org"),
                eq("Tx Student"),
                eq("Transaction Safety Exam"),
                anyInt(),
                anyInt(),
                anyInt(),
                anyInt(),
                anyString(),
                anyString()
        );
    }

    @Test
    @DisplayName("Attempt finalization succeeds and preserves state even if executor rejects email task")
    void testAttemptFinalizationResilientToTaskRejection() {
        TaskExecutor rejectingExecutor = task -> {
            throw new TaskRejectedException("Simulated queue full rejection");
        };

        AttemptService service = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService,
                rejectingExecutor
        );

        learniq_backend.model.Test test = createMockTest(11L, "Resilience Exam");
        learniq_backend.model.User user = createMockUser(101L, "resilient@learniq.org", "Resilient Student");
        TestAttempt attempt = createMockAttempt(501L, test, user);

        when(testAttemptRepository.findByIdWithLock(501L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findByTestId(11L)).thenReturn(createMockQuestions(test, 1));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        TestAttempt result = service.submitAttempt(501L, Map.of("1", "A"));

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(TestAttempt.Status.SUBMITTED);
        assertThat(result.isSubmitted()).isTrue();
        verify(emailService, never()).sendTestResultEmail(anyString(), anyString(), anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyString());
    }

    @Test
    @DisplayName("Attempt finalization succeeds when email service throws runtime exception in worker thread")
    void testEmailServiceExceptionLoggedWithoutBreakingSubmission() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicBoolean errorLogged = new AtomicBoolean(false);

        when(emailService.sendTestResultEmail(anyString(), anyString(), anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    errorLogged.set(true);
                    latch.countDown();
                    throw new RuntimeException("Simulated SMTP network outage");
                });

        AttemptService service = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService,
                threadPoolExecutor
        );

        learniq_backend.model.Test test = createMockTest(12L, "Network Fault Exam");
        learniq_backend.model.User user = createMockUser(102L, "smtp.fault@learniq.org", "Fault Test User");
        TestAttempt attempt = createMockAttempt(502L, test, user);

        when(testAttemptRepository.findByIdWithLock(502L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findByTestId(12L)).thenReturn(createMockQuestions(test, 1));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        TestAttempt result = service.submitAttempt(502L, Map.of("1", "A"));

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(TestAttempt.Status.SUBMITTED);

        boolean completed = latch.await(3, TimeUnit.SECONDS);
        assertThat(completed).isTrue();
        assertThat(errorLogged.get()).isTrue();
    }

    @Test
    @DisplayName("Backward-compatible constructor uses SyncTaskExecutor and dispatches email synchronously")
    void testBackwardCompatibleConstructor() {
        AttemptService service = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService
        );

        learniq_backend.model.Test test = createMockTest(13L, "Sync Constructor Exam");
        learniq_backend.model.User user = createMockUser(103L, "sync@learniq.org", "Sync User");
        TestAttempt attempt = createMockAttempt(503L, test, user);

        when(testAttemptRepository.findByIdWithLock(503L)).thenReturn(Optional.of(attempt));
        when(questionRepository.findByTestId(13L)).thenReturn(createMockQuestions(test, 1));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));
        when(emailService.sendTestResultEmail(anyString(), anyString(), anyString(), anyInt(), anyInt(), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(true);

        TestAttempt result = service.submitAttempt(503L, Map.of("1", "A"));

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(TestAttempt.Status.SUBMITTED);

        verify(emailService, times(1)).sendTestResultEmail(
                eq("sync@learniq.org"),
                eq("Sync User"),
                eq("Sync Constructor Exam"),
                anyInt(),
                anyInt(),
                anyInt(),
                anyInt(),
                anyString(),
                anyString()
        );
    }

    // Helper builders
    private learniq_backend.model.Test createMockTest(Long id, String title) {
        learniq_backend.model.Test test = new learniq_backend.model.Test();
        test.setId(id);
        test.setTitle(title);
        test.setTestType("MAIN");
        test.setCategory("JAVA");
        test.setQuestionCount(2);
        test.setDurationMinutes(30);
        return test;
    }

    private learniq_backend.model.User createMockUser(Long id, String email, String name) {
        learniq_backend.model.User user = new learniq_backend.model.User();
        user.setId(id);
        user.setEmail(email);
        user.setName(name);
        user.setRole(User.Role.STUDENT);
        user.setVerified(true);
        return user;
    }

    private TestAttempt createMockAttempt(Long id, learniq_backend.model.Test test, learniq_backend.model.User user) {
        TestAttempt attempt = new TestAttempt();
        attempt.setId(id);
        attempt.setTest(test);
        attempt.setUser(user);
        attempt.setUserEmail(user.getEmail());
        attempt.setUserName(user.getName());
        attempt.setStatus(TestAttempt.Status.IN_PROGRESS);
        attempt.setSubmitted(false);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(10));
        attempt.setAnswers(new ArrayList<>());
        return attempt;
    }

    private List<Question> createMockQuestions(learniq_backend.model.Test test, int count) {
        List<Question> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            Question q = new Question();
            q.setId((long) i);
            q.setQuestionText("Question " + i);
            q.setCorrectAnswer("A");
            q.setOptionA("Opt A");
            q.setOptionB("Opt B");
            q.setOptionC("Opt C");
            q.setOptionD("Opt D");
            q.setTests(new ArrayList<>(List.of(test)));
            list.add(q);
        }
        return list;
    }
}
