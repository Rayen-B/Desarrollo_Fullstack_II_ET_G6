package proyecto.orden_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import proyecto.orden_service.client.dto.MovimientosDTO;
import proyecto.orden_service.client.dto.ProductoCatalogoDTO;
import proyecto.orden_service.client.dto.VentaCatalogoDTO;

// Llamadas directas a catalogo-service por Eureka (no pasan por el Gateway)
@FeignClient(name = "catalogo-service")
public interface CatalogoClient {

    @GetMapping("/api/v1/productos/{codigo}")
    ProductoCatalogoDTO obtenerProducto(@PathVariable("codigo") String codigo);

    @PostMapping("/api/v1/productos/stock/descontar")
    MovimientosDTO descontar(@RequestBody VentaCatalogoDTO venta);

    @PostMapping("/api/v1/productos/stock/devolver")
    void devolver(@RequestBody MovimientosDTO movimientos);
}
