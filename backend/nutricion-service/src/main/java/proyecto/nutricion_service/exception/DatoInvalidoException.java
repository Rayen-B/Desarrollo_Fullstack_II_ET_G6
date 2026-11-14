package proyecto.nutricion_service.exception;

public class DatoInvalidoException extends RuntimeException {
    public DatoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
