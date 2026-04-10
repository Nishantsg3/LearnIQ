package learniq_backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // AUTH
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // TESTS
                        .requestMatchers(HttpMethod.GET, "/api/v1/tests/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/tests/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/tests/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tests/**").hasRole("ADMIN")

                        // QUESTIONS
                        .requestMatchers(HttpMethod.GET, "/api/v1/questions/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/questions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/questions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/questions/**").hasRole("ADMIN")

                        // 🔥 FIX: ATTEMPTS (ALLOW STUDENT FULL ACCESS)
                        .requestMatchers("/api/v1/attempts/**").hasRole("STUDENT")

                        // ADMIN
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://learniq-frontend.onrender.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}