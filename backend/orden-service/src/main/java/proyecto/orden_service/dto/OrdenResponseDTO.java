package proyecto.orden_service.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrdenResponseDTO {

    @Schema(example = "PD-48213077")
    private String id;

    @Schema(example = "#PD-48213077")
    private String numero;

    @Schema(example = "2026-11-21")
    private LocalDate fecha;

    @Schema(example = "16:05")
    private String hora;

    private String cliente;
    private String correo;
    private String telefono;
    private String run;
    private String entrega;

    @Schema(example = "despacho")
    private String tipoEntrega;

    @Schema(example = "tarjeta")
    private String metodoPago;

    @Schema(example = "Pendiente")
    private String estado;

    @Schema(example = "39800")
    private Integer total;

    @Schema(example = "$39.800")
    private String montoTotal;

    private List<DetalleDTO> detalle;

    private String tipoTarjeta;
    private Integer cuotas;
    private String ultimos4;
    private Integer pagaCon;
    private Integer vuelto;
    private String motivoRechazo;
    private String codigoMotivo;
    private String referenciaPago;
    private LocalDateTime plazoPago;
    private String codigoPedido;
    private String motivoCancelacion;
    private LocalDateTime fechaCancelacion;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetalleDTO {
        @Schema(example = "TC002")
        private String codigo;
        @Schema(example = "Torta Selva Negra")
        private String nombre;
        @Schema(description = "Precio unitario (el trozo ya viene a 1/4)", example = "19900")
        private Integer precio;
        @Schema(example = "2")
        private Integer cantidad;
        @Schema(example = "completa")
        private String variante;
    }
}
