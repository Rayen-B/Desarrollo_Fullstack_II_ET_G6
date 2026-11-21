package proyecto.usuario_service.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    public static final String ADMINISTRADOR = "Administrador";
    public static final String VENDEDOR = "Vendedor";
    public static final String CLIENTE = "Cliente";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run", unique = true, length = 9)
    private String run;

    @Column(name = "usuario", unique = true, length = 30)
    private String usuario;

    @Column(name = "nombre", nullable = false, length = 60)
    private String nombre;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos = "";

    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "region", nullable = false, length = 80)
    private String region = "";

    @Column(name = "comuna", nullable = false, length = 80)
    private String comuna = "";

    @Column(name = "direccion", nullable = false, length = 300)
    private String direccion = "";
}
