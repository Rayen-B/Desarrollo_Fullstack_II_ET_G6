package proyecto.nutricion_service.exception;

public class ServicioExternoException extends RuntimeException {
    public ServicioExternoException(String mensaje) {
        super(mensaje);
    }
}
