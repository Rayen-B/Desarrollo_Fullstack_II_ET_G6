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
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import proyecto.catalogo_service.dto.ErrorResponseDTO;
import proyecto.catalogo_service.dto.ProductoRequestDTO;
import proyecto.catalogo_service.dto.ProductoResponseDTO;
import proyecto.catalogo_service.dto.RecetaDTO;
import proyecto.catalogo_service.service.FotoService;
import proyecto.catalogo_service.service.ProductoService;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
@Tag(name = "API Productos", description = "Productos, recetas y fotos de la tienda")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private FotoService fotoService;

    @GetMapping
    @Operation(summary = "Listar productos", description = "Filtros opcionales por categoría y texto. Incluye el disponible (vitrina + preparables)")
    @ApiResponse(responseCode = "200", description = "Listado recuperado con éxito")
    public ResponseEntity<List<ProductoResponseDTO>> listar(
            @Parameter(description = "Id o nombre de la categoría", example = "tortas") @RequestParam(required = false) String categoria,
            @Parameter(description = "Texto a buscar en nombre, código o categoría", example = "trufa") @RequestParam(required = false) String q) {
        return ResponseEntity.ok(productoService.listar(categoria, q));
    }

    @GetMapping("/{codigo}")
    @Operation(summary = "Obtener un producto")
    @ApiResponse(responseCode = "200", description = "Producto encontrado")
    @ApiResponse(responseCode = "404", description = "No existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 404, \"mensaje\": \"El producto no existe.\"}")))
    public ResponseEntity<ProductoResponseDTO> obtener(@Parameter(description = "Código del producto", example = "TC001") @PathVariable String codigo) {
        return ResponseEntity.ok(productoService.obtener(codigo));
    }

    @PostMapping
    @Operation(summary = "Crear producto (admin)", description = "La descripción en HTML (Tiptap) se limpia con jsoup antes de guardarla")
    @ApiResponse(responseCode = "201", description = "Producto creado")
    @ApiResponse(responseCode = "400", description = "Datos inválidos", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 400, \"mensaje\": \"El precio no puede ser negativo (0 = producto gratuito)\"}")))
    @ApiResponse(responseCode = "409", description = "Código repetido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 409, \"mensaje\": \"Ya existe un producto con el código TC001.\"}")))
    public ResponseEntity<ProductoResponseDTO> crear(@Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @PutMapping("/{codigo}")
    @Operation(summary = "Editar producto (admin)", description = "El código no se cambia. Si no viene la receta, se mantiene la actual")
    @ApiResponse(responseCode = "200", description = "Producto actualizado")
    public ResponseEntity<ProductoResponseDTO> actualizar(@PathVariable String codigo, @Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.ok(productoService.actualizar(codigo, request));
    }

    @DeleteMapping("/{codigo}")
    @Operation(summary = "Eliminar producto (admin)")
    @ApiResponse(responseCode = "204", description = "Producto eliminado")
    public ResponseEntity<Void> eliminar(@PathVariable String codigo) {
        productoService.eliminar(codigo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{codigo}/receta")
    @Operation(summary = "Obtener la receta", description = "Insumos de una unidad completa (un trozo usa 1/4). Misma forma que recibe Nutrición")
    @ApiResponse(responseCode = "200", description = "Receta encontrada")
    public ResponseEntity<RecetaDTO> obtenerReceta(@PathVariable String codigo) {
        return ResponseEntity.ok(productoService.obtenerReceta(codigo));
    }

    @PutMapping("/{codigo}/receta")
    @Operation(summary = "Cambiar la receta (admin)", description = "Reemplaza la receta completa; una lista vacía deja el producto sin receta")
    @ApiResponse(responseCode = "200", description = "Receta guardada")
    @ApiResponse(responseCode = "400", description = "Insumo inválido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 400, \"mensaje\": \"El insumo vainilla no existe.\"}")))
    public ResponseEntity<ProductoResponseDTO> actualizarReceta(@PathVariable String codigo, @Valid @RequestBody RecetaDTO receta) {
        return ResponseEntity.ok(productoService.actualizarReceta(codigo, receta));
    }

    @PostMapping(value = "/{codigo}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir foto del producto (admin)", description = "JPG, PNG o WEBP de hasta 2 MB. Se guarda en la carpeta media y queda en imagen como URL")
    @ApiResponse(responseCode = "200", description = "Foto guardada")
    @ApiResponse(responseCode = "400", description = "Archivo inválido", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class), examples = @ExampleObject(value = "{\"timestamp\": \"2026-11-20T12:00:00\", \"status\": 400, \"mensaje\": \"La foto debe ser JPG, PNG o WEBP\"}")))
    public ResponseEntity<ProductoResponseDTO> subirFoto(@PathVariable String codigo, @RequestParam("archivo") MultipartFile archivo) {
        return ResponseEntity.ok(productoService.guardarFoto(codigo, archivo));
    }

    @GetMapping("/media/{archivo}")
    @Operation(summary = "Ver una foto subida", description = "Sirve las fotos de la carpeta media")
    @ApiResponse(responseCode = "200", description = "La imagen")
    @ApiResponse(responseCode = "404", description = "No existe", content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    public ResponseEntity<Resource> verFoto(@PathVariable String archivo) {
        return ResponseEntity.ok()
                .contentType(fotoService.tipo(archivo))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(fotoService.cargar(archivo));
    }
}
