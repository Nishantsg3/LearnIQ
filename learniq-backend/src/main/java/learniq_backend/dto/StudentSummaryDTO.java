package learniq_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import learniq_backend.model.User;

import java.time.LocalDateTime;

/**
 * Dedicated projection DTO for administrative student directory views.
 * Contains only non-sensitive, allowlisted candidate summary fields.
 * Explicitly excludes password, otp, otpExpiry, resetToken, and resetTokenExpiry.
 */
public record StudentSummaryDTO(
    Long id,
    String name,
    String email,
    User.Role role,
    LocalDateTime createdAt,
    @JsonProperty("isVerified")
    boolean isVerified
) {
    public static StudentSummaryDTO fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new StudentSummaryDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getCreatedAt(),
            user.isVerified()
        );
    }
}
