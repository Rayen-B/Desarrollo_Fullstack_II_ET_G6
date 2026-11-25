package proyecto.catalogo_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoRequestDTO {

    @Schema(description = "Solo al crear; al editar se ignora", example = "TC010")
    @Size(min = 3, max = 20, message = "El código debe tener entre 3 y 20 caracteres")
    @Pattern(regexp = "[A-Za-z0-9]*", message = "El código solo puede tener letras y números")
    private String codigo;

    @Schema(example = "Torta de Zanahoria")
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String nombre;

    @Schema(description = "Nombre o id de la categoría", example = "Tortas")
    @NotBlank(message = "La categoría es requerida")
    private String categoria;

    @Schema(example = "15900")
    @NotNull(message = "El precio es requerido")
    @PositiveOrZero(message = "El precio no puede ser negativo (0 = producto gratuito)")
    private Integer precio;

    @Schema(example = "18900")
    @PositiveOrZero(message = "El precio anterior no puede ser negativo")
    private Integer precioAnterior;

    @Schema(description = "Unidades ya hechas en vitrina", example = "5")
    @NotNull(message = "El stock es requerido")
    @PositiveOrZero(message = "El stock no puede ser negativo")
    private Integer stock;

    @Schema(example = "2")
    @PositiveOrZero(message = "El stock crítico no puede ser negativo")
    private Integer stockCritico;

    @Schema(description = "Clave de images.js del front o URL de una foto subida", example = "menu/Torta_Trufa")
    @Size(max = 255, message = "La imagen no puede superar 255 caracteres")
    private String imagen;

    @Schema(description = "HTML del editor Tiptap; se limpia al guardar", example = "<p>Bizcocho de <strong>zanahoria</strong> con nueces.</p>")
    @Size(max = 10000, message = "La descripción es demasiado larga")
    private String descripcion;

    private List<@Valid ItemRecetaDTO> receta;
}
