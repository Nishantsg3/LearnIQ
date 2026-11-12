package learniq_backend.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.lifecycle.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class LifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(LifecycleScheduler.class);

    private final TestLifecycleService testLifecycleService;

    @Value("${app.lifecycle.scheduler.enabled:true}")
    private boolean enabled;

    /**
     * Periodic fallback synchronization for test statuses and expired attempts.
     * Polling frequency is non-intrusive and configurable via 'app.lifecycle.poll-interval-ms'
     * (default: 5 minutes / 300,000ms), protecting Neon Postgres auto-suspend and HikariCP scale-to-zero.
     */
    @Scheduled(
            fixedDelayString = "${app.lifecycle.poll-interval-ms:300000}",
            initialDelayString = "${app.lifecycle.initial-delay-ms:300000}"
    )
    public void runLifecycleUpdate() {
        if (!enabled) {
            log.debug("[LIFECYCLE-SCHEDULER] Background scheduler is disabled via configuration; skipping execution.");
            return;
        }
        log.info("[LIFECYCLE-SCHEDULER] Running background lifecycle synchronization...");
        testLifecycleService.syncAllTests();
        testLifecycleService.syncAllAttempts();
    }

    public boolean isEnabled() {
        return enabled;
    }
}
