// ¿La tienda usa el backend (usuarios con JWT, catálogo en el servidor) o funciona sola con localStorage?
// Se activa con VITE_MODO_SERVIDOR=true (el build de producción lo trae en .env.production).
// Se lee en cada llamada (no al cargar el módulo) para poder cambiarlo en las pruebas.
export const modoServidor = () => String(import.meta.env.VITE_MODO_SERVIDOR ?? 'false').trim().toLowerCase() === 'true';
