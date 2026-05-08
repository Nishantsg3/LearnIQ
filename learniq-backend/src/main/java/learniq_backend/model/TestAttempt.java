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

    @ManyToOne(optional = true)
    @JoinColumn(name = "user_id")
    private User user;

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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
    private int attemptedCount;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime endTime;

    @Column
    private Integer remainingSeconds;

    @Column
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean submitted;

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public boolean isSubmitted() { return submitted; }
    public void setSubmitted(boolean submitted) { this.submitted = submitted; }
    public Test getTest() { return test; }
    public void setTest(Test test) { this.test = test; }

    // 🔥 CRITICAL FIX
    @OneToMany(
            mappedBy = "attempt",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<AttemptAnswer> answers = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }
    public int getScorePercent() { return scorePercent; }
    public void setScorePercent(int scorePercent) { this.scorePercent = scorePercent; }
    public int getAttemptedCount() { return attemptedCount; }
    public void setAttemptedCount(int attemptedCount) { this.attemptedCount = attemptedCount; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public List<AttemptAnswer> getAnswers() { return answers; }
    public void setAnswers(List<AttemptAnswer> answers) { this.answers = answers; }

    public enum Status {
        IN_PROGRESS, SUBMITTED, MISSED, ABANDONED
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