package proyecto.catalogo_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.catalogo_service.model.Categoria;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, String> {
}
