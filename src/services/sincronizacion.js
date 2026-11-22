// Modo servidor: cada cambio del panel se envía al servidor y se espera su respuesta.
// Si el servidor lo acepta, se vuelve a traer el catálogo para que el navegador muestre exactamente lo guardado.
// Si lo rechaza, no se cambia nada en el navegador y se devuelve el mensaje del servidor.
import { cargarCatalogoServidor } from './catalogo';

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Inténtalo más tarde.';

export const mensajeServidor = (e) => (e && e.status === 0 ? MENSAJE_SIN_CONEXION : (e && e.message) || 'Ocurrió un error inesperado.');

// accion: función que devuelve una promesa. Resultado: { exito, datos } o { exito: false, mensaje }
export async function guardarEnServidor(accion, { recargarCatalogo = true } = {}) {
  try {
    const datos = await accion();
    if (recargarCatalogo) await cargarCatalogoServidor().catch(() => null);
    return { exito: true, datos };
  } catch (e) {
    return { exito: false, mensaje: mensajeServidor(e) };
  }
}
