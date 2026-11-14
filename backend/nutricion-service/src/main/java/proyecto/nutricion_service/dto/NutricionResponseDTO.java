package proyecto.nutricion_service.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class NutricionResponseDTO {
    private String codigoProducto;
    private NutrientesDTO total;
    private NutrientesDTO porTrozo;
    private List<String> alergenos;
    private List<String> ingredientesSinDatos;
    private LocalDateTime calculadoEn;
    private boolean desdeCache;
}
