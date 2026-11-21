package proyecto.orden_service.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VentaCatalogoDTO {
    private List<ItemVentaCatalogoDTO> items;
}
