package learniq_backend.repository;

import learniq_backend.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByStatus(String status);
    long countByStatus(String status);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select t from Test t where t.id = :id")
    Optional<Test> findByIdWithReadLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Test t where t.id = :id")
    Optional<Test> findByIdWithWriteLock(@Param("id") Long id);
}
