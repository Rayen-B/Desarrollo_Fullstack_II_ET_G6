package proyecto.catalogo_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.catalogo_service.dto.ItemVentaDTO;
import proyecto.catalogo_service.dto.MovimientosDTO;
import proyecto.catalogo_service.dto.VentaRequestDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.Producto;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ProductoRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private InsumoRepository insumoRepository;

    @InjectMocks
    private StockService stockService;

    private Insumo harina;
    private Producto torta;

    @BeforeEach
    void setUp() {
        harina = Datos.insumo("harina", 1000);
        torta = Datos.producto("TC001", 1, List.of(Datos.linea(harina, 300)));
    }

    private VentaRequestDTO venta(int cantidad) {
        return new VentaRequestDTO(List.of(new ItemVentaDTO("TC001", 1.0, null, cantidad)));
    }

    @Test
    void descontarGuardaYDevuelveMovimientos() {
        when(insumoRepository.findAll()).thenReturn(List.of(harina));
        when(productoRepository.findAllById(anyList())).thenReturn(List.of(torta));

        MovimientosDTO m = stockService.descontar(venta(2));

        assertEquals(1, m.getVitrina().get("TC001"));
        assertEquals(300.0, m.getInsumos().get("harina"));
        assertEquals(0, torta.getStock());
        assertEquals(700.0, harina.getStock());
        verify(productoRepository).saveAll(any());
        verify(insumoRepository).saveAll(any());
    }

    @Test
    void descontarSinStockNoGuardaNada() {
        when(insumoRepository.findAll()).thenReturn(List.of(harina));
        when(productoRepository.findAllById(anyList())).thenReturn(List.of(torta));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> stockService.descontar(venta(5)));

        assertEquals("Ya no hay stock suficiente de Producto TC001.", ex.getMessage());
        assertEquals(1, torta.getStock());
        assertEquals(1000.0, harina.getStock());
        verify(productoRepository, never()).saveAll(any());
    }

    @Test
    void verificarNoModificaElStock() {
        when(insumoRepository.findAll()).thenReturn(List.of(harina));
        when(productoRepository.findAllById(anyList())).thenReturn(List.of(torta));

        assertTrue(stockService.verificar(venta(4)).isOk());
        assertEquals(1, torta.getStock());
        assertEquals(1000.0, harina.getStock());
    }

    @Test
    void verificarAvisaSiNoAlcanza() {
        when(insumoRepository.findAll()).thenReturn(List.of(harina));
        when(productoRepository.findAllById(anyList())).thenReturn(List.of(torta));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> stockService.verificar(venta(5)));
        assertEquals("No hay stock suficiente de Producto TC001.", ex.getMessage());
    }

    @Test
    void devolverSumaVitrinaEInsumos() {
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));
        when(insumoRepository.findById("harina")).thenReturn(Optional.of(harina));

        stockService.devolver(new MovimientosDTO(Map.of("TC001", 2), Map.of("harina", 75.5)));

        assertEquals(3, torta.getStock());
        assertEquals(1075.5, harina.getStock());
    }

    @Test
    void devolverRechazaNegativos() {
        MovimientosDTO m = new MovimientosDTO(Map.of("TC001", -1), Map.of());
        assertThrows(DatoInvalidoException.class, () -> stockService.devolver(m));
        verifyNoInteractions(productoRepository);
    }
}
