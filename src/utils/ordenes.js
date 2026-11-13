// Funciones para mostrar las órdenes y su boleta en el panel admin

/**
 * Las órdenes nuevas guardan "detalle"; las antiguas solo texto
 */
export function detalleOrden(orden) {
  if (Array.isArray(orden.detalle) && orden.detalle.length) return orden.detalle;
  return String(orden.items || '')
    .split(/[;,](?![^(]*\))/)
    .map((texto) => texto.trim())
    .filter(Boolean)
    .map((texto) => {
      const m = texto.match(/^(\d+)\s*x\s*(.+?)\s*\(\$?([\d.]+)\)$/i);
      if (!m) return { nombre: texto, cantidad: 1, precio: 0 };
      const cantidad = parseInt(m[1], 10);
      const subtotal = parseInt(m[3].replace(/\./g, ''), 10) || 0;
      return { nombre: m[2], cantidad, precio: Math.round(subtotal / cantidad) };
    });
}

// Resumen corto para la tabla
export function resumenProductos(orden) {
  const detalle = detalleOrden(orden);
  if (!detalle.length) return 'Sin productos';
  const unidades = detalle.reduce((t, d) => t + d.cantidad, 0);
  const primero = `${detalle[0].cantidad}x ${detalle[0].nombre}`;
  return detalle.length > 1 ? `${primero} y ${detalle.length - 1} más (${unidades} un.)` : primero;
}

// Tipo de despacho
export function entregaOrden(orden) {
  const esDespacho = orden.tipoEntrega
    ? orden.tipoEntrega === 'despacho'
    : Boolean(orden.entrega) && orden.entrega !== 'Retiro en tienda';
  return esDespacho
    ? { tipo: 'Despacho a domicilio', direccion: orden.entrega || 'Sin dirección', icono: 'ti-truck-delivery' }
    : { tipo: 'Retiro en tienda', direccion: 'Av. Papita Dulce, Santiago', icono: 'ti-building-store' };
}

const METODOS_PAGO = {
  tarjeta: 'Tarjeta de crédito / débito',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo'
};
export const textoMetodoPago = (metodo) => METODOS_PAGO[metodo] || 'No registrado';

// Desglose de la boleta 
export function desgloseIva(total) {
  const neto = Math.round(total / 1.19);
  return { neto, iva: total - neto, total };
}

// Número de la orden sin #
export const numeroOrden = (orden) => String(orden.numero || orden.id || '').replace(/^#/, '');

// Fecha de "2026-06-01" a "01-06-2026"
export function fechaChilena(fecha) {
  const [a, m, d] = String(fecha || '').split('-');
  return d ? `${d}-${m}-${a}` : fecha;
}
