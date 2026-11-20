package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemVentaDTO {

    @Schema(example = "TC001")
    @NotBlank(message = "El código del producto es obligatorio")
    private String codigo;

    @Schema(description = "1 = completa, 0.25 = trozo. Si no viene, se usa la variante", example = "0.25")
    @Positive(message = "El factor debe ser mayor a 0")
    @DecimalMax(value = "1", message = "El factor no puede ser mayor a 1")
    private Double factor;

    @Schema(description = "completa o trozo", example = "trozo")
    private String variante;

    @Schema(example = "2")
    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;
}
