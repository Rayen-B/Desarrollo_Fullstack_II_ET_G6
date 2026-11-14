package proyecto.nutricion_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IngredienteDTO {

    private String insumoId;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 60, message = "El nombre admite máximo 60 caracteres")
    private String nombre;

    @NotBlank(message = "El nombre en inglés es obligatorio")
    @Pattern(regexp = "^[A-Za-z ]{2,60}$", message = "El nombre en inglés solo admite letras sin tildes y espacios (2 a 60)")
    private String nombreIngles;

    @NotBlank(message = "La unidad es obligatoria")
    @Pattern(regexp = "^(g|ml|u)$", message = "La unidad debe ser g, ml o u")
    private String unidad;

    private List<@Pattern(regexp = "^[a-záéíóúñ ]{2,30}$", message = "Alérgeno no válido") String> alergenos;
}
