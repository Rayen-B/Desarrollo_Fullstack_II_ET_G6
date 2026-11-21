package proyecto.catalogo_service.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "receta_items")
@Getter
@Setter
@NoArgsConstructor
public class ItemReceta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_codigo", nullable = false)
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad", nullable = false)
    private Double cantidad;

    public ItemReceta(Insumo insumo, Double cantidad) {
        this.insumo = insumo;
        this.cantidad = cantidad;
    }
}
