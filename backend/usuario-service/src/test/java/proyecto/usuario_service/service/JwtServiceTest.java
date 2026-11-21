package proyecto.usuario_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import proyecto.usuario_service.model.Usuario;
import proyecto.usuario_service.util.Validaciones;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRETO = Base64.getEncoder().encodeToString("clave-de-prueba-de-32-bytes-o-mas!!".getBytes());

    private Usuario admin() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setNombre("Admin");
        u.setCorreo("admin@papitadulce.cl");
        u.setRol(Usuario.ADMINISTRADOR);
        return u;
    }

    @Test
    void generaUnTokenConIdRolYNombre() {
        JwtService jwt = new JwtService(SECRETO, 15);

        Claims claims = jwt.leer(jwt.generar(admin()));

        assertEquals("admin@papitadulce.cl", claims.getSubject());
        assertEquals(1, claims.get("id", Integer.class));
        assertEquals("Administrador", claims.get("rol", String.class));
        assertEquals(900, jwt.segundosDeVida());
        assertTrue(claims.getExpiration().after(claims.getIssuedAt()));
    }

    @Test
    void rechazaUnTokenFirmadoConOtraClave() {
        String otro = Base64.getEncoder().encodeToString("otra-clave-distinta-de-32-bytes-o-mas".getBytes());
        String token = new JwtService(otro, 15).generar(admin());

        assertThrows(JwtException.class, () -> new JwtService(SECRETO, 15).leer(token));
    }

    @Test
    void rechazaUnTokenVencido() {
        String token = new JwtService(SECRETO, -1).generar(admin());
        assertThrows(JwtException.class, () -> new JwtService(SECRETO, 15).leer(token));
    }

    @Test
    void sinSecretoNoArranca() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> new JwtService("", 15));
        assertTrue(ex.getMessage().contains("JWT_SECRET"));
        assertThrows(IllegalStateException.class, () -> new JwtService(Base64.getEncoder().encodeToString("corta".getBytes()), 15));
    }

    @Test
    void validaRunYContrasenasComoElFront() {
        assertNull(Validaciones.validarRun("190110222"));
        assertNull(Validaciones.validarRun("111111111"));
        assertNotNull(Validaciones.validarRun("19.011.022-2"));
        assertEquals("RUN inválido. El dígito verificador no corresponde (esperado: 2)", Validaciones.validarRun("19011022K"));
        assertTrue(Validaciones.passwordSegura("Papita#2026"));
        assertFalse(Validaciones.passwordSegura("papita#2026"));
        assertTrue(Validaciones.passwordAdmin("Ven#2026"));
        assertFalse(Validaciones.passwordAdmin("Ventas#20261"));
    }
}
