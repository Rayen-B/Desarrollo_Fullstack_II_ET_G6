package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrdenRequestDTO {

    @Schema(example = "Armando Esteban Quito")
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 120, message = "Máximo 120 caracteres")
    private String cliente;

    @Schema(example = "armando.quito@gmail.com")
    @NotBlank(message = "El correo es requerido")
    @Email(message = "Formato de correo no válido (ej: usuario@correo.com)")
    @Size(max = 100)
    private String correo;

    @Schema(example = "+56 9 6543 2109")
    @Size(max = 20)
    private String telefono;

    @Schema(example = "201239877")
    @Size(max = 9)
    private String run;

    @Schema(example = "Calle Prat 789, Concepción")
    @NotBlank(message = "La dirección de entrega es requerida")
    @Size(max = 300)
    private String entrega;

    @Schema(example = "despacho")
    @NotBlank(message = "El tipo de entrega es requerido")
    @Pattern(regexp = "despacho|retiro", message = "El tipo de entrega debe ser despacho o retiro")
    private String tipoEntrega;

    @Schema(example = "tarjeta")
    @NotBlank(message = "El método de pago es requerido")
    @Pattern(regexp = "tarjeta|transferencia|efectivo", message = "El método de pago debe ser tarjeta, transferencia o efectivo")
    private String metodoPago;

    @NotEmpty(message = "La orden no tiene productos.")
    @Size(max = 30, message = "Máximo 30 productos distintos por orden")
    private List<@Valid ItemOrdenRequestDTO> items;

    @Schema(description = "Resultado del simulador de pago del front", example = "true")
    @NotNull(message = "Falta el resultado del pago")
    private Boolean pagoAprobado;

    @Valid
    private DatosPagoDTO datosPago;
}
