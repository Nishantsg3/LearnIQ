package learniq_backend.repository;

import learniq_backend.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<Test, Long> {
    long countByStatus(String status);

}