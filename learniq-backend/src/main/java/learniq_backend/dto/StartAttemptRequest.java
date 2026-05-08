package learniq_backend.dto;

import lombok.Data;

@Data
public class StartAttemptRequest {
    private Long testId;
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
}
