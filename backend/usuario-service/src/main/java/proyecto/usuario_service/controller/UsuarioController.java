package proyecto.usuario_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proyecto.usuario_service.dto.ErrorResponseDTO;
import proyecto.usuario_service.dto.UsuarioAdminRequestDTO;
import proyecto.usuario_service.dto.UsuarioResponseDTO;
import proyecto.usuario_service.exception.SinPermisoException;
import proyecto.usuario_service.model.Usuario;
import proyecto.usuario_service.service.UsuarioService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@Tag(name = "API Usuarios (admin)", description = "Administración de usuarios. Solo rol Administrador (el Gateway envía X-User-Rol)")
@ApiResponse(responseCode = "403", description = "No es Administrador", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 403, \"mensaje\": \"No tienes permiso para esta acción\"}")))
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    @Operation(summary = "Listar usuarios")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<UsuarioResponseDTO>> listar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol) {
        exigirAdministrador(rol);
        return ResponseEntity.ok(usuarioService.listar());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un usuario")
    @ApiResponse(responseCode = "200", description = "Usuario encontrado")
    @ApiResponse(responseCode = "404", description = "No existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 404, \"mensaje\": \"El usuario no existe.\"}")))
    public ResponseEntity<UsuarioResponseDTO> obtener(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol, @PathVariable Long id) {
        exigirAdministrador(rol);
        return ResponseEntity.ok(usuarioService.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear usuario", description = "El admin elige el rol. RUN con dígito verificador, sin puntos ni guion")
    @ApiResponse(responseCode = "201", description = "Usuario creado")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 400, \"mensaje\": \"RUN inválido. El dígito verificador no corresponde (esperado: 9)\"}")))
    @ApiResponse(responseCode = "409", description = "RUN o correo repetido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"El RUN ya se encuentra registrado.\"}")))
    public ResponseEntity<UsuarioResponseDTO> crear(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                                    @Valid @RequestBody UsuarioAdminRequestDTO request) {
        exigirAdministrador(rol);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar usuario", description = "Si la contraseña viene vacía, se mantiene la actual")
    @ApiResponse(responseCode = "200", description = "Usuario actualizado")
    public ResponseEntity<UsuarioResponseDTO> actualizar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                                         @PathVariable Long id, @Valid @RequestBody UsuarioAdminRequestDTO request) {
        exigirAdministrador(rol);
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar usuario", description = "No se puede eliminar el propio usuario")
    @ApiResponse(responseCode = "204", description = "Usuario eliminado")
    @ApiResponse(responseCode = "409", description = "Es el propio usuario", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"No puedes eliminar tu propio usuario.\"}")))
    public ResponseEntity<Void> eliminar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                         @Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId, @PathVariable Long id) {
        exigirAdministrador(rol);
        usuarioService.eliminar(id, usuarioId);
        return ResponseEntity.noContent().build();
    }

    private void exigirAdministrador(String rol) {
        if (!Usuario.ADMINISTRADOR.equals(rol)) throw new SinPermisoException("No tienes permiso para esta acción");
    }
}
