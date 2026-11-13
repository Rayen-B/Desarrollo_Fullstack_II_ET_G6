import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import ResumenOrden from '../components/organisms/ResumenOrden';
import { obtenerOrden } from '../services/db';
import { obtenerMotivo } from '../utils/pago';

// Vista /compra/error/:id cuando el pago fue rechazado. El carrito se conserva para reintentar.
// Cada motivo de rechazo tiene su ícono, su explicación y su consejo.
export default function CompraError() {
  const { id } = useParams();
  const { state } = useLocation();
  const orden = obtenerOrden(id);
  useSeo({ titulo: orden ? 'No se pudo realizar el pago' : 'Orden no encontrada', noindex: true });

  if (!orden) {
    return <section className="container text-center"><h1 className="stitle">Orden no encontrada</h1><Link to="/productos" className="btn-red">Volver a la tienda</Link></section>;
  }

  // El motivo llega por la navegación; si se recarga la página se toma el guardado en la orden
  const codigo = state?.codigoMotivo || orden.codigoMotivo || 'rechazo';
  const motivo = obtenerMotivo(codigo);
  const explicacion = state?.motivo || motivo.motivo;

  return (
    <section className="pago-resultado pago-error">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="pago-tarjeta">
          <div className="pago-icono pago-icono-error" aria-hidden="true"><i className={`fas ${motivo.icono}`}></i></div>
          <span className="pago-orden">Orden {orden.numero}</span>
          <h1 className="pago-titulo">No se pudo realizar el pago</h1>
          <h2 className="pago-subtitulo">{motivo.titulo}</h2>
          <p className="pago-explicacion" role="alert">{explicacion}</p>
          <div className="pago-consejo"><i className="fas fa-lightbulb" aria-hidden="true"></i><span>{motivo.consejo}</span></div>
          <p className="pago-tranquilidad"><i className="fas fa-shield-alt me-2" aria-hidden="true"></i>No se realizó ningún cobro. Tu carrito sigue guardado.</p>

          <div className="pago-acciones">
            <Link to="/checkout" className="btn-red pago-principal"><i className="fas fa-redo" aria-hidden="true"></i>{motivo.reintentable ? 'Reintentar el pago' : 'VOLVER A REALIZAR EL PAGO'}</Link>
            <Link to="/checkout" className="btn btn-outline-secondary">Elegir otro método de pago</Link>
            <Link to="/productos" className="btn btn-link"><i className="fas fa-arrow-left me-1" aria-hidden="true"></i>Volver a la tienda</Link>
          </div>
          <p className="pago-ayuda">¿Necesitas ayuda? <Link to="/#contact-section">Contáctanos</Link> o escribe a pagos@papitadulce.cl</p>

          <details className="pago-detalle">
            <summary>Ver detalle del pedido ({orden.montoTotal})</summary>
            <ResumenOrden orden={orden} />
          </details>
        </div>
      </div>
    </section>
  );
}
