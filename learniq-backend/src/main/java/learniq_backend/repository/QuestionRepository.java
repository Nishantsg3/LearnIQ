package learniq_backend.repository;

import learniq_backend.model.Question;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCategoryAndDifficultyLevel(String category, String difficultyLevel);

    List<Question> findByTestId(Long testId);

    List<Question> findByTestIsNull();

    List<Question> findByTestIsNullAndCategory(String category);

    List<Question> findByTestIsNullAndCategoryAndDifficultyLevel(String category, String difficultyLevel);

    List<Question> findByCategory(String category);
}
