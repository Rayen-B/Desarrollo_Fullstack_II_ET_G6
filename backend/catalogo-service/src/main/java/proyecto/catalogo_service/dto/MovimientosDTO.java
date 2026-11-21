package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Lo que salió de la vitrina y de cada insumo en una venta; se guarda en la orden para poder devolverlo")
public class MovimientosDTO {

    @Schema(description = "Unidades sacadas de la vitrina por código", example = "{\"TC001\": 1}")
    private Map<String, Integer> vitrina = new HashMap<>();

    @Schema(description = "Cantidad usada de cada insumo", example = "{\"harina\": 75, \"huevos\": 1}")
    private Map<String, Double> insumos = new HashMap<>();
}
