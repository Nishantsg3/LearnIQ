package learniq_backend.repository;

import learniq_backend.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByUserEmailOrderBySubmittedAtDesc(String userEmail);
    List<TestAttempt> findByUserEmail(String userEmail);
    Optional<TestAttempt> findTopByUserEmailAndTestIdOrderBySubmittedAtDesc(String userEmail, Long testId);
    Optional<TestAttempt> findFirstByUserEmailAndTestIdAndStatusOrderByStartedAtDesc(String userEmail, Long testId, TestAttempt.Status status);
}
