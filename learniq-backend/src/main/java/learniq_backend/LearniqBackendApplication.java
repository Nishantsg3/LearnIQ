package learniq_backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import learniq_backend.repository.*;
import learniq_backend.service.DataSeederService;
import learniq_backend.model.*;
import java.util.*;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.data.jpa.repository.config.EnableJpaAuditing
public class LearniqBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearniqBackendApplication.class, args);
	}

    @Bean
    CommandLineRunner seeder(DataSeederService seederService, learniq_backend.repository.TestAttemptRepository attemptRepo) {
        return args -> {
            // seederService.seed(); // WIPE and RE-SEED (DISABLED FOR PERSISTENCE)
            
            // TARGETED CLEANUP: Remove earliest attempt to shift indexing
            try {
                // Find all attempts, sorted by ID
                List<TestAttempt> allAttempts = attemptRepo.findAll();
                if (!allAttempts.isEmpty()) {
                    // Sort by ID to find the very first one
                    allAttempts.sort(Comparator.comparing(TestAttempt::getId));
                    TestAttempt first = allAttempts.get(0);
                    
                    // Only delete if it's an old one (e.g. ID < 903) to avoid deleting the one just made
                    if (first.getId() < 903L) {
                        attemptRepo.delete(first);
                        System.out.println(">>> CLEANUP: Successfully deleted original first attempt (ID: " + first.getId() + ")");
                    }
                }
            } catch (Exception e) {
                System.err.println(">>> CLEANUP: Failed to re-index attempts - " + e.getMessage());
            }
        };
    }
}
