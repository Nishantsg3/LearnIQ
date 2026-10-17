package learniq_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Preflight OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // PUBLIC ENDPOINTS
                        .requestMatchers("/", "/api/v1/health", "/api/v1/auth/**").permitAll()

                        // TESTS
                        .requestMatchers(HttpMethod.GET, "/api/v1/tests", "/api/v1/tests/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/tests", "/api/v1/tests/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/tests", "/api/v1/tests/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tests", "/api/v1/tests/**").hasRole("ADMIN")

                        // QUESTIONS - STUDENT ACCESS (ONLY FOR ACTIVE TEST ATTEMPTS)
                        .requestMatchers(HttpMethod.GET, "/api/v1/questions/test/*/attempt", "/api/v1/questions/test/*/time").hasAnyRole("STUDENT", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/questions/test/*/start-attempt", "/api/v1/questions/test/*/submit", "/api/v1/questions/test/*/abandon").hasAnyRole("STUDENT", "ADMIN")

                        // QUESTIONS - ADMIN ACCESS (BANK, CREATION, NUCLEAR WIPE, EDIT, DELETE)
                        .requestMatchers("/api/v1/questions/**").hasRole("ADMIN")

                        // PRESETS (TEMPLATES IMPORT - ADMIN ONLY)
                        .requestMatchers("/api/v1/presets/**").hasRole("ADMIN")

                        // 🔥 ATTEMPTS (ALLOW STUDENT & ADMIN ACCESS)
                        .requestMatchers("/api/v1/attempts/**").hasAnyRole("STUDENT", "ADMIN")

                        // ADMIN
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}