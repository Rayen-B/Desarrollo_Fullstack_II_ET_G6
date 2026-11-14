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
import proyecto.nutricion_service.dto.NutricionResponseDTO;
import proyecto.nutricion_service.dto.RecetaRequestDTO;
import proyecto.nutricion_service.service.NutricionService;

@RestController
@RequestMapping("/api/v1/nutricion/productos")
@Tag(name = "API Nutrición", description = "Información nutricional y alérgenos de los productos, calculados desde su receta")
public class NutricionController {

    @Autowired
    private NutricionService nutricionService;

    @GetMapping("/{codigo}")
    @Operation(summary = "Obtener la nutrición guardada de un producto", description = "Devuelve el último cálculo guardado, sin consultar Spoonacular")
    @ApiResponse(responseCode = "200", description = "Información nutricional encontrada")
    @ApiResponse(responseCode = "404", description = "El producto aún no tiene información calculada", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-13T19:49:46\", \"status\": 404, \"mensaje\": \"El producto TC999 aún no tiene información nutricional calculada\"}")))
    public ResponseEntity<NutricionResponseDTO> obtener(
            @Parameter(description = "Código del producto, por ejemplo TC001") @PathVariable String codigo) {
        return ResponseEntity.ok(nutricionService.obtener(codigo));
    }

    @PostMapping("/{codigo}")
    @Operation(summary = "Calcular la nutrición de un producto", description = "Si la receta no cambió devuelve el cálculo guardado; si es nueva o cambió, consulta Spoonacular y guarda el resultado")
    @ApiResponse(responseCode = "200", description = "Información nutricional calculada o leída desde la base de datos")
    @ApiResponse(responseCode = "400", description = "Receta inválida o con insumos sin nombre en inglés", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-13T19:49:46\", \"status\": 400, \"mensaje\": \"Estos insumos no tienen nombre en inglés registrado: vainilla\"}")))
    @ApiResponse(responseCode = "503", description = "Spoonacular no disponible, clave inválida o límite diario alcanzado", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-13T19:49:46\", \"status\": 503, \"mensaje\": \"Se alcanzó el límite diario de consultas a Spoonacular\"}")))
    public ResponseEntity<NutricionResponseDTO> calcular(
            @Parameter(description = "Código del producto, por ejemplo TC001") @PathVariable String codigo,
            @Parameter(description = "true para recalcular aunque la receta no haya cambiado") @RequestParam(defaultValue = "false") boolean forzar,
            @Parameter(description = "Insumos y cantidades de una unidad completa del producto") @Valid @RequestBody RecetaRequestDTO receta) {
        return ResponseEntity.ok(nutricionService.calcular(codigo, receta, forzar));
    }
}
