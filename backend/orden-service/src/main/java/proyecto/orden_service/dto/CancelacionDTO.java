package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelacionDTO {

    @Schema(example = "Cancelada por la tienda")
    @Size(max = 200, message = "Máximo 200 caracteres")
    private String motivo;
}
