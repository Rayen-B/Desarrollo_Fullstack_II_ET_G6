package proyecto.catalogo_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import proyecto.catalogo_service.dto.ErrorResponseDTO;
import proyecto.catalogo_service.dto.MovimientosDTO;
import proyecto.catalogo_service.dto.VentaRequestDTO;
import proyecto.catalogo_service.dto.VerificacionDTO;
import proyecto.catalogo_service.service.StockService;

@RestController
@RequestMapping("/api/v1/productos/stock")
@Tag(name = "API Stock", description = "Descontar y devolver stock de una venta (lo usa Órdenes). Completas salen primero de vitrina; lo que falta y los trozos se preparan con insumos")
public class StockController {

    @Autowired
    private StockService stockService;

    @PostMapping("/verificar")
    @Operation(summary = "Revisar si alcanza el stock", description = "No descuenta nada")
    @ApiResponse(responseCode = "200", description = "Alcanza el stock")
    @ApiResponse(responseCode = "409", description = "No alcanza", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"No hay stock suficiente de Torta Trufa.\"}")))
    public ResponseEntity<VerificacionDTO> verificar(@Valid @RequestBody VentaRequestDTO request) {
        return ResponseEntity.ok(stockService.verificar(request));
    }

    @PostMapping("/descontar")
    @Operation(summary = "Descontar una venta", description = "Todo o nada. Devuelve los movimientos para poder devolverlos si la orden se cancela")
    @ApiResponse(responseCode = "200", description = "Stock descontado")
    @ApiResponse(responseCode = "409", description = "No alcanza", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"Ya no hay stock suficiente de Torta Trufa.\"}")))
    public ResponseEntity<MovimientosDTO> descontar(@Valid @RequestBody VentaRequestDTO request) {
        return ResponseEntity.ok(stockService.descontar(request));
    }

    @PostMapping("/devolver")
    @Operation(summary = "Devolver una venta", description = "Recibe los movimientos que entregó descontar")
    @ApiResponse(responseCode = "204", description = "Stock devuelto")
    public ResponseEntity<Void> devolver(@RequestBody MovimientosDTO movimientos) {
        stockService.devolver(movimientos);
        return ResponseEntity.noContent().build();
    }
}
