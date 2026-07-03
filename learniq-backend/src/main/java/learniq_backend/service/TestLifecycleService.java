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

    /**
     * Centralized logic to sync a test's status based on time.
     * 1. SCHEDULED -> LIVE   when now >= scheduledAt (and set startedAt = now)
     * 2. LIVE      -> COMPLETED when now >= endTime (MAIN tests only)
     * 3. Move to History: When status is COMPLETED, set archived=true and active=false
     */
    public boolean isActuallyActive(Test test, LocalDateTime now) {
        if (!"ACTIVE".equalsIgnoreCase(test.getStatus())) return false;
        
        // For MAIN tests, also check the window
        if ("MAIN".equalsIgnoreCase(test.getTestType())) {
            LocalDateTime endAt = test.getEndTime();
            if (endAt == null && test.getStartTime() != null) {
                endAt = test.getStartTime().plusMinutes(test.getDurationMinutes());
            }
            if (endAt != null && now.isAfter(endAt)) return false;
        }
        
        return true;
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
            
            if (endAt == null && test.getStartTime() != null) {
                endAt = test.getStartTime().plusMinutes(test.getDurationMinutes());
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
     * Syncs ALL tests every 5 minutes via background scheduler
     * Added initialDelay to prevent startup bottlenecks on Render
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 300000, initialDelay = 120000)
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
}
