package learniq_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    private String resetToken;

    private LocalDateTime resetTokenExpiry;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isVerified;

    private String otp;

    private LocalDateTime otpExpiry;

    public enum Role {
        ADMIN, STUDENT
    }
}
