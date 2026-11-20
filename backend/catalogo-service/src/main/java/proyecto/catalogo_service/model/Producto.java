package proyecto.catalogo_service.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
public class Producto {

    @Id
    @Column(name = "codigo", length = 20)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @ManyToOne(optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(name = "precio", nullable = false)
    private Integer precio;

    @Column(name = "precio_anterior")
    private Integer precioAnterior;

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "stock_critico", nullable = false)
    private Integer stockCritico;

    @Column(name = "imagen", nullable = false)
    private String imagen;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemReceta> receta = new ArrayList<>();

    // Reutiliza las líneas existentes para no chocar con la restricción única (producto, insumo)
    public void cambiarReceta(List<ItemReceta> items) {
        receta.removeIf(actual -> items.stream().noneMatch(n -> n.getInsumo().getId().equals(actual.getInsumo().getId())));
        for (ItemReceta nuevo : items) {
            receta.stream()
                    .filter(actual -> actual.getInsumo().getId().equals(nuevo.getInsumo().getId()))
                    .findFirst()
                    .ifPresentOrElse(actual -> actual.setCantidad(nuevo.getCantidad()), () -> {
                        nuevo.setProducto(this);
                        receta.add(nuevo);
                    });
        }
    }
}
