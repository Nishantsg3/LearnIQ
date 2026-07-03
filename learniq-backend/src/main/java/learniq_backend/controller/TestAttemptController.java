package learniq_backend.controller;

import learniq_backend.dto.StartAttemptRequest;
import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
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
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final UserRepository userRepository;


    // ✅ START ATTEMPT
    @PostMapping("/start")
    public ResponseEntity<?> startAttempt(@RequestBody StartAttemptRequest request,
                                          Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            String userEmail = authentication.getName();
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, request.getTestId());
            
            // If already submitted, block re-attempt and return existing attempt ID
            if (attempt.getStatus() == TestAttempt.Status.SUBMITTED) {
                return ResponseEntity.status(409).body(Map.of(
                    "message", "You have already completed this test.",
                    "attemptId", attempt.getId()
                ));
            }

            return ResponseEntity.ok(Map.of(
                "attemptId", attempt.getId(),
                "testId", attempt.getTest().getId(),
                "status", attempt.getStatus()
            ));
        } catch (RuntimeException e) {
            System.err.println("[TestAttemptController] Start Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Internal server error during initialization"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyAttempts(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        String email = auth.getName();

        System.out.println("CONTROLLER: routing to service layer");

        return ResponseEntity.ok(
            attemptService.getUserAttempts(email)
        );
    }


    // ✅ GET SINGLE ATTEMPT
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

    // ✅ SUBMIT
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitAttempt(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> answers,
                                           Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            if (answers == null) {
                answers = new HashMap<>();
            }

            TestAttempt submitted = attemptService.submitAttempt(id, answers);

            return ResponseEntity.ok(
                    attemptService.mapToResponse(submitted)
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message", e.getMessage(),
                            "type", e.getClass().getSimpleName()
                    )
            );
        }
    }

    // ✅ SAVE PROGRESS (FOR RESUME)
    @PostMapping("/{id}/save-progress")
    public ResponseEntity<?> saveProgress(@PathVariable Long id,
                                          @RequestBody Map<String, String> answers,
                                          Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        
        try {
            TestAttempt attempt = attemptService.saveProgress(id, answers);
            return ResponseEntity.ok(Map.of("message", "Progress saved", "attemptId", attempt.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ✅ DELETE ATTEMPT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttempt(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        try {
            TestAttempt attempt = testAttemptRepository.findById(id).orElse(null);
            if (attempt == null) {
                return ResponseEntity.notFound().build();
            }

            // 1. Block deleting MAIN test attempts
            if ("MAIN".equalsIgnoreCase(attempt.getTest().getTestType())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Main test results cannot be deleted."));
            }

            // 2. Ownership check: Only owner or admin can delete
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
            String userEmail = auth.getName();
            String ownerEmail = attempt.getUser() != null ? attempt.getUser().getEmail() : attempt.getUserEmail();

            if (!isAdmin && (ownerEmail == null || !ownerEmail.equalsIgnoreCase(userEmail))) {
                return ResponseEntity.status(403).body(Map.of("message", "Access Denied: You do not own this attempt."));
            }

            testAttemptRepository.delete(attempt);
            return ResponseEntity.ok(Map.of("message", "Attempt deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}