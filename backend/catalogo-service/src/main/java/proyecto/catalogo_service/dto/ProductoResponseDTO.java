package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoResponseDTO {

    @Schema(description = "Igual al código", example = "TC001")
    private String id;

    @Schema(example = "TC001")
    private String codigo;

    @Schema(example = "Torta Panqueque Naranja")
    private String nombre;

    @Schema(description = "Nombre de la categoría", example = "Tortas")
    private String categoria;

    @Schema(example = "tortas")
    private String categoriaId;

    @Schema(example = "16900")
    private Integer precio;

    @Schema(example = "20000")
    private Integer precioAnterior;

    @Schema(description = "Unidades en vitrina", example = "12")
    private Integer stock;

    @Schema(example = "4")
    private Integer stockCritico;

    @Schema(example = "menu/Torta_Panqueque_Naranja")
    private String imagen;

    @Schema(example = "<p>Panqueques suaves, crema pastelera &amp; frutas frescas.</p>")
    private String descripcion;

    private List<ItemRecetaDTO> receta;

    @Schema(description = "Vitrina + lo que se puede preparar con los insumos", example = "12")
    private Integer disponible;

    @Schema(example = "false")
    private boolean critico;
}
