package learniq_backend.controller;

import learniq_backend.dto.StartAttemptRequest;
import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.TestAttempt;
import learniq_backend.service.AttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/attempts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TestAttemptController {

    private final AttemptService attemptService;

    // ✅ START ATTEMPT
    @PostMapping("/start")
    public ResponseEntity<?> startAttempt(@RequestBody StartAttemptRequest request,
                                          Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        String userEmail = authentication.getName();

        TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, request.getTestId());

        // If already submitted, block re-attempt and return existing attempt ID
        if (attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
            return ResponseEntity.status(409).body(Map.of(
                "message", "You have already completed this test.",
                "attemptId", attempt.getId()
            ));
        }

        return ResponseEntity.ok(Map.of("attemptId", attempt.getId()));
    }

    // ✅ GET USER ATTEMPTS
    @GetMapping("/me")
    public ResponseEntity<List<TestAttemptResponse>> getMyAttempts(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        return ResponseEntity.ok(
                attemptService.getUserAttempts(authentication.getName())
        );
    }

    // ✅ GET SINGLE ATTEMPT (FIXED — DIRECT FETCH, NOT STREAM FILTER)
    @GetMapping("/{id}")
    public ResponseEntity<?> getAttemptById(@PathVariable Long id,
                                           Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            TestAttemptResponse response = attemptService.mapToResponse(
                    attemptService.getAttemptById(id)
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ✅ SUBMIT (CRITICAL FIX)
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitAttempt(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> answers,
                                           Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            // 🔥 FIX 1: NEVER PASS NULL
            if (answers == null) {
                answers = new HashMap<>();
            }

            TestAttempt submitted = attemptService.submitAttempt(id, answers);

            return ResponseEntity.ok(
                    attemptService.mapToResponse(submitted)
            );

        } catch (Exception e) {
            e.printStackTrace(); // 🔥 SHOW REAL ERROR IN BACKEND LOG

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message", e.getMessage(),
                            "type", e.getClass().getSimpleName()
                    )
            );
        }
    }
}