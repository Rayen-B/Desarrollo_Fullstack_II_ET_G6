package proyecto.orden_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemOrdenRequestDTO {

    @Schema(example = "TL004")
    @NotBlank(message = "El código del producto es obligatorio")
    private String codigo;

    @Schema(example = "1")
    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Max(value = 50, message = "La cantidad máxima por producto es 50")
    private Integer cantidad;

    @Schema(description = "completa o trozo (solo tortas). Si no viene, es completa", example = "trozo")
    @Pattern(regexp = "completa|trozo", message = "La variante debe ser completa o trozo")
    private String variante;
}
