package proyecto.orden_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.orden_service.client.dto.ItemVentaCatalogoDTO;
import proyecto.orden_service.client.dto.MovimientosDTO;
import proyecto.orden_service.client.dto.ProductoCatalogoDTO;
import proyecto.orden_service.dto.*;
import proyecto.orden_service.exception.ConflictoException;
import proyecto.orden_service.exception.DatoInvalidoException;
import proyecto.orden_service.exception.RecursoNoEncontradoException;
import proyecto.orden_service.exception.SinPermisoException;
import proyecto.orden_service.model.DetalleOrden;
import proyecto.orden_service.model.Orden;
import proyecto.orden_service.repository.OrdenRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrdenServiceTest {

    @Mock
    private OrdenRepository ordenRepository;

    @Mock
    private InventarioService inventarioService;

    @InjectMocks
    private OrdenService ordenService;

    private final MovimientosDTO movimientos = new MovimientosDTO(Map.of("TL004", 1), Map.of("harina", 62.5));

    @BeforeEach
    void setUp() {
        lenient().when(inventarioService.producto("TL004")).thenReturn(new ProductoCatalogoDTO("TL004", "Torta Trufa", "Tortas", 18900));
        lenient().when(inventarioService.producto("BEB001")).thenReturn(new ProductoCatalogoDTO("BEB001", "Jugo de Frutilla", "Bebestibles", 1500));
        lenient().when(ordenRepository.save(any(Orden.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(ordenRepository.saveAndFlush(any(Orden.class))).thenAnswer(i -> i.getArgument(0));
    }

    private OrdenRequestDTO pedido(String metodo, boolean aprobado, DatosPagoDTO pago, ItemOrdenRequestDTO... items) {
        return new OrdenRequestDTO("Armando Esteban Quito", "Armando.Quito@gmail.com", "+56 9 6543 2109", "", "Calle Prat 789",
                "despacho", metodo, List.of(items), aprobado, pago);
    }

    private Orden ordenGuardada(String estado, String movimientosJson) {
        Orden o = new Orden();
        o.setId("PD-1");
        o.setUsuarioId(4L);
        o.setFecha(LocalDate.now());
        o.setHora(LocalTime.NOON);
        o.setCreadaEn(LocalDateTime.now());
        o.setCliente("Armando");
        o.setCorreo("armando.quito@gmail.com");
        o.setEntrega("Calle Prat 789");
        o.setTipoEntrega("despacho");
        o.setMetodoPago("tarjeta");
        o.setEstado(estado);
        o.setTotal(37800);
        o.setMovimientosStock(movimientosJson);
        o.agregarLinea(new DetalleOrden("TL004", "Torta Trufa", 18900, 2, "completa"));
        o.agregarLinea(new DetalleOrden("TL004", "Torta Trufa", 4725, 1, "trozo"));
        return o;
    }

    @Test
    void usaElPrecioDelCatalogoYDescuentaElStock() {
        when(inventarioService.descontar(anyList())).thenReturn(movimientos);

        OrdenResponseDTO r = ordenService.crear(pedido("tarjeta", true, new DatosPagoDTO("credito", 3, "0366", null, null, null),
                new ItemOrdenRequestDTO("tl004", 2, null), new ItemOrdenRequestDTO("TL004", 1, "trozo")), 4L);

        assertEquals(18900 * 2 + 4725, r.getTotal());
        assertEquals("$42.525", r.getMontoTotal());
        assertEquals(4725, r.getDetalle().get(1).getPrecio());
        assertEquals("Pendiente", r.getEstado());
        assertEquals("0366", r.getUltimos4());
        assertEquals(3, r.getCuotas());
        assertEquals("armando.quito@gmail.com", r.getCorreo());
        assertTrue(r.getId().matches("PD-\\d{8}"));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ItemVentaCatalogoDTO>> items = ArgumentCaptor.forClass(List.class);
        verify(inventarioService).descontar(items.capture());
        assertEquals("trozo", items.getValue().get(1).getVariante());
    }

    @Test
    void pagoRechazadoNoTocaElStock() {
        OrdenResponseDTO r = ordenService.crear(pedido("tarjeta", false, new DatosPagoDTO(null, null, null, null, "Fondos insuficientes", "fondos"),
                new ItemOrdenRequestDTO("TL004", 1, null)), 4L);

        assertEquals("Pago rechazado", r.getEstado());
        assertEquals("Fondos insuficientes", r.getMotivoRechazo());
        verify(inventarioService, never()).descontar(anyList());
    }

    @Test
    void sinStockNoSeCreaLaOrden() {
        when(inventarioService.descontar(anyList())).thenThrow(new ConflictoException("Ya no hay stock suficiente de Torta Trufa."));

        ConflictoException ex = assertThrows(ConflictoException.class, () ->
                ordenService.crear(pedido("tarjeta", true, null, new ItemOrdenRequestDTO("TL004", 99, null)), 4L));

        assertEquals("Ya no hay stock suficiente de Torta Trufa.", ex.getMessage());
        verify(ordenRepository, never()).saveAndFlush(any());
    }

    @Test
    void soloLasTortasSeVendenPorTrozo() {
        assertThrows(DatoInvalidoException.class, () ->
                ordenService.crear(pedido("tarjeta", true, null, new ItemOrdenRequestDTO("BEB001", 1, "trozo")), 4L));
        verify(inventarioService, never()).descontar(anyList());
    }

    @Test
    void transferenciaQuedaPendienteDePagoConPlazo() {
        when(inventarioService.descontar(anyList())).thenReturn(movimientos);

        OrdenResponseDTO r = ordenService.crear(pedido("transferencia", true, null, new ItemOrdenRequestDTO("TL004", 1, null)), 4L);

        assertEquals("Pendiente de pago", r.getEstado());
        assertEquals(r.getId(), r.getReferenciaPago());
        assertTrue(r.getPlazoPago().isAfter(LocalDateTime.now().plusHours(20)));
    }

    @Test
    void efectivoCalculaElVueltoYElCodigo() {
        when(inventarioService.descontar(anyList())).thenReturn(movimientos);

        OrdenResponseDTO r = ordenService.crear(pedido("efectivo", true, new DatosPagoDTO(null, null, null, 20000, null, null),
                new ItemOrdenRequestDTO("TL004", 1, null)), 4L);

        assertEquals(1100, r.getVuelto());
        assertTrue(r.getCodigoPedido().matches("PD-\\d{4}"));
    }

    @Test
    void efectivoQueNoAlcanzaDa400() {
        assertThrows(DatoInvalidoException.class, () -> ordenService.crear(
                pedido("efectivo", true, new DatosPagoDTO(null, null, null, 1000, null, null), new ItemOrdenRequestDTO("TL004", 1, null)), 4L));
        verify(inventarioService, never()).descontar(anyList());
    }

    @Test
    void siNoSePuedeGuardarSeDevuelveElStock() {
        when(inventarioService.descontar(anyList())).thenReturn(movimientos);
        when(ordenRepository.saveAndFlush(any(Orden.class))).thenThrow(new IllegalStateException("BD caída"));

        assertThrows(IllegalStateException.class, () ->
                ordenService.crear(pedido("tarjeta", true, null, new ItemOrdenRequestDTO("TL004", 1, null)), 4L));
        verify(inventarioService).devolver(movimientos);
    }

    @Test
    void cancelarDevuelveLoQueSeDesconto() {
        Orden orden = ordenGuardada("Pendiente", "{\"vitrina\":{\"TL004\":1},\"insumos\":{\"harina\":62.5}}");
        when(ordenRepository.findById("PD-1")).thenReturn(Optional.of(orden));

        OrdenResponseDTO r = ordenService.cancelar("#pd-1", "Sin stock de repuesto", "Vendedor");

        ArgumentCaptor<MovimientosDTO> devuelto = ArgumentCaptor.forClass(MovimientosDTO.class);
        verify(inventarioService).devolver(devuelto.capture());
        assertEquals(62.5, devuelto.getValue().getInsumos().get("harina"));
        assertEquals("Cancelado", r.getEstado());
        assertEquals("Sin stock de repuesto", r.getMotivoCancelacion());
        assertNull(orden.getMovimientosStock());
    }

    @Test
    void ordenDeEjemploDevuelveSoloLasCompletasALaVitrina() {
        when(ordenRepository.findById("PD-1")).thenReturn(Optional.of(ordenGuardada("Enviado", null)));

        ordenService.cancelar("PD-1", null, "Administrador");

        ArgumentCaptor<MovimientosDTO> devuelto = ArgumentCaptor.forClass(MovimientosDTO.class);
        verify(inventarioService).devolver(devuelto.capture());
        assertEquals(Map.of("TL004", 2), devuelto.getValue().getVitrina());
    }

    @Test
    void noSeCancelaDosVeces() {
        when(ordenRepository.findById("PD-1")).thenReturn(Optional.of(ordenGuardada("Cancelado", null)));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> ordenService.cancelar("PD-1", null, "Vendedor"));
        assertEquals("La orden ya estaba cancelada.", ex.getMessage());
        verifyNoInteractions(inventarioService);
    }

    @Test
    void clienteNoPuedeGestionarOrdenes() {
        assertThrows(SinPermisoException.class, () -> ordenService.cancelar("PD-1", null, "Cliente"));
        assertThrows(SinPermisoException.class, () -> ordenService.listar("Cliente"));
        assertThrows(SinPermisoException.class, () -> ordenService.eliminar("PD-1", "Vendedor"));
    }

    @Test
    void clienteNoVeOrdenesAjenas() {
        when(ordenRepository.findById("PD-1")).thenReturn(Optional.of(ordenGuardada("Pendiente", null)));

        assertThrows(RecursoNoEncontradoException.class, () -> ordenService.obtener("PD-1", 99L, "Cliente"));
        assertEquals("PD-1", ordenService.obtener("PD-1", 4L, "Cliente").getId());
        assertEquals("PD-1", ordenService.obtener("PD-1", 1L, "Vendedor").getId());
    }

    @Test
    void cambiarEstadoValidaYNoRevivelasCanceladas() {
        when(ordenRepository.findById("PD-1")).thenReturn(Optional.of(ordenGuardada("Cancelado", null)));

        assertThrows(DatoInvalidoException.class, () -> ordenService.cambiarEstado("PD-1", "Perdido", "Vendedor"));
        assertThrows(ConflictoException.class, () -> ordenService.cambiarEstado("PD-1", "Enviado", "Vendedor"));
    }

    @Test
    void cancelaLasTransferenciasVencidas() {
        Orden vencida = ordenGuardada("Pendiente de pago", "{\"vitrina\":{},\"insumos\":{\"harina\":10.0}}");
        when(ordenRepository.findByEstadoAndPlazoPagoBefore(eq("Pendiente de pago"), any())).thenReturn(List.of(vencida));

        assertEquals(1, ordenService.cancelarTransferenciasVencidas());
        assertEquals("Cancelado", vencida.getEstado());
        assertEquals("Plazo de pago vencido", vencida.getMotivoCancelacion());
    }

    @Test
    void resumenComoElFront() {
        Orden a = ordenGuardada("Enviado", null);
        Orden b = ordenGuardada("Cancelado", null);
        Orden c = ordenGuardada("Pendiente", null);
        c.setTotal(10000);
        when(ordenRepository.findAll()).thenReturn(List.of(a, b, c));

        ResumenVentasDTO r = ordenService.resumen("Administrador");

        assertEquals(3, r.getTotalOrdenes());
        assertEquals(2, r.getOrdenesValidas());
        assertEquals(47800, r.getIngresos());
        assertEquals(23900, r.getTicketPromedio());
        assertEquals(1L, r.getPorEstado().get("Cancelado"));
    }
}
