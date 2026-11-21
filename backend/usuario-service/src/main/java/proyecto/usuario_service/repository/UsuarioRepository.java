package proyecto.usuario_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.usuario_service.model.Usuario;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    Optional<Usuario> findByUsuarioIgnoreCase(String usuario);

    Optional<Usuario> findByRunIgnoreCase(String run);
}
