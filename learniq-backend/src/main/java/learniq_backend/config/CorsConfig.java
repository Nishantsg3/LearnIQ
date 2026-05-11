package learniq_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed Origins
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://learniq-frontend.onrender.com"
        ));
        
        // Allowed Methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // Allowed Headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow Credentials
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply configuration to all paths
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
