package proyecto.nutricion_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "nutricion_producto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NutricionProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_nutricion")
    private Integer idNutricion;

    @Column(name = "codigo_producto", nullable = false, unique = true, length = 20)
    private String codigoProducto;

    @Column(name = "huella_receta", nullable = false, length = 64)
    private String huellaReceta;

    @Column(name = "calorias", nullable = false, precision = 10, scale = 1)
    private BigDecimal calorias;

    @Column(name = "azucares", nullable = false, precision = 10, scale = 1)
    private BigDecimal azucares;

    @Column(name = "grasas", nullable = false, precision = 10, scale = 1)
    private BigDecimal grasas;

    @Column(name = "proteinas", nullable = false, precision = 10, scale = 1)
    private BigDecimal proteinas;

    @Column(name = "carbohidratos", nullable = false, precision = 10, scale = 1)
    private BigDecimal carbohidratos;

    @Column(name = "alergenos", nullable = false, length = 200)
    private String alergenos;

    @Column(name = "ingredientes_sin_datos", nullable = false, length = 500)
    private String ingredientesSinDatos;

    @Column(name = "calculado_en", nullable = false)
    private LocalDateTime calculadoEn;
}
