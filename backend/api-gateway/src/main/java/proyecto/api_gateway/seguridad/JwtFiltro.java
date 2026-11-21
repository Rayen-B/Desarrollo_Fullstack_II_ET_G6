package proyecto.api_gateway.seguridad;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

// Revisa el token de cada llamada, aplica los permisos por rol y pasa los datos del usuario a los microservicios
@Component
public class JwtFiltro implements GlobalFilter, Ordered {

    public static final String USER_ID = "X-User-Id";
    public static final String USER_ROL = "X-User-Rol";
    public static final String USER_CORREO = "X-User-Correo";

    private final SecretKey clave;

    public JwtFiltro(@Value("${jwt.secret:}") String secreto) {
        if (secreto == null || secreto.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno JWT_SECRET (la misma de usuario-service)");
        }
        this.clave = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secreto.trim()));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        ReglasAcceso.Acceso acceso = ReglasAcceso.para(request.getMethod(), request.getPath().value());

        // Nadie puede mandar estos headers desde afuera haciéndose pasar por otro usuario
        ServerHttpRequest.Builder limpio = request.mutate().headers(h -> {
            h.remove(USER_ID);
            h.remove(USER_ROL);
            h.remove(USER_CORREO);
        });

        if (acceso == ReglasAcceso.Acceso.BLOQUEADO) return error(exchange, HttpStatus.FORBIDDEN, "Ruta de uso interno");
        if (acceso == ReglasAcceso.Acceso.PUBLICO) return chain.filter(exchange.mutate().request(limpio.build()).build());

        String autorizacion = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (autorizacion == null || !autorizacion.startsWith("Bearer ")) {
            return error(exchange, HttpStatus.UNAUTHORIZED, "Debes iniciar sesión");
        }

        Claims claims;
        try {
            claims = Jwts.parser().verifyWith(clave).build().parseSignedClaims(autorizacion.substring(7)).getPayload();
        } catch (ExpiredJwtException e) {
            return error(exchange, HttpStatus.UNAUTHORIZED, "El token expiró");
        } catch (JwtException | IllegalArgumentException e) {
            return error(exchange, HttpStatus.UNAUTHORIZED, "Token inválido");
        }

        String rol = claims.get("rol", String.class);
        if (!ReglasAcceso.permite(acceso, rol)) return error(exchange, HttpStatus.FORBIDDEN, "No tienes permiso para esta acción");

        ServerHttpRequest conUsuario = limpio.headers(h -> {
            h.set(USER_ID, String.valueOf(claims.get("id")));
            h.set(USER_ROL, rol);
            h.set(USER_CORREO, claims.getSubject());
        }).build();
        return chain.filter(exchange.mutate().request(conUsuario).build());
    }

    private Mono<Void> error(ServerWebExchange exchange, HttpStatus estado, String mensaje) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(estado);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String json = "{\"timestamp\":\"" + LocalDateTime.now() + "\",\"status\":" + estado.value() + ",\"mensaje\":\"" + mensaje + "\"}";
        DataBuffer buffer = response.bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
