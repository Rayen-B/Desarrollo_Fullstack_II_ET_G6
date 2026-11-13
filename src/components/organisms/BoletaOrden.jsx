import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import images from '../../assets/images';
import { detalleOrden, entregaOrden, textoMetodoPago, desgloseIva, numeroOrden, fechaChilena } from '../../utils/ordenes';

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-CL');

export default function BoletaOrden({ orden, show, onHide }) {
  // Al terminar de imprimir se quita la clase que oculta el resto de la página
  useEffect(() => {
    const limpiar = () => document.body.classList.remove('imprimiendo-boleta');
    window.addEventListener('afterprint', limpiar);
    return () => window.removeEventListener('afterprint', limpiar);
  }, []);

  const imprimir = () => {
    document.body.classList.add('imprimiendo-boleta');
    window.print();
  };

  if (!orden) return <Modal show={false} onHide={onHide} />;

  const detalle = detalleOrden(orden);
  const entrega = entregaOrden(orden);
  const sumaDetalle = detalle.reduce((t, d) => t + d.cantidad * d.precio, 0);
  const { neto, iva, total } = desgloseIva(orden.total || sumaDetalle);

  return (
    <Modal show={show} onHide={onHide} centered size="lg" contentClassName="border-0 shadow" aria-labelledby="boletaTitulo">
      <div className="modal-header bg-white border-bottom">
        <h5 className="modal-title fw-bold text-principal" id="boletaTitulo">
          <i className="ti ti-receipt-2 me-1 text-secundario"></i> Boleta de la Orden
        </h5>
        <button type="button" className="btn-close" aria-label="Cerrar" onClick={onHide}></button>
      </div>
      <div className="modal-body p-4">
        <div className="boleta-imprimible">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
            <div className="d-flex align-items-center gap-3">
              <img src={images['favicon_io/Logo_Papita_Dulce']} alt="Papita Dulce" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              <div>
                <div className="fw-bold fs-5 text-secundario">Papita Dulce</div>
                <div className="small text-muted">Pastelería &amp; Cafetería</div>
                <div className="small text-muted">Av. Papita Dulce, Santiago, Chile</div>
                <div className="small text-muted">papitadulce@gmail.com · +56 9 1234 5678</div>
              </div>
            </div>
            <div className="border border-2 rounded-3 text-center px-4 py-2" style={{ borderColor: 'var(--color-secundario)' }}>
              <div className="small fw-bold">R.U.T.: 76.543.210-3</div>
              <div className="fw-bold text-secundario">BOLETA ELECTRÓNICA</div>
              <div className="small fw-bold font-monospace">N° {numeroOrden(orden)}</div>
            </div>
          </div>

          <div className="row g-3 mb-4 small">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 h-100">
                <div className="fw-bold text-principal mb-2 text-uppercase"><i className="ti ti-user me-1"></i> Cliente</div>
                <div><span className="text-muted">Nombre:</span> <b>{orden.cliente}</b></div>
                <div><span className="text-muted">Correo:</span> {orden.correo}</div>
                <div><span className="text-muted">Teléfono:</span> {orden.telefono || 'No registrado'}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-3 h-100">
                <div className="fw-bold text-principal mb-2 text-uppercase"><i className="ti ti-calendar-time me-1"></i> Compra</div>
                <div><span className="text-muted">Fecha:</span> {fechaChilena(orden.fecha)}{orden.hora ? ` a las ${orden.hora} hrs` : ''}</div>
                <div><span className="text-muted">Entrega:</span> {entrega.tipo}</div>
                <div><span className="text-muted">Dirección:</span> {entrega.direccion}</div>
                <div><span className="text-muted">Pago:</span> {textoMetodoPago(orden.metodoPago)}</div> 
                <div><span className="text-muted">Estado:</span> {orden.estado}</div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle mb-3 tabla-boleta">
              <thead>
                <tr>
                  <th className="text-center">Cant.</th>
                  <th>Descripción</th>
                  <th className="text-end">P. Unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d, i) => (
                  <tr key={i}>
                    <td className="text-center">{d.cantidad}</td>
                    <td>{d.nombre}</td>
                    <td className="text-end">{pesos(d.precio)}</td>
                    <td className="text-end fw-semibold">{pesos(d.cantidad * d.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <div style={{ minWidth: '240px' }} className="small">
              <div className="d-flex justify-content-between"><span className="text-muted">Monto neto</span><span>{pesos(neto)}</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted">IVA</span><span>{pesos(iva)}</span></div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2 fs-6 fw-bold text-principal"><span>TOTAL</span><span>{pesos(total)}</span></div>
            </div>
          </div>
          <p className="text-center text-muted small mt-4 mb-0">¡Gracias por tu compra en Papita Dulce!</p>
        </div>
      </div>
      <div className="modal-footer bg-light border-0 py-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onHide}><i className="ti ti-x me-1"></i> Cerrar</button>
        <button type="button" className="btn btn-pasteleria btn-sm" onClick={imprimir}>
          <i className="ti ti-printer me-1"></i> Imprimir Boleta
        </button>
      </div>
    </Modal>
  );
}
