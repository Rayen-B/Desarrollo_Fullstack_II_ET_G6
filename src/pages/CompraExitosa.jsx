import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import ResumenOrden from '../components/organisms/ResumenOrden';
import { obtenerOrden } from '../services/db';
import { DATOS_TRANSFERENCIA, formatearPlazo } from '../utils/pago';

// Vista /compra/exitosa/:id con el resumen de la compra
export default function CompraExitosa() {
  const { id } = useParams();
  const orden = obtenerOrden(id);
  useSeo({ titulo: orden ? 'Compra realizada' : 'Orden no encontrada', noindex: true });
  const [emailEnviado, setEmailEnviado] = useState(false);

  if (!orden) {
    return <section className="container text-center"><h1 className="stitle">Orden no encontrada</h1><Link to="/productos" className="btn-red">Volver a la tienda</Link></section>;
  }

  const esTransferencia = orden.metodoPago === 'transferencia';
  const esEfectivo = orden.metodoPago === 'efectivo';

  return (
    <section>
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="p-4 bg-white rounded-4 shadow-sm">
          {esTransferencia ? (
            <>
              <h1 className="h3 fw-bold" style={{ color: '#b7791f' }}><i className="fas fa-hourglass-half me-2"></i>Pedido recibido. Nro {orden.numero}</h1>
              <p className="text-muted">Tu pedido queda <b>pendiente de pago</b> hasta que recibamos tu transferencia.</p>
              <div className="payment-info payment-transfer" data-testid="instrucciones-transferencia">
                <strong><i className="fas fa-university me-2" aria-hidden="true"></i>Transfiere antes del {formatearPlazo(orden.plazoPago)}</strong>
                <ul className="list-unstyled mb-0 mt-2">
                  {DATOS_TRANSFERENCIA.map((d) => <li key={d.etiqueta}><span className="text-muted">{d.etiqueta}:</span> {d.valor}</li>)}
                  <li><span className="text-muted">Referencia (comentario):</span> <b className="font-monospace">{orden.referenciaPago || orden.id}</b></li>
                </ul>
              </div>
            </>
          ) : esEfectivo ? (
            <>
              <h1 className="h3 fw-bold" style={{ color: 'var(--green)' }}><i className="fas fa-check-circle me-2"></i>Pedido confirmado. Nro {orden.numero}</h1>
              <p className="text-muted">Pagas en efectivo al recibir o retirar tu pedido.</p>
              <div className="payment-info" data-testid="instrucciones-efectivo">
                <strong><i className="fas fa-ticket-alt me-2" aria-hidden="true"></i>Código de pedido: <span className="font-monospace">{orden.codigoPedido}</span></strong>
                <p className="mb-0 mt-1">Muéstralo al retirar o al repartidor.{orden.pagaCon ? ` Pagarás con $${Number(orden.pagaCon).toLocaleString('es-CL')} y tu vuelto será de $${Number(orden.vuelto || 0).toLocaleString('es-CL')}.` : ''}</p>
              </div>
            </>
          ) : (
            <>
              <h1 className="h3 fw-bold" style={{ color: 'var(--green)' }}><i className="fas fa-check-circle me-2"></i>Se ha realizado la compra. Nro {orden.numero}</h1>
              <p className="text-muted">Gracias por tu compra. Guardamos el comprobante de tu pedido.</p>
              {orden.tipoTarjeta && (
                <p className="small" data-testid="detalle-tarjeta"><i className="fas fa-credit-card me-2" aria-hidden="true"></i>Pagado con tarjeta de {orden.tipoTarjeta === 'debito' ? 'débito' : 'crédito'} •••• {orden.ultimos4}{orden.cuotas > 1 ? ` en ${orden.cuotas} cuotas sin interés` : ''}</p>
              )}
            </>
          )}
          <ResumenOrden orden={orden} />
          <div className="d-flex flex-wrap align-items-center gap-2 no-print">
            <button type="button" className="btn-red" onClick={() => window.print()}><i className="fas fa-file-pdf me-1"></i>Imprimir boleta en PDF</button>
            <button type="button" className="btn-outline-tienda" onClick={() => setEmailEnviado(true)}><i className="fas fa-envelope me-1"></i>Enviar boleta por email</button>
            <Link to="/productos" className="btn btn-outline-secondary rounded-pill px-4 d-inline-flex align-items-center"><i className="fas fa-arrow-left me-1" aria-hidden="true"></i>Seguir comprando</Link>
          </div>
          {emailEnviado && <p className="mt-3 text-success" role="status">Enviamos la boleta a {orden.correo}.</p>}
        </div>
      </div>
    </section>
  );
}
