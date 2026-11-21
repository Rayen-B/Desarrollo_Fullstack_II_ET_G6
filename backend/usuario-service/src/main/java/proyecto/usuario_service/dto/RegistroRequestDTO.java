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
public class RegistroRequestDTO {

    @Schema(example = "Camila")
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 3, max = 60, message = "El nombre debe tener entre 3 y 60 caracteres")
    @Pattern(regexp = "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$", message = "El nombre solo puede contener letras y espacios")
    private String nombre;

    @Schema(example = "camila@gmail.com")
    @NotBlank(message = "El correo es requerido")
    @Email(message = "Formato de correo no válido (ej: usuario@correo.com)")
    @Size(max = 100, message = "Máximo 100 caracteres")
    private String correo;

    @Schema(example = "Papita#2026")
    @NotBlank(message = "La contraseña es requerida")
    @Size(max = 50, message = "La contraseña es demasiado larga")
    private String password;

    @Schema(example = "Región Metropolitana de Santiago")
    @NotBlank(message = "Selecciona tu región")
    @Size(max = 80)
    private String region;

    @Schema(example = "Santiago")
    @NotBlank(message = "Selecciona tu comuna")
    @Size(max = 80)
    private String comuna;

    @Schema(example = "Rojas")
    @Size(max = 100, message = "Máximo 100 caracteres")
    private String apellidos;

    @Schema(description = "Opcional, sin puntos ni guion", example = "201239877")
    private String run;

    @Size(max = 300, message = "Máximo 300 caracteres")
    private String direccion;

    @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
    private LocalDate fechaNacimiento;
}
