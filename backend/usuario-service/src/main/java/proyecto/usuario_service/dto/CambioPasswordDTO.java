package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambioPasswordDTO {

    @Schema(example = "Cliente!2026")
    @NotBlank(message = "Ingresa tu contraseña actual")
    private String actual;

    @Schema(example = "Nueva#2026")
    @NotBlank(message = "Ingresa la contraseña nueva")
    @Size(max = 50, message = "La contraseña es demasiado larga")
    private String nueva;
}
