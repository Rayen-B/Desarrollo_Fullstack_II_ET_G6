package proyecto.orden_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import proyecto.orden_service.client.CatalogoClient;
import proyecto.orden_service.client.dto.ItemVentaCatalogoDTO;
import proyecto.orden_service.client.dto.MovimientosDTO;
import proyecto.orden_service.client.dto.ProductoCatalogoDTO;
import proyecto.orden_service.client.dto.VentaCatalogoDTO;
import proyecto.orden_service.exception.ConflictoException;
import proyecto.orden_service.exception.DatoInvalidoException;
import proyecto.orden_service.exception.RecursoNoEncontradoException;
import proyecto.orden_service.exception.ServicioExternoException;

import java.util.List;

// Habla con catalogo-service (OpenFeign + Eureka) y traduce sus errores a los de Órdenes
@Service
public class InventarioService {

    private static final Logger log = LoggerFactory.getLogger(InventarioService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String SIN_CATALOGO = "No se pudo comunicar con el catálogo en este momento";

    @Autowired
    private CatalogoClient catalogoClient;

    public ProductoCatalogoDTO producto(String codigo) {
        try {
            return catalogoClient.obtenerProducto(codigo);
        } catch (FeignException.NotFound e) {
            throw new DatoInvalidoException("El producto " + codigo + " no existe.");
        } catch (FeignException e) {
            log.warn("Catálogo respondió {} al pedir el producto {}", e.status(), codigo);
            throw new ServicioExternoException(SIN_CATALOGO);
        }
    }

    public MovimientosDTO descontar(List<ItemVentaCatalogoDTO> items) {
        try {
            return catalogoClient.descontar(new VentaCatalogoDTO(items));
        } catch (FeignException.Conflict e) {
            throw new ConflictoException(mensajeDe(e, "Ya no hay stock suficiente."));
        } catch (FeignException.NotFound e) {
            throw new DatoInvalidoException(mensajeDe(e, "Uno de los productos no existe."));
        } catch (FeignException e) {
            log.warn("Catálogo respondió {} al descontar stock", e.status());
            throw new ServicioExternoException(SIN_CATALOGO);
        }
    }

    public void devolver(MovimientosDTO movimientos) {
        try {
            catalogoClient.devolver(movimientos);
        } catch (FeignException e) {
            log.warn("Catálogo respondió {} al devolver stock", e.status());
            throw new ServicioExternoException(SIN_CATALOGO);
        }
    }

    private String mensajeDe(FeignException e, String porDefecto) {
        try {
            JsonNode cuerpo = JSON.readTree(e.contentUTF8());
            return cuerpo.hasNonNull("mensaje") ? cuerpo.get("mensaje").asText() : porDefecto;
        } catch (Exception ignorada) {
            return porDefecto;
        }
    }
}
