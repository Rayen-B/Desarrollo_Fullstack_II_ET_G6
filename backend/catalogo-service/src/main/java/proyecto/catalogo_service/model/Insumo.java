package proyecto.catalogo_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "insumos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Insumo {

    @Id
    @Column(name = "id", length = 40)
    private String id;

    @Column(name = "nombre", nullable = false, unique = true, length = 40)
    private String nombre;

    @Column(name = "unidad", nullable = false, length = 5)
    private String unidad;

    @Column(name = "stock", nullable = false)
    private Double stock;

    @Column(name = "minimo", nullable = false)
    private Double minimo;
}
