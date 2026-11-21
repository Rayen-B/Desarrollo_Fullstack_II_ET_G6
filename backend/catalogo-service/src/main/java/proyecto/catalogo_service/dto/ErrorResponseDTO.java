package proyecto.catalogo_service.dto;

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

    @Schema(example = "2026-11-13T19:49:46")
    private LocalDateTime timestamp;

    @Schema(example = "400")
    private int status;

    @Schema(example = "El producto no existe.")
    private String mensaje;
}
