package proyecto.catalogo_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.util.Textos;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;

@Service
public class FotoService {

    public static final String RUTA_PUBLICA = "/api/v1/productos/media/";
    private static final long MAXIMO_BYTES = 2L * 1024 * 1024;

    private final Path carpeta;

    public FotoService(@Value("${catalogo.media-dir:./media}") String mediaDir) {
        this.carpeta = Paths.get(mediaDir).toAbsolutePath().normalize();
    }

    public String guardar(String codigo, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) throw new DatoInvalidoException("Debes adjuntar una foto");
        if (archivo.getSize() > MAXIMO_BYTES) throw new DatoInvalidoException("La foto no puede pesar más de 2 MB");
        try {
            String extension = extensionReal(archivo);
            String nombre = Textos.slug(codigo) + "-" + System.currentTimeMillis() + "." + extension;
            Files.createDirectories(carpeta);
            try (InputStream entrada = archivo.getInputStream()) {
                Files.copy(entrada, carpeta.resolve(nombre), StandardCopyOption.REPLACE_EXISTING);
            }
            return RUTA_PUBLICA + nombre;
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar la foto", e);
        }
    }

    public Resource cargar(String archivo) {
        Path ruta = carpeta.resolve(archivo).normalize();
        if (!ruta.startsWith(carpeta) || !Files.isRegularFile(ruta)) {
            throw new RecursoNoEncontradoException("La foto no existe.");
        }
        return new FileSystemResource(ruta);
    }

    public MediaType tipo(String archivo) {
        String nombre = archivo.toLowerCase();
        if (nombre.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (nombre.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    public void borrarSiEsPropia(String imagen) {
        if (imagen == null || !imagen.startsWith(RUTA_PUBLICA)) return;
        Path ruta = carpeta.resolve(imagen.substring(RUTA_PUBLICA.length())).normalize();
        if (!ruta.startsWith(carpeta)) return;
        try {
            Files.deleteIfExists(ruta);
        } catch (IOException ignored) {
        }
    }

    // Se revisan los primeros bytes del archivo, no el tipo que dice el navegador
    private String extensionReal(MultipartFile archivo) throws IOException {
        byte[] cabecera = new byte[12];
        int leidos;
        try (InputStream entrada = archivo.getInputStream()) {
            leidos = entrada.readNBytes(cabecera, 0, 12);
        }
        if (leidos >= 3 && (cabecera[0] & 0xFF) == 0xFF && (cabecera[1] & 0xFF) == 0xD8 && (cabecera[2] & 0xFF) == 0xFF) return "jpg";
        if (leidos >= 4 && (cabecera[0] & 0xFF) == 0x89 && cabecera[1] == 'P' && cabecera[2] == 'N' && cabecera[3] == 'G') return "png";
        if (leidos >= 12 && texto(cabecera, 0, 4).equals("RIFF") && texto(cabecera, 8, 12).equals("WEBP")) return "webp";
        throw new DatoInvalidoException("La foto debe ser JPG, PNG o WEBP");
    }

    private String texto(byte[] bytes, int desde, int hasta) {
        return new String(Arrays.copyOfRange(bytes, desde, hasta), StandardCharsets.US_ASCII);
    }
}
