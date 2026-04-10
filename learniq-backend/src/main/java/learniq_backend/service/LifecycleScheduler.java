package learniq_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LifecycleScheduler {

    private final TestLifecycleService testLifecycleService;

    /**
     * Automatically syncs test statuses every 30 seconds.
     * This handles SCHEDULED -> LIVE and LIVE -> COMPLETED transitions.
     */
    @Scheduled(fixedDelay = 30000)
    public void runLifecycleUpdate() {
        log.info("Running background lifecycle synchronization...");
        testLifecycleService.syncAllTests();
    }
}
