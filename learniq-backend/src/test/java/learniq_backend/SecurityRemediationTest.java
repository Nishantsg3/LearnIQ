package learniq_backend;

import learniq_backend.controller.AdminController;
import learniq_backend.controller.AuthController;
import learniq_backend.controller.TestAttemptController;
import learniq_backend.dto.LoginRequest;
import learniq_backend.dto.RegisterRequest;
import learniq_backend.dto.TestAttemptResponse;
import learniq_backend.model.*;
import learniq_backend.repository.*;
import learniq_backend.security.JwtUtil;
import learniq_backend.service.AttemptService;
import learniq_backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.http.MediaType;

@ExtendWith(MockitoExtension.class)
public class SecurityRemediationTest {

    @Mock
    private TestAttemptRepository testAttemptRepository;
    @Mock
    private AttemptAnswerRepository attemptAnswerRepository;
    @Mock
    private TestRepository testRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private JwtUtil jwtUtil;

    private PasswordEncoder passwordEncoder;
    private AttemptService attemptService;
    private TestAttemptController testAttemptController;
    private AdminController adminController;
    private AuthController authController;
    private MockMvc mockMvc;

    private User studentA;
    private User studentB;
    private User adminUser;
    private learniq_backend.model.Test sampleTest;
    private Question question1;
    private Question question2;
    private TestAttempt inProgressAttempt;
    private TestAttempt submittedAttempt;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();

        attemptService = new AttemptService(
                testAttemptRepository,
                attemptAnswerRepository,
                testRepository,
                userRepository,
                questionRepository,
                emailService
        );

        testAttemptController = new TestAttemptController(
                attemptService,
                testAttemptRepository,
                userRepository
        );

        adminController = new AdminController(
                null,
                testRepository,
                questionRepository,
                userRepository,
                passwordEncoder,
                testAttemptRepository,
                attemptAnswerRepository,
                null
        );

        authController = new AuthController(
                userRepository,
                jwtUtil,
                emailService,
                passwordEncoder
        );

        mockMvc = MockMvcBuilders.standaloneSetup(testAttemptController).build();

        // Seed users
        studentA = new User();
        studentA.setId(1L);
        studentA.setName("Alice Student");
        studentA.setEmail("alice@learniq.org");
        studentA.setPassword(passwordEncoder.encode("SecretAlice123!"));
        studentA.setRole(User.Role.STUDENT);
        studentA.setVerified(true);

        studentB = new User();
        studentB.setId(2L);
        studentB.setName("Bob Student");
        studentB.setEmail("bob@learniq.org");
        studentB.setPassword(passwordEncoder.encode("SecretBob123!"));
        studentB.setRole(User.Role.STUDENT);
        studentB.setVerified(true);

        adminUser = new User();
        adminUser.setId(99L);
        adminUser.setName("Admin Sarah");
        adminUser.setEmail("admin@learniq.org");
        adminUser.setPassword(passwordEncoder.encode("AdminPass123!"));
        adminUser.setRole(User.Role.ADMIN);
        adminUser.setVerified(true);

        // Seed test & questions
        sampleTest = new learniq_backend.model.Test();
        sampleTest.setId(10L);
        sampleTest.setTitle("Java Security and Concurrency");
        sampleTest.setCategory("Java");
        sampleTest.setTestType("MAIN");
        sampleTest.setDurationMinutes(30);

        question1 = new Question();
        question1.setId(101L);
        question1.setQuestionText("What is the purpose of volatile keyword?");
        question1.setOptionA("Memory visibility");
        question1.setOptionB("Serialization");
        question1.setOptionC("Garbage collection");
        question1.setOptionD("Type safety");
        question1.setCorrectAnswer("A");

        question2 = new Question();
        question2.setId(102L);
        question2.setQuestionText("Which collection is synchronized?");
        question2.setOptionA("ArrayList");
        question2.setOptionB("ConcurrentHashMap");
        question2.setOptionC("HashSet");
        question2.setOptionD("LinkedList");
        question2.setCorrectAnswer("B");

        // Seed attempts
        inProgressAttempt = new TestAttempt();
        inProgressAttempt.setId(501L);
        inProgressAttempt.setUser(studentA);
        inProgressAttempt.setUserEmail(studentA.getEmail());
        inProgressAttempt.setUserName(studentA.getName());
        inProgressAttempt.setTest(sampleTest);
        inProgressAttempt.setStatus(TestAttempt.Status.IN_PROGRESS);
        inProgressAttempt.setSubmitted(false);
        inProgressAttempt.setScorePercent(-1);
        inProgressAttempt.setAnswers(new ArrayList<>());

        AttemptAnswer ans1 = new AttemptAnswer();
        ans1.setId(1L);
        ans1.setAttempt(inProgressAttempt);
        ans1.setQuestionId(101L);
        ans1.setSelectedOption("A");
        ans1.setCorrectOption("A");
        ans1.setCorrect(true);
        inProgressAttempt.getAnswers().add(ans1);

        submittedAttempt = new TestAttempt();
        submittedAttempt.setId(502L);
        submittedAttempt.setUser(studentA);
        submittedAttempt.setUserEmail(studentA.getEmail());
        submittedAttempt.setUserName(studentA.getName());
        submittedAttempt.setTest(sampleTest);
        submittedAttempt.setStatus(TestAttempt.Status.SUBMITTED);
        submittedAttempt.setSubmitted(true);
        submittedAttempt.setScorePercent(100);
        submittedAttempt.setCorrectCount(2);
        submittedAttempt.setWrongCount(0);
        submittedAttempt.setAnswers(new ArrayList<>());

        AttemptAnswer sAns1 = new AttemptAnswer();
        sAns1.setId(11L);
        sAns1.setAttempt(submittedAttempt);
        sAns1.setQuestionId(101L);
        sAns1.setSelectedOption("A");
        sAns1.setCorrectOption("A");
        sAns1.setCorrect(true);

        AttemptAnswer sAns2 = new AttemptAnswer();
        sAns2.setId(12L);
        sAns2.setAttempt(submittedAttempt);
        sAns2.setQuestionId(102L);
        sAns2.setSelectedOption("B");
        sAns2.setCorrectOption("B");
        sAns2.setCorrect(true);

        submittedAttempt.getAnswers().add(sAns1);
        submittedAttempt.getAnswers().add(sAns2);
    }

    private Authentication createAuth(String email, String role) {
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 1: In-progress attempt response NEVER contains correct answers or indicators
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-1: In-progress attempt response masks correctAnswer and correctness indicators")
    void testInProgressAttemptMasksAnswerKey() {
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));

        TestAttemptResponse response = attemptService.mapToResponse(inProgressAttempt);

        assertNotNull(response);
        assertEquals("IN_PROGRESS", response.getStatus());
        assertFalse(response.isSubmitted());
        assertEquals(-1, response.getScorePercent());
        assertEquals(0, response.getCorrectCount());
        assertEquals(0, response.getWrongCount());

        assertNotNull(response.getAnswerReviews());
        assertEquals(2, response.getAnswerReviews().size());

        for (TestAttemptResponse.AnswerReview review : response.getAnswerReviews()) {
            assertNull(review.getCorrectAnswer(), "correctAnswer MUST be null during in-progress attempt");
            assertFalse(review.isCorrect(), "isCorrect indicator MUST be false during in-progress attempt");
        }

        // Student's previously selected option MUST be preserved for resuming
        TestAttemptResponse.AnswerReview q1Review = response.getAnswerReviews().stream()
                .filter(r -> r.getQuestionId().equals(101L))
                .findFirst().orElseThrow();
        assertEquals("A", q1Review.getSelectedOption(), "Selected option must be preserved for exam resume");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 2: Owning student can retrieve and save their own attempt
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-2: Owning student can retrieve attempt and save progress")
    void testOwningStudentAccess() {
        when(testAttemptRepository.findById(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));
        when(testAttemptRepository.findByIdWithLock(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(attemptAnswerRepository.findByAttemptId(501L)).thenReturn(inProgressAttempt.getAnswers());

        Authentication authAlice = createAuth("alice@learniq.org", "STUDENT");

        // GET attempt
        ResponseEntity<?> getRes = testAttemptController.getAttemptById(501L, authAlice);
        assertEquals(HttpStatus.OK, getRes.getStatusCode());
        TestAttemptResponse body = (TestAttemptResponse) getRes.getBody();
        assertNotNull(body);
        assertEquals(501L, body.getId());

        // SAVE progress
        Map<String, String> answers = Map.of("102", "B");
        ResponseEntity<?> saveRes = testAttemptController.saveProgress(501L, answers, authAlice);
        assertEquals(HttpStatus.OK, saveRes.getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 3: Student A cannot read, modify, or submit Student B's attempt (IDOR/BOLA)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-3: Student B is blocked (403 Forbidden) from accessing Student A's attempt")
    void testCrossStudentAccessBlocked() {
        when(testAttemptRepository.findById(501L)).thenReturn(Optional.of(inProgressAttempt));

        Authentication authBob = createAuth("bob@learniq.org", "STUDENT");

        // Bob tries to GET Alice's attempt
        ResponseEntity<?> getRes = testAttemptController.getAttemptById(501L, authBob);
        assertEquals(HttpStatus.FORBIDDEN, getRes.getStatusCode());

        // Bob tries to SAVE progress on Alice's attempt
        ResponseEntity<?> saveRes = testAttemptController.saveProgress(501L, Map.of("101", "C"), authBob);
        assertEquals(HttpStatus.FORBIDDEN, saveRes.getStatusCode());

        // Bob tries to SUBMIT Alice's attempt
        ResponseEntity<?> submitRes = testAttemptController.submitAttempt(501L, Map.of("101", "C"), authBob);
        assertEquals(HttpStatus.FORBIDDEN, submitRes.getStatusCode());

        // Bob tries to DELETE Alice's attempt
        ResponseEntity<?> deleteRes = testAttemptController.deleteAttempt(501L, authBob);
        assertEquals(HttpStatus.FORBIDDEN, deleteRes.getStatusCode());

        // Verify no progress or submission changes occurred
        verify(attemptAnswerRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 4: Unauthorized user (unauthenticated / missing token) cannot access attempt endpoints
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-4: Unauthenticated request returns 401 Unauthorized")
    void testUnauthenticatedAccessBlocked() {
        ResponseEntity<?> getRes = testAttemptController.getAttemptById(501L, null);
        assertEquals(HttpStatus.UNAUTHORIZED, getRes.getStatusCode());

        ResponseEntity<?> saveRes = testAttemptController.saveProgress(501L, Map.of(), null);
        assertEquals(HttpStatus.UNAUTHORIZED, saveRes.getStatusCode());

        ResponseEntity<?> submitRes = testAttemptController.submitAttempt(501L, Map.of(), null);
        assertEquals(HttpStatus.UNAUTHORIZED, submitRes.getStatusCode());

        ResponseEntity<?> deleteRes = testAttemptController.deleteAttempt(501L, null);
        assertEquals(HttpStatus.UNAUTHORIZED, deleteRes.getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 5: Authorized admin retains intended administrative access
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-5: Administrator has legitimate access to view attempt metadata")
    void testAdminAuthorizedAccess() {
        when(testAttemptRepository.findById(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));

        Authentication authAdmin = createAuth("admin@learniq.org", "ADMIN");

        ResponseEntity<?> getRes = testAttemptController.getAttemptById(501L, authAdmin);
        assertEquals(HttpStatus.OK, getRes.getStatusCode());
        TestAttemptResponse body = (TestAttemptResponse) getRes.getBody();
        assertNotNull(body);
        assertEquals(501L, body.getId());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 6: Submitted attempts still support legitimate results and answer review
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-6: Submitted attempt response provides full answer key and review analytics")
    void testSubmittedAttemptProvidesFullReview() {
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));

        TestAttemptResponse response = attemptService.mapToResponse(submittedAttempt);

        assertNotNull(response);
        assertEquals("SUBMITTED", response.getStatus());
        assertTrue(response.isSubmitted());
        assertEquals(100, response.getScorePercent());
        assertEquals(2, response.getCorrectCount());
        assertEquals(0, response.getWrongCount());

        assertNotNull(response.getAnswerReviews());
        assertEquals(2, response.getAnswerReviews().size());

        TestAttemptResponse.AnswerReview rev1 = response.getAnswerReviews().stream()
                .filter(r -> r.getQuestionId().equals(101L))
                .findFirst().orElseThrow();
        assertEquals("A", rev1.getCorrectAnswer(), "Submitted review must expose correct answer");
        assertEquals("A", rev1.getSelectedOption());
        assertTrue(rev1.isCorrect(), "Submitted review must indicate correct status");

        TestAttemptResponse.AnswerReview rev2 = response.getAnswerReviews().stream()
                .filter(r -> r.getQuestionId().equals(102L))
                .findFirst().orElseThrow();
        assertEquals("B", rev2.getCorrectAnswer());
        assertEquals("B", rev2.getSelectedOption());
        assertTrue(rev2.isCorrect());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 7: Newly created admin passwords are BCrypt hashed and authenticate correctly
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P1-1: Newly created administrator passwords are BCrypt hashed and authenticate")
    void testAdminCreationPasswordHashingAndLogin() {
        RegisterRequest createReq = new RegisterRequest("New Admin", "newadmin@learniq.org", "SecurePassword987!");

        when(userRepository.existsByEmail("newadmin@learniq.org")).thenReturn(false);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(userCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> createRes = adminController.createAdmin(createReq);
        assertEquals(HttpStatus.OK, createRes.getStatusCode());

        User savedAdmin = userCaptor.getValue();
        assertNotNull(savedAdmin);
        assertEquals("newadmin@learniq.org", savedAdmin.getEmail());
        assertEquals(User.Role.ADMIN, savedAdmin.getRole());
        assertTrue(savedAdmin.isVerified());

        // Password MUST be BCrypt encoded (starts with $2a$ or $2b$, 60 chars)
        String encodedPassword = savedAdmin.getPassword();
        assertNotEquals("SecurePassword987!", encodedPassword, "Password MUST NOT be stored in plain text");
        assertTrue(encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$"), "Password MUST be BCrypt hashed");
        assertTrue(passwordEncoder.matches("SecurePassword987!", encodedPassword));

        // Test Authentication through AuthController
        when(userRepository.findByEmail("newadmin@learniq.org")).thenReturn(Optional.of(savedAdmin));
        when(jwtUtil.generateToken("newadmin@learniq.org", "ADMIN")).thenReturn("mock-admin-jwt-token");

        LoginRequest loginReq = new LoginRequest("newadmin@learniq.org", "SecurePassword987!");
        ResponseEntity<?> loginRes = authController.adminLogin(loginReq);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> loginBody = (Map<String, Object>) loginRes.getBody();
        assertNotNull(loginBody);
        assertEquals("mock-admin-jwt-token", loginBody.get("token"));
        assertEquals("ADMIN", loginBody.get("role"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 8: Legacy plaintext admin passwords safely upgrade to BCrypt on successful login
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P1-2: Legacy plaintext admin passwords safely upgrade to BCrypt upon login")
    void testLegacyPlaintextAdminPasswordUpgrade() {
        User legacyAdmin = new User();
        legacyAdmin.setId(88L);
        legacyAdmin.setName("Legacy Admin");
        legacyAdmin.setEmail("legacyadmin@learniq.org");
        legacyAdmin.setPassword("PlaintextPassword123"); // Simulating old pre-fix record
        legacyAdmin.setRole(User.Role.ADMIN);
        legacyAdmin.setVerified(true);

        when(userRepository.findByEmail("legacyadmin@learniq.org")).thenReturn(Optional.of(legacyAdmin));
        when(jwtUtil.generateToken("legacyadmin@learniq.org", "ADMIN")).thenReturn("mock-legacy-jwt");

        LoginRequest loginReq = new LoginRequest("legacyadmin@learniq.org", "PlaintextPassword123");
        ResponseEntity<?> loginRes = authController.adminLogin(loginReq);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());

        // Verify password was upgraded to BCrypt in memory and saved
        verify(userRepository, times(1)).save(legacyAdmin);
        assertTrue(legacyAdmin.getPassword().startsWith("$2a$") || legacyAdmin.getPassword().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches("PlaintextPassword123", legacyAdmin.getPassword()));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 9: Existing exam submission, scoring, and autosave integrity
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-7: Exam submission calculates correct scores and transitions attempt to SUBMITTED")
    void testExamSubmissionAndScoringIntegrity() {
        when(testAttemptRepository.findByIdWithLock(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));
        when(testAttemptRepository.save(any(TestAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        // Submit attempt with answers: Q101 -> "A" (correct), Q102 -> "A" (wrong, correct is B)
        Map<String, String> submittedAnswers = Map.of("101", "A", "102", "A");
        TestAttempt finalized = attemptService.submitAttempt(501L, submittedAnswers);

        assertNotNull(finalized);
        assertEquals(TestAttempt.Status.SUBMITTED, finalized.getStatus());
        assertTrue(finalized.isSubmitted());
        assertNotNull(finalized.getSubmittedAt());

        // Score: 1 of 2 correct = 50%
        assertEquals(2, finalized.getTotalQuestions());
        assertEquals(1, finalized.getCorrectCount());
        assertEquals(1, finalized.getWrongCount());
        assertEquals(2, finalized.getAttemptedCount());
        assertEquals(50, finalized.getScorePercent());

        // Verify post-submission mapToResponse now includes the answer key for legitimate review
        TestAttemptResponse reviewResponse = attemptService.mapToResponse(finalized);
        assertEquals(50, reviewResponse.getScorePercent());
        assertNotNull(reviewResponse.getAnswerReviews());

        TestAttemptResponse.AnswerReview q1 = reviewResponse.getAnswerReviews().stream()
                .filter(r -> r.getQuestionId().equals(101L)).findFirst().orElseThrow();
        assertEquals("A", q1.getCorrectAnswer());
        assertEquals("A", q1.getSelectedOption());
        assertTrue(q1.isCorrect());

        TestAttemptResponse.AnswerReview q2 = reviewResponse.getAnswerReviews().stream()
                .filter(r -> r.getQuestionId().equals(102L)).findFirst().orElseThrow();
        assertEquals("B", q2.getCorrectAnswer());
        assertEquals("A", q2.getSelectedOption());
        assertFalse(q2.isCorrect());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 10: Submission idempotency prevents duplicate evaluation or score mutation
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-8: Duplicate submission on already submitted attempt is idempotent")
    void testSubmissionIdempotency() {
        when(testAttemptRepository.findByIdWithLock(502L)).thenReturn(Optional.of(submittedAttempt));

        // Attempting to submit an already submitted attempt
        TestAttempt result = attemptService.submitAttempt(502L, Map.of("101", "D"));

        // Must remain unchanged at 100% score
        assertEquals(TestAttempt.Status.SUBMITTED, result.getStatus());
        assertTrue(result.isSubmitted());
        assertEquals(100, result.getScorePercent());
        assertEquals(2, result.getCorrectCount());
        verify(testAttemptRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 11: Incorrect passwords return 401 Unauthorized
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P1-3: Incorrect passwords return 401 Unauthorized for both student and admin")
    void testIncorrectPasswordRejected() {
        when(userRepository.findByEmail("alice@learniq.org")).thenReturn(Optional.of(studentA));

        LoginRequest wrongPwReq = new LoginRequest("alice@learniq.org", "WrongPassword123!");
        ResponseEntity<?> response = authController.studentLogin(wrongPwReq);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());

        when(userRepository.findByEmail("admin@learniq.org")).thenReturn(Optional.of(adminUser));
        LoginRequest wrongAdminPwReq = new LoginRequest("admin@learniq.org", "WrongPassword123!");
        ResponseEntity<?> adminResponse = authController.adminLogin(wrongAdminPwReq);
        assertEquals(HttpStatus.UNAUTHORIZED, adminResponse.getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 12: Unknown hash formats (crypt/hex) are explicitly rejected and not upgraded
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P1-4: Unknown crypt and hex password hash formats are rejected")
    void testUnknownHashFormatRejected() {
        // User with unknown modular crypt format (e.g. argon2)
        User argon2User = new User();
        argon2User.setEmail("argon2user@learniq.org");
        argon2User.setPassword("$argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQ$i9w8...");
        argon2User.setRole(User.Role.STUDENT);
        argon2User.setVerified(true);

        when(userRepository.findByEmail("argon2user@learniq.org")).thenReturn(Optional.of(argon2User));

        // Attempting to log in with the hash string itself must be rejected
        LoginRequest req1 = new LoginRequest("argon2user@learniq.org", "$argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQ$i9w8...");
        ResponseEntity<?> res1 = authController.studentLogin(req1);
        assertEquals(HttpStatus.UNAUTHORIZED, res1.getStatusCode());

        // User with SHA-256 64-char hex hash
        User hexUser = new User();
        hexUser.setEmail("hexuser@learniq.org");
        hexUser.setPassword("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        hexUser.setRole(User.Role.STUDENT);
        hexUser.setVerified(true);

        when(userRepository.findByEmail("hexuser@learniq.org")).thenReturn(Optional.of(hexUser));

        LoginRequest req2 = new LoginRequest("hexuser@learniq.org", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        ResponseEntity<?> res2 = authController.studentLogin(req2);
        assertEquals(HttpStatus.UNAUTHORIZED, res2.getStatusCode());

        // Verify neither account had its password upgraded
        verify(userRepository, never()).save(argon2User);
        verify(userRepository, never()).save(hexUser);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 13: Ordinary student registration hashes with BCrypt, and authenticates
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P1-5: Ordinary student registration hashes with BCrypt and authenticates normally")
    void testOrdinaryStudentRegistrationAndBCryptLogin() {
        RegisterRequest regReq = new RegisterRequest("Charlie Student", "charlie@learniq.org", "CharlieSecurePass123!");

        when(userRepository.existsByEmail("charlie@learniq.org")).thenReturn(false);
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> regRes = authController.register(regReq);
        assertEquals(HttpStatus.OK, regRes.getStatusCode());

        User registered = captor.getValue();
        assertNotNull(registered);
        assertTrue(registered.getPassword().startsWith("$2a$") || registered.getPassword().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches("CharlieSecurePass123!", registered.getPassword()));

        // Authenticate with BCrypt
        registered.setVerified(true);
        when(userRepository.findByEmail("charlie@learniq.org")).thenReturn(Optional.of(registered));
        when(jwtUtil.generateToken("charlie@learniq.org", "STUDENT")).thenReturn("mock-student-jwt");

        LoginRequest loginReq = new LoginRequest("charlie@learniq.org", "CharlieSecurePass123!");
        ResponseEntity<?> loginRes = authController.studentLogin(loginReq);
        assertEquals(HttpStatus.OK, loginRes.getStatusCode());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST 14: Spring MVC MockMvc integration test for attempt authorization boundaries
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("P0-9: MockMvc HTTP integration verifies 401, 403, and 200 authorization boundaries")
    void testSpringMvcMockMvcAuthorization() throws Exception {
        when(testAttemptRepository.findById(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(questionRepository.findByTestId(sampleTest.getId())).thenReturn(List.of(question1, question2));
        when(testAttemptRepository.findByIdWithLock(501L)).thenReturn(Optional.of(inProgressAttempt));
        when(attemptAnswerRepository.findByAttemptId(501L)).thenReturn(inProgressAttempt.getAnswers());

        Authentication authAlice = createAuth("alice@learniq.org", "STUDENT");
        Authentication authBob = createAuth("bob@learniq.org", "STUDENT");
        Authentication authAdmin = createAuth("admin@learniq.org", "ADMIN");

        // 1. Anonymous (unauthenticated) -> 401
        mockMvc.perform(get("/api/v1/attempts/501"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/attempts/501/save-progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"101\": \"A\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/attempts/501/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/attempts/501"))
                .andExpect(status().isUnauthorized());

        // 2. Cross-student (Bob attacking Alice's attempt) -> 403
        mockMvc.perform(get("/api/v1/attempts/501").principal(authBob))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access Denied: You do not own this attempt."));

        mockMvc.perform(post("/api/v1/attempts/501/save-progress")
                        .principal(authBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"101\": \"B\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/attempts/501/submit")
                        .principal(authBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/attempts/501").principal(authBob))
                .andExpect(status().isForbidden());

        // 3. Owning student (Alice accessing her own attempt) -> 200
        mockMvc.perform(get("/api/v1/attempts/501").principal(authAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(501))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.scorePercent").value(-1))
                .andExpect(jsonPath("$.answerReviews[0].correctAnswer").doesNotExist());

        mockMvc.perform(post("/api/v1/attempts/501/save-progress")
                        .principal(authAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"101\": \"A\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Progress saved"));

        // 4. Admin accessing attempt -> 200
        mockMvc.perform(get("/api/v1/attempts/501").principal(authAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(501));
    }
}
