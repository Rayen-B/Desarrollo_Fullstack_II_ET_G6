package proyecto.catalogo_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.catalogo_service.dto.InsumoRequestDTO;
import proyecto.catalogo_service.dto.InsumoResponseDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ItemRecetaRepository;
import proyecto.catalogo_service.util.Textos;

import java.util.List;

@Service
public class InsumoService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ItemRecetaRepository itemRecetaRepository;

    public List<InsumoResponseDTO> listar() {
        return insumoRepository.findAll().stream().map(this::aDto).toList();
    }

    public InsumoResponseDTO obtener(String id) {
        return aDto(buscar(id));
    }

    @Transactional
    public InsumoResponseDTO crear(InsumoRequestDTO request) {
        String nombre = Textos.limpio(request.getNombre());
        String id = Textos.slug(nombre);
        if (insumoRepository.existsById(id) || nombreRepetido(nombre, null)) {
            throw new ConflictoException("Ya existe un insumo con ese nombre");
        }
        Insumo insumo = new Insumo(id, nombre, request.getUnidad(),
                CalculoStock.redondear(request.getStock()), CalculoStock.redondear(request.getMinimo()));
        return aDto(insumoRepository.save(insumo));
    }

    @Transactional
    public InsumoResponseDTO actualizar(String id, InsumoRequestDTO request) {
        Insumo insumo = buscar(id);
        String nombre = Textos.limpio(request.getNombre());
        if (nombreRepetido(nombre, insumo.getId())) {
            throw new ConflictoException("Ya existe un insumo con ese nombre");
        }
        insumo.setNombre(nombre);
        insumo.setUnidad(request.getUnidad());
        insumo.setStock(CalculoStock.redondear(request.getStock()));
        insumo.setMinimo(CalculoStock.redondear(request.getMinimo()));
        return aDto(insumoRepository.save(insumo));
    }

    @Transactional
    public void eliminar(String id) {
        Insumo insumo = buscar(id);
        long recetas = itemRecetaRepository.countByInsumoId(insumo.getId());
        if (recetas > 0) {
            throw new ConflictoException("No se puede eliminar: el insumo se usa en " + recetas + " receta(s).");
        }
        insumoRepository.delete(insumo);
    }

    private Insumo buscar(String id) {
        return insumoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("El insumo no existe."));
    }

    private boolean nombreRepetido(String nombre, String idActual) {
        String slug = Textos.slug(nombre);
        return insumoRepository.findAll().stream()
                .anyMatch(i -> !i.getId().equals(idActual) && (i.getId().equals(slug) || i.getNombre().equalsIgnoreCase(nombre)));
    }

    private InsumoResponseDTO aDto(Insumo i) {
        return new InsumoResponseDTO(i.getId(), i.getNombre(), i.getUnidad(), i.getStock(), i.getMinimo(), i.getStock() <= i.getMinimo());
    }
}
