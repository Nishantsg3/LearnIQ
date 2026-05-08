package learniq_backend.dto;

import java.util.List;

public record CreateTestRequest(
    String title,
    String category,
    String difficultyLevel,
    List<Long> questionIds,
    Integer totalQuestions,
    Integer totalMarks,
    Integer duration,
    String status,
    String sectionType,
    String description,
    String testType,
    java.time.LocalDateTime scheduledAt,
    java.time.LocalDateTime startTime,
    java.time.LocalDateTime endTime,
    Boolean active
) {}
