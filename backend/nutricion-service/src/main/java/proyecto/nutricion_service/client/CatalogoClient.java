package proyecto.nutricion_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import proyecto.nutricion_service.dto.RecetaRequestDTO;

// Se busca catalogo-service por su nombre en Eureka
@FeignClient(name = "catalogo-service")
public interface CatalogoClient {

    @GetMapping("/api/v1/productos/{codigo}/receta")
    RecetaRequestDTO obtenerReceta(@PathVariable("codigo") String codigo);
}
