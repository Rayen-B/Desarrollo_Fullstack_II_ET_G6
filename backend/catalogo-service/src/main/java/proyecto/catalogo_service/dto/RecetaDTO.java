package proyecto.catalogo_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecetaDTO {

    @NotNull(message = "La receta es obligatoria")
    private List<@Valid ItemRecetaDTO> items;
}
