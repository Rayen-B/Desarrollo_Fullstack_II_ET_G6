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
import proyecto.catalogo_service.dto.CategoriaRequestDTO;
import proyecto.catalogo_service.dto.CategoriaResponseDTO;
import proyecto.catalogo_service.dto.ErrorResponseDTO;
import proyecto.catalogo_service.service.CategoriaService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@Tag(name = "API Categorías", description = "Categorías de productos de la tienda")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    @GetMapping
    @Operation(summary = "Listar categorías")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<CategoriaResponseDTO>> listar() {
        return ResponseEntity.ok(categoriaService.listar());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una categoría", description = "Acepta el id (tortas) o el nombre (Tortas)")
    @ApiResponse(responseCode = "200", description = "Categoría encontrada")
    @ApiResponse(responseCode = "404", description = "No existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 404, \"mensaje\": \"La categoría no existe.\"}")))
    public ResponseEntity<CategoriaResponseDTO> obtener(@Parameter(description = "Id de la categoría", example = "tortas") @PathVariable String id) {
        return ResponseEntity.ok(categoriaService.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear categoría (admin)", description = "El id se arma desde el nombre: \"Sin Azúcar\" -> sin-azucar")
    @ApiResponse(responseCode = "201", description = "Categoría creada")
    @ApiResponse(responseCode = "409", description = "Ya existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"La categoría \\\"Tortas\\\" ya existe.\"}")))
    public ResponseEntity<CategoriaResponseDTO> crear(@Valid @RequestBody CategoriaRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar categoría (admin)", description = "Si cambia el nombre, los productos siguen ligados a la categoría")
    @ApiResponse(responseCode = "200", description = "Categoría actualizada")
    public ResponseEntity<CategoriaResponseDTO> actualizar(@PathVariable String id, @Valid @RequestBody CategoriaRequestDTO request) {
        return ResponseEntity.ok(categoriaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoría (admin)", description = "No se puede eliminar si todavía tiene productos")
    @ApiResponse(responseCode = "204", description = "Categoría eliminada")
    @ApiResponse(responseCode = "409", description = "Tiene productos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"No se puede eliminar: tiene 6 producto(s) asociados.\"}")))
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        categoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
