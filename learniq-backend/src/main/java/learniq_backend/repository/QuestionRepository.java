package learniq_backend.repository;

import learniq_backend.model.Question;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    boolean existsByQuestionText(String questionText);


    @Query("SELECT q FROM Question q JOIN q.tests t WHERE t.id = :testId")
    List<Question> findByTestId(@Param("testId") Long testId);

    @Modifying
    @Transactional
    @Query(value = "ALTER SEQUENCE question_id_seq RESTART WITH 1", nativeQuery = true)
    void resetId();


    List<Question> findByCategory(String category);

    @Query(value = "SELECT * FROM question WHERE UPPER(category) = UPPER(:category) ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByCategory(@Param("category") String category, @Param("limit") int limit);

    @Query(value = "SELECT * FROM question ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandom(@Param("limit") int limit);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question WHERE UPPER(category) = UPPER(:category)", nativeQuery = true)
    void hardDeleteByCategory(@Param("category") String category);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question WHERE question_text = :title", nativeQuery = true)
    void hardDeleteByTitle(@Param("title") String title);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question", nativeQuery = true)
    void hardDeleteAll();
}

