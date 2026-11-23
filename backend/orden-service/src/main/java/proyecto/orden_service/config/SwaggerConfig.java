package proyecto.orden_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // "/" = el mismo origen desde donde se abre Swagger (directo o a través del API Gateway)
                .servers(List.of(new Server().url("/")))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .info(new Info()
                        .title("API Órdenes - Papita Dulce")
                        .version("1.0")
                        .description("Órdenes de compra, boletas, estados y reportes de ventas. Usa Catálogo (OpenFeign + Eureka) para los precios y el stock. "
                                + "Todas las rutas reciben los headers X-User-Id y X-User-Rol que pone el API Gateway al validar el token."));
    }
}
