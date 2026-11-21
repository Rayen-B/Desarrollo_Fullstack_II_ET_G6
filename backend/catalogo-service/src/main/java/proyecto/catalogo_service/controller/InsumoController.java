package proyecto.catalogo_service.controller;

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
import proyecto.catalogo_service.dto.ErrorResponseDTO;
import proyecto.catalogo_service.dto.InsumoRequestDTO;
import proyecto.catalogo_service.dto.InsumoResponseDTO;
import proyecto.catalogo_service.service.InsumoService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insumos")
@Tag(name = "API Insumos", description = "Ingredientes de la pastelería y su stock (g, ml o u)")
public class InsumoController {

    @Autowired
    private InsumoService insumoService;

    @GetMapping
    @Operation(summary = "Listar insumos", description = "Incluye si cada insumo está en stock crítico")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<InsumoResponseDTO>> listar() {
        return ResponseEntity.ok(insumoService.listar());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un insumo")
    @ApiResponse(responseCode = "200", description = "Insumo encontrado")
    @ApiResponse(responseCode = "404", description = "No existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 404, \"mensaje\": \"El insumo no existe.\"}")))
    public ResponseEntity<InsumoResponseDTO> obtener(@Parameter(description = "Id del insumo", example = "harina") @PathVariable String id) {
        return ResponseEntity.ok(insumoService.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear insumo (admin)", description = "El id se arma desde el nombre: \"Crema de leche\" -> crema-de-leche")
    @ApiResponse(responseCode = "201", description = "Insumo creado")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 400, \"mensaje\": \"La unidad debe ser g, ml o u\"}")))
    @ApiResponse(responseCode = "409", description = "Ya existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"Ya existe un insumo con ese nombre\"}")))
    public ResponseEntity<InsumoResponseDTO> crear(@Valid @RequestBody InsumoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(insumoService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar insumo (admin)", description = "Cambia nombre, unidad, stock o mínimo")
    @ApiResponse(responseCode = "200", description = "Insumo actualizado")
    public ResponseEntity<InsumoResponseDTO> actualizar(@PathVariable String id, @Valid @RequestBody InsumoRequestDTO request) {
        return ResponseEntity.ok(insumoService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar insumo (admin)", description = "No se puede eliminar si alguna receta lo usa")
    @ApiResponse(responseCode = "204", description = "Insumo eliminado")
    @ApiResponse(responseCode = "409", description = "Se usa en recetas", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"No se puede eliminar: el insumo se usa en 3 receta(s).\"}")))
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        insumoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
