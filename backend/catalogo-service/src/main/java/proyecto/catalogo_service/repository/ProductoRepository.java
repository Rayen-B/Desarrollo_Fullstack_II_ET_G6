package proyecto.catalogo_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import proyecto.catalogo_service.model.Producto;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, String> {

    long countByCategoriaId(String categoriaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.codigo IN :codigos ORDER BY p.codigo")
    List<Producto> findParaActualizar(Collection<String> codigos);
}
