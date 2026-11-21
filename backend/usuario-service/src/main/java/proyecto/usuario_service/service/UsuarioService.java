package proyecto.usuario_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.usuario_service.dto.CambioPasswordDTO;
import proyecto.usuario_service.dto.PerfilRequestDTO;
import proyecto.usuario_service.dto.UsuarioAdminRequestDTO;
import proyecto.usuario_service.dto.UsuarioResponseDTO;
import proyecto.usuario_service.exception.ConflictoException;
import proyecto.usuario_service.exception.DatoInvalidoException;
import proyecto.usuario_service.exception.RecursoNoEncontradoException;
import proyecto.usuario_service.model.Usuario;
import proyecto.usuario_service.repository.UsuarioRepository;
import proyecto.usuario_service.util.Validaciones;

import java.util.List;

@Service
public class UsuarioService {

    private static final String PASSWORD_ADMIN = "La contraseña debe tener entre 4 y 10 caracteres, con letra, número y símbolo";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UsuarioResponseDTO perfil(Long id) {
        return aDto(buscar(id));
    }

    @Transactional
    public UsuarioResponseDTO actualizarPerfil(Long id, PerfilRequestDTO request) {
        Usuario usuario = buscar(id);
        String correo = Validaciones.correo(request.getCorreo());
        usuarioRepository.findByCorreoIgnoreCase(correo)
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new ConflictoException("Ese correo ya está registrado por otro usuario.");
                });
        usuario.setNombre(Validaciones.limpio(request.getNombre()));
        usuario.setCorreo(correo);
        if (request.getApellidos() != null) usuario.setApellidos(Validaciones.limpio(request.getApellidos()));
        if (request.getRegion() != null) usuario.setRegion(Validaciones.limpio(request.getRegion()));
        if (request.getComuna() != null) usuario.setComuna(Validaciones.limpio(request.getComuna()));
        if (request.getDireccion() != null) usuario.setDireccion(Validaciones.limpio(request.getDireccion()));
        if (request.getFechaNacimiento() != null) usuario.setFechaNacimiento(request.getFechaNacimiento());
        return aDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(Long id, CambioPasswordDTO request) {
        Usuario usuario = buscar(id);
        if (!passwordEncoder.matches(request.getActual(), usuario.getPasswordHash())) {
            throw new DatoInvalidoException("La contraseña actual no es correcta.");
        }
        if (!Validaciones.passwordSegura(request.getNueva())) throw new DatoInvalidoException(AuthService.PASSWORD_DEBIL);
        usuario.setPasswordHash(passwordEncoder.encode(request.getNueva()));
        usuarioRepository.save(usuario);
    }

    public List<UsuarioResponseDTO> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioService::aDto).toList();
    }

    public UsuarioResponseDTO obtener(Long id) {
        return aDto(buscar(id));
    }

    @Transactional
    public UsuarioResponseDTO crear(UsuarioAdminRequestDTO request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) throw new DatoInvalidoException("La contraseña es requerida");
        Usuario usuario = new Usuario();
        aplicar(usuario, request);
        return aDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDTO actualizar(Long id, UsuarioAdminRequestDTO request) {
        Usuario usuario = buscar(id);
        aplicar(usuario, request);
        return aDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public void eliminar(Long id, Long idActual) {
        Usuario usuario = buscar(id);
        if (usuario.getId().equals(idActual)) throw new ConflictoException("No puedes eliminar tu propio usuario.");
        usuarioRepository.delete(usuario);
    }

    private void aplicar(Usuario usuario, UsuarioAdminRequestDTO request) {
        String errorRun = Validaciones.validarRun(request.getRun());
        if (errorRun != null) throw new DatoInvalidoException(errorRun);
        String run = request.getRun().trim().toUpperCase();
        String correo = Validaciones.correo(request.getCorreo());
        usuarioRepository.findByRunIgnoreCase(run)
                .filter(otro -> !otro.getId().equals(usuario.getId()))
                .ifPresent(otro -> {
                    throw new ConflictoException("El RUN ya se encuentra registrado.");
                });
        usuarioRepository.findByCorreoIgnoreCase(correo)
                .filter(otro -> !otro.getId().equals(usuario.getId()))
                .ifPresent(otro -> {
                    throw new ConflictoException("Ya existe una cuenta con ese correo.");
                });
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (!Validaciones.passwordAdmin(request.getPassword())) throw new DatoInvalidoException(PASSWORD_ADMIN);
            usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        usuario.setRun(run);
        usuario.setRol(request.getRol());
        usuario.setNombre(Validaciones.limpio(request.getNombre()));
        usuario.setApellidos(Validaciones.limpio(request.getApellidos()));
        usuario.setCorreo(correo);
        usuario.setFechaNacimiento(request.getFechaNacimiento());
        usuario.setRegion(Validaciones.limpio(request.getRegion()));
        usuario.setComuna(Validaciones.limpio(request.getComuna()));
        usuario.setDireccion(Validaciones.limpio(request.getDireccion()));
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("El usuario no existe."));
    }

    static UsuarioResponseDTO aDto(Usuario u) {
        return new UsuarioResponseDTO(u.getId(), u.getRun(), u.getUsuario(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getRol(), u.getFechaNacimiento(), u.getRegion(), u.getComuna(), u.getDireccion());
    }
}
