package proyecto.usuario_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import proyecto.usuario_service.dto.CambioPasswordDTO;
import proyecto.usuario_service.dto.PerfilRequestDTO;
import proyecto.usuario_service.dto.UsuarioAdminRequestDTO;
import proyecto.usuario_service.dto.UsuarioResponseDTO;
import proyecto.usuario_service.exception.ConflictoException;
import proyecto.usuario_service.exception.DatoInvalidoException;
import proyecto.usuario_service.exception.RecursoNoEncontradoException;
import proyecto.usuario_service.model.Usuario;
import proyecto.usuario_service.repository.UsuarioRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario lola;

    @BeforeEach
    void setUp() {
        lola = new Usuario();
        lola.setId(3L);
        lola.setRun("184561239");
        lola.setNombre("Lola");
        lola.setCorreo("lola.mento@profesor.duoc.cl");
        lola.setPasswordHash("hash-viejo");
        lola.setRol(Usuario.VENDEDOR);
    }

    private UsuarioAdminRequestDTO admin(String run, String password) {
        return new UsuarioAdminRequestDTO(run, "Vendedor", "Lola", "Mento Rojas", "lola.mento@profesor.duoc.cl", password, null, "", "", "Av. Providencia 456");
    }

    @Test
    void perfilConCorreoDeOtroDa409() {
        Usuario otro = new Usuario();
        otro.setId(9L);
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));
        when(usuarioRepository.findByCorreoIgnoreCase("otro@gmail.com")).thenReturn(Optional.of(otro));

        PerfilRequestDTO request = new PerfilRequestDTO("Lola", null, "otro@gmail.com", null, null, null, null);
        ConflictoException ex = assertThrows(ConflictoException.class, () -> usuarioService.actualizarPerfil(3L, request));
        assertEquals("Ese correo ya está registrado por otro usuario.", ex.getMessage());
    }

    @Test
    void perfilNoCambiaElRol() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));
        when(usuarioRepository.findByCorreoIgnoreCase(any())).thenReturn(Optional.of(lola));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        UsuarioResponseDTO r = usuarioService.actualizarPerfil(3L, new PerfilRequestDTO("Lolita", "Mento", "lola.mento@profesor.duoc.cl", null, null, "Calle 1", null));

        assertEquals("Lolita", r.getNombre());
        assertEquals("Calle 1", r.getDireccion());
        assertEquals("Vendedor", r.getRol());
    }

    @Test
    void cambiarPasswordPideLaActual() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));
        when(passwordEncoder.matches("mala", "hash-viejo")).thenReturn(false);

        DatoInvalidoException ex = assertThrows(DatoInvalidoException.class, () -> usuarioService.cambiarPassword(3L, new CambioPasswordDTO("mala", "Nueva#2026")));
        assertEquals("La contraseña actual no es correcta.", ex.getMessage());
    }

    @Test
    void cambiarPasswordGuardaLaNuevaEncriptada() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));
        when(passwordEncoder.matches("Ventas#2026", "hash-viejo")).thenReturn(true);
        when(passwordEncoder.encode("Nueva#2026")).thenReturn("hash-nuevo");

        usuarioService.cambiarPassword(3L, new CambioPasswordDTO("Ventas#2026", "Nueva#2026"));

        assertEquals("hash-nuevo", lola.getPasswordHash());
    }

    @Test
    void crearSinPasswordDa400() {
        assertThrows(DatoInvalidoException.class, () -> usuarioService.crear(admin("184561239", "")));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crearConRunInvalidoDa400() {
        DatoInvalidoException ex = assertThrows(DatoInvalidoException.class, () -> usuarioService.crear(admin("184561234", "Ven#2026")));
        assertTrue(ex.getMessage().startsWith("RUN inválido"));
    }

    @Test
    void crearConRunRepetidoDa409() {
        when(usuarioRepository.findByRunIgnoreCase("184561239")).thenReturn(Optional.of(lola));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> usuarioService.crear(admin("184561239", "Ven#2026")));
        assertEquals("El RUN ya se encuentra registrado.", ex.getMessage());
    }

    @Test
    void editarSinPasswordMantieneLaActual() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));
        when(usuarioRepository.findByRunIgnoreCase("184561239")).thenReturn(Optional.of(lola));
        when(usuarioRepository.findByCorreoIgnoreCase(any())).thenReturn(Optional.of(lola));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        usuarioService.actualizar(3L, admin("184561239", ""));

        assertEquals("hash-viejo", lola.getPasswordHash());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void noSePuedeEliminarAsiMismo() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(lola));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> usuarioService.eliminar(3L, 3L));
        assertEquals("No puedes eliminar tu propio usuario.", ex.getMessage());
        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    void usuarioInexistenteDa404() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class, () -> usuarioService.obtener(99L));
    }
}
