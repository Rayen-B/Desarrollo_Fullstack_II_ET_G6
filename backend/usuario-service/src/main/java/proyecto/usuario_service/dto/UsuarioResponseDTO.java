package proyecto.usuario_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDTO {

    @Schema(example = "4")
    private Long id;

    @Schema(example = "201239877")
    private String run;

    @Schema(description = "Nombre de usuario opcional, como admin", example = "admin")
    private String usuario;

    @Schema(example = "Armando")
    private String nombre;

    @Schema(example = "Esteban Quito")
    private String apellidos;

    @Schema(example = "armando.quito@gmail.com")
    private String correo;

    @Schema(example = "Cliente")
    private String rol;

    private LocalDate fechaNacimiento;

    @Schema(example = "Región del Biobío")
    private String region;

    @Schema(example = "Concepción")
    private String comuna;

    @Schema(example = "Calle Prat 789")
    private String direccion;
}
