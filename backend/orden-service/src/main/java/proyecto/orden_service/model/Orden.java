package proyecto.orden_service.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes")
@Getter
@Setter
@NoArgsConstructor
public class Orden {

    public static final String PENDIENTE = "Pendiente";
    public static final String PENDIENTE_PAGO = "Pendiente de pago";
    public static final String PROCESANDO = "Procesando";
    public static final String ENVIADO = "Enviado";
    public static final String CANCELADO = "Cancelado";
    public static final String PAGO_RECHAZADO = "Pago rechazado";
    public static final List<String> ESTADOS = List.of(PENDIENTE, PENDIENTE_PAGO, PROCESANDO, ENVIADO, CANCELADO, PAGO_RECHAZADO);
    public static final List<String> SIN_INGRESO = List.of(CANCELADO, PAGO_RECHAZADO, PENDIENTE_PAGO);

    @Id
    @Column(name = "id", length = 20)
    private String id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora", nullable = false)
    private LocalTime hora;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;

    @Column(name = "cliente", nullable = false, length = 120)
    private String cliente;

    @Column(name = "correo", nullable = false, length = 100)
    private String correo;

    @Column(name = "telefono", nullable = false, length = 20)
    private String telefono = "";

    @Column(name = "run", nullable = false, length = 9)
    private String run = "";

    @Column(name = "entrega", nullable = false, length = 300)
    private String entrega;

    @Column(name = "tipo_entrega", nullable = false, length = 10)
    private String tipoEntrega;

    @Column(name = "metodo_pago", nullable = false, length = 15)
    private String metodoPago;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @Column(name = "total", nullable = false)
    private Integer total;

    @Column(name = "tipo_tarjeta", length = 10)
    private String tipoTarjeta;

    @Column(name = "cuotas")
    private Integer cuotas;

    @Column(name = "ultimos4", length = 4)
    private String ultimos4;

    @Column(name = "paga_con")
    private Integer pagaCon;

    @Column(name = "vuelto")
    private Integer vuelto;

    @Column(name = "motivo_rechazo", length = 200)
    private String motivoRechazo;

    @Column(name = "codigo_motivo", length = 40)
    private String codigoMotivo;

    @Column(name = "referencia_pago", length = 20)
    private String referenciaPago;

    @Column(name = "plazo_pago")
    private LocalDateTime plazoPago;

    @Column(name = "codigo_pedido", length = 10)
    private String codigoPedido;

    @Column(name = "motivo_cancelacion", length = 200)
    private String motivoCancelacion;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    // Lo que Catálogo descontó (vitrina e insumos), en JSON, para poder devolverlo si se cancela
    @Column(name = "movimientos_stock", columnDefinition = "TEXT")
    private String movimientosStock;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<DetalleOrden> detalle = new ArrayList<>();

    public void agregarLinea(DetalleOrden linea) {
        linea.setOrden(this);
        detalle.add(linea);
    }
}
