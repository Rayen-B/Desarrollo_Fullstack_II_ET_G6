package proyecto.nutricion_service.controller;

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
import proyecto.nutricion_service.dto.ErrorResponseDTO;
import proyecto.nutricion_service.dto.IngredienteDTO;
import proyecto.nutricion_service.service.IngredienteService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/nutricion/ingredientes")
@Tag(name = "API Ingredientes", description = "Nombre en inglés, unidad y alérgenos de cada insumo")
public class IngredienteController {

    @Autowired
    private IngredienteService ingredienteService;

    @GetMapping
    @Operation(summary = "Listar ingredientes", description = "Retorna la traducción y los alérgenos de todos los insumos registrados")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<IngredienteDTO>> listar() {
        return ResponseEntity.ok(ingredienteService.listarTodos());
    }

    @PutMapping("/{insumoId}")
    @Operation(summary = "Crear o actualizar un ingrediente", description = "Registra el nombre en inglés, la unidad y los alérgenos de un insumo")
    @ApiResponse(responseCode = "200", description = "Ingrediente guardado correctamente")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-13T19:49:46\", \"status\": 400, \"mensaje\": \"La unidad debe ser g, ml o u\"}")))
    public ResponseEntity<IngredienteDTO> guardar(
            @Parameter(description = "Id del insumo, por ejemplo harina") @PathVariable String insumoId,
            @Parameter(description = "Datos del ingrediente") @Valid @RequestBody IngredienteDTO request) {
        return ResponseEntity.ok(ingredienteService.guardar(insumoId, request));
    }
}
