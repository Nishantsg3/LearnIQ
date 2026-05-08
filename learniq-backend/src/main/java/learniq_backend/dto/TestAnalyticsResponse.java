package learniq_backend.dto;

public record TestAnalyticsResponse(
    Long testId,
    String title,
    String category,
    Integer durationMinutes,
    long totalAttempts,
    double averageScore,
    double highestScore,
    double lowestScore,
    long studentsAttempted,
    double passPercentage,
    double participationRate
) {}
