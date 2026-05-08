package learniq_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String sectionType = "Multiple Choice";

    @Column(nullable = false)
    private String difficultyLevel = "Easy";

    @Column(nullable = false)
    private int questionCount;

    @Column(nullable = false)
    private int durationMinutes;

    // When the test is scheduled to start (admin sets this for SCHEDULED tests)
    private LocalDateTime scheduledAt;

    // Actual moment the test went LIVE (set automatically)
    private LocalDateTime startedAt;

    // MAIN Test Window
    private LocalDateTime startTime;

    @Column(nullable = true)
    private LocalDateTime endTime;

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    @Column(length = 500)
    private String description;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'PRACTICE'")
    private String testType = "PRACTICE"; // "PRACTICE" or "MAIN"

    @Column(nullable = false, columnDefinition = "varchar(255) default 'ACTIVE'")
    private String status = "ACTIVE";

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getTestType() { return testType; }
    public String getType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { 
        if (status != null) {
            String s = status.toUpperCase();
            if (s.equals("ACTIVE") || s.equals("ARCHIVED")) {
                this.status = s;
            } else if (s.equals("LIVE")) {
                this.status = "ACTIVE";
            } else if (s.equals("COMPLETED")) {
                this.status = "ARCHIVED";
            }
        }
    }

    @PrePersist
    @PreUpdate
    public void validateStatus() {
        if (status == null || (!status.equals("ACTIVE") && !status.equals("ARCHIVED"))) {
            // Default to ACTIVE for safety if invalid
            this.status = "ACTIVE";
        }
    }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public String getSectionType() { return sectionType; }
    public void setSectionType(String sectionType) { this.sectionType = sectionType; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public int getQuestionCount() { 
        if (questions != null && !questions.isEmpty()) {
            return questions.size();
        }
        return questionCount; 
    }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
    public List<TestAttempt> getAttempts() { return attempts; }
    public void setAttempts(List<TestAttempt> attempts) { this.attempts = attempts; }
    public String getMode() { return testType; }
    public boolean isActive() {
        return status != null && (status.equalsIgnoreCase("ACTIVE") || status.equalsIgnoreCase("LIVE"));
    }

    @ManyToMany
    @JoinTable(
        name = "test_questions",
        joinColumns = @JoinColumn(name = "test_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<Question> questions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestAttempt> attempts;
}
