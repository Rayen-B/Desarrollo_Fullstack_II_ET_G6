import React from 'react';
import { detalleDeOrden, formatearMonto } from '../../services/db';
import { textoMetodoPago } from '../../utils/ordenes';

// Resumen de una orden: datos del cliente, entrega, productos y total. Se usa en "compra exitosa" y "pago con error".
export default function ResumenOrden({ orden }) {
  const lineas = detalleDeOrden(orden);
  const entrega = typeof orden.entrega === 'string' ? orden.entrega : orden.entrega?.metodo || 'No informada';
  return (
    <div className="resumen-orden">
      <div className="row g-2 small mb-3">
        <div className="col-sm-6"><span className="text-muted">Cliente:</span> <strong>{typeof orden.cliente === 'string' ? orden.cliente : orden.cliente?.nombre}</strong></div>
        <div className="col-sm-6"><span className="text-muted">Correo:</span> <strong>{orden.correo}</strong></div>
        {orden.telefono && <div className="col-sm-6"><span className="text-muted">Teléfono:</span> <strong>{orden.telefono}</strong></div>}
        <div className="col-sm-6"><span className="text-muted">Fecha:</span> <strong>{orden.fecha}</strong></div>
        <div className="col-sm-6"><span className="text-muted">Entrega:</span> <strong>{entrega}</strong></div>
        {orden.metodoPago && <div className="col-sm-6"><span className="text-muted">Pago:</span> <strong>{textoMetodoPago(orden.metodoPago)}</strong></div>}
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr><th>Producto</th><th className="text-end">Precio</th><th className="text-center">Cantidad</th><th className="text-end">Subtotal</th></tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={`${l.nombre}-${i}`}>
                <td>{l.nombre}{l.variante === 'trozo' && <small className="text-muted"> (trozo)</small>}</td>
                <td className="text-end">{formatearMonto(l.precio)}</td>
                <td className="text-center">{l.cantidad}</td>
                <td className="text-end">{formatearMonto(l.precio * l.cantidad)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th colSpan="3" className="text-end">Total</th><th className="text-end" data-testid="total-orden">{formatearMonto(orden.total)}</th></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
