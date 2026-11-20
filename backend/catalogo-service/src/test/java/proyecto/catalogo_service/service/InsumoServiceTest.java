package proyecto.catalogo_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.catalogo_service.dto.InsumoRequestDTO;
import proyecto.catalogo_service.dto.InsumoResponseDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ItemRecetaRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InsumoServiceTest {

    @Mock
    private InsumoRepository insumoRepository;

    @Mock
    private ItemRecetaRepository itemRecetaRepository;

    @InjectMocks
    private InsumoService insumoService;

    @Test
    void crearMarcaCriticoSiEstaBajoElMinimo() {
        when(insumoRepository.existsById("crema-de-leche")).thenReturn(false);
        when(insumoRepository.findAll()).thenReturn(List.of());
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(i -> i.getArgument(0));

        InsumoResponseDTO r = insumoService.crear(new InsumoRequestDTO("Crema de leche", "ml", 900.0, 1000.0));

        assertEquals("crema-de-leche", r.getId());
        assertTrue(r.isCritico());
    }

    @Test
    void renombrarAUnNombreQueYaExisteDa409() {
        Insumo harina = new Insumo("harina", "Harina", "g", 100.0, 10.0);
        Insumo azucar = new Insumo("azucar", "Azúcar", "g", 100.0, 10.0);
        when(insumoRepository.findById("harina")).thenReturn(Optional.of(harina));
        when(insumoRepository.findAll()).thenReturn(List.of(harina, azucar));

        assertThrows(ConflictoException.class, () -> insumoService.actualizar("harina", new InsumoRequestDTO("azúcar", "g", 1.0, 1.0)));
    }

    @Test
    void noSeEliminaSiUnaRecetaLoUsa() {
        when(insumoRepository.findById("harina")).thenReturn(Optional.of(Datos.insumo("harina", 1)));
        when(itemRecetaRepository.countByInsumoId("harina")).thenReturn(3L);

        ConflictoException ex = assertThrows(ConflictoException.class, () -> insumoService.eliminar("harina"));
        assertEquals("No se puede eliminar: el insumo se usa en 3 receta(s).", ex.getMessage());
        verify(insumoRepository, never()).delete(any());
    }
}
