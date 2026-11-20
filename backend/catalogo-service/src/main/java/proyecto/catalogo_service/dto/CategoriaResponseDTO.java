package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaResponseDTO {

    @Schema(example = "tortas")
    private String id;

    @Schema(example = "Tortas")
    private String nombre;

    @Schema(example = "Tortas caseras para celebrar, completas o por trozo.")
    private String descripcion;

    @Schema(example = "menu/Torta_Panqueque_Naranja")
    private String imagen;
}
