package learniq_backend.dto;

public record LeaderboardEntry(
    int rank,
    String userName,
    String userEmail,
    double score
) {}
