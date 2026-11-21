package proyecto.catalogo_service.config;

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
                        .title("API Catálogo e Inventario - Papita Dulce")
                        .version("1.0")
                        .description("Productos, categorías, insumos, recetas, stock (vitrina + preparables) y fotos de productos."));
    }
}
