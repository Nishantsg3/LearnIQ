package learniq_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TestAttemptResponse {
    private Long id;
    private Long testId;
    private String testTitle;
    private String category;
    private int scorePercent;
    private int correctCount;
    private int wrongCount;
    private LocalDateTime submittedAt;
    private String status;
    private List<learniq_backend.controller.QuestionController.QuestionAttemptView> questions;
    private Long remainingTime;
}
