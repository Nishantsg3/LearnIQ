package learniq_backend.service;

import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.dto.TestAttemptResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final TestAttemptRepository testAttemptRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    @Transactional
    public TestAttempt startOrResumeAttempt(String userEmail, Long testId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        Optional<TestAttempt> existingOpt =
                testAttemptRepository.findFirstByUserEmailAndTestIdAndStatusOrderByStartedAtDesc(
                        userEmail, testId, TestAttempt.Status.IN_PROGRESS);

        if (existingOpt.isPresent()) {
            TestAttempt existing = existingOpt.get();

            if (existing.getEndTime() != null &&
                    LocalDateTime.now().isAfter(existing.getEndTime())) {

                existing.setStatus(TestAttempt.Status.EXPIRED);
                return testAttemptRepository.save(existing);
            }

            return existing;
        }

        String userName = userRepository.findByEmail(userEmail)
                .map(User::getName)
                .orElse("Student");

        LocalDateTime now = LocalDateTime.now();

        TestAttempt newAttempt = TestAttempt.builder()
                .userEmail(userEmail)
                .userName(userName)
                .test(test)
                .startedAt(now)
                .endTime(now.plusMinutes(test.getDurationMinutes()))
                .status(TestAttempt.Status.IN_PROGRESS)
                .scorePercent(-1)
                .answers(new ArrayList<>())
                .build();

        return testAttemptRepository.save(newAttempt);
    }

    public long getRemainingSeconds(Long attemptId) {

        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        if (attempt.getEndTime() == null) return 0;

        long remaining = Duration.between(LocalDateTime.now(), attempt.getEndTime()).getSeconds();
        return Math.max(0, remaining);
    }

    public TestAttempt getAttemptById(Long id) {
        return testAttemptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
    }

    @Transactional
    public TestAttempt submitAttempt(Long attemptId, Map<String, String> answers) {

        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        // ✅ FIX: DO NOT REPLACE LIST
        if (attempt.getAnswers() == null) {
            attempt.setAnswers(new ArrayList<>());
        } else {
            attempt.getAnswers().clear();
        }

        List<Question> questions = questionRepository.findByTestId(
                attempt.getTest().getId()
        );

        int correctCount = 0;
        List<AttemptAnswer> newAnswers = new ArrayList<>();

        for (Question q : questions) {

            String selected = (answers != null)
                    ? answers.get(String.valueOf(q.getId()))
                    : null;

            boolean isCorrect = q.getCorrectAnswer() != null &&
                    q.getCorrectAnswer().equalsIgnoreCase(
                            selected == null ? "" : selected.trim()
                    );

            if (isCorrect) correctCount++;

            newAnswers.add(AttemptAnswer.builder()
                    .questionId(q.getId())
                    .selectedOption(selected)
                    .isCorrect(isCorrect)
                    .build());
        }

        int total = questions.size();
        int scorePercent = total == 0 ? 0 : (correctCount * 100) / total;

        attempt.setTotalQuestions(total);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(total - correctCount);
        attempt.setScorePercent(scorePercent);

        attempt.setStatus(TestAttempt.Status.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());

        // ✅ FIX: ADD TO SAME LIST (IMPORTANT)
        for (AttemptAnswer ans : newAnswers) {
            ans.setAttempt(attempt);
            attempt.getAnswers().add(ans);
        }

        return testAttemptRepository.save(attempt);
    }

    public List<TestAttemptResponse> getUserAttempts(String email) {

        if (email == null || email.isBlank()) return Collections.emptyList();

        List<TestAttempt> attempts = testAttemptRepository.findByUserEmail(email);

        if (attempts == null || attempts.isEmpty()) return Collections.emptyList();

        attempts.sort((a, b) -> {
            LocalDateTime t1 = a.getSubmittedAt();
            LocalDateTime t2 = b.getSubmittedAt();

            if (t1 == null && t2 == null) return 0;
            if (t1 == null) return 1;
            if (t2 == null) return -1;

            return t2.compareTo(t1);
        });

        return attempts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TestAttemptResponse mapToResponse(TestAttempt attempt) {

        if (attempt == null) return null;

        Long testId = null;
        String testTitle = "Unknown Test";
        String category = "Unknown";
        List<learniq_backend.controller.QuestionController.QuestionAttemptView> questions = null;
        Long remainingTime = null;

        if (attempt.getTest() != null) {

            testId = attempt.getTest().getId();
            testTitle = attempt.getTest().getTitle();
            category = attempt.getTest().getCategory();

            if (attempt.getStatus() == TestAttempt.Status.IN_PROGRESS) {

                questions = questionRepository.findByTestId(testId).stream()
                        .map(q -> new learniq_backend.controller.QuestionController.QuestionAttemptView(
                                q.getId(),
                                q.getQuestionText(),
                                q.getOptionA(),
                                q.getOptionB(),
                                q.getOptionC(),
                                q.getOptionD()))
                        .collect(Collectors.toList());

                remainingTime = getRemainingSeconds(attempt.getId());
            }
        }

        return TestAttemptResponse.builder()
                .id(attempt.getId())
                .testId(testId)
                .testTitle(testTitle)
                .category(category)
                .scorePercent(attempt.getScorePercent())
                .correctCount(attempt.getCorrectCount())
                .wrongCount(attempt.getWrongCount())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus() != null ? attempt.getStatus().name() : null)
                .questions(questions)
                .remainingTime(remainingTime)
                .build();
    }
}