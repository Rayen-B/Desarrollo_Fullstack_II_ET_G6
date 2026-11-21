package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {

    @Schema(description = "Correo o nombre de usuario", example = "admin")
    @NotBlank(message = "Ingresa tu correo o nombre de usuario")
    private String identificador;

    @Schema(example = "admin")
    @NotBlank(message = "Ingresa tu contraseña")
    private String password;
}
