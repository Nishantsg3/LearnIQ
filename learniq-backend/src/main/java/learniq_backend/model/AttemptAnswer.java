package learniq_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attempt_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔥 CRITICAL FIX (LAZY + NULL SAFE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private TestAttempt attempt;

    @Column(nullable = false)
    private Long questionId;

    @Column
    private String selectedOption;

    @Column
    private boolean isCorrect;
}