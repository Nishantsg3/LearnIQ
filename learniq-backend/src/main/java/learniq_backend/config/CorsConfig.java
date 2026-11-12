package learniq_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class CorsConfig {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        Set<String> origins = new LinkedHashSet<>();
        // Localhost development ports
        origins.add("http://localhost:5173");
        origins.add("http://localhost:3000");
        origins.add("http://localhost:4173");
        origins.add("http://127.0.0.1:5173");
        origins.add("http://127.0.0.1:3000");
        origins.add("http://127.0.0.1:4173");

        // Production frontend URL (without trailing slash)
        origins.add("https://learniq-frontend-7oyn.onrender.com");

        // Dynamic frontend URL from application properties / environment variable
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String url : frontendUrl.split(",")) {
                String cleanUrl = url.trim().replaceAll("/+$", "");
                if (!cleanUrl.isEmpty()) {
                    origins.add(cleanUrl);
                }
            }
        }

        // Allowed Origins
        configuration.setAllowedOrigins(new ArrayList<>(origins));
        
        // Allowed Methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
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
