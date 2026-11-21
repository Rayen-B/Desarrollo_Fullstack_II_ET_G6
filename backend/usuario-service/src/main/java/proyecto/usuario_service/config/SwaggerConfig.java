package proyecto.usuario_service.config;

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
                        .title("API Usuarios - Papita Dulce")
                        .version("1.0")
                        .description("Registro, inicio de sesión con JWT y refresh token, perfil y administración de usuarios. "
                                + "Las rutas de perfil y administración reciben los headers X-User-Id y X-User-Rol que pone el API Gateway al validar el token."));
    }
}
