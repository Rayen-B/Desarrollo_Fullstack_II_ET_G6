package proyecto.usuario_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import proyecto.usuario_service.dto.LoginRequestDTO;
import proyecto.usuario_service.dto.RegistroRequestDTO;
import proyecto.usuario_service.dto.TokenResponseDTO;
import proyecto.usuario_service.dto.UsuarioResponseDTO;
import proyecto.usuario_service.exception.ConflictoException;
import proyecto.usuario_service.exception.DatoInvalidoException;
import proyecto.usuario_service.exception.NoAutorizadoException;
import proyecto.usuario_service.model.RefreshToken;
import proyecto.usuario_service.model.Usuario;
import proyecto.usuario_service.repository.RefreshTokenRepository;
import proyecto.usuario_service.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private Usuario armando;

    @BeforeEach
    void setUp() {
        armando = new Usuario();
        armando.setId(4L);
        armando.setNombre("Armando");
        armando.setCorreo("armando.quito@gmail.com");
        armando.setPasswordHash("hash");
        armando.setRol(Usuario.CLIENTE);
    }

    private RegistroRequestDTO registro(String correo, String password, String run) {
        return new RegistroRequestDTO("Camila", correo, password, "Región Metropolitana de Santiago", "Santiago", null, run, null, null);
    }

    @Test
    void registroCreaClienteConPasswordEncriptada() {
        when(usuarioRepository.findByCorreoIgnoreCase("camila@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Papita#2026")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        UsuarioResponseDTO r = authService.registrar(registro(" Camila@Gmail.com ", "Papita#2026", ""));

        assertEquals("camila@gmail.com", r.getCorreo());
        assertEquals("Cliente", r.getRol());
        assertNull(r.getRun());
        ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(guardado.capture());
        assertEquals("hash-bcrypt", guardado.getValue().getPasswordHash());
    }

    @Test
    void registroConCorreoRepetidoDa409() {
        when(usuarioRepository.findByCorreoIgnoreCase("armando.quito@gmail.com")).thenReturn(Optional.of(armando));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> authService.registrar(registro("armando.quito@gmail.com", "Papita#2026", null)));
        assertEquals("Ya existe una cuenta registrada con ese correo.", ex.getMessage());
    }

    @Test
    void registroConPasswordDebilDa400() {
        assertThrows(DatoInvalidoException.class, () -> authService.registrar(registro("camila@gmail.com", "papita", null)));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void registroConRunInvalidoDa400() {
        DatoInvalidoException ex = assertThrows(DatoInvalidoException.class, () -> authService.registrar(registro("camila@gmail.com", "Papita#2026", "201239875")));
        assertTrue(ex.getMessage().startsWith("RUN inválido"));
    }

    @Test
    void loginPorNombreDeUsuarioEntregaTokens() {
        when(usuarioRepository.findByCorreoIgnoreCase("admin")).thenReturn(Optional.empty());
        when(usuarioRepository.findByUsuarioIgnoreCase("admin")).thenReturn(Optional.of(armando));
        when(passwordEncoder.matches("admin", "hash")).thenReturn(true);
        when(jwtService.generar(armando)).thenReturn("jwt");
        when(jwtService.segundosDeVida()).thenReturn(900L);

        TokenResponseDTO r = authService.login(new LoginRequestDTO(" Admin ", "admin"));

        assertEquals("jwt", r.getAccessToken());
        assertEquals("Bearer", r.getTipo());
        assertEquals(900L, r.getExpiraEn());
        assertNotNull(r.getRefreshToken());
        ArgumentCaptor<RefreshToken> guardado = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(guardado.capture());
        assertEquals(AuthService.hash(r.getRefreshToken()), guardado.getValue().getTokenHash());
        assertNotEquals(r.getRefreshToken(), guardado.getValue().getTokenHash());
    }

    @Test
    void loginConPasswordIncorrectaDa401() {
        when(usuarioRepository.findByCorreoIgnoreCase("armando.quito@gmail.com")).thenReturn(Optional.of(armando));
        when(passwordEncoder.matches("mala", "hash")).thenReturn(false);

        NoAutorizadoException ex = assertThrows(NoAutorizadoException.class, () -> authService.login(new LoginRequestDTO("armando.quito@gmail.com", "mala")));
        assertEquals("Usuario o contraseña incorrectos.", ex.getMessage());
        verifyNoInteractions(jwtService);
    }

    @Test
    void refreshAnulaElUsadoYEntregaUnoNuevo() {
        RefreshToken actual = new RefreshToken(AuthService.hash("viejo"), armando, LocalDateTime.now().plusDays(1));
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("viejo"))).thenReturn(Optional.of(actual));
        when(jwtService.generar(armando)).thenReturn("jwt-nuevo");

        TokenResponseDTO r = authService.renovar("viejo");

        assertTrue(actual.isRevocado());
        assertEquals("jwt-nuevo", r.getAccessToken());
        assertNotEquals("viejo", r.getRefreshToken());
    }

    @Test
    void refreshReutilizadoCierraTodasLasSesiones() {
        RefreshToken usado = new RefreshToken(AuthService.hash("robado"), armando, LocalDateTime.now().plusDays(1));
        usado.setRevocado(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(usado));

        assertThrows(NoAutorizadoException.class, () -> authService.renovar("robado"));
        verify(refreshTokenRepository).revocarTodosDe(4L);
        verifyNoInteractions(jwtService);
    }

    @Test
    void refreshVencidoDa401() {
        RefreshToken vencido = new RefreshToken(AuthService.hash("x"), armando, LocalDateTime.now().minusMinutes(1));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(vencido));

        NoAutorizadoException ex = assertThrows(NoAutorizadoException.class, () -> authService.renovar("x"));
        assertEquals("La sesión expiró, inicia sesión de nuevo.", ex.getMessage());
    }

    @Test
    void refreshDesconocidoDa401() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());
        assertThrows(NoAutorizadoException.class, () -> authService.renovar("inventado"));
    }

    @Test
    void logoutAnulaElRefresh() {
        RefreshToken actual = new RefreshToken(AuthService.hash("t"), armando, LocalDateTime.now().plusDays(1));
        when(refreshTokenRepository.findByTokenHash(AuthService.hash("t"))).thenReturn(Optional.of(actual));

        authService.cerrarSesion("t");

        assertTrue(actual.isRevocado());
    }
}
