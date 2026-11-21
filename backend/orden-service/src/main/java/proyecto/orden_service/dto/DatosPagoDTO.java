package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Tarjeta: tipoTarjeta, cuotas, ultimos4. Efectivo: pagaCon. Pago rechazado: motivoRechazo y codigoMotivo")
public class DatosPagoDTO {

    @Schema(example = "credito")
    @Pattern(regexp = "credito|debito", message = "El tipo de tarjeta debe ser credito o debito")
    private String tipoTarjeta;

    @Schema(example = "3")
    @Min(value = 1, message = "Las cuotas deben ser al menos 1")
    @Max(value = 48, message = "Máximo 48 cuotas")
    private Integer cuotas;

    @Schema(description = "Solo los últimos 4 dígitos; nunca se envía la tarjeta completa", example = "0366")
    @Pattern(regexp = "\\d{4}", message = "Solo se guardan los últimos 4 dígitos de la tarjeta")
    private String ultimos4;

    @Schema(description = "Con cuánto paga en efectivo, para calcular el vuelto", example = "20000")
    @PositiveOrZero(message = "El monto en efectivo no puede ser negativo")
    private Integer pagaCon;

    @Size(max = 200)
    private String motivoRechazo;

    @Size(max = 40)
    private String codigoMotivo;
}
