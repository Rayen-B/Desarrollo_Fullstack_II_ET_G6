package proyecto.orden_service.controller;

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
import proyecto.orden_service.dto.*;
import proyecto.orden_service.service.OrdenService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ordenes")
@Tag(name = "API Órdenes", description = "Compras, boletas y estados. Requiere sesión (el Gateway envía X-User-Id y X-User-Rol)")
public class OrdenController {

    @Autowired
    private OrdenService ordenService;

    @PostMapping
    @Operation(summary = "Crear una orden", description = "Toma precios y nombres desde Catálogo. Si el pago fue aprobado, Catálogo descuenta el stock (vitrina primero; trozos con insumos)")
    @ApiResponse(responseCode = "201", description = "Orden creada (también cuando el pago fue rechazado, en estado Pago rechazado)")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 400, \"mensaje\": \"Solo las tortas se venden por trozo.\"}")))
    @ApiResponse(responseCode = "409", description = "Sin stock: no se crea la orden", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"Ya no hay stock suficiente de Torta Trufa.\"}")))
    @ApiResponse(responseCode = "503", description = "Catálogo no disponible", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 503, \"mensaje\": \"No se pudo comunicar con el catálogo en este momento\"}")))
    public ResponseEntity<OrdenResponseDTO> crear(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId,
                                                  @Valid @RequestBody OrdenRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.crear(request, usuarioId));
    }

    @GetMapping("/mias")
    @Operation(summary = "Mis órdenes", description = "Las órdenes del usuario con sesión, de la más nueva a la más antigua")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<OrdenResponseDTO>> misOrdenes(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId) {
        return ResponseEntity.ok(ordenService.misOrdenes(usuarioId));
    }

    @GetMapping
    @Operation(summary = "Todas las órdenes (Vendedor y Administrador)")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    @ApiResponse(responseCode = "403", description = "Es Cliente", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 403, \"mensaje\": \"No tienes permiso para esta acción\"}")))
    public ResponseEntity<List<OrdenResponseDTO>> listar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol) {
        return ResponseEntity.ok(ordenService.listar(rol));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Ver una orden (boleta)", description = "El cliente solo ve las suyas; Vendedor y Administrador ven cualquiera. Acepta PD-123 o #PD-123")
    @ApiResponse(responseCode = "200", description = "Orden encontrada")
    @ApiResponse(responseCode = "404", description = "No existe o es de otro cliente", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 404, \"mensaje\": \"La orden no existe.\"}")))
    public ResponseEntity<OrdenResponseDTO> obtener(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long usuarioId,
                                                    @Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                                    @PathVariable String id) {
        return ResponseEntity.ok(ordenService.obtener(id, usuarioId, rol));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar el estado (Vendedor y Administrador)", description = "Por ejemplo, confirmar una transferencia (Pendiente) o marcar Enviado. Pasar a Cancelado devuelve el stock")
    @ApiResponse(responseCode = "200", description = "Estado actualizado")
    @ApiResponse(responseCode = "400", description = "Estado no válido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 400, \"mensaje\": \"Estado no válido.\"}")))
    public ResponseEntity<OrdenResponseDTO> cambiarEstado(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                                          @PathVariable String id, @Valid @RequestBody CambioEstadoDTO request) {
        return ResponseEntity.ok(ordenService.cambiarEstado(id, request.getEstado(), rol));
    }

    @PostMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar una orden (Vendedor y Administrador)", description = "Le pide a Catálogo devolver lo que se había descontado (vitrina e insumos)")
    @ApiResponse(responseCode = "200", description = "Orden cancelada")
    @ApiResponse(responseCode = "409", description = "Ya estaba cancelada", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-21T12:00:00\", \"status\": 409, \"mensaje\": \"La orden ya estaba cancelada.\"}")))
    public ResponseEntity<OrdenResponseDTO> cancelar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol,
                                                     @PathVariable String id, @Valid @RequestBody(required = false) CancelacionDTO request) {
        return ResponseEntity.ok(ordenService.cancelar(id, request == null ? null : request.getMotivo(), rol));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una orden (solo Administrador)")
    @ApiResponse(responseCode = "204", description = "Orden eliminada")
    public ResponseEntity<Void> eliminar(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol, @PathVariable String id) {
        ordenService.eliminar(id, rol);
        return ResponseEntity.noContent().build();
    }
}
