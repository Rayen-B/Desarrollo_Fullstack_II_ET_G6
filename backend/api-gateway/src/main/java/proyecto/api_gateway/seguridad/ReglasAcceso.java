package proyecto.api_gateway.seguridad;

import org.springframework.http.HttpMethod;

public final class ReglasAcceso {

    public enum Acceso { PUBLICO, SESION, VENDEDOR, ADMINISTRADOR, BLOQUEADO }

    private ReglasAcceso() {
    }

    public static Acceso para(HttpMethod metodo, String rutaOriginal) {
        String ruta = rutaOriginal.replaceAll("/{2,}", "/");
        boolean lectura = HttpMethod.GET.equals(metodo);
        if (HttpMethod.OPTIONS.equals(metodo)) return Acceso.PUBLICO;
        if (empieza(ruta, "/api/v1/auth")) return Acceso.PUBLICO;
        if (empieza(ruta, "/api/v1/productos/stock")) return Acceso.BLOQUEADO;
        if (empieza(ruta, "/api/v1/productos") || empieza(ruta, "/api/v1/categorias")) {
            return lectura ? Acceso.PUBLICO : Acceso.ADMINISTRADOR;
        }
        if (empieza(ruta, "/api/v1/nutricion")) return lectura ? Acceso.PUBLICO : Acceso.ADMINISTRADOR;
        // La tienda lee los insumos para saber cuántos trozos se pueden preparar
        if (empieza(ruta, "/api/v1/insumos")) return lectura ? Acceso.PUBLICO : Acceso.ADMINISTRADOR;
        if (empieza(ruta, "/api/v1/usuarios/perfil")) return Acceso.SESION;
        if (empieza(ruta, "/api/v1/usuarios")) return Acceso.ADMINISTRADOR;
        if (empieza(ruta, "/api/v1/reportes")) return Acceso.VENDEDOR;
        return Acceso.SESION;
    }

    public static boolean permite(Acceso acceso, String rol) {
        return switch (acceso) {
            case PUBLICO, SESION -> true;
            case VENDEDOR -> "Vendedor".equals(rol) || "Administrador".equals(rol);
            case ADMINISTRADOR -> "Administrador".equals(rol);
            case BLOQUEADO -> false;
        };
    }

    private static boolean empieza(String ruta, String prefijo) {
        return ruta.equals(prefijo) || ruta.startsWith(prefijo + "/");
    }
}
