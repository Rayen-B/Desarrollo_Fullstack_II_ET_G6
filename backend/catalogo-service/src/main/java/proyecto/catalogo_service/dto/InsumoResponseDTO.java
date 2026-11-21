package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsumoResponseDTO {

    @Schema(example = "crema")
    private String id;

    @Schema(example = "Crema de leche")
    private String nombre;

    @Schema(example = "ml")
    private String unidad;

    @Schema(example = "900")
    private Double stock;

    @Schema(example = "1000")
    private Double minimo;

    @Schema(description = "true si el stock está en el mínimo o por debajo", example = "true")
    private boolean critico;
}
