package proyecto.orden_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import proyecto.orden_service.dto.ResumenVentasDTO;
import proyecto.orden_service.service.OrdenService;

@RestController
@RequestMapping("/api/v1/reportes")
@Tag(name = "API Reportes", description = "Resumen de ventas para el panel (Vendedor y Administrador)")
public class ReporteController {

    @Autowired
    private OrdenService ordenService;

    @GetMapping("/resumen")
    @Operation(summary = "Resumen de ventas", description = "Total de órdenes, órdenes válidas, ingresos, ticket promedio y cantidad por estado")
    @ApiResponse(responseCode = "200", description = "Resumen calculado")
    public ResponseEntity<ResumenVentasDTO> resumen(@Parameter(hidden = true) @RequestHeader("X-User-Rol") String rol) {
        return ResponseEntity.ok(ordenService.resumen(rol));
    }
}
