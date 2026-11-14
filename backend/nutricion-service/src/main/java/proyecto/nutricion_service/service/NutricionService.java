package proyecto.nutricion_service.service;

import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import proyecto.nutricion_service.client.SpoonacularClient;
import proyecto.nutricion_service.client.dto.SpoonIngredienteDTO;
import proyecto.nutricion_service.dto.ItemRecetaDTO;
import proyecto.nutricion_service.dto.NutricionResponseDTO;
import proyecto.nutricion_service.dto.NutrientesDTO;
import proyecto.nutricion_service.dto.RecetaRequestDTO;
import proyecto.nutricion_service.exception.DatoInvalidoException;
import proyecto.nutricion_service.exception.RecursoNoEncontradoException;
import proyecto.nutricion_service.exception.ServicioExternoException;
import proyecto.nutricion_service.model.Ingrediente;
import proyecto.nutricion_service.model.NutricionProducto;
import proyecto.nutricion_service.repository.IngredienteRepository;
import proyecto.nutricion_service.repository.NutricionProductoRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NutricionService {

    private static final Logger log = LoggerFactory.getLogger(NutricionService.class);

    // Un trozo de torta es 1/4 de la receta (la misma regla del stock en la tienda)
    public static final double FACTOR_TROZO = 0.25;

    @Autowired
    private NutricionProductoRepository nutricionRepository;

    @Autowired
    private IngredienteRepository ingredienteRepository;

    @Autowired
    private SpoonacularClient spoonacularClient;

    @Value("${spoonacular.api-key}")
    private String apiKey;

    public NutricionResponseDTO obtener(String codigo) {
        String codigoProducto = normalizarCodigo(codigo);
        return nutricionRepository.findByCodigoProducto(codigoProducto)
                .map(n -> mapToResponse(n, true))
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "El producto " + codigoProducto + " aún no tiene información nutricional calculada"));
    }

    // Devuelve el cálculo guardado si la receta no cambió; si es nueva o cambió, consulta Spoonacular y lo guarda
    public NutricionResponseDTO calcular(String codigo, RecetaRequestDTO receta, boolean forzar) {
        String codigoProducto = normalizarCodigo(codigo);
        Map<String, Ingrediente> ingredientes = buscarIngredientes(receta.getItems());
        String huella = calcularHuella(receta.getItems(), ingredientes);

        Optional<NutricionProducto> guardado = nutricionRepository.findByCodigoProducto(codigoProducto);
        if (!forzar && guardado.isPresent() && huella.equals(guardado.get().getHuellaReceta())) {
            log.info("Nutrición de {} leída desde la base de datos", codigoProducto);
            return mapToResponse(guardado.get(), true);
        }

        log.info("Calculando nutrición de {} con Spoonacular", codigoProducto);
        List<SpoonIngredienteDTO> analisis = consultarSpoonacular(armarLineas(receta.getItems(), ingredientes));

        Map<String, Double> totales = new HashMap<>();
        List<String> sinDatos = new ArrayList<>();
        for (SpoonIngredienteDTO ingrediente : analisis) {
            if (ingrediente.getNutrition() == null || ingrediente.getNutrition().getNutrients() == null
                    || ingrediente.getNutrition().getNutrients().isEmpty()) {
                sinDatos.add(ingrediente.getOriginal() != null ? ingrediente.getOriginal() : ingrediente.getName());
                continue;
            }
            ingrediente.getNutrition().getNutrients().forEach(n ->
                    totales.merge(n.getName(), n.getAmount() == null ? 0 : n.getAmount(), Double::sum));
        }

        NutricionProducto nutricion = guardado.orElseGet(NutricionProducto::new);
        nutricion.setCodigoProducto(codigoProducto);
        nutricion.setHuellaReceta(huella);
        nutricion.setCalorias(redondear(totales.getOrDefault("Calories", 0.0)));
        nutricion.setAzucares(redondear(totales.getOrDefault("Sugar", 0.0)));
        nutricion.setGrasas(redondear(totales.getOrDefault("Fat", 0.0)));
        nutricion.setProteinas(redondear(totales.getOrDefault("Protein", 0.0)));
        nutricion.setCarbohidratos(redondear(totales.getOrDefault("Carbohydrates", 0.0)));
        nutricion.setAlergenos(String.join(",", alergenosDe(ingredientes.values())));
        nutricion.setIngredientesSinDatos(String.join(",", sinDatos));
        nutricion.setCalculadoEn(LocalDateTime.now());

        NutricionProducto saved = nutricionRepository.save(nutricion);
        log.info("Nutrición de {} guardada: {} kcal", codigoProducto, saved.getCalorias());
        return mapToResponse(saved, false);
    }

    // Convierte la receta en líneas en inglés para Spoonacular: "300 g flour", "4 eggs"
    public List<String> armarLineas(List<ItemRecetaDTO> items, Map<String, Ingrediente> ingredientes) {
        return items.stream().map(item -> {
            Ingrediente ingrediente = ingredientes.get(item.getInsumoId());
            String cantidad = BigDecimal.valueOf(item.getCantidad()).stripTrailingZeros().toPlainString();
            return "u".equals(ingrediente.getUnidad())
                    ? cantidad + " " + ingrediente.getNombreIngles()
                    : cantidad + " " + ingrediente.getUnidad() + " " + ingrediente.getNombreIngles();
        }).collect(Collectors.toList());
    }

    // Resumen de la receta: si cambia un insumo, una cantidad o un nombre en inglés, cambia la huella
    public String calcularHuella(List<ItemRecetaDTO> items, Map<String, Ingrediente> ingredientes) {
        String texto = items.stream()
                .sorted(Comparator.comparing(ItemRecetaDTO::getInsumoId))
                .map(i -> i.getInsumoId() + ":" + BigDecimal.valueOf(i.getCantidad()).stripTrailingZeros().toPlainString()
                        + ":" + ingredientes.get(i.getInsumoId()).getNombreIngles())
                .collect(Collectors.joining(";"));
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private Map<String, Ingrediente> buscarIngredientes(List<ItemRecetaDTO> items) {
        Set<String> ids = new LinkedHashSet<>();
        for (ItemRecetaDTO item : items) {
            if (!ids.add(item.getInsumoId())) {
                throw new DatoInvalidoException("El insumo " + item.getInsumoId() + " está repetido en la receta");
            }
        }
        Map<String, Ingrediente> encontrados = ingredienteRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Ingrediente::getInsumoId, i -> i));
        List<String> faltantes = ids.stream().filter(id -> !encontrados.containsKey(id)).toList();
        if (!faltantes.isEmpty()) {
            throw new DatoInvalidoException("Estos insumos no tienen nombre en inglés registrado: " + String.join(", ", faltantes));
        }
        return encontrados;
    }

    private List<SpoonIngredienteDTO> consultarSpoonacular(List<String> lineas) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ServicioExternoException("Falta configurar la variable de entorno SPOONACULAR_API_KEY");
        }
        Map<String, Object> formulario = new LinkedHashMap<>();
        formulario.put("ingredientList", String.join("\n", lineas));
        formulario.put("servings", "1");
        formulario.put("includeNutrition", "true");
        formulario.put("language", "en");
        try {
            List<SpoonIngredienteDTO> respuesta = spoonacularClient.analizarIngredientes(apiKey, formulario);
            if (respuesta == null || respuesta.isEmpty()) {
                throw new ServicioExternoException("Spoonacular no devolvió información para la receta");
            }
            return respuesta;
        } catch (FeignException e) {
            log.error("Error al consultar Spoonacular ({}): {}", e.status(), e.getMessage());
            if (e.status() == 401) {
                throw new ServicioExternoException("La clave de Spoonacular no es válida");
            }
            if (e.status() == 402) {
                throw new ServicioExternoException("Se alcanzó el límite diario de consultas a Spoonacular");
            }
            throw new ServicioExternoException("No se pudo consultar Spoonacular en este momento");
        }
    }

    private SortedSet<String> alergenosDe(Collection<Ingrediente> ingredientes) {
        return ingredientes.stream()
                .flatMap(i -> Arrays.stream(i.getAlergenos().split(",")))
                .map(String::trim)
                .filter(a -> !a.isEmpty())
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private String normalizarCodigo(String codigo) {
        String limpio = codigo == null ? "" : codigo.trim().toUpperCase();
        if (!limpio.matches("^[A-Z0-9]{2,20}$")) {
            throw new DatoInvalidoException("El código de producto solo admite letras y números (2 a 20)");
        }
        return limpio;
    }

    private BigDecimal redondear(double valor) {
        return BigDecimal.valueOf(valor).setScale(1, RoundingMode.HALF_UP);
    }

    private List<String> separar(String texto) {
        if (texto == null || texto.isBlank()) return List.of();
        return Arrays.stream(texto.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private NutricionResponseDTO mapToResponse(NutricionProducto n, boolean desdeCache) {
        NutricionResponseDTO response = new NutricionResponseDTO();
        response.setCodigoProducto(n.getCodigoProducto());
        response.setTotal(new NutrientesDTO(
                n.getCalorias().doubleValue(), n.getAzucares().doubleValue(), n.getGrasas().doubleValue(),
                n.getProteinas().doubleValue(), n.getCarbohidratos().doubleValue()));
        response.setPorTrozo(new NutrientesDTO(
                porTrozo(n.getCalorias()), porTrozo(n.getAzucares()), porTrozo(n.getGrasas()),
                porTrozo(n.getProteinas()), porTrozo(n.getCarbohidratos())));
        response.setAlergenos(separar(n.getAlergenos()));
        response.setIngredientesSinDatos(separar(n.getIngredientesSinDatos()));
        response.setCalculadoEn(n.getCalculadoEn());
        response.setDesdeCache(desdeCache);
        return response;
    }

    private double porTrozo(BigDecimal total) {
        return redondear(total.doubleValue() * FACTOR_TROZO).doubleValue();
    }
}
