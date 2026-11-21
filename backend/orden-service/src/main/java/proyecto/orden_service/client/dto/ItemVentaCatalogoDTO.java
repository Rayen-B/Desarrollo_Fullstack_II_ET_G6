package proyecto.orden_service.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemVentaCatalogoDTO {
    private String codigo;
    private String variante;
    private Integer cantidad;
}
