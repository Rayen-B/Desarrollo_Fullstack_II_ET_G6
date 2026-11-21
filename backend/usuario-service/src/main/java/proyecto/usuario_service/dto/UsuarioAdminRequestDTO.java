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
public class UsuarioAdminRequestDTO {

    @Schema(description = "Sin puntos ni guion", example = "184561239")
    @NotBlank(message = "El RUN es requerido")
    private String run;

    @Schema(example = "Vendedor")
    @NotBlank(message = "El rol es requerido")
    @Pattern(regexp = "Administrador|Vendedor|Cliente", message = "El rol debe ser Administrador, Vendedor o Cliente")
    private String rol;

    @Schema(example = "Lola")
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 50, message = "Requerido (máx 50 caracteres)")
    private String nombre;

    @Schema(example = "Mento Rojas")
    @NotBlank(message = "Los apellidos son requeridos")
    @Size(max = 100, message = "Requerido (máx 100 caracteres)")
    private String apellidos;

    @Schema(example = "lola.mento@profesor.duoc.cl")
    @NotBlank(message = "El correo es requerido")
    @Email(message = "Formato de correo no válido (ej: usuario@correo.com)")
    @Size(max = 100, message = "Máximo 100 caracteres")
    private String correo;

    @Schema(description = "Obligatoria al crear; al editar, si viene vacía no se cambia", example = "Ven#2026")
    private String password;

    @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
    private LocalDate fechaNacimiento;

    @Size(max = 80)
    private String region;

    @Size(max = 80)
    private String comuna;

    @Schema(example = "Av. Providencia 456")
    @NotBlank(message = "La dirección es requerida")
    @Size(max = 300, message = "Requerido (máx 300 caracteres)")
    private String direccion;
}
