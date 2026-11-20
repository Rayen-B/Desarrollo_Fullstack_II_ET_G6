package proyecto.catalogo_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import proyecto.catalogo_service.dto.ItemRecetaDTO;
import proyecto.catalogo_service.dto.ProductoRequestDTO;
import proyecto.catalogo_service.dto.ProductoResponseDTO;
import proyecto.catalogo_service.dto.RecetaDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.Categoria;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.ItemReceta;
import proyecto.catalogo_service.model.Producto;
import proyecto.catalogo_service.repository.CategoriaRepository;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ProductoRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private InsumoRepository insumoRepository;

    @Mock
    private FotoService fotoService;

    @InjectMocks
    private ProductoService productoService;

    private Insumo harina;
    private Insumo huevos;

    @BeforeEach
    void setUp() {
        harina = Datos.insumo("harina", 1000);
        huevos = Datos.insumo("huevos", 10);
    }

    private ProductoRequestDTO request(String codigo, String descripcion, List<ItemRecetaDTO> receta) {
        return new ProductoRequestDTO(codigo, "Torta Nueva", "Tortas", 15000, null, 1, 2, null, descripcion, receta);
    }

    @Test
    void crearLimpiaElHtmlYCalculaElDisponible() {
        when(productoRepository.existsById("TN001")).thenReturn(false);
        when(categoriaRepository.findById("tortas")).thenReturn(Optional.of(Datos.TORTAS));
        when(insumoRepository.findAll()).thenReturn(List.of(harina, huevos));
        when(productoRepository.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        String html = "<p>Rica <strong>torta</strong></p><script>alert(1)</script><img src=x onerror=alert(1)>";
        ProductoResponseDTO r = productoService.crear(request("tn001", html, List.of(new ItemRecetaDTO("harina", 300.0), new ItemRecetaDTO("huevos", 4.0))));

        assertEquals("TN001", r.getId());
        assertEquals("Tortas", r.getCategoria());
        assertEquals("<p>Rica <strong>torta</strong></p>", r.getDescripcion());
        assertEquals("menu/Torta_Panqueque_Naranja", r.getImagen());
        assertEquals(2, r.getReceta().size());
        assertEquals(1 + 2, r.getDisponible());
        assertFalse(r.isCritico());
    }

    @Test
    void crearConCodigoRepetidoDa409() {
        when(productoRepository.existsById("TC001")).thenReturn(true);

        ConflictoException ex = assertThrows(ConflictoException.class, () -> productoService.crear(request("TC001", "", null)));
        assertEquals("Ya existe un producto con el código TC001.", ex.getMessage());
    }

    @Test
    void crearSinCodigoDa400() {
        assertThrows(DatoInvalidoException.class, () -> productoService.crear(request(" ", "", null)));
    }

    @Test
    void crearConCategoriaInexistenteDa400() {
        when(productoRepository.existsById("TN001")).thenReturn(false);
        when(categoriaRepository.findById("tortas")).thenReturn(Optional.empty());

        assertThrows(DatoInvalidoException.class, () -> productoService.crear(request("TN001", "", null)));
        verify(productoRepository, never()).save(any());
    }

    @Test
    void recetaConInsumoRepetidoDa400() {
        Producto torta = Datos.producto("TC001", 0, List.of());
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));
        when(insumoRepository.findAll()).thenReturn(List.of(harina));

        RecetaDTO receta = new RecetaDTO(List.of(new ItemRecetaDTO("harina", 100.0), new ItemRecetaDTO("harina", 50.0)));
        assertThrows(DatoInvalidoException.class, () -> productoService.actualizarReceta("TC001", receta));
    }

    @Test
    void actualizarRecetaReutilizaLasLineasExistentes() {
        ItemReceta lineaHarina = Datos.linea(harina, 300);
        Producto torta = Datos.producto("TC001", 0, List.of(lineaHarina));
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));
        when(insumoRepository.findAll()).thenReturn(List.of(harina, huevos));
        when(productoRepository.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        productoService.actualizarReceta("TC001", new RecetaDTO(List.of(new ItemRecetaDTO("harina", 250.0), new ItemRecetaDTO("huevos", 2.0))));

        assertEquals(2, torta.getReceta().size());
        assertSame(lineaHarina, torta.getReceta().get(0));
        assertEquals(250.0, lineaHarina.getCantidad());
    }

    @Test
    void obtenerRecetaTieneLaFormaQueUsaNutricion() {
        Producto torta = Datos.producto("TC001", 0, List.of(Datos.linea(harina, 300)));
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));

        RecetaDTO receta = productoService.obtenerReceta("tc001");

        assertEquals("harina", receta.getItems().get(0).getInsumoId());
        assertEquals(300.0, receta.getItems().get(0).getCantidad());
    }

    @Test
    void obtenerInexistenteDa404() {
        when(productoRepository.findById("XX1")).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> productoService.obtener("XX1"));
    }

    @Test
    void listarFiltraPorCategoriaYTexto() {
        Categoria postres = new Categoria("postres", "Postres", "", "");
        Producto torta = Datos.producto("TC001", 1, List.of());
        Producto brownie = Datos.producto("POS006", 1, List.of());
        brownie.setNombre("Brownie con Nueces");
        brownie.setCategoria(postres);
        when(productoRepository.findAll()).thenReturn(List.of(torta, brownie));
        when(insumoRepository.findAll()).thenReturn(List.of());

        assertEquals(List.of("POS006"), productoService.listar("Postres", null).stream().map(ProductoResponseDTO::getCodigo).toList());
        assertEquals(List.of("POS006"), productoService.listar(null, "nuéces").stream().map(ProductoResponseDTO::getCodigo).toList());
        assertEquals(2, productoService.listar(null, null).size());
    }

    @Test
    void guardarFotoCambiaLaImagenYBorraLaAnterior() {
        Producto torta = Datos.producto("TC001", 0, List.of());
        torta.setImagen("/api/v1/productos/media/tc001-1.png");
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));
        when(fotoService.guardar(eq("TC001"), any())).thenReturn("/api/v1/productos/media/tc001-2.webp");
        when(productoRepository.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));
        when(insumoRepository.findAll()).thenReturn(List.of());

        ProductoResponseDTO r = productoService.guardarFoto("TC001", null);

        assertEquals("/api/v1/productos/media/tc001-2.webp", r.getImagen());
        verify(fotoService).borrarSiEsPropia("/api/v1/productos/media/tc001-1.png");
    }

    @Test
    void eliminarBorraElProducto() {
        Producto torta = Datos.producto("TC001", 0, List.of());
        when(productoRepository.findById("TC001")).thenReturn(Optional.of(torta));

        productoService.eliminar("TC001");

        verify(productoRepository).delete(torta);
        verify(fotoService).borrarSiEsPropia("menu/x");
    }
}
