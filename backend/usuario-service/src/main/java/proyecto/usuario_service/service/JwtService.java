package proyecto.usuario_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import proyecto.usuario_service.model.Usuario;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey clave;
    private final long accessMinutos;

    public JwtService(@Value("${jwt.secret:}") String secreto, @Value("${jwt.access-minutos:15}") long accessMinutos) {
        if (secreto == null || secreto.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno JWT_SECRET (texto base64 de al menos 32 bytes)");
        }
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secreto.trim());
        } catch (RuntimeException e) {
            throw new IllegalStateException("JWT_SECRET debe estar en base64");
        }
        if (bytes.length < 32) throw new IllegalStateException("JWT_SECRET debe tener al menos 32 bytes");
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.accessMinutos = accessMinutos;
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getCorreo())
                .claim("id", usuario.getId())
                .claim("rol", usuario.getRol())
                .claim("nombre", usuario.getNombre())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(accessMinutos, ChronoUnit.MINUTES)))
                .signWith(clave)
                .compact();
    }

    public Claims leer(String token) {
        return Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload();
    }

    public long segundosDeVida() {
        return accessMinutos * 60;
    }
}
