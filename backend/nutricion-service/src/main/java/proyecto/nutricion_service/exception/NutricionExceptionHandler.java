package proyecto.nutricion_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import proyecto.nutricion_service.dto.ErrorResponseDTO;

import java.time.LocalDateTime;

@ControllerAdvice
public class NutricionExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        return respuesta(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DatoInvalidoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarDatoInvalido(DatoInvalidoException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, ex.getMessage());
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

    @ExceptionHandler(ServicioExternoException.class)
    public ResponseEntity<ErrorResponseDTO> manejarServicioExterno(ServicioExternoException ex) {
        return respuesta(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    private ResponseEntity<ErrorResponseDTO> respuesta(HttpStatus estado, String mensaje) {
        return new ResponseEntity<>(new ErrorResponseDTO(LocalDateTime.now(), estado.value(), mensaje), estado);
    }
}
