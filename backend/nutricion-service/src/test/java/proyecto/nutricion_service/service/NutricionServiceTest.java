package proyecto.nutricion_service.service;

import feign.FeignException;
import feign.Request;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import proyecto.nutricion_service.client.SpoonacularClient;
import proyecto.nutricion_service.client.dto.SpoonIngredienteDTO;
import proyecto.nutricion_service.dto.ItemRecetaDTO;
import proyecto.nutricion_service.dto.NutricionResponseDTO;
import proyecto.nutricion_service.dto.RecetaRequestDTO;
import proyecto.nutricion_service.exception.DatoInvalidoException;
import proyecto.nutricion_service.exception.RecursoNoEncontradoException;
import proyecto.nutricion_service.exception.ServicioExternoException;
import proyecto.nutricion_service.model.Ingrediente;
import proyecto.nutricion_service.model.NutricionProducto;
import proyecto.nutricion_service.repository.IngredienteRepository;
import proyecto.nutricion_service.repository.NutricionProductoRepository;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NutricionServiceTest {

    @Mock
    private NutricionProductoRepository nutricionRepository;

    @Mock
    private IngredienteRepository ingredienteRepository;

    @Mock
    private SpoonacularClient spoonacularClient;

    @InjectMocks
    private NutricionService nutricionService;

    private Ingrediente harina;
    private Ingrediente huevos;
    private RecetaRequestDTO receta;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(nutricionService, "apiKey", "clave-de-prueba");
        harina = new Ingrediente("harina", "Harina", "flour", "g", "gluten");
        huevos = new Ingrediente("huevos", "Huevos", "eggs", "u", "huevo");
        receta = new RecetaRequestDTO(List.of(new ItemRecetaDTO("harina", 300.0), new ItemRecetaDTO("huevos", 4.0)));
    }

    private SpoonIngredienteDTO ingredienteSpoon(String original, double calorias, double azucar) {
        SpoonIngredienteDTO.Nutriente kcal = new SpoonIngredienteDTO.Nutriente();
        kcal.setName("Calories");
        kcal.setAmount(calorias);
        SpoonIngredienteDTO.Nutriente sugar = new SpoonIngredienteDTO.Nutriente();
        sugar.setName("Sugar");
        sugar.setAmount(azucar);
        SpoonIngredienteDTO.Nutricion nutricion = new SpoonIngredienteDTO.Nutricion();
        nutricion.setNutrients(List.of(kcal, sugar));
        SpoonIngredienteDTO dto = new SpoonIngredienteDTO();
        dto.setOriginal(original);
        dto.setNutrition(nutricion);
        return dto;
    }

    private void prepararIngredientes() {
        when(ingredienteRepository.findAllById(any())).thenReturn(List.of(harina, huevos));
    }

    @Test
    void calcular_RecetaNueva_ConsultaSpoonacularYGuarda() {
        prepararIngredientes();
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.empty());
        when(spoonacularClient.analizarIngredientes(eq("clave-de-prueba"), anyMap()))
                .thenReturn(List.of(ingredienteSpoon("300 g flour", 1092.0, 0.8), ingredienteSpoon("4 eggs", 286.0, 0.8)));
        when(nutricionRepository.save(any(NutricionProducto.class))).thenAnswer(inv -> inv.getArgument(0));

        NutricionResponseDTO resultado = nutricionService.calcular("tc001", receta, false);

        assertEquals("TC001", resultado.getCodigoProducto());
        assertEquals(1378.0, resultado.getTotal().getCalorias());
        assertEquals(1.6, resultado.getTotal().getAzucares());
        assertEquals(344.5, resultado.getPorTrozo().getCalorias());
        assertEquals(List.of("gluten", "huevo"), resultado.getAlergenos());
        assertFalse(resultado.isDesdeCache());
        verify(nutricionRepository, times(1)).save(any(NutricionProducto.class));
    }

    @Test
    void calcular_EnviaLaRecetaEnInglesASpoonacular() {
        prepararIngredientes();
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.empty());
        when(spoonacularClient.analizarIngredientes(anyString(), anyMap())).thenReturn(List.of(ingredienteSpoon("300 g flour", 100, 0)));
        when(nutricionRepository.save(any(NutricionProducto.class))).thenAnswer(inv -> inv.getArgument(0));

        nutricionService.calcular("TC001", receta, false);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, ?>> formulario = ArgumentCaptor.forClass(Map.class);
        verify(spoonacularClient).analizarIngredientes(eq("clave-de-prueba"), formulario.capture());
        assertEquals("300 g flour\n4 eggs", formulario.getValue().get("ingredientList"));
        assertEquals("true", formulario.getValue().get("includeNutrition"));
    }

    @Test
    void calcular_RecetaSinCambios_UsaLaBaseDeDatosSinConsultarSpoonacular() {
        prepararIngredientes();
        Map<String, Ingrediente> mapa = Map.of("harina", harina, "huevos", huevos);
        NutricionProducto guardado = new NutricionProducto(1, "TC001", nutricionService.calcularHuella(receta.getItems(), mapa),
                new java.math.BigDecimal("1000.0"), new java.math.BigDecimal("10.0"), new java.math.BigDecimal("20.0"),
                new java.math.BigDecimal("30.0"), new java.math.BigDecimal("40.0"), "gluten,huevo", "", java.time.LocalDateTime.now());
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.of(guardado));

        NutricionResponseDTO resultado = nutricionService.calcular("TC001", receta, false);

        assertTrue(resultado.isDesdeCache());
        assertEquals(1000.0, resultado.getTotal().getCalorias());
        assertEquals(250.0, resultado.getPorTrozo().getCalorias());
        verifyNoInteractions(spoonacularClient);
        verify(nutricionRepository, never()).save(any());
    }

    @Test
    void calcular_Forzar_ConsultaSpoonacularAunqueLaRecetaNoCambie() {
        prepararIngredientes();
        Map<String, Ingrediente> mapa = Map.of("harina", harina, "huevos", huevos);
        NutricionProducto guardado = new NutricionProducto(1, "TC001", nutricionService.calcularHuella(receta.getItems(), mapa),
                java.math.BigDecimal.ONE, java.math.BigDecimal.ONE, java.math.BigDecimal.ONE, java.math.BigDecimal.ONE,
                java.math.BigDecimal.ONE, "", "", java.time.LocalDateTime.now());
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.of(guardado));
        when(spoonacularClient.analizarIngredientes(anyString(), anyMap())).thenReturn(List.of(ingredienteSpoon("300 g flour", 500, 0)));
        when(nutricionRepository.save(any(NutricionProducto.class))).thenAnswer(inv -> inv.getArgument(0));

        NutricionResponseDTO resultado = nutricionService.calcular("TC001", receta, true);

        assertEquals(500.0, resultado.getTotal().getCalorias());
        verify(spoonacularClient, times(1)).analizarIngredientes(anyString(), anyMap());
    }

    @Test
    void calcular_CambiarUnaCantidad_CambiaLaHuella() {
        Map<String, Ingrediente> mapa = Map.of("harina", harina, "huevos", huevos);
        String original = nutricionService.calcularHuella(receta.getItems(), mapa);
        String otra = nutricionService.calcularHuella(List.of(new ItemRecetaDTO("harina", 350.0), new ItemRecetaDTO("huevos", 4.0)), mapa);
        String mismoOrdenDistinto = nutricionService.calcularHuella(List.of(new ItemRecetaDTO("huevos", 4.0), new ItemRecetaDTO("harina", 300.0)), mapa);

        assertNotEquals(original, otra);
        assertEquals(original, mismoOrdenDistinto);
    }

    @Test
    void calcular_IngredienteSinDatos_SeInformaYNoSeSuma() {
        prepararIngredientes();
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.empty());
        SpoonIngredienteDTO sinNutricion = new SpoonIngredienteDTO();
        sinNutricion.setOriginal("4 eggs");
        when(spoonacularClient.analizarIngredientes(anyString(), anyMap())).thenReturn(List.of(ingredienteSpoon("300 g flour", 1092, 0.8), sinNutricion));
        when(nutricionRepository.save(any(NutricionProducto.class))).thenAnswer(inv -> inv.getArgument(0));

        NutricionResponseDTO resultado = nutricionService.calcular("TC001", receta, false);

        assertEquals(1092.0, resultado.getTotal().getCalorias());
        assertEquals(List.of("4 eggs"), resultado.getIngredientesSinDatos());
    }

    @Test
    void calcular_InsumoSinTraduccion_LanzaDatoInvalido() {
        when(ingredienteRepository.findAllById(any())).thenReturn(List.of(harina));

        DatoInvalidoException ex = assertThrows(DatoInvalidoException.class,
                () -> nutricionService.calcular("TC001", receta, false));

        assertTrue(ex.getMessage().contains("huevos"));
        verifyNoInteractions(spoonacularClient);
    }

    @Test
    void calcular_InsumoRepetido_LanzaDatoInvalido() {
        RecetaRequestDTO repetida = new RecetaRequestDTO(List.of(new ItemRecetaDTO("harina", 100.0), new ItemRecetaDTO("harina", 50.0)));

        assertThrows(DatoInvalidoException.class, () -> nutricionService.calcular("TC001", repetida, false));
    }

    @Test
    void calcular_CodigoConCaracteresRaros_LanzaDatoInvalido() {
        assertThrows(DatoInvalidoException.class, () -> nutricionService.calcular("TC<script>", receta, false));
    }

    @Test
    void calcular_SinClaveConfigurada_LanzaServicioExterno() {
        ReflectionTestUtils.setField(nutricionService, "apiKey", "");
        prepararIngredientes();
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.empty());

        ServicioExternoException ex = assertThrows(ServicioExternoException.class,
                () -> nutricionService.calcular("TC001", receta, false));

        assertTrue(ex.getMessage().contains("SPOONACULAR_API_KEY"));
    }

    @Test
    void calcular_LimiteDiarioAlcanzado_LanzaServicioExterno() {
        prepararIngredientes();
        when(nutricionRepository.findByCodigoProducto("TC001")).thenReturn(Optional.empty());
        Request request = Request.create(Request.HttpMethod.POST, "/recipes/parseIngredients", Map.of(), null, StandardCharsets.UTF_8, null);
        when(spoonacularClient.analizarIngredientes(anyString(), anyMap()))
                .thenThrow(FeignException.errorStatus("analizarIngredientes",
                        feign.Response.builder().status(402).reason("Payment Required").request(request).headers(Map.of()).build()));

        ServicioExternoException ex = assertThrows(ServicioExternoException.class,
                () -> nutricionService.calcular("TC001", receta, false));

        assertTrue(ex.getMessage().contains("límite diario"));
        verify(nutricionRepository, never()).save(any());
    }

    @Test
    void obtener_ProductoSinCalculo_LanzaNoEncontrado() {
        when(nutricionRepository.findByCodigoProducto("TC999")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> nutricionService.obtener("TC999"));
    }

    @Test
    void armarLineas_UnidadesSinDecimalesInnecesarios() {
        Map<String, Ingrediente> mapa = Map.of("harina", harina, "huevos", huevos);
        List<String> lineas = nutricionService.armarLineas(
                List.of(new ItemRecetaDTO("harina", 62.5), new ItemRecetaDTO("huevos", 1.0)), mapa);

        assertEquals(List.of("62.5 g flour", "1 eggs"), lineas);
    }
}
