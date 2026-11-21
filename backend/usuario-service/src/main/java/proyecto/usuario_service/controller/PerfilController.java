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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proyecto.usuario_service.dto.CambioPasswordDTO;
import proyecto.usuario_service.dto.ErrorResponseDTO;
import proyecto.usuario_service.dto.PerfilRequestDTO;
import proyecto.usuario_service.dto.UsuarioResponseDTO;
import proyecto.usuario_service.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/usuarios/perfil")
@Tag(name = "API Mi Perfil", description = "Datos del usuario con sesión iniciada (el Gateway envía X-User-Id)")
public class PerfilController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    @Operation(summary = "Ver mi perfil")
    @ApiResponse(responseCode = "200", description = "Perfil encontrado")
    @ApiResponse(responseCode = "401", description = "Sin sesión", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 401, \"mensaje\": \"Debes iniciar sesión\"}")))
    public ResponseEntity<UsuarioResponseDTO> verPerfil(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId) {
        return ResponseEntity.ok(usuarioService.perfil(usuarioId));
    }

    @PutMapping
    @Operation(summary = "Editar mi perfil", description = "No permite cambiar el rol ni la contraseña")
    @ApiResponse(responseCode = "200", description = "Perfil actualizado")
    @ApiResponse(responseCode = "409", description = "Correo en uso", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"Ese correo ya está registrado por otro usuario.\"}")))
    public ResponseEntity<UsuarioResponseDTO> editarPerfil(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId,
                                                           @Valid @RequestBody PerfilRequestDTO request) {
        return ResponseEntity.ok(usuarioService.actualizarPerfil(usuarioId, request));
    }

    @PutMapping("/password")
    @Operation(summary = "Cambiar mi contraseña", description = "Pide la contraseña actual")
    @ApiResponse(responseCode = "204", description = "Contraseña cambiada")
    @ApiResponse(responseCode = "400", description = "Contraseña actual incorrecta o nueva muy débil", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 400, \"mensaje\": \"La contraseña actual no es correcta.\"}")))
    public ResponseEntity<Void> cambiarPassword(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId,
                                                @Valid @RequestBody CambioPasswordDTO request) {
        usuarioService.cambiarPassword(usuarioId, request);
        return ResponseEntity.noContent().build();
    }
}
