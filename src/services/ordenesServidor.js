// Órdenes contra orden-service (a través del gateway). El servidor manda: el navegador solo guarda una copia
// para que las páginas (boleta, mis compras, panel y reportes) la lean igual que en modo local.
import { http } from './api';
import { obtenerOrdenes, guardarOrdenes } from './storage';

const BASE = '/api/v1/ordenes';
const esPersonal = (rol) => rol === 'Administrador' || rol === 'Vendedor';

// Staff ve todas; un cliente solo las suyas
export async function cargarOrdenesServidor(rol) {
  const ordenes = await http(esPersonal(rol) ? BASE : `${BASE}/mias`);
  if (Array.isArray(ordenes)) guardarOrdenes(ordenes);
  return ordenes;
}

export const limpiarOrdenesLocales = () => guardarOrdenes([]);

// Reemplaza (o agrega) una orden en la copia local
export function guardarOrdenEnCopia(orden) {
  const resto = obtenerOrdenes().filter((o) => o.id !== orden.id);
  guardarOrdenes([orden, ...resto]);
  return orden;
}

// items: [{ codigo, cantidad, variante }]. El precio lo pone el servidor (desde Catálogo).
export const crearOrdenServidor = (datos) => http(BASE, { method: 'POST', body: datos });

export const cambiarEstadoServidor = (id, estado) =>
  http(`${BASE}/${encodeURIComponent(id)}/estado`, { method: 'PUT', body: { estado } });

export const cancelarOrdenServidor = (id, motivo) =>
  http(`${BASE}/${encodeURIComponent(id)}/cancelar`, { method: 'POST', body: { motivo } });

export const eliminarOrdenServidor = (id) => http(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
