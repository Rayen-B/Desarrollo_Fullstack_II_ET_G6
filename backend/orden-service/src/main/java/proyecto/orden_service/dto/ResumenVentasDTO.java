package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumenVentasDTO {

    @Schema(example = "5")
    private long totalOrdenes;

    @Schema(description = "Sin contar canceladas, rechazadas ni transferencias sin pagar", example = "4")
    private long ordenesValidas;

    @Schema(example = "111900")
    private long ingresos;

    @Schema(example = "27975")
    private long ticketPromedio;

    private Map<String, Long> porEstado;
}
