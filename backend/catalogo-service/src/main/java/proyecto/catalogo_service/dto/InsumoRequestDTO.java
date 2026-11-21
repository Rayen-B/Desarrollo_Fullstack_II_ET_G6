package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsumoRequestDTO {

    @Schema(example = "Crema de leche")
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 3, max = 40, message = "El nombre debe tener entre 3 y 40 caracteres")
    private String nombre;

    @Schema(example = "ml")
    @NotBlank(message = "La unidad es requerida")
    @Pattern(regexp = "g|ml|u", message = "La unidad debe ser g, ml o u")
    private String unidad;

    @Schema(example = "900")
    @NotNull(message = "Ingresa el stock")
    @PositiveOrZero(message = "El stock no puede ser negativo")
    private Double stock;

    @Schema(example = "1000")
    @NotNull(message = "Ingresa el mínimo")
    @PositiveOrZero(message = "El mínimo no puede ser negativo")
    private Double minimo;
}
