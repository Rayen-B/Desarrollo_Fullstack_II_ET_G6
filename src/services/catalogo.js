// Productos, categorías, insumos y fotos contra catalogo-service (a través del gateway).
// En modo servidor el servidor manda: lo que trae reemplaza la copia del navegador, stock incluido.
import { http } from './api';
import { guardarProductos } from './storage';
import { guardarCategorias } from './categorias';
import { guardarInsumos } from './insumos';

const BASE = '/api/v1';

// La tienda escucha este evento para volver a leer el catálogo
export const EVENTO_CATALOGO_ACTUALIZADO = 'papita:catalogo-actualizado';

export const listarProductosServidor = () => http(`${BASE}/productos`);
export const listarCategoriasServidor = () => http(`${BASE}/categorias`);
export const listarInsumosServidor = () => http(`${BASE}/insumos`);

// Trae productos, categorías e insumos y reemplaza la copia local
export async function cargarCatalogoServidor() {
  const [productos, categorias, insumos] = await Promise.all([
    listarProductosServidor(), listarCategoriasServidor(), listarInsumosServidor()
  ]);
  if (Array.isArray(productos)) guardarProductos(productos);
  if (Array.isArray(categorias) && categorias.length > 0) guardarCategorias(categorias);
  if (Array.isArray(insumos)) guardarInsumos(insumos);
  window.dispatchEvent(new Event(EVENTO_CATALOGO_ACTUALIZADO));
  return true;
}

// Producto del panel -> cuerpo que espera el servidor
export function productoParaApi(p) {
  const imagen = typeof p.imagen === 'string' && !/^(data:|blob:)/.test(p.imagen) ? p.imagen : null; // base64 no se envía
  return {
    codigo: String(p.codigo).trim().toUpperCase(),
    nombre: p.nombre,
    categoria: p.categoria,
    precio: Math.round(Number(p.precio) || 0),
    precioAnterior: Number(p.precioAnterior) > 0 ? Math.round(Number(p.precioAnterior)) : null,
    stock: Math.max(0, Math.round(Number(p.stock) || 0)),
    stockCritico: Math.max(0, Math.round(Number(p.stockCritico) || 0)),
    imagen,
    descripcion: p.descripcion || '',
    receta: (p.receta || [])
      .filter((f) => f.insumoId && Number(f.cantidad) > 0)
      .map((f) => ({ insumoId: f.insumoId, cantidad: Number(f.cantidad) }))
  };
}

export const crearProductoServidor = (p) => http(`${BASE}/productos`, { method: 'POST', body: productoParaApi(p) });

export const actualizarProductoServidor = (p) => {
  const cuerpo = productoParaApi(p);
  return http(`${BASE}/productos/${encodeURIComponent(cuerpo.codigo)}`, { method: 'PUT', body: cuerpo });
};

export const eliminarProductoServidor = (codigo) =>
  http(`${BASE}/productos/${encodeURIComponent(codigo)}`, { method: 'DELETE' });

// Sube la foto de un producto que ya existe y devuelve el producto con la URL nueva en "imagen"
export function subirFotoServidor(codigo, archivo) {
  const datos = new FormData();
  datos.append('archivo', archivo, archivo.name || 'foto.webp');
  return http(`${BASE}/productos/${encodeURIComponent(codigo)}/foto`, { method: 'POST', body: datos, timeoutMs: 60000 });
}

// ---- Categorías ----
export const crearCategoriaServidor = (c) =>
  http(`${BASE}/categorias`, { method: 'POST', body: { nombre: c.nombre, descripcion: c.descripcion || '', imagen: c.imagen || '' } });
export const actualizarCategoriaServidor = (id, c) =>
  http(`${BASE}/categorias/${encodeURIComponent(id)}`, { method: 'PUT', body: { nombre: c.nombre, descripcion: c.descripcion || '', imagen: c.imagen || '' } });
export const eliminarCategoriaServidor = (id) => http(`${BASE}/categorias/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- Insumos ----
const cuerpoInsumo = (i) => ({ nombre: i.nombre, unidad: i.unidad, stock: Number(i.stock), minimo: Number(i.minimo) });
export const crearInsumoServidor = (i) => http(`${BASE}/insumos`, { method: 'POST', body: cuerpoInsumo(i) });
export const actualizarInsumoServidor = (id, i) =>
  http(`${BASE}/insumos/${encodeURIComponent(id)}`, { method: 'PUT', body: cuerpoInsumo(i) });
export const eliminarInsumoServidor = (id) => http(`${BASE}/insumos/${encodeURIComponent(id)}`, { method: 'DELETE' });
