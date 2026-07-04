package learniq_backend.repository;

import learniq_backend.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByUserEmailOrderBySubmittedAtDesc(String userEmail);
    List<TestAttempt> findByUserEmail(String userEmail);
    List<TestAttempt> findByUserId(Long userId);
    Optional<TestAttempt> findTopByUserEmailAndTestIdOrderBySubmittedAtDesc(String userEmail, Long testId);
    Optional<TestAttempt> findFirstByUserEmailAndTestIdAndStatusOrderByStartedAtDesc(String userEmail, Long testId, TestAttempt.Status status);
    Optional<TestAttempt> findFirstByUserEmailAndTestIdAndSubmittedOrderByStartedAtDesc(String userEmail, Long testId, boolean submitted);
    boolean existsByUserEmailAndTestIdAndSubmitted(String userEmail, Long testId, boolean submitted);
    List<TestAttempt> findByTestIdAndSubmitted(Long testId, boolean submitted);
    boolean existsByTestId(Long testId);
    long countByTestId(Long testId);
    Optional<TestAttempt> findFirstByUserIdAndTestIdAndStatus(Long userId, Long testId, TestAttempt.Status status);
    List<TestAttempt> findAllByUserIdAndTestIdAndStatus(Long userId, Long testId, TestAttempt.Status status);
    List<TestAttempt> findAllByUserIdAndStatus(Long userId, TestAttempt.Status status);
    List<TestAttempt> findAllByUserEmailAndStatus(String userEmail, TestAttempt.Status status);
    List<TestAttempt> findAllByStatus(TestAttempt.Status status);
    long countByTestIdAndScorePercentGreaterThanAndStatus(Long testId, int scorePercent, TestAttempt.Status status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from TestAttempt a where a.id = :id")
    Optional<TestAttempt> findByIdWithLock(@Param("id") Long id);

    List<TestAttempt> findByTestIdAndStatus(Long testId, TestAttempt.Status status);
    long countByTestIdAndStatus(Long testId, TestAttempt.Status status);
}
