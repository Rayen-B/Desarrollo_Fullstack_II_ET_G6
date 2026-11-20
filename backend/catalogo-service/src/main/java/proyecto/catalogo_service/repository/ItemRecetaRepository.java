package proyecto.catalogo_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.catalogo_service.model.ItemReceta;

@Repository
public interface ItemRecetaRepository extends JpaRepository<ItemReceta, Long> {

    long countByInsumoId(String insumoId);
}
