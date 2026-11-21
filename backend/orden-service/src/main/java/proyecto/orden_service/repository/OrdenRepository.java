package proyecto.orden_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.orden_service.model.Orden;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrdenRepository extends JpaRepository<Orden, String> {

    List<Orden> findAllByOrderByCreadaEnDesc();

    List<Orden> findByUsuarioIdOrderByCreadaEnDesc(Long usuarioId);

    List<Orden> findByEstadoAndPlazoPagoBefore(String estado, LocalDateTime limite);
}
