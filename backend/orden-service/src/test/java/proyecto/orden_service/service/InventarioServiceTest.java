package proyecto.orden_service.service;

import feign.FeignException;
import feign.Request;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.orden_service.client.CatalogoClient;
import proyecto.orden_service.exception.ConflictoException;
import proyecto.orden_service.exception.DatoInvalidoException;
import proyecto.orden_service.exception.ServicioExternoException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private CatalogoClient catalogoClient;

    @InjectMocks
    private InventarioService inventarioService;

    private final Request request = Request.create(Request.HttpMethod.POST, "/api/v1/productos/stock/descontar", Map.of(), null, StandardCharsets.UTF_8, null);

    @Test
    void sinStockTraeElMensajeDeCatalogo() {
        byte[] cuerpo = "{\"status\":409,\"mensaje\":\"Ya no hay stock suficiente de Torta Trufa.\"}".getBytes(StandardCharsets.UTF_8);
        when(catalogoClient.descontar(any())).thenThrow(new FeignException.Conflict("conflicto", request, cuerpo, null));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> inventarioService.descontar(List.of()));
        assertEquals("Ya no hay stock suficiente de Torta Trufa.", ex.getMessage());
    }

    @Test
    void productoInexistenteDa400() {
        when(catalogoClient.obtenerProducto("XX1")).thenThrow(new FeignException.NotFound("no", request, null, null));
        assertThrows(DatoInvalidoException.class, () -> inventarioService.producto("XX1"));
    }

    @Test
    void catalogoCaidoDa503() {
        when(catalogoClient.obtenerProducto("TC001")).thenThrow(new FeignException.ServiceUnavailable("caido", request, null, null));
        assertThrows(ServicioExternoException.class, () -> inventarioService.producto("TC001"));
    }
}
