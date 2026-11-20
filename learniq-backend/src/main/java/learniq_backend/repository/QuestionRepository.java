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

    java.util.Optional<Question> findFirstByOrderByIdAsc();


    @Query("SELECT q FROM Question q JOIN q.tests t WHERE t.id = :testId")
    List<Question> findByTestId(@Param("testId") Long testId);

    @Modifying
    @Transactional
    @Query(value = "ALTER SEQUENCE question_id_seq RESTART WITH 1", nativeQuery = true)
    void resetId();


    List<Question> findByCategory(String category);

    List<Question> findByCategoryAndIsDeletedFalse(String category);

    @Query("SELECT q FROM Question q WHERE UPPER(q.category) = UPPER(:category) AND (q.isDeleted = false OR q.isDeleted IS NULL)")
    List<Question> findByCategoryIgnoreCaseAndIsDeletedFalse(@Param("category") String category);

    List<Question> findAllByIsDeletedFalse();

    long countByIsDeletedFalse();

    long countByCategoryAndIsDeletedFalse(String category);

    @Query("SELECT COUNT(q) FROM Question q WHERE UPPER(q.category) = UPPER(:category) AND (q.isDeleted = false OR q.isDeleted IS NULL)")
    long countByCategoryIgnoreCaseAndIsDeletedFalse(@Param("category") String category);

    @Query(value = "SELECT * FROM question WHERE UPPER(category) = UPPER(:category) AND is_deleted = false ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByCategory(@Param("category") String category, @Param("limit") int limit);

    @Query(value = "SELECT * FROM question WHERE is_deleted = false ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandom(@Param("limit") int limit);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question", nativeQuery = true)
    void hardDeleteAll();
}

