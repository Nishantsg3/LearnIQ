package learniq_backend.repository;

import learniq_backend.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<Test, Long> {
    java.util.List<Test> findByStatus(String status);
    long countByStatus(String status);
}
