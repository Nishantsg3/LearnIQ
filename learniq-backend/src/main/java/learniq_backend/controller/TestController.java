package learniq_backend.controller;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.model.TestAttempt;
import learniq_backend.repository.TestAttemptRepository;
import learniq_backend.repository.TestRepository;
import learniq_backend.service.TestLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tests")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TestController {

    private final TestRepository testRepository;
    private final learniq_backend.repository.QuestionRepository questionRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final TestLifecycleService testLifecycleService;

    // ─── GET ALL ────────────────────────────────────────────────────────────────

    @GetMapping
    public List<Test> getAllTests(Authentication authentication) {
        String email = authentication.getName();
        boolean admin = isAdmin(authentication);
        
        List<Test> tests = testRepository.findAll();
        
        // Sync all statuses before returning
        tests.forEach(testLifecycleService::syncTestLifecycle);

        if (admin) {
            return tests;
        }

        // Students never see DRAFT
        return tests.stream()
                .filter(t -> !"DRAFT".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());
    }

    // ─── GET ONE ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id, Authentication authentication) {
        return testRepository.findById(id)
                .map(test -> {
                    testLifecycleService.syncTestLifecycle(test);
                    return test;
                })
                .filter(t -> isAdmin(authentication) || !"DRAFT".equalsIgnoreCase(t.getStatus()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createTest(@RequestBody Test test) {
        // Updated Rules: Easy (10/10), Medium (15/15), Hard (30/30)
        int requiredCount;
        int duration;
        switch (test.getDifficultyLevel() != null ? test.getDifficultyLevel().toUpperCase() : "MEDIUM") {
            case "EASY" -> { requiredCount = 10; duration = 10; }
            case "HARD" -> { requiredCount = 30; duration = 30; }
            default -> { requiredCount = 15; duration = 15; } // MEDIUM
        }

        // Difficulty is ONLY a label. Always fetch by category ONLY.
        List<learniq_backend.model.Question> bankQs;
        if ("General".equalsIgnoreCase(test.getCategory())) {
            bankQs = questionRepository.findByTestIsNull();
        } else {
            // Updated: Ignore difficultyLevel in query (fetch by category only)
            bankQs = questionRepository.findByTestIsNullAndCategory(test.getCategory());
        }

        // Use all available if bank < requested (Safety Fallback)
        int finalCount = Math.min(bankQs.size(), requiredCount);
        if (finalCount == 0 && bankQs.size() == 0) {
            // Technically empty bank is bad, but we still allow creation to avoid crash.
        }

        java.util.Collections.shuffle(bankQs);
        List<learniq_backend.model.Question> selected = bankQs.subList(0, finalCount);

        test.setQuestionCount(finalCount);
        test.setDurationMinutes(duration);

        // Resolve status
        String requestedStatus = test.getStatus() != null ? test.getStatus().toUpperCase() : "DRAFT";
        if ("LIVE".equals(requestedStatus)) {
            test.setStartedAt(LocalDateTime.now());
        } else if (!"SCHEDULED".equals(requestedStatus)) {
            test.setStatus("DRAFT");
        }

        Test savedTest = testRepository.save(test);

        // Clone bank questions
        List<learniq_backend.model.Question> clones = selected.stream().map(bq -> 
            learniq_backend.model.Question.builder()
                .questionText(bq.getQuestionText())
                .optionA(bq.getOptionA())
                .optionB(bq.getOptionB())
                .optionC(bq.getOptionC())
                .optionD(bq.getOptionD())
                .correctAnswer(bq.getCorrectAnswer())
                .category(savedTest.getCategory())
                .difficultyLevel(savedTest.getDifficultyLevel()) // preserve label
                .test(savedTest)
                .build()
        ).collect(Collectors.toList());
        
        questionRepository.saveAll(clones);

        return ResponseEntity.ok(savedTest);
    }

    // ─── GO LIVE (admin override) ────────────────────────────────────────────────

    @PostMapping("/{id}/live")
    public ResponseEntity<?> goLive(@PathVariable Long id) {
        return testRepository.findById(id)
                .map(test -> {
                    // Ignore scheduledAt. Set startedAt = now.
                    test.setStatus("LIVE");
                    test.setStartedAt(LocalDateTime.now());
                    return ResponseEntity.ok(testRepository.save(test));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTest(@PathVariable Long id, @RequestBody Test updatedTest) {
        return testRepository.findById(id)
                .map(test -> {
                    // Block edit if LIVE or COMPLETED
                    if ("LIVE".equalsIgnoreCase(test.getStatus()) || "COMPLETED".equalsIgnoreCase(test.getStatus())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot edit a published or completed test"));
                    }

                    test.setTitle(updatedTest.getTitle());
                    test.setCategory(updatedTest.getCategory());
                    test.setSectionType(updatedTest.getSectionType());
                    test.setDifficultyLevel(updatedTest.getDifficultyLevel());
                    test.setScheduledAt(updatedTest.getScheduledAt());
                    test.setDescription(updatedTest.getDescription());
                    test.setStatus(updatedTest.getStatus());

                    return ResponseEntity.ok(testRepository.save(test));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        if (!testRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Test entity has cascade = CascadeType.ALL for questions and attempts
        testRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── HELPERS ────────────────────────────────────────────────────────────────

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
