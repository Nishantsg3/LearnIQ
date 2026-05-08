package learniq_backend.repository;

import learniq_backend.model.AttemptAnswer;
import learniq_backend.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

    List<AttemptAnswer> findByAttempt(TestAttempt attempt);

    List<AttemptAnswer> findByAttemptId(Long attemptId);

    void deleteByAttemptId(Long attemptId);
}
