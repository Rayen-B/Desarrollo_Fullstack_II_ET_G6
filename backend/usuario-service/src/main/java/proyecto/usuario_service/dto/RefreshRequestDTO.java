package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshRequestDTO {

    @Schema(description = "El refreshToken que entregó el login o el último refresh")
    @NotBlank(message = "Falta el refresh token")
    private String refreshToken;
}
