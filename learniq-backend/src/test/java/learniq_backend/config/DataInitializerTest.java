package learniq_backend.config;

import learniq_backend.model.User;
import learniq_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Should skip initialization when admin email is null or empty")
    void shouldSkipWhenEmailNullOrEmpty() throws Exception {
        dataInitializer.setAdminCredentials(null, "SecureAdminPassword!2026", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());

        dataInitializer.setAdminCredentials("   ", "SecureAdminPassword!2026", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should skip initialization when admin email is placeholder 'none' (case-insensitive)")
    void shouldSkipWhenEmailIsNonePlaceholder() throws Exception {
        dataInitializer.setAdminCredentials("none", "SecureAdminPassword!2026", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());

        dataInitializer.setAdminCredentials(" NONE ", "SecureAdminPassword!2026", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should skip initialization when admin password is null or empty")
    void shouldSkipWhenPasswordNullOrEmpty() throws Exception {
        dataInitializer.setAdminCredentials("admin@learniq.com", null, "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());

        dataInitializer.setAdminCredentials("admin@learniq.com", "   ", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should skip initialization when admin password is placeholder 'none' (case-insensitive)")
    void shouldSkipWhenPasswordIsNonePlaceholder() throws Exception {
        dataInitializer.setAdminCredentials("admin@learniq.com", "none", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());

        dataInitializer.setAdminCredentials("admin@learniq.com", " None ", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());

        dataInitializer.setAdminCredentials("admin@learniq.com", "NONE", "Admin");
        dataInitializer.run();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create verified admin with BCrypt encoded password when credentials are valid")
    void shouldCreateAdminWhenCredentialsValid() throws Exception {
        when(userRepository.findByEmail("admin@learniq.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ValidAdminPass#2026")).thenReturn("$2a$10$hashedAdminPasswordToken");

        dataInitializer.setAdminCredentials("admin@learniq.com", "ValidAdminPass#2026", "SysAdmin");
        dataInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User saved = userCaptor.getValue();
        assertEquals("admin@learniq.com", saved.getEmail());
        assertEquals("SysAdmin", saved.getName());
        assertEquals("$2a$10$hashedAdminPasswordToken", saved.getPassword());
        assertEquals(User.Role.ADMIN, saved.getRole());
        assertTrue(saved.isVerified());
    }

    @Test
    @DisplayName("Should not duplicate or re-seed when admin already exists with BCrypt password")
    void shouldNotRecreateWhenAdminAlreadyExists() throws Exception {
        User existingAdmin = new User();
        existingAdmin.setEmail("admin@learniq.com");
        existingAdmin.setPassword("$2a$10$existingBcryptHash");
        existingAdmin.setRole(User.Role.ADMIN);

        when(userRepository.findByEmail("admin@learniq.com")).thenReturn(Optional.of(existingAdmin));

        dataInitializer.setAdminCredentials("admin@learniq.com", "ValidAdminPass#2026", "SysAdmin");
        dataInitializer.run();

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Should upgrade legacy plaintext password to BCrypt hash if matching")
    void shouldUpgradePlaintextPasswordToBcrypt() throws Exception {
        User legacyAdmin = new User();
        legacyAdmin.setEmail("admin@learniq.com");
        legacyAdmin.setPassword("PlaintextPassword");
        legacyAdmin.setRole(User.Role.ADMIN);

        when(userRepository.findByEmail("admin@learniq.com")).thenReturn(Optional.of(legacyAdmin));
        when(passwordEncoder.encode("PlaintextPassword")).thenReturn("$2a$10$newlyHashedBcrypt");

        dataInitializer.setAdminCredentials("admin@learniq.com", "PlaintextPassword", "SysAdmin");
        dataInitializer.run();

        verify(userRepository, times(1)).save(legacyAdmin);
        assertEquals("$2a$10$newlyHashedBcrypt", legacyAdmin.getPassword());
    }
}
