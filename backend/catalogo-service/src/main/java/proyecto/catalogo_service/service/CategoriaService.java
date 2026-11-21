package proyecto.catalogo_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.catalogo_service.dto.CategoriaRequestDTO;
import proyecto.catalogo_service.dto.CategoriaResponseDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.Categoria;
import proyecto.catalogo_service.repository.CategoriaRepository;
import proyecto.catalogo_service.repository.ProductoRepository;
import proyecto.catalogo_service.util.Textos;

import java.util.List;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    public List<CategoriaResponseDTO> listar() {
        return categoriaRepository.findAll().stream().map(this::aDto).toList();
    }

    public CategoriaResponseDTO obtener(String id) {
        return aDto(buscar(id));
    }

    @Transactional
    public CategoriaResponseDTO crear(CategoriaRequestDTO request) {
        String nombre = Textos.limpio(request.getNombre());
        String id = Textos.slug(nombre);
        if (categoriaRepository.existsById(id) || nombreRepetido(nombre, null)) {
            throw new ConflictoException("La categoría \"" + nombre + "\" ya existe.");
        }
        String imagen = Textos.limpio(request.getImagen());
        Categoria categoria = new Categoria(id, nombre, Textos.limpio(request.getDescripcion()), imagen.isEmpty() ? "imgc1" : imagen);
        return aDto(categoriaRepository.save(categoria));
    }

    // El id no cambia al renombrar, así los productos siguen ligados
    @Transactional
    public CategoriaResponseDTO actualizar(String id, CategoriaRequestDTO request) {
        Categoria categoria = buscar(id);
        String nombre = Textos.limpio(request.getNombre());
        if (nombreRepetido(nombre, categoria.getId())) {
            throw new ConflictoException("La categoría \"" + nombre + "\" ya existe.");
        }
        categoria.setNombre(nombre);
        if (request.getDescripcion() != null) categoria.setDescripcion(Textos.limpio(request.getDescripcion()));
        if (request.getImagen() != null && !request.getImagen().isBlank()) categoria.setImagen(request.getImagen().trim());
        return aDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public void eliminar(String id) {
        Categoria categoria = buscar(id);
        long cantidad = productoRepository.countByCategoriaId(categoria.getId());
        if (cantidad > 0) {
            throw new ConflictoException("No se puede eliminar: tiene " + cantidad + " producto(s) asociados.");
        }
        categoriaRepository.delete(categoria);
    }

    public Categoria buscar(String idONombre) {
        return categoriaRepository.findById(Textos.slug(idONombre))
                .orElseThrow(() -> new RecursoNoEncontradoException("La categoría no existe."));
    }

    private boolean nombreRepetido(String nombre, String idActual) {
        String slug = Textos.slug(nombre);
        return categoriaRepository.findAll().stream()
                .anyMatch(c -> !c.getId().equals(idActual) && (c.getId().equals(slug) || Textos.slug(c.getNombre()).equals(slug)));
    }

    private CategoriaResponseDTO aDto(Categoria c) {
        return new CategoriaResponseDTO(c.getId(), c.getNombre(), c.getDescripcion(), c.getImagen());
    }
}
