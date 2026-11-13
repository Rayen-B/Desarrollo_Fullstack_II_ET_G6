import { detalleOrden, entregaOrden, textoMetodoPago } from './ordenes';

const normalizar = (texto) => String(texto || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/^trozo de /, '').replace(/\bde\b/g, ' ').replace(/\s+/g, ' ').trim();

// Producto del inventario que corresponde a una línea de la orden (por código o por nombre)
export function productoDeLinea(linea, productos) {
  if (linea.codigo) {
    const porCodigo = productos.find((p) => p.codigo === linea.codigo);
    if (porCodigo) return porCodigo;
  }
  const nombre = normalizar(linea.nombre);
  return productos.find((p) => normalizar(p.nombre) === nombre) || null;
}

// Totales generales de ventas
export function resumenVentas(ordenes) {
  const total = ordenes.reduce((t, o) => t + (Number(o.total) || 0), 0);
  const unidades = ordenes.reduce((t, o) => t + detalleOrden(o).reduce((s, d) => s + d.cantidad, 0), 0);
  return { total, cantidad: ordenes.length, promedio: ordenes.length ? Math.round(total / ordenes.length) : 0, unidades };
}

// Agrupa valores y los deja ordenados de mayor a menor, con su porcentaje del total
function agrupar(pares) {
  const mapa = new Map();
  pares.forEach(({ clave, monto, unidades = 0 }) => {
    const actual = mapa.get(clave) || { nombre: clave, monto: 0, unidades: 0 };
    actual.monto += monto;
    actual.unidades += unidades;
    mapa.set(clave, actual);
  });
  const lista = [...mapa.values()].sort((a, b) => b.monto - a.monto || b.unidades - a.unidades);
  const total = lista.reduce((t, x) => t + x.monto, 0);
  return lista.map((x) => ({ ...x, porcentaje: total ? Math.round((x.monto / total) * 100) : 0 }));
}

// Ranking de productos por unidades vendidas
export function productosMasVendidos(ordenes, productos, limite = 5) {
  const pares = ordenes.flatMap((o) => detalleOrden(o).map((d) => {
    const producto = productoDeLinea(d, productos);
    return { clave: producto ? producto.nombre : d.nombre, monto: d.precio * d.cantidad, unidades: d.cantidad };
  }));
  return agrupar(pares).sort((a, b) => b.unidades - a.unidades || b.monto - a.monto).slice(0, limite);
}

export function ventasPorCategoria(ordenes, productos) {
  return agrupar(ordenes.flatMap((o) => detalleOrden(o).map((d) => {
    const producto = productoDeLinea(d, productos);
    return { clave: (producto && producto.categoria) || 'Sin categoría', monto: d.precio * d.cantidad, unidades: d.cantidad };
  })));
}

export function ventasPorMetodoPago(ordenes) {
  return agrupar(ordenes.map((o) => ({ clave: textoMetodoPago(o.metodoPago), monto: Number(o.total) || 0, unidades: 1 })));
}

export function ventasPorEntrega(ordenes) {
  return agrupar(ordenes.map((o) => ({ clave: entregaOrden(o).tipo, monto: Number(o.total) || 0, unidades: 1 })));
}

// Cantidad de órdenes por estado: { Pendiente: 2, ... }
export function ordenesPorEstado(ordenes) {
  return ordenes.reduce((acc, o) => ({ ...acc, [o.estado || 'Sin estado']: (acc[o.estado || 'Sin estado'] || 0) + 1 }), {});
}
