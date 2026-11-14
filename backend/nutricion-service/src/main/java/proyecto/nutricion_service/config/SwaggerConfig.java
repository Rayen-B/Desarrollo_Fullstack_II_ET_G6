package proyecto.nutricion_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Nutrición - Papita Dulce")
                        .version("1.0")
                        .description("Cálculo de la información nutricional y los alérgenos de cada producto a partir de su receta, usando la API de Spoonacular."));
    }
}
