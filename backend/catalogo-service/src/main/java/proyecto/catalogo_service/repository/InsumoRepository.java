package proyecto.catalogo_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import proyecto.catalogo_service.model.Insumo;

import java.util.List;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, String> {

    // Bloquea las filas hasta terminar la venta: dos compras al mismo tiempo no pueden usar el mismo stock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Insumo i ORDER BY i.id")
    List<Insumo> findTodosParaActualizar();
}
