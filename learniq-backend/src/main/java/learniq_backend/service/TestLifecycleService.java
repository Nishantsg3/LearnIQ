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

    /**
     * Centralized logic to sync a test's status based on time.
     * 1. SCHEDULED -> LIVE   when now >= scheduledAt (and set startedAt = now)
     * 2. LIVE      -> COMPLETED when now >= startedAt + duration
     * 3. Safety Check: If status is LIVE and startedAt is missing, fix it.
     */
    @Transactional
    public Test syncTestLifecycle(Test test) {
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;

        // 1. Promote SCHEDULED -> LIVE
        if ("SCHEDULED".equalsIgnoreCase(test.getStatus())
                && test.getScheduledAt() != null
                && !test.getScheduledAt().isAfter(now)) {
            test.setStatus("LIVE");
            test.setStartedAt(now); // Set exact moment it turned live
            changed = true;
        }

        // 2. Safety Check: If LIVE but startedAt was never set (avoid runtime crashes)
        if ("LIVE".equalsIgnoreCase(test.getStatus()) && test.getStartedAt() == null) {
            test.setStartedAt(now);
            changed = true;
        }

        // 3. Auto-close LIVE -> COMPLETED
        if ("LIVE".equalsIgnoreCase(test.getStatus()) && test.getStartedAt() != null) {
            LocalDateTime endAt = test.getStartedAt().plusMinutes(test.getDurationMinutes());
            if (!now.isBefore(endAt)) {
                test.setStatus("COMPLETED");
                changed = true;
            }
        }

        return changed ? testRepository.save(test) : test;
    }

    /**
     * Syncs ALL tests (used by the background scheduler)
     */
    @Transactional
    public void syncAllTests() {
        List<Test> tests = testRepository.findAll();
        for (Test test : tests) {
            syncTestLifecycle(test);
        }
    }
}
