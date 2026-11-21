package proyecto.usuario_service.controller;

import io.swagger.v3.oas.annotations.Operation;
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
import proyecto.usuario_service.dto.*;
import proyecto.usuario_service.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "API Autenticación", description = "Registro, inicio de sesión con JWT y renovación con refresh token (rutas públicas)")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/registro")
    @Operation(summary = "Registrar cliente", description = "Crea una cuenta con rol Cliente. No inicia sesión automáticamente")
    @ApiResponse(responseCode = "201", description = "Cuenta creada")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 400, \"mensaje\": \"La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo\"}")))
    @ApiResponse(responseCode = "409", description = "Correo o RUN ya registrado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"Ya existe una cuenta registrada con ese correo.\"}")))
    public ResponseEntity<UsuarioResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Acepta correo o nombre de usuario. Devuelve un accessToken (JWT, 15 min) y un refreshToken (7 días)")
    @ApiResponse(responseCode = "200", description = "Sesión iniciada")
    @ApiResponse(responseCode = "401", description = "Credenciales incorrectas", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 401, \"mensaje\": \"Usuario o contraseña incorrectos.\"}")))
    public ResponseEntity<TokenResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar la sesión", description = "Entrega tokens nuevos. El refreshToken usado deja de servir")
    @ApiResponse(responseCode = "200", description = "Tokens renovados")
    @ApiResponse(responseCode = "401", description = "Refresh token inválido, usado o vencido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 401, \"mensaje\": \"La sesión expiró, inicia sesión de nuevo.\"}")))
    public ResponseEntity<TokenResponseDTO> renovar(@Valid @RequestBody RefreshRequestDTO request) {
        return ResponseEntity.ok(authService.renovar(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Anula el refreshToken")
    @ApiResponse(responseCode = "204", description = "Sesión cerrada")
    public ResponseEntity<Void> cerrarSesion(@Valid @RequestBody RefreshRequestDTO request) {
        authService.cerrarSesion(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
}
