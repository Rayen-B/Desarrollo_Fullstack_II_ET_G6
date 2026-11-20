package proyecto.catalogo_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import proyecto.catalogo_service.dto.ItemVentaDTO;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.Producto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CalculoStockTest {

    private Producto torta;
    private Map<String, Double> stock;

    @BeforeEach
    void setUp() {
        Insumo harina = Datos.insumo("harina", 1000);
        Insumo naranjas = Datos.insumo("naranjas", 3);
        torta = Datos.producto("TC001", 2, List.of(Datos.linea(harina, 300), Datos.linea(naranjas, 3)));
        stock = new HashMap<>(Map.of("harina", 1000.0, "naranjas", 3.0));
    }

    @Test
    void disponibleSumaVitrinaYPreparables() {
        assertEquals(1, CalculoStock.preparables(torta.getReceta(), stock, 1));
        assertEquals(3, CalculoStock.disponible(torta, stock));
    }

    @Test
    void sinRecetaNoSePuedePreparar() {
        Producto jugo = Datos.producto("BEB001", 5, List.of());
        assertEquals(0, CalculoStock.preparables(jugo.getReceta(), stock, 1));
        assertEquals(5, CalculoStock.disponible(jugo, stock));
    }

    @Test
    void completasSalenPrimeroDeVitrina() {
        CalculoStock.Resultado r = CalculoStock.simular(List.of(new ItemVentaDTO("TC001", 1.0, null, 3)), Map.of("TC001", torta), stock);

        assertTrue(r.ok());
        assertEquals(0, r.vitrina().get("TC001"));
        assertEquals(2, r.movimientos().getVitrina().get("TC001"));
        assertEquals(700.0, r.insumos().get("harina"));
        assertEquals(0.0, r.insumos().get("naranjas"));
        assertEquals(300.0, r.movimientos().getInsumos().get("harina"));
    }

    @Test
    void trozoUsaUnCuartoDeLaRecetaYNoTocaVitrina() {
        CalculoStock.Resultado r = CalculoStock.simular(List.of(new ItemVentaDTO("tc001", null, "trozo", 2)), Map.of("TC001", torta), stock);

        assertTrue(r.ok());
        assertEquals(2, r.vitrina().get("TC001"));
        assertEquals(850.0, r.insumos().get("harina"));
        assertEquals(1.5, r.insumos().get("naranjas"));
        assertTrue(r.movimientos().getVitrina().isEmpty());
    }

    @Test
    void siNoAlcanzaDevuelveElFaltante() {
        CalculoStock.Resultado r = CalculoStock.simular(List.of(new ItemVentaDTO("TC001", 1.0, null, 4)), Map.of("TC001", torta), stock);

        assertFalse(r.ok());
        assertEquals("Producto TC001", r.faltante());
    }

    @Test
    void productoInexistenteLanza404() {
        List<ItemVentaDTO> items = List.of(new ItemVentaDTO("XX999", 1.0, null, 1));
        assertThrows(RecursoNoEncontradoException.class, () -> CalculoStock.simular(items, Map.of("TC001", torta), stock));
    }
}
