package learniq_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class TestAttemptResponse {
    public TestAttemptResponse() {}
    private Long id;
    private Long testId;
    private Long userId;
    private String testTitle;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    private String category;
    private int scorePercent;
    private int correctCount;
    private int wrongCount;
    private int totalQuestions;
    private int attemptedCount;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private String status;
    private String testType;
    private boolean submitted;
    private List<learniq_backend.controller.QuestionController.QuestionAttemptView> questions;
    private Long remainingTime;
    private List<AnswerReview> answerReviews;
    private List<AttemptResponseItem> responses;
    private Integer rank;
    private Integer totalParticipants;

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }
    public Integer getTotalParticipants() { return totalParticipants; }
    public void setTotalParticipants(Integer totalParticipants) { this.totalParticipants = totalParticipants; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public String getTestTitle() { return testTitle; }
    public void setTestTitle(String testTitle) { this.testTitle = testTitle; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public int getScorePercent() { return scorePercent; }
    public void setScorePercent(int scorePercent) { this.scorePercent = scorePercent; }
    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getAttemptedCount() { return attemptedCount; }
    public void setAttemptedCount(int attemptedCount) { this.attemptedCount = attemptedCount; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }
    public boolean isSubmitted() { return submitted; }
    public void setSubmitted(boolean submitted) { this.submitted = submitted; }
    public List<learniq_backend.controller.QuestionController.QuestionAttemptView> getQuestions() { return questions; }
    public void setQuestions(List<learniq_backend.controller.QuestionController.QuestionAttemptView> questions) { this.questions = questions; }
    public Long getRemainingTime() { return remainingTime; }
    public void setRemainingTime(Long remainingTime) { this.remainingTime = remainingTime; }
    public List<AnswerReview> getAnswerReviews() { return answerReviews; }
    public void setAnswerReviews(List<AnswerReview> answerReviews) { this.answerReviews = answerReviews; }
    public List<AttemptResponseItem> getResponses() { return responses; }
    public void setResponses(List<AttemptResponseItem> responses) { this.responses = responses; }

    public static class AttemptResponseItem {
        public AttemptResponseItem() {}
        private Long id;
        private String selectedOption;
        private String correctOption;
        private boolean correct;
        private QuestionData question;
        private String text;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getSelectedOption() { return selectedOption; }
        public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }
        public String getCorrectOption() { return correctOption; }
        public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }
        public QuestionData getQuestion() { return question; }
        public void setQuestion(QuestionData question) { this.question = question; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public static class QuestionData {
        public QuestionData() {}
        private Long id;
        private String text;
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getOptionA() { return optionA; }
        public void setOptionA(String optionA) { this.optionA = optionA; }
        public String getOptionB() { return optionB; }
        public void setOptionB(String optionB) { this.optionB = optionB; }
        public String getOptionC() { return optionC; }
        public void setOptionC(String optionC) { this.optionC = optionC; }
        public String getOptionD() { return optionD; }
        public void setOptionD(String optionD) { this.optionD = optionD; }
        public String getCorrectOption() { return correctOption; }
        public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
    }

    public static class AnswerReview {
        public AnswerReview() {}
        private Long questionId;
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String selectedOption;
        private String correctAnswer;
        private boolean correct;

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getOptionA() { return optionA; }
        public void setOptionA(String optionA) { this.optionA = optionA; }
        public String getOptionB() { return optionB; }
        public void setOptionB(String optionB) { this.optionB = optionB; }
        public String getOptionC() { return optionC; }
        public void setOptionC(String optionC) { this.optionC = optionC; }
        public String getOptionD() { return optionD; }
        public void setOptionD(String optionD) { this.optionD = optionD; }
        public String getSelectedOption() { return selectedOption; }
        public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }
        public String getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }
    }
}
