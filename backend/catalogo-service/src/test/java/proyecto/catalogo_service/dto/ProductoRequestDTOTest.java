package proyecto.catalogo_service.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductoRequestDTOTest {

    private static Validator validator;

    @BeforeAll
    static void crearValidador() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private ProductoRequestDTO producto(Integer precio) {
        ProductoRequestDTO dto = new ProductoRequestDTO();
        dto.setCodigo("TC010");
        dto.setNombre("Torta de Zanahoria");
        dto.setCategoria("Tortas");
        dto.setPrecio(precio);
        dto.setStock(5);
        return dto;
    }

    @Test
    void precioCeroEsValidoComoProductoGratuito() {
        assertTrue(validator.validate(producto(0)).isEmpty());
    }

    @Test
    void precioNegativoNoEsValido() {
        Set<ConstraintViolation<ProductoRequestDTO>> errores = validator.validate(producto(-1));
        assertEquals(1, errores.size());
        assertEquals("precio", errores.iterator().next().getPropertyPath().toString());
    }

    @Test
    void precioEsRequerido() {
        assertEquals(1, validator.validate(producto(null)).size());
    }
}
