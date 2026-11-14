package proyecto.nutricion_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import proyecto.nutricion_service.client.dto.SpoonIngredienteDTO;

import java.util.List;
import java.util.Map;

@FeignClient(name = "spoonacular", url = "${spoonacular.url}")
public interface SpoonacularClient {

    // Recibe una lista de ingredientes en inglés ("300 g flour") y devuelve los nutrientes de cada uno
    @PostMapping(value = "/recipes/parseIngredients", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    List<SpoonIngredienteDTO> analizarIngredientes(@RequestParam("apiKey") String apiKey,
                                                   @RequestBody Map<String, ?> formulario);
}
