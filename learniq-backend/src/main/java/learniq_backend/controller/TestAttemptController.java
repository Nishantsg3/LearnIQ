package learniq_backend.controller;

import learniq_backend.dto.StartAttemptRequest;
import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.TestAttempt;
import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import learniq_backend.service.AttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/v1/attempts")
@RequiredArgsConstructor
public class TestAttemptController {

    private final AttemptService attemptService;
    private final learniq_backend.repository.TestAttemptRepository testAttemptRepository;
    private final UserRepository userRepository;

    private boolean isAuthorizedForAttempt(TestAttempt attempt, Authentication auth) {
        if (attempt == null || auth == null) return false;
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        if (isAdmin) return true;
        String userEmail = auth.getName();
        String ownerEmail = (attempt.getUser() != null && attempt.getUser().getEmail() != null)
                ? attempt.getUser().getEmail() : attempt.getUserEmail();
        return ownerEmail != null && ownerEmail.equalsIgnoreCase(userEmail);
    }

    // ✅ START ATTEMPT
    @PostMapping("/start")
    public ResponseEntity<?> startAttempt(@RequestBody StartAttemptRequest request,
                                          Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        if (request == null || request.getTestId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Test ID is required"));
        }

        try {
            String userEmail = authentication.getName();
            TestAttempt attempt = attemptService.startOrResumeAttempt(userEmail, request.getTestId());
            
            // If already submitted, block re-attempt and return existing attempt ID with 409 CONFLICT
            if (attempt.getStatus() == TestAttempt.Status.SUBMITTED || attempt.isSubmitted()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "You have already completed this test.",
                    "attemptId", attempt.getId()
                ));
            }

            return ResponseEntity.ok(Map.of(
                "attemptId", attempt.getId(),
                "testId", attempt.getTest() != null ? attempt.getTest().getId() : request.getTestId(),
                "status", attempt.getStatus() != null ? attempt.getStatus().name() : "IN_PROGRESS"
            ));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RuntimeException e) {
            System.err.println("[TestAttemptController] Start Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", sanitizeErrorMessage(e, "Failed to start assessment")));
        } catch (Exception e) {
            System.err.println("[TestAttemptController] Internal Error during start: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Internal server error during initialization"));
        }
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyAttempts(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
        }
        String email = auth.getName();

        System.out.println("CONTROLLER: routing to service layer");

        try {
            List<TestAttemptResponse> attempts = attemptService.getUserAttempts(email);
            return ResponseEntity.ok(attempts != null ? attempts : Collections.emptyList());
        } catch (Exception e) {
            System.err.println("[TestAttemptController] Failed to fetch attempts for " + email + ": " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }


    // ✅ GET SINGLE ATTEMPT
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAttemptById(@PathVariable Long id,
                                           Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Optional<TestAttempt> attemptOpt = testAttemptRepository.findById(id);
        if (attemptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Attempt not found"));
        }

        TestAttempt attempt = attemptOpt.get();
        if (!isAuthorizedForAttempt(attempt, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You do not own this attempt."));
        }

        try {
            System.out.println("[DIAGNOSTIC] Results fetch: attemptId=" + id + ", userEmail=" + authentication.getName() + ", timestamp=" + java.time.LocalDateTime.now());
            TestAttemptResponse response = attemptService.mapToResponse(attempt);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("[TestAttemptController] Fetch Attempt Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", sanitizeErrorMessage(e, "Failed to retrieve attempt results.")));
        }
    }

    // ✅ SUBMIT
    @PostMapping("/{id}/submit")
    @Transactional
    public ResponseEntity<?> submitAttempt(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> answers,
                                           Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        Optional<TestAttempt> attemptOpt = testAttemptRepository.findById(id);
        if (attemptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Attempt not found"));
        }

        TestAttempt attempt = attemptOpt.get();
        if (!isAuthorizedForAttempt(attempt, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You do not own this attempt."));
        }

        try {
            if (answers == null) {
                answers = new HashMap<>();
            }

            TestAttempt submitted = attemptService.submitAttempt(id, answers);

            return ResponseEntity.ok(
                    attemptService.mapToResponse(submitted)
            );

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[TestAttemptController] Submit Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("message", sanitizeErrorMessage(e, "Failed to submit attempt. Please try again."))
            );
        }
    }

    // ✅ SAVE PROGRESS (FOR RESUME)
    @PostMapping("/{id}/save-progress")
    @Transactional
    public ResponseEntity<?> saveProgress(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> answers,
                                          Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        
        Optional<TestAttempt> attemptOpt = testAttemptRepository.findById(id);
        if (attemptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Attempt not found"));
        }

        TestAttempt attempt = attemptOpt.get();
        if (!isAuthorizedForAttempt(attempt, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You do not own this attempt."));
        }

        try {
            TestAttempt updated = attemptService.saveProgress(id, answers != null ? answers : Collections.emptyMap());
            return ResponseEntity.ok(Map.of("message", "Progress saved", "attemptId", updated.getId()));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[TestAttemptController] Save Progress Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", sanitizeErrorMessage(e, "Failed to save progress.")));
        }
    }

    // ✅ DELETE ATTEMPT
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteAttempt(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        try {
            Optional<TestAttempt> attemptOpt = testAttemptRepository.findById(id);
            if (attemptOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Attempt not found"));
            }
            TestAttempt attempt = attemptOpt.get();

            // 1. Ownership check: Only owner or admin can delete
            if (!isAuthorizedForAttempt(attempt, auth)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You do not own this attempt."));
            }

            // 2. Block deleting MAIN test attempts
            String testType = (attempt.getTest() != null && attempt.getTest().getTestType() != null)
                    ? attempt.getTest().getTestType() : attempt.getTestType();
            if ("MAIN".equalsIgnoreCase(testType)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Main test results cannot be deleted."));
            }

            testAttemptRepository.delete(attempt);
            return ResponseEntity.ok(Map.of("message", "Attempt deleted"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[TestAttemptController] Delete Attempt Failure: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", sanitizeErrorMessage(e, "Failed to delete attempt.")));
        }
    }

    private String sanitizeErrorMessage(Exception e, String defaultMessage) {
        if (e instanceof ResponseStatusException rse) {
            return rse.getReason() != null ? rse.getReason() : defaultMessage;
        }
        if (e instanceof org.springframework.dao.DataAccessException ||
            e instanceof jakarta.persistence.PersistenceException ||
            e instanceof java.sql.SQLException) {
            return "A database error occurred. Please try again later.";
        }
        String msg = e.getMessage();
        if (msg == null || msg.isBlank() || msg.contains("SQL") || msg.contains("table") || msg.contains("hibernate") || msg.contains("jdbc") || msg.contains("database")) {
            return defaultMessage;
        }
        return msg;
    }
}