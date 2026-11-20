package proyecto.catalogo_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.catalogo_service.dto.CategoriaRequestDTO;
import proyecto.catalogo_service.dto.CategoriaResponseDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.model.Categoria;
import proyecto.catalogo_service.repository.CategoriaRepository;
import proyecto.catalogo_service.repository.ProductoRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private CategoriaService categoriaService;

    @Test
    void crearArmaElIdDesdeElNombre() {
        when(categoriaRepository.existsById("sin-azucar")).thenReturn(false);
        when(categoriaRepository.findAll()).thenReturn(List.of(Datos.TORTAS));
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(i -> i.getArgument(0));

        CategoriaResponseDTO r = categoriaService.crear(new CategoriaRequestDTO("  Sin Azúcar ", null, null));

        assertEquals("sin-azucar", r.getId());
        assertEquals("Sin Azúcar", r.getNombre());
        assertEquals("imgc1", r.getImagen());
    }

    @Test
    void crearRepetidaDa409() {
        when(categoriaRepository.existsById("tortas")).thenReturn(true);

        ConflictoException ex = assertThrows(ConflictoException.class, () -> categoriaService.crear(new CategoriaRequestDTO("Tortas", "", "")));
        assertEquals("La categoría \"Tortas\" ya existe.", ex.getMessage());
    }

    @Test
    void renombrarMantieneElId() {
        Categoria tortas = new Categoria("tortas", "Tortas", "", "menu/x");
        when(categoriaRepository.findById("tortas")).thenReturn(Optional.of(tortas));
        when(categoriaRepository.findAll()).thenReturn(List.of(tortas));
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(i -> i.getArgument(0));

        CategoriaResponseDTO r = categoriaService.actualizar("tortas", new CategoriaRequestDTO("Tortas Caseras", null, null));

        assertEquals("tortas", r.getId());
        assertEquals("Tortas Caseras", r.getNombre());
        assertEquals("menu/x", r.getImagen());
    }

    @Test
    void noSeEliminaConProductos() {
        when(categoriaRepository.findById("tortas")).thenReturn(Optional.of(Datos.TORTAS));
        when(productoRepository.countByCategoriaId("tortas")).thenReturn(6L);

        ConflictoException ex = assertThrows(ConflictoException.class, () -> categoriaService.eliminar("Tortas"));
        assertEquals("No se puede eliminar: tiene 6 producto(s) asociados.", ex.getMessage());
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void eliminarSinProductos() {
        when(categoriaRepository.findById("tortas")).thenReturn(Optional.of(Datos.TORTAS));
        when(productoRepository.countByCategoriaId("tortas")).thenReturn(0L);

        categoriaService.eliminar("tortas");

        verify(categoriaRepository).delete(Datos.TORTAS);
    }
}
