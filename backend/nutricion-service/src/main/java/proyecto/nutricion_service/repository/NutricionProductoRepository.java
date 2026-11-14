package proyecto.nutricion_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.nutricion_service.model.NutricionProducto;

import java.util.Optional;

@Repository
public interface NutricionProductoRepository extends JpaRepository<NutricionProducto, Integer> {

    Optional<NutricionProducto> findByCodigoProducto(String codigoProducto);
}
