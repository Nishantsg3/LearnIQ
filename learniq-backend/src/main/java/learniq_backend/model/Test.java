package learniq_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String sectionType;

    @Column(nullable = false)
    private String difficultyLevel;

    @Column(nullable = false)
    private int questionCount;

    @Column(nullable = false)
    private int durationMinutes;

    // When the test is scheduled to start (admin sets this for SCHEDULED tests)
    private LocalDateTime scheduledAt;

    // Actual moment the test went LIVE (set automatically)
    private LocalDateTime startedAt;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private String status;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestAttempt> attempts;
}
