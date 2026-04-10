package learniq_backend.repository;

import learniq_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String token);
    boolean existsByEmail(String email);
    boolean existsByRole(User.Role role);
    long countByRole(User.Role role);
}
