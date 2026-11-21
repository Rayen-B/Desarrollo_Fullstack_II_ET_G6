package proyecto.usuario_service.util;

import java.util.Locale;

// Mismas reglas de src/utils/validaciones.js del front
public final class Validaciones {

    private Validaciones() {
    }

    public static String limpio(String texto) {
        return texto == null ? "" : texto.trim();
    }

    public static String correo(String correo) {
        return limpio(correo).toLowerCase(Locale.ROOT);
    }

    // RUN sin puntos ni guion, con dígito verificador módulo 11 (ej: 19011022K)
    public static String validarRun(String run) {
        String limpio = limpio(run).toUpperCase(Locale.ROOT);
        if (limpio.isEmpty()) return "El RUN es requerido";
        if (limpio.contains(".") || limpio.contains("-")) return "El RUN debe ingresarse sin puntos ni guión (ej: 19011022K)";
        if (limpio.length() < 7 || limpio.length() > 9) return "El RUN debe tener entre 7 y 9 caracteres (sin puntos ni guión)";
        String cuerpo = limpio.substring(0, limpio.length() - 1);
        char dv = limpio.charAt(limpio.length() - 1);
        if (!cuerpo.matches("\\d+")) return "El cuerpo del RUN debe contener solo números";
        int suma = 0;
        int multiplo = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += (cuerpo.charAt(i) - '0') * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }
        int resultado = 11 - (suma % 11);
        char esperado = resultado == 11 ? '0' : resultado == 10 ? 'K' : (char) ('0' + resultado);
        if (dv != esperado) return "RUN inválido. El dígito verificador no corresponde (esperado: " + esperado + ")";
        return null;
    }

    // Registro y cambio de contraseña: 8 o más, una mayúscula, un número y un símbolo
    public static boolean passwordSegura(String password) {
        return password != null && password.length() >= 8
                && password.matches(".*[A-ZÁÉÍÓÚÑ].*")
                && password.matches(".*\\d.*")
                && password.matches(".*[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9].*");
    }

    // Formulario de usuarios del admin: 4 a 10, letra, número y símbolo
    public static boolean passwordAdmin(String password) {
        return password != null && password.length() >= 4 && password.length() <= 10
                && password.matches(".*[a-zA-Z].*")
                && password.matches(".*\\d.*")
                && password.matches(".*[^a-zA-Z0-9].*");
    }
}
