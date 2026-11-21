package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambioEstadoDTO {

    @Schema(description = "Pendiente, Pendiente de pago, Procesando, Enviado, Cancelado o Pago rechazado", example = "Enviado")
    @NotBlank(message = "El estado es requerido")
    private String estado;
}
