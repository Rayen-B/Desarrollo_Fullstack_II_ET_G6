package proyecto.nutricion_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class NutricionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NutricionServiceApplication.class, args);
	}
}
