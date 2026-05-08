package learniq_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@RequiredArgsConstructor
public class LifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(LifecycleScheduler.class);

    private final TestLifecycleService testLifecycleService;

    /**
     * Automatically syncs test statuses every 30 seconds.
     * This handles SCHEDULED -> LIVE and LIVE -> COMPLETED transitions.
     */
    @Scheduled(fixedDelay = 30000)
    public void runLifecycleUpdate() {
        log.info("Running background lifecycle synchronization...");
        testLifecycleService.syncAllTests();
        testLifecycleService.syncAllAttempts();
    }
}
