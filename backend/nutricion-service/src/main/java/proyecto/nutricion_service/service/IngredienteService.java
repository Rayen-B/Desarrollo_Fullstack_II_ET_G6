package proyecto.nutricion_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import proyecto.nutricion_service.dto.IngredienteDTO;
import proyecto.nutricion_service.exception.DatoInvalidoException;
import proyecto.nutricion_service.model.Ingrediente;
import proyecto.nutricion_service.repository.IngredienteRepository;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IngredienteService {

    @Autowired
    private IngredienteRepository ingredienteRepository;

    public List<IngredienteDTO> listarTodos() {
        return ingredienteRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Crea o actualiza la traducción y los alérgenos de un insumo
    public IngredienteDTO guardar(String insumoId, IngredienteDTO request) {
        String id = insumoId == null ? "" : insumoId.trim().toLowerCase();
        if (!id.matches("^[a-z0-9-]{2,40}$")) {
            throw new DatoInvalidoException("El id del insumo solo admite minúsculas, números y guiones (2 a 40)");
        }
        Ingrediente ingrediente = ingredienteRepository.findById(id).orElseGet(Ingrediente::new);
        ingrediente.setInsumoId(id);
        ingrediente.setNombre(request.getNombre().trim());
        ingrediente.setNombreIngles(request.getNombreIngles().trim().toLowerCase());
        ingrediente.setUnidad(request.getUnidad());
        ingrediente.setAlergenos(request.getAlergenos() == null ? "" : request.getAlergenos().stream()
                .map(a -> a.trim().toLowerCase())
                .distinct()
                .collect(Collectors.joining(",")));
        return mapToDTO(ingredienteRepository.save(ingrediente));
    }

    private IngredienteDTO mapToDTO(Ingrediente i) {
        List<String> alergenos = i.getAlergenos() == null || i.getAlergenos().isBlank()
                ? List.of()
                : Arrays.stream(i.getAlergenos().split(",")).map(String::trim).toList();
        return new IngredienteDTO(i.getInsumoId(), i.getNombre(), i.getNombreIngles(), i.getUnidad(), alergenos);
    }
}
