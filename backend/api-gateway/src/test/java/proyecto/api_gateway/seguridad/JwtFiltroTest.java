package proyecto.api_gateway.seguridad;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class JwtFiltroTest {

    private static final byte[] BYTES = "clave-de-prueba-de-32-bytes-o-mas!!".getBytes();

    private JwtFiltro filtro;
    private AtomicReference<ServerWebExchange> recibido;
    private GatewayFilterChain cadena;

    @BeforeEach
    void setUp() {
        filtro = new JwtFiltro(Base64.getEncoder().encodeToString(BYTES));
        recibido = new AtomicReference<>();
        cadena = exchange -> {
            recibido.set(exchange);
            return Mono.empty();
        };
    }

    private String token(String rol, long segundos) {
        Instant ahora = Instant.now();
        return Jwts.builder().subject("u@papitadulce.cl").claim("id", 7).claim("rol", rol)
                .issuedAt(Date.from(ahora)).expiration(Date.from(ahora.plusSeconds(segundos)))
                .signWith(Keys.hmacShaKeyFor(BYTES)).compact();
    }

    private MockServerWebExchange llamar(HttpMethod metodo, String ruta, String token, String rolFalso) {
        MockServerHttpRequest.BaseBuilder<?> req = MockServerHttpRequest.method(metodo, ruta);
        if (token != null) req.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (rolFalso != null) req.header(JwtFiltro.USER_ROL, rolFalso);
        MockServerWebExchange exchange = MockServerWebExchange.from(req.build());
        filtro.filter(exchange, cadena).block();
        return exchange;
    }

    @Test
    void rutasPublicasPasanSinTokenYSinHeadersFalsos() {
        llamar(HttpMethod.GET, "/api/v1/productos", null, "Administrador");

        assertNotNull(recibido.get());
        assertNull(recibido.get().getRequest().getHeaders().getFirst(JwtFiltro.USER_ROL));
    }

    @Test
    void sinTokenDa401() {
        MockServerWebExchange ex = llamar(HttpMethod.POST, "/api/v1/productos", null, null);

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getResponse().getStatusCode());
        assertNull(recibido.get());
    }

    @Test
    void clienteNoPuedeCrearProductos() {
        MockServerWebExchange ex = llamar(HttpMethod.POST, "/api/v1/productos", token("Cliente", 60), null);
        assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    }

    @Test
    void adminPasaYSeEnvianSusDatos() {
        llamar(HttpMethod.DELETE, "/api/v1/usuarios/3", token("Administrador", 60), "Cliente");

        HttpHeaders headers = recibido.get().getRequest().getHeaders();
        assertEquals("7", headers.getFirst(JwtFiltro.USER_ID));
        assertEquals("Administrador", headers.getFirst(JwtFiltro.USER_ROL));
        assertEquals("u@papitadulce.cl", headers.getFirst(JwtFiltro.USER_CORREO));
    }

    @Test
    void vendedorVeInsumosPeroNoLosEdita() {
        llamar(HttpMethod.GET, "/api/v1/insumos", token("Vendedor", 60), null);
        assertNotNull(recibido.get());

        MockServerWebExchange ex = llamar(HttpMethod.PUT, "/api/v1/insumos/harina", token("Vendedor", 60), null);
        assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    }

    @Test
    void clienteEntraASuPerfil() {
        llamar(HttpMethod.GET, "/api/v1/usuarios/perfil", token("Cliente", 60), null);
        assertEquals("Cliente", recibido.get().getRequest().getHeaders().getFirst(JwtFiltro.USER_ROL));
    }

    @Test
    void tokenVencidoOFalsoDa401() {
        assertEquals(HttpStatus.UNAUTHORIZED, llamar(HttpMethod.GET, "/api/v1/usuarios/perfil", token("Cliente", -60), null).getResponse().getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, llamar(HttpMethod.GET, "/api/v1/usuarios/perfil", "abc.def.ghi", null).getResponse().getStatusCode());
    }

    @Test
    void stockEstaBloqueadoInclusoParaAdmin() {
        MockServerWebExchange ex = llamar(HttpMethod.POST, "/api/v1/productos/stock/descontar", token("Administrador", 60), null);
        assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
        assertEquals(ReglasAcceso.Acceso.BLOQUEADO, ReglasAcceso.para(HttpMethod.POST, "/api/v1/productos//stock/descontar"));
    }
}
