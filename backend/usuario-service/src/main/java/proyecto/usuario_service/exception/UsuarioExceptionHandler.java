package proyecto.usuario_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import proyecto.usuario_service.dto.ErrorResponseDTO;

import java.time.LocalDateTime;

@ControllerAdvice
public class UsuarioExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        return respuesta(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DatoInvalidoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarDatoInvalido(DatoInvalidoException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarConflicto(ConflictoException ex) {
        return respuesta(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(NoAutorizadoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarNoAutorizado(NoAutorizadoException ex) {
        return respuesta(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(SinPermisoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarSinPermiso(SinPermisoException ex) {
        return respuesta(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponseDTO> manejarSinSesion(MissingRequestHeaderException ex) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> manejarValidacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getAllErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Datos inválidos");
        return respuesta(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> manejarJsonInvalido(HttpMessageNotReadableException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no tiene un formato JSON válido");
    }

    private ResponseEntity<ErrorResponseDTO> respuesta(HttpStatus estado, String mensaje) {
        return new ResponseEntity<>(new ErrorResponseDTO(LocalDateTime.now(), estado.value(), mensaje), estado);
    }
}
