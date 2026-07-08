package learniq_backend.config;

import learniq_backend.model.TestAttempt;
import learniq_backend.repository.TestAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-shot backfill migration: populates the denormalized testType column
 * for any existing TestAttempt rows that have a null testType but still
 * have a linked Test entity.
 *
 * Safe to run on every startup — it skips rows that already have a value.
 * This ensures historical attempts are not silently filtered out in the
 * Student Results page.
 */
@Component
@Order(10)
@RequiredArgsConstructor
public class AttemptTestTypeBackfill implements CommandLineRunner {

    private final TestAttemptRepository testAttemptRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<TestAttempt> nullTypeAttempts = testAttemptRepository.findAll().stream()
                .filter(a -> a.getTestType() == null && a.getTest() != null)
                .toList();

        if (nullTypeAttempts.isEmpty()) {
            System.out.println("[BACKFILL] testType already populated for all attempts. Skipping.");
            return;
        }

        int count = 0;
        for (TestAttempt a : nullTypeAttempts) {
            try {
                String type = a.getTest().getTestType();
                if (type != null) {
                    a.setTestType(type);
                    testAttemptRepository.save(a);
                    count++;
                }
            } catch (Exception e) {
                System.err.println("[BACKFILL] Failed to backfill attempt " + a.getId() + ": " + e.getMessage());
            }
        }
        System.out.println("[BACKFILL] Backfilled testType for " + count + " existing attempt(s).");
    }
}
