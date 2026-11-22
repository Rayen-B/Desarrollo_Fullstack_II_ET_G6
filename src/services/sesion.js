// Tokens que entrega usuario-service al iniciar sesión:
//  - accessToken: JWT que dura 15 minutos y va en cada llamada (Authorization: Bearer ...)
//  - refreshToken: sirve una sola vez para pedir un accessToken nuevo (dura 7 días)
// Nota de seguridad: en localStorage los podría leer un script malicioso (XSS). Por eso las descripciones HTML
// se sanitizan al guardar (servidor, jsoup) y al mostrar (DOMPurify).
const TOKEN_KEY = 'papita_token';
const REFRESH_KEY = 'papita_refresh';

const leer = (clave) => {
  try { return localStorage.getItem(clave); } catch { return null; }
};
const escribir = (clave, valor) => {
  try {
    if (valor) localStorage.setItem(clave, valor);
    else localStorage.removeItem(clave);
  } catch { /* sin almacenamiento disponible */ }
};

export const obtenerToken = () => leer(TOKEN_KEY);
export const obtenerRefresh = () => leer(REFRESH_KEY);
export const guardarToken = (token) => escribir(TOKEN_KEY, token);

export function guardarTokens({ accessToken, refreshToken } = {}) {
  escribir(TOKEN_KEY, accessToken);
  escribir(REFRESH_KEY, refreshToken);
}

export const borrarToken = () => {
  escribir(TOKEN_KEY, null);
  escribir(REFRESH_KEY, null);
};

// Lee el contenido del token SIN verificar la firma (eso solo puede hacerlo el servidor): sirve para saber si venció
export function leerPayload(token) {
  try {
    const parte = String(token).split('.')[1];
    return JSON.parse(atob(parte.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function tokenVigente(token) {
  const payload = token ? leerPayload(token) : null;
  return Boolean(payload && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now());
}

// La sesión sigue viva si el accessToken no venció o si hay un refreshToken para renovarlo
export const sesionRecuperable = () => tokenVigente(obtenerToken()) || Boolean(obtenerRefresh());
