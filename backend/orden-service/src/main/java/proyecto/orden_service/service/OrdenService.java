package proyecto.orden_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

import java.security.SecureRandom;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrdenService {

    private static final Logger log = LoggerFactory.getLogger(OrdenService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final ZoneId CHILE = ZoneId.of("America/Santiago");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    public static final double FACTOR_TROZO = 0.25;

    @Autowired
    private OrdenRepository ordenRepository;

    @Autowired
    private InventarioService inventarioService;

    @Value("${ordenes.horas-plazo-transferencia:24}")
    private long horasPlazo = 24;

    private final SecureRandom random = new SecureRandom();

    // El precio y el nombre se piden a Catálogo: nunca se confía en lo que manda el navegador
    @Transactional
    public OrdenResponseDTO crear(OrdenRequestDTO request, Long usuarioId) {
        Orden orden = new Orden();
        List<ItemVentaCatalogoDTO> paraDescontar = new ArrayList<>();
        for (ItemOrdenRequestDTO item : request.getItems()) {
            String codigo = item.getCodigo().trim().toUpperCase();
            String variante = item.getVariante() == null ? "completa" : item.getVariante();
            ProductoCatalogoDTO producto = inventarioService.producto(codigo);
            boolean trozo = "trozo".equals(variante);
            if (trozo && !"Tortas".equalsIgnoreCase(producto.getCategoria())) {
                throw new DatoInvalidoException("Solo las tortas se venden por trozo.");
            }
            int precio = trozo ? (int) Math.round(producto.getPrecio() * FACTOR_TROZO) : producto.getPrecio();
            orden.agregarLinea(new DetalleOrden(codigo, producto.getNombre(), precio, item.getCantidad(), variante));
            paraDescontar.add(new ItemVentaCatalogoDTO(codigo, variante, item.getCantidad()));
        }
        int total = orden.getDetalle().stream().mapToInt(d -> d.getPrecio() * d.getCantidad()).sum();
        DatosPagoDTO pago = request.getDatosPago() == null ? new DatosPagoDTO() : request.getDatosPago();
        boolean aprobado = Boolean.TRUE.equals(request.getPagoAprobado());

        LocalDateTime ahora = LocalDateTime.now(CHILE);
        orden.setId(nuevoId());
        orden.setUsuarioId(usuarioId);
        orden.setFecha(ahora.toLocalDate());
        orden.setHora(ahora.toLocalTime().withSecond(0).withNano(0));
        orden.setCreadaEn(ahora);
        orden.setCliente(request.getCliente().trim());
        orden.setCorreo(request.getCorreo().trim().toLowerCase());
        orden.setTelefono(limpio(request.getTelefono()));
        orden.setRun(limpio(request.getRun()).toUpperCase());
        orden.setEntrega(request.getEntrega().trim());
        orden.setTipoEntrega(request.getTipoEntrega());
        orden.setMetodoPago(request.getMetodoPago());
        orden.setTotal(total);

        if (!aprobado) {
            orden.setEstado(Orden.PAGO_RECHAZADO);
            orden.setMotivoRechazo(pago.getMotivoRechazo());
            orden.setCodigoMotivo(pago.getCodigoMotivo());
            return aDto(ordenRepository.save(orden));
        }

        aplicarDatosDePago(orden, pago, ahora);
        MovimientosDTO movimientos = inventarioService.descontar(paraDescontar);
        orden.setMovimientosStock(aJson(movimientos));
        try {
            return aDto(ordenRepository.saveAndFlush(orden));
        } catch (RuntimeException e) {
            log.error("No se pudo guardar la orden {}; se devuelve el stock descontado", orden.getId());
            inventarioService.devolver(movimientos);
            throw e;
        }
    }

    public List<OrdenResponseDTO> misOrdenes(Long usuarioId) {
        return ordenRepository.findByUsuarioIdOrderByCreadaEnDesc(usuarioId).stream().map(OrdenService::aDto).toList();
    }

    public List<OrdenResponseDTO> listar(String rol) {
        exigirPersonal(rol);
        return ordenRepository.findAllByOrderByCreadaEnDesc().stream().map(OrdenService::aDto).toList();
    }

    // Un cliente solo ve sus órdenes; si pide una ajena se responde como si no existiera
    public OrdenResponseDTO obtener(String id, Long usuarioId, String rol) {
        Orden orden = buscar(id);
        if (!esPersonal(rol) && !Objects.equals(orden.getUsuarioId(), usuarioId)) {
            throw new RecursoNoEncontradoException("La orden no existe.");
        }
        return aDto(orden);
    }

    @Transactional
    public OrdenResponseDTO cambiarEstado(String id, String estado, String rol) {
        exigirPersonal(rol);
        if (!Orden.ESTADOS.contains(estado)) throw new DatoInvalidoException("Estado no válido.");
        if (Orden.CANCELADO.equals(estado)) return cancelar(id, "Cancelada por la tienda", rol);
        Orden orden = buscar(id);
        if (estaCancelada(orden)) throw new ConflictoException("La orden está cancelada y ya no cambia de estado.");
        orden.setEstado(estado);
        return aDto(ordenRepository.save(orden));
    }

    @Transactional
    public OrdenResponseDTO cancelar(String id, String motivo, String rol) {
        exigirPersonal(rol);
        return aDto(cancelarOrden(buscar(id), motivo));
    }

    @Transactional
    public void eliminar(String id, String rol) {
        if (!"Administrador".equals(rol)) throw new SinPermisoException("No tienes permiso para esta acción");
        ordenRepository.delete(buscar(id));
    }

    @Transactional
    public int cancelarTransferenciasVencidas() {
        List<Orden> vencidas = ordenRepository.findByEstadoAndPlazoPagoBefore(Orden.PENDIENTE_PAGO, LocalDateTime.now(CHILE));
        int canceladas = 0;
        for (Orden orden : vencidas) {
            try {
                cancelarOrden(orden, "Plazo de pago vencido");
                canceladas++;
            } catch (RuntimeException e) {
                log.warn("No se pudo cancelar la transferencia vencida {}: {}", orden.getId(), e.getMessage());
            }
        }
        return canceladas;
    }

    public ResumenVentasDTO resumen(String rol) {
        exigirPersonal(rol);
        List<Orden> ordenes = ordenRepository.findAll();
        List<Orden> validas = ordenes.stream().filter(o -> !Orden.SIN_INGRESO.contains(o.getEstado())).toList();
        long ingresos = validas.stream().mapToLong(Orden::getTotal).sum();
        Map<String, Long> porEstado = new LinkedHashMap<>();
        Orden.ESTADOS.forEach(e -> porEstado.put(e, ordenes.stream().filter(o -> e.equals(o.getEstado())).count()));
        return new ResumenVentasDTO(ordenes.size(), validas.size(), ingresos,
                validas.isEmpty() ? 0 : Math.round((double) ingresos / validas.size()), porEstado);
    }

    private Orden cancelarOrden(Orden orden, String motivo) {
        if (estaCancelada(orden)) throw new ConflictoException("La orden ya estaba cancelada.");
        inventarioService.devolver(movimientosDe(orden));
        orden.setEstado(Orden.CANCELADO);
        orden.setMotivoCancelacion(motivo == null || motivo.isBlank() ? "Cancelada por la tienda" : motivo.trim());
        orden.setFechaCancelacion(LocalDateTime.now(CHILE));
        orden.setMovimientosStock(null);
        return ordenRepository.save(orden);
    }

    // Las órdenes de ejemplo no guardan movimientos: se devuelven sus unidades completas a la vitrina, como en el front
    private MovimientosDTO movimientosDe(Orden orden) {
        if (orden.getMovimientosStock() != null) {
            try {
                return JSON.readValue(orden.getMovimientosStock(), MovimientosDTO.class);
            } catch (JsonProcessingException e) {
                log.warn("Movimientos ilegibles en la orden {}", orden.getId());
            }
        }
        Map<String, Integer> vitrina = orden.getDetalle().stream()
                .filter(d -> !"trozo".equals(d.getVariante()))
                .collect(Collectors.toMap(DetalleOrden::getCodigo, DetalleOrden::getCantidad, Integer::sum));
        return new MovimientosDTO(vitrina, new HashMap<>());
    }

    private void aplicarDatosDePago(Orden orden, DatosPagoDTO pago, LocalDateTime ahora) {
        switch (orden.getMetodoPago()) {
            case "transferencia" -> {
                orden.setEstado(Orden.PENDIENTE_PAGO);
                orden.setReferenciaPago(orden.getId());
                orden.setPlazoPago(ahora.plusHours(horasPlazo));
            }
            case "efectivo" -> {
                orden.setEstado(Orden.PENDIENTE);
                orden.setCodigoPedido("PD-" + ultimos(orden.getId().replaceAll("\\D", ""), 4));
                if (pago.getPagaCon() != null && pago.getPagaCon() > 0) {
                    if (pago.getPagaCon() < orden.getTotal()) throw new DatoInvalidoException("El monto con que pagas no alcanza para el total.");
                    orden.setPagaCon(pago.getPagaCon());
                    orden.setVuelto(pago.getPagaCon() - orden.getTotal());
                }
            }
            default -> {
                orden.setEstado(Orden.PENDIENTE);
                orden.setTipoTarjeta(pago.getTipoTarjeta());
                orden.setCuotas("credito".equals(pago.getTipoTarjeta()) && pago.getCuotas() != null ? pago.getCuotas() : 1);
                orden.setUltimos4(pago.getUltimos4());
            }
        }
    }

    private String nuevoId() {
        String id;
        do {
            id = "PD-" + ultimos(String.valueOf(System.currentTimeMillis()), 6) + (random.nextInt(90) + 10);
        } while (ordenRepository.existsById(id));
        return id;
    }

    private Orden buscar(String id) {
        String limpio = limpio(id).replaceFirst("^#", "").toUpperCase();
        return ordenRepository.findById(limpio).orElseThrow(() -> new RecursoNoEncontradoException("La orden no existe."));
    }

    private static boolean estaCancelada(Orden orden) {
        return Orden.CANCELADO.equals(orden.getEstado()) || Orden.PAGO_RECHAZADO.equals(orden.getEstado());
    }

    private static boolean esPersonal(String rol) {
        return "Vendedor".equals(rol) || "Administrador".equals(rol);
    }

    private static void exigirPersonal(String rol) {
        if (!esPersonal(rol)) throw new SinPermisoException("No tienes permiso para esta acción");
    }

    private static String aJson(MovimientosDTO movimientos) {
        try {
            return JSON.writeValueAsString(movimientos);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudieron guardar los movimientos de stock", e);
        }
    }

    private static String limpio(String texto) {
        return texto == null ? "" : texto.trim();
    }

    private static String ultimos(String texto, int n) {
        return texto.length() <= n ? texto : texto.substring(texto.length() - n);
    }

    public static String formatearMonto(int monto) {
        DecimalFormatSymbols simbolos = new DecimalFormatSymbols();
        simbolos.setGroupingSeparator('.');
        return "$" + new DecimalFormat("#,##0", simbolos).format(monto);
    }

    static OrdenResponseDTO aDto(Orden o) {
        return OrdenResponseDTO.builder()
                .id(o.getId())
                .numero("#" + o.getId())
                .fecha(o.getFecha())
                .hora(o.getHora().format(HORA))
                .cliente(o.getCliente())
                .correo(o.getCorreo())
                .telefono(o.getTelefono())
                .run(o.getRun())
                .entrega(o.getEntrega())
                .tipoEntrega(o.getTipoEntrega())
                .metodoPago(o.getMetodoPago())
                .estado(o.getEstado())
                .total(o.getTotal())
                .montoTotal(formatearMonto(o.getTotal()))
                .detalle(o.getDetalle().stream()
                        .map(d -> new OrdenResponseDTO.DetalleDTO(d.getCodigo(), d.getNombre(), d.getPrecio(), d.getCantidad(), d.getVariante()))
                        .toList())
                .tipoTarjeta(o.getTipoTarjeta())
                .cuotas(o.getCuotas())
                .ultimos4(o.getUltimos4())
                .pagaCon(o.getPagaCon())
                .vuelto(o.getVuelto())
                .motivoRechazo(o.getMotivoRechazo())
                .codigoMotivo(o.getCodigoMotivo())
                .referenciaPago(o.getReferenciaPago())
                .plazoPago(o.getPlazoPago())
                .codigoPedido(o.getCodigoPedido())
                .motivoCancelacion(o.getMotivoCancelacion())
                .fechaCancelacion(o.getFechaCancelacion())
                .build();
    }
}
