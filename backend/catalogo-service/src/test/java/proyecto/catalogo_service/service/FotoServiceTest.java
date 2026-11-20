package proyecto.catalogo_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.util.HtmlSeguro;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FotoServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @TempDir
    Path carpeta;

    private FotoService fotoService;

    @BeforeEach
    void setUp() {
        fotoService = new FotoService(carpeta.toString());
    }

    @Test
    void guardaUnPngYLoPuedeServir() throws Exception {
        String url = fotoService.guardar("TC001", new MockMultipartFile("archivo", "torta.png", "image/png", PNG));

        assertTrue(url.startsWith("/api/v1/productos/media/tc001-"));
        assertTrue(url.endsWith(".png"));
        String archivo = url.substring(FotoService.RUTA_PUBLICA.length());
        assertTrue(Files.exists(carpeta.resolve(archivo)));
        assertTrue(fotoService.cargar(archivo).exists());
    }

    @Test
    void rechazaUnArchivoQueNoEsImagenAunqueDigaQueSi() {
        MockMultipartFile falso = new MockMultipartFile("archivo", "virus.png", "image/png", "<script>".getBytes());
        assertThrows(DatoInvalidoException.class, () -> fotoService.guardar("TC001", falso));
    }

    @Test
    void noDejaSalirDeLaCarpetaMedia() {
        assertThrows(RecursoNoEncontradoException.class, () -> fotoService.cargar("../secreto.txt"));
    }

    @Test
    void borraSoloFotosPropias() throws Exception {
        Path foto = Files.write(carpeta.resolve("tc001-1.png"), PNG);

        fotoService.borrarSiEsPropia("menu/Torta_Trufa");
        assertTrue(Files.exists(foto));

        fotoService.borrarSiEsPropia("/api/v1/productos/media/tc001-1.png");
        assertFalse(Files.exists(foto));
    }

    @Test
    void htmlSeguroQuitaScriptsYConservaElFormato() {
        String limpio = HtmlSeguro.limpiar("<h2>Hola</h2><p onclick=\"x()\">Rica <a href=\"javascript:alert(1)\">aquí</a></p><script>alert(1)</script>");
        assertEquals("<h2>Hola</h2><p>Rica <a rel=\"nofollow\">aquí</a></p>", limpio);
    }
}
