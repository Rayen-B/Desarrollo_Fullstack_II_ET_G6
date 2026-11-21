package proyecto.orden_service.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimientosDTO {
    private Map<String, Integer> vitrina = new HashMap<>();
    private Map<String, Double> insumos = new HashMap<>();
}
