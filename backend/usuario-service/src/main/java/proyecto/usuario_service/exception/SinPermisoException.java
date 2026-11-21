package proyecto.usuario_service.exception;

public class SinPermisoException extends RuntimeException {
    public SinPermisoException(String mensaje) {
        super(mensaje);
    }
}
