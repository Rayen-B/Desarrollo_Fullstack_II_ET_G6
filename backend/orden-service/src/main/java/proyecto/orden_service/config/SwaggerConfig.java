package proyecto.orden_service.config;

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
                        .title("API Órdenes - Papita Dulce")
                        .version("1.0")
                        .description("Órdenes de compra, boletas, estados y reportes de ventas. Usa Catálogo (OpenFeign + Eureka) para los precios y el stock. "
                                + "Todas las rutas reciben los headers X-User-Id y X-User-Rol que pone el API Gateway al validar el token."));
    }
}
