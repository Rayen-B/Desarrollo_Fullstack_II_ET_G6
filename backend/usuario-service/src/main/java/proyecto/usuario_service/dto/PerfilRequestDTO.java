package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerfilRequestDTO {

    @Schema(example = "Armando")
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 60, message = "Máximo 60 caracteres")
    private String nombre;

    @Schema(example = "Esteban Quito")
    @Size(max = 100, message = "Máximo 100 caracteres")
    private String apellidos;

    @Schema(example = "armando.quito@gmail.com")
    @NotBlank(message = "El correo es requerido")
    @Email(message = "Formato de correo no válido (ej: usuario@correo.com)")
    @Size(max = 100, message = "Máximo 100 caracteres")
    private String correo;

    @Size(max = 80)
    private String region;

    @Size(max = 80)
    private String comuna;

    @Size(max = 300, message = "Máximo 300 caracteres")
    private String direccion;

    @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
    private LocalDate fechaNacimiento;
}
