import React from 'react';
import { Link } from 'react-router-dom';
import { obtenerImagen } from '../../assets/images';
import { descuentoPorcentaje, esOferta } from '../../services/db';
import { formatearPrecio } from '../../utils/formato';

// Tarjeta de producto del catálogo. Recibe un producto de la base de datos (services/db.js).
//  - producto: { codigo, nombre, categoria, precio, precioAnterior, stock, imagen, descripcion }
//  - disponible: unidades enteras que se pueden vender (vitrina + preparables); por defecto el stock
//  - hayTrozos: si quedan trozos aunque no haya tortas enteras
//  - onAgregar(producto): se llama al presionar "Agregar" (si no se entrega, el botón no se muestra)
export default function TarjetaProducto({ producto, disponible = Number(producto.stock), hayTrozos = false, onAgregar }) {
  const descuento = descuentoPorcentaje(producto);
  const sinEnteras = disponible <= 0;
  const agotado = sinEnteras && !hayTrozos;
  const urlDetalle = `/producto/${producto.codigo}`;

  return (
    <article className="mcard">
      <Link to={urlDetalle} className="mimg d-block" aria-label={`Ver detalle de ${producto.nombre}`}>
        <img src={obtenerImagen(producto.imagen)} alt={producto.nombre} loading="lazy" />
        {esOferta(producto) && <div className="mbdg hot"><i className="fas fa-tag"></i> -{descuento}%</div>}
        {agotado && <div className="mbdg new">Agotado</div>}
        {sinEnteras && hayTrozos && <div className="mbdg new">Solo por trozo</div>}
      </Link>
      <div className="mbody">
        <div className="mcat">{producto.categoria}</div>
        <h3 className="mtit"><Link to={urlDetalle} className="text-reset text-decoration-none">{producto.nombre}</Link></h3>
        <div className="mdesc">{producto.descripcion}</div>
        <div className="mfoot d-flex justify-content-between align-items-center gap-2">
          <div className="mprice">
            {formatearPrecio(producto.precio)}
            {descuento > 0 && <> <small>{formatearPrecio(producto.precioAnterior)}</small></>}
          </div>
          {onAgregar && (sinEnteras && hayTrozos ? (
            <Link to={urlDetalle} className="btn-red btn-sm"><i className="fas fa-birthday-cake"></i>Ver trozos</Link>
          ) : (
            <button type="button" className="btn-red btn-sm" disabled={agotado} onClick={() => onAgregar(producto)} aria-label={`Agregar ${producto.nombre} al carrito`}>
              <i className="fas fa-shopping-bag"></i>{agotado ? 'Sin stock' : 'Agregar'}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
