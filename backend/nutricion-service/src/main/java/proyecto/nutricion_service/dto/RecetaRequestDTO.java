package proyecto.nutricion_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecetaRequestDTO {

    @NotEmpty(message = "La receta debe tener al menos un insumo")
    private List<@Valid ItemRecetaDTO> items;
}
