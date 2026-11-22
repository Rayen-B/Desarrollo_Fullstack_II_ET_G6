// Cliente HTTP del backend. Todas las llamadas pasan por el API Gateway (puerto 8080).
//
// VITE_API_URL define la URL base:
//   - Desarrollo local:  http://localhost:8080  (valor por defecto)
//   - AWS con CloudFront sirviendo /api/* en el mismo dominio: déjala vacía ("")
import { obtenerToken, obtenerRefresh, guardarTokens, borrarToken } from './sesion';

export const API_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

// Se emite cuando la sesión ya no se puede renovar: la app cierra la sesión
export const EVENTO_SESION_EXPIRADA = 'papita:sesion-expirada';

const TIMEOUT_POR_DEFECTO_MS = 15000;
const RUTA_REFRESH = '/api/v1/auth/refresh';

// Error con el código HTTP (status 0 = no hubo respuesta: sin red, servidor caído o tiempo agotado)
export class ApiError extends Error {
  constructor(mensaje, status = 0) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Las rutas que devuelve el backend ("/api/v1/productos/media/x.webp") se completan con la dirección del API
export const resolverUrlApi = (ruta) => (String(ruta).startsWith('/api/') ? `${API_URL}${ruta}` : ruta);

async function enviar(ruta, { method, body, timeoutMs, token }) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const cabeceras = {};
  if (body !== undefined && !esFormData) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${API_URL}${ruta}`, {
      method,
      headers: Object.keys(cabeceras).length > 0 ? cabeceras : undefined,
      body: body === undefined ? undefined : (esFormData ? body : JSON.stringify(body)),
      signal: controlador.signal
    });
  } catch (e) {
    throw new ApiError(e && e.name === 'AbortError' ? 'El servidor tardó demasiado en responder' : 'No se pudo conectar con el servidor', 0);
  } finally {
    clearTimeout(temporizador);
  }
}

const leerJson = async (respuesta) => {
  try { return await respuesta.json(); } catch { return null; }
};

// Una sola renovación a la vez: si varias llamadas reciben 401 juntas, esperan la misma.
// (El backend anula todas las sesiones si un refreshToken se usa dos veces.)
let renovacionEnCurso = null;

export function renovarSesion() {
  if (renovacionEnCurso) return renovacionEnCurso;
  renovacionEnCurso = (async () => {
    const refreshToken = obtenerRefresh();
    if (!refreshToken) return false;
    const respuesta = await enviar(RUTA_REFRESH, { method: 'POST', body: { refreshToken }, timeoutMs: TIMEOUT_POR_DEFECTO_MS });
    if (!respuesta.ok) {
      // Otra pestaña pudo haberlo renovado recién: si el refresh guardado cambió, se usa ese
      return Boolean(obtenerRefresh()) && obtenerRefresh() !== refreshToken;
    }
    guardarTokens(await leerJson(respuesta));
    return true;
  })().finally(() => { renovacionEnCurso = null; });
  return renovacionEnCurso;
}

function cerrarSesionLocal() {
  borrarToken();
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
}

// Llama al backend y devuelve el JSON. Si algo falla lanza ApiError con el "mensaje" que envía el servidor.
// Si el accessToken venció, lo renueva con el refreshToken y repite la llamada una vez.
export async function http(ruta, { method = 'GET', body, timeoutMs = TIMEOUT_POR_DEFECTO_MS } = {}) {
  const tokenUsado = obtenerToken();
  let respuesta = await enviar(ruta, { method, body, timeoutMs, token: tokenUsado });

  if (respuesta.status === 401 && (tokenUsado || obtenerRefresh()) && !ruta.startsWith('/api/v1/auth/')) {
    let renovado = false;
    try {
      renovado = obtenerToken() !== tokenUsado ? true : await renovarSesion();
    } catch {
      renovado = false;
    }
    if (!renovado) {
      cerrarSesionLocal();
      throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
    }
    respuesta = await enviar(ruta, { method, body, timeoutMs, token: obtenerToken() });
  }

  const datos = await leerJson(respuesta);
  if (!respuesta.ok) {
    throw new ApiError((datos && datos.mensaje) || `Error ${respuesta.status} del servidor`, respuesta.status);
  }
  return datos;
}
