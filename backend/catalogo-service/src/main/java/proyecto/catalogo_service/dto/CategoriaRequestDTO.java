package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaRequestDTO {

    @Schema(example = "Sin Azúcar")
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 3, max = 30, message = "El nombre debe tener entre 3 y 30 caracteres")
    private String nombre;

    @Schema(example = "Postres endulzados con stevia.")
    @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
    private String descripcion;

    @Schema(example = "menu/postre1")
    @Size(max = 255, message = "La imagen no puede superar 255 caracteres")
    private String imagen;
}
