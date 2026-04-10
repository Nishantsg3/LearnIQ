package learniq_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        // Log the exception (in a real app, use a logger)
        System.err.println("DEBUG: Caught exception: " + ex.getClass().getName() + " - " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "message", ex.getMessage() != null ? ex.getMessage() : "Null message",
                    "exception", ex.getClass().getName()
                ));
    }
}
