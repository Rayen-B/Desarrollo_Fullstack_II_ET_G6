package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta cuando ocurre un error")
public class ErrorResponseDTO {

    @Schema(example = "2026-11-21T12:00:00")
    private LocalDateTime timestamp;

    @Schema(example = "404")
    private int status;

    @Schema(example = "La orden no existe.")
    private String mensaje;
}
