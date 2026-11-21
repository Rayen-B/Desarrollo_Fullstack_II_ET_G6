package proyecto.usuario_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import proyecto.usuario_service.util.Validaciones;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthService {

    public static final String CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos.";
    public static final String SESION_EXPIRADA = "La sesión expiró, inicia sesión de nuevo.";
    public static final String PASSWORD_DEBIL = "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Value("${jwt.refresh-dias:7}")
    private long refreshDias = 7;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public UsuarioResponseDTO registrar(RegistroRequestDTO request) {
        String correo = Validaciones.correo(request.getCorreo());
        if (!Validaciones.passwordSegura(request.getPassword())) throw new DatoInvalidoException(PASSWORD_DEBIL);
        String run = runOpcional(request.getRun());
        if (usuarioRepository.findByCorreoIgnoreCase(correo).isPresent()) {
            throw new ConflictoException("Ya existe una cuenta registrada con ese correo.");
        }
        if (run != null && usuarioRepository.findByRunIgnoreCase(run).isPresent()) {
            throw new ConflictoException("El RUN ingresado ya se encuentra registrado.");
        }
        Usuario usuario = new Usuario();
        usuario.setRun(run);
        usuario.setNombre(Validaciones.limpio(request.getNombre()));
        usuario.setApellidos(Validaciones.limpio(request.getApellidos()));
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(Usuario.CLIENTE);
        usuario.setFechaNacimiento(request.getFechaNacimiento());
        usuario.setRegion(Validaciones.limpio(request.getRegion()));
        usuario.setComuna(Validaciones.limpio(request.getComuna()));
        usuario.setDireccion(Validaciones.limpio(request.getDireccion()));
        return UsuarioService.aDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public TokenResponseDTO login(LoginRequestDTO request) {
        String identificador = Validaciones.correo(request.getIdentificador());
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(identificador)
                .or(() -> usuarioRepository.findByUsuarioIgnoreCase(identificador))
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .orElseThrow(() -> new NoAutorizadoException(CREDENCIALES_INVALIDAS));
        return emitir(usuario);
    }

    // Cada refresh token sirve una sola vez. Si alguien reutiliza uno ya usado, se cierran todas las sesiones de ese usuario
    @Transactional(noRollbackFor = NoAutorizadoException.class)
    public TokenResponseDTO renovar(String refreshToken) {
        RefreshToken guardado = refreshTokenRepository.findByTokenHash(hash(refreshToken))
                .orElseThrow(() -> new NoAutorizadoException(SESION_EXPIRADA));
        if (guardado.isRevocado()) {
            refreshTokenRepository.revocarTodosDe(guardado.getUsuario().getId());
            throw new NoAutorizadoException(SESION_EXPIRADA);
        }
        guardado.setRevocado(true);
        refreshTokenRepository.save(guardado);
        if (guardado.getExpiraEn().isBefore(LocalDateTime.now())) throw new NoAutorizadoException(SESION_EXPIRADA);
        return emitir(guardado.getUsuario());
    }

    @Transactional
    public void cerrarSesion(String refreshToken) {
        refreshTokenRepository.findByTokenHash(hash(refreshToken)).ifPresent(r -> {
            r.setRevocado(true);
            refreshTokenRepository.save(r);
        });
    }

    private TokenResponseDTO emitir(Usuario usuario) {
        String refresh = nuevoToken();
        refreshTokenRepository.save(new RefreshToken(hash(refresh), usuario, LocalDateTime.now().plusDays(refreshDias)));
        return new TokenResponseDTO(jwtService.generar(usuario), refresh, "Bearer", jwtService.segundosDeVida(), UsuarioService.aDto(usuario));
    }

    private String nuevoToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private String runOpcional(String run) {
        if (run == null || run.isBlank()) return null;
        String error = Validaciones.validarRun(run);
        if (error != null) throw new DatoInvalidoException(error);
        return run.trim().toUpperCase();
    }
}
