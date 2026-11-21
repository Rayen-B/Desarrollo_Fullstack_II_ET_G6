package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemRecetaDTO {

    @Schema(example = "harina")
    @NotBlank(message = "El insumo es obligatorio")
    private String insumoId;

    @Schema(description = "Cantidad para una unidad completa (un trozo usa 1/4)", example = "300")
    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a 0")
    private Double cantidad;
}
