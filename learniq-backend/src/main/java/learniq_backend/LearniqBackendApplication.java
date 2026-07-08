package learniq_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.data.jpa.repository.config.EnableJpaAuditing
public class LearniqBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearniqBackendApplication.class, args);
	}
}
