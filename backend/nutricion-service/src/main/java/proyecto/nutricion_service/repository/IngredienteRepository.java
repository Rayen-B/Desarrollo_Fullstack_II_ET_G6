package proyecto.nutricion_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import proyecto.nutricion_service.model.Ingrediente;

@Repository
public interface IngredienteRepository extends JpaRepository<Ingrediente, String> {
}
