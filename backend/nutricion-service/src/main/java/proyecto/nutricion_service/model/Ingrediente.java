package proyecto.nutricion_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ingredientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ingrediente {

    @Id
    @Column(name = "insumo_id", length = 40)
    private String insumoId;

    @Column(name = "nombre", nullable = false, length = 60)
    private String nombre;

    @Column(name = "nombre_ingles", nullable = false, length = 60)
    private String nombreIngles;

    @Column(name = "unidad", nullable = false, length = 5)
    private String unidad;

    @Column(name = "alergenos", nullable = false, length = 200)
    private String alergenos;
}
