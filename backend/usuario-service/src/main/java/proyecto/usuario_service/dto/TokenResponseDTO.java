package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponseDTO {

    @Schema(description = "JWT para el header Authorization: Bearer ...")
    private String accessToken;

    @Schema(description = "Sirve para pedir un accessToken nuevo en /api/v1/auth/refresh")
    private String refreshToken;

    @Schema(example = "Bearer")
    private String tipo;

    @Schema(description = "Segundos que dura el accessToken", example = "900")
    private long expiraEn;

    private UsuarioResponseDTO usuario;
}
