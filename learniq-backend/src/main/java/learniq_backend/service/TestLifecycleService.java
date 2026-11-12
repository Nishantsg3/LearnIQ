package learniq_backend.service;

import learniq_backend.model.Test;
import learniq_backend.model.TestAttempt;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TestLifecycleService {

    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final AttemptService attemptService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    /**
     * Centralized logic to sync a test's status based on time.
     * 1. SCHEDULED -> LIVE   when now >= scheduledAt (and set startedAt = now)
     * 2. LIVE      -> COMPLETED when now >= endTime (MAIN tests only)
     * 3. Move to History: When status is COMPLETED, set archived=true and active=false
     */
    public boolean isActuallyActive(Test test, LocalDateTime now) {
        if (test == null) return false;
        if ("ARCHIVED".equalsIgnoreCase(test.getStatus())) return false;

        boolean hasActiveStatus = "ACTIVE".equalsIgnoreCase(test.getStatus()) || "LIVE".equalsIgnoreCase(test.getStatus());
        boolean isPromotableScheduled = "SCHEDULED".equalsIgnoreCase(test.getStatus())
                && test.getScheduledAt() != null
                && !now.isBefore(test.getScheduledAt());

        if (!hasActiveStatus && !isPromotableScheduled) {
            return false;
        }

        // For MAIN tests, check window: upcoming tests are NOT active; expired tests are NOT active
        if ("MAIN".equalsIgnoreCase(test.getTestType())) {
            LocalDateTime startAt = test.getStartTime() != null ? test.getStartTime() : test.getScheduledAt();
            if (startAt != null && now.isBefore(startAt)) {
                return false;
            }

            LocalDateTime endAt = test.getEndTime();
            if (endAt == null && startAt != null) {
                int duration = test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
                endAt = startAt.plusMinutes(duration);
            }
            if (endAt != null && now.isAfter(endAt)) return false;
        }

        return true;
    }

    public boolean isExpired(Test test, LocalDateTime now) {
        if (test == null) return false;
        if ("ARCHIVED".equalsIgnoreCase(test.getStatus())) return true;
        if ("MAIN".equalsIgnoreCase(test.getTestType())) {
            LocalDateTime endAt = test.getEndTime();
            LocalDateTime startAt = test.getStartTime() != null ? test.getStartTime() : test.getScheduledAt();
            if (endAt == null && startAt != null) {
                int duration = test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
                endAt = startAt.plusMinutes(duration);
            }
            if (endAt != null && now.isAfter(endAt)) return true;
        }
        return false;
    }

    @Transactional
    public Test syncTestLifecycle(Test test) {
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;

        // 1. Promote SCHEDULED -> ACTIVE
        if ("SCHEDULED".equalsIgnoreCase(test.getStatus())
                && test.getScheduledAt() != null
                && !test.getScheduledAt().isAfter(now)) {
            test.setStatus("ACTIVE");
            test.setStartedAt(now); 
            changed = true;
        }

        // 2. Auto-close ACTIVE -> ARCHIVED (ONLY for MAIN tests)
        if ("MAIN".equalsIgnoreCase(test.getTestType()) && !"ARCHIVED".equalsIgnoreCase(test.getStatus())) {
            LocalDateTime endAt = test.getEndTime();
            LocalDateTime startAt = test.getStartTime() != null ? test.getStartTime() : test.getScheduledAt();
            
            if (endAt == null && startAt != null) {
                int duration = test.getDurationMinutes() > 0 ? test.getDurationMinutes() : 60;
                endAt = startAt.plusMinutes(duration);
            }

            if (endAt != null && !now.isBefore(endAt)) {
                test.setStatus("ARCHIVED");
                changed = true;
                System.out.println("[LIFECYCLE] Test ID " + test.getId() + " (" + test.getTitle() + ") marked as ARCHIVED.");
            }
        }

        return changed ? testRepository.save(test) : test;
    }

    /**
     * Syncs ALL tests. Can be invoked on-demand or via LifecycleScheduler.
     */
    @Transactional
    public void syncAllTests() {
        // Only scan assessments that aren't already archived
        List<Test> tests = testRepository.findAll().stream()
                .filter(t -> !"ARCHIVED".equalsIgnoreCase(t.getStatus()))
                .toList();
                
        if (!tests.isEmpty()) {
            System.out.println("[LIFECYCLE] Scanning " + tests.size() + " assessments for status promotion/expiry...");
            for (Test test : tests) {
                syncTestLifecycle(test);
            }
        }
    }

    /**
     * 🛡️ DETERMINISTIC AUTO-SUBMIT ENGINE
     * Scans all IN_PROGRESS attempts and forces submission if endTime has passed.
     * This works REGARDLESS of whether the test is ACTIVE or ARCHIVED.
     */
    @Transactional
    public void syncAllAttempts() {
        List<TestAttempt> activeAttempts = testAttemptRepository.findAllByStatus(TestAttempt.Status.IN_PROGRESS);
        LocalDateTime now = LocalDateTime.now();
        int count = 0;

        for (TestAttempt attempt : activeAttempts) {
            // If attempt has reached its individual end time (e.g. 60 mins after start)
            if (attempt.getEndTime() != null && now.isAfter(attempt.getEndTime())) {
                // Load with lock to avoid stale state and concurrency conflicts
                Optional<TestAttempt> lockedOpt = testAttemptRepository.findByIdWithLock(attempt.getId());
                if (lockedOpt.isPresent()) {
                    TestAttempt locked = lockedOpt.get();
                    if (locked.getStatus() == TestAttempt.Status.IN_PROGRESS) {
                        System.out.println("[AUTO-SUBMIT] Time expired for Attempt " + locked.getId() + " (User: " + locked.getUserEmail() + "). Finalizing...");
                        attemptService.finalizeAndSubmit(locked, null);
                        count++;
                    }
                }
            }
        }

        if (count > 0) {
            System.out.println("[AUTO-SUBMIT] Successfully finalized " + count + " expired attempts.");
        }
    }

    @Transactional
    public void deleteTestSafely(Long id) {
        Test test = testRepository.findByIdWithWriteLock(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Test not found"));

        long attemptCount = testAttemptRepository.countByTestId(id);
        if (attemptCount > 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Cannot delete assessment with existing student attempts. Archive the test instead.");
        }

        jdbcTemplate.update("DELETE FROM test_questions WHERE test_id = ?", id);
        testRepository.delete(test);
    }
}
