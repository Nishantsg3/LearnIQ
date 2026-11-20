package learniq_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Spring-managed asynchronous task execution configuration.
 * Provides a bounded thread pool for email dispatches and background tasks,
 * preventing thread starvation, unbounded native thread allocation, and
 * ensuring graceful termination on container shutdown.
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean(name = "emailTaskExecutor")
    @Primary
    public ThreadPoolTaskExecutor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("mail-exec-");

        // Failsafe observable rejection handler:
        // 1. When shutting down: reject and log (never silently swallow dropped tasks).
        // 2. When saturated during normal operation: log saturation warning and execute on caller thread.
        executor.setRejectedExecutionHandler((r, pool) -> {
            if (pool.isShutdown()) {
                log.warn("[EMAIL-EXECUTOR] Task rejected because executor is shutting down. Email task was not executed.");
                throw new TaskRejectedException("EmailTaskExecutor is shut down; rejecting new task");
            }
            log.warn("[EMAIL-EXECUTOR] Email task queue saturated (active={}, queued={}); executing on caller thread",
                    pool.getActiveCount(), pool.getQueue().size());
            r.run();
        });

        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    @Override
    public TaskExecutor getAsyncExecutor() {
        return emailTaskExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (throwable, method, params) ->
                log.error("[ASYNC-ERROR] Uncaught exception in async method '{}': {}",
                        method.getName(), throwable.getMessage(), throwable);
    }
}
