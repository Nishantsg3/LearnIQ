package learniq_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String userName;

    @ManyToOne(optional = false)
    @JoinColumn(name = "test_id")
    private Test test;

    @Column
    private int totalQuestions;

    @Column
    private int correctCount;

    @Column
    private int wrongCount;

    @Column
    private int scorePercent;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime endTime;

    @Column
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    // 🔥 CRITICAL FIX
    @OneToMany(
            mappedBy = "attempt",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<AttemptAnswer> answers = new ArrayList<>();

    public enum Status {
        IN_PROGRESS, SUBMITTED, EXPIRED
    }

    // 🔥 SAFE METHOD (KEEP THIS)
    public void setAnswersSafely(List<AttemptAnswer> newAnswers) {

        this.answers.clear();

        if (newAnswers != null) {
            for (AttemptAnswer ans : newAnswers) {
                ans.setAttempt(this);
                this.answers.add(ans);
            }
        }
    }
}