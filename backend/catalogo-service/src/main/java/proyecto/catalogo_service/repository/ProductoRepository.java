package proyecto.catalogo_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.catalogo_service.model.Producto;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, String> {

    long countByCategoriaId(String categoriaId);
}
