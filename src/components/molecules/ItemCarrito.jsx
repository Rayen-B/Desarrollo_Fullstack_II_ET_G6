import React from 'react';
import { useCart } from '../../context/CartContext';
import { useTienda } from '../../context/TiendaContext';
import { factorDeItem } from '../../utils/stock';
import { formatearPrecio } from '../../utils/formato';
import { obtenerImagen } from '../../assets/images';

// Una fila del carrito
export default function ItemCarrito({ item }) {
  const { actualizarCantidad, eliminarDelCarrito } = useCart();
  const { maximoPara } = useTienda();
  // Máximo para esta línea sin contarla a ella misma
  const maximo = maximoPara(item.codigo, factorDeItem(item), item);

  return (
    <div className="cartitem">
      <img src={obtenerImagen(item.imagen)} alt={item.nombre} />
      <div>
        <h5>{item.nombre}</h5>
        <div className="cartitem-price">{formatearPrecio(item.precio)}</div>
        <div className="cartqty">
          <button type="button" aria-label="Disminuir cantidad" onClick={() => actualizarCantidad(item.id, item.variante, item.cantidad - 1)}>-</button>
          <span>{item.cantidad}</span>
          <button type="button" aria-label="Aumentar cantidad" disabled={item.cantidad >= maximo} onClick={() => actualizarCantidad(item.id, item.variante, item.cantidad + 1)}>+</button>
        </div>
        {item.cantidad > maximo && (
          <div className="cartitem-aviso">{maximo <= 0 ? 'Producto agotado' : maximo === 1 ? 'Solo queda 1' : `Solo quedan ${maximo}`}</div>
        )}
      </div>
      <button className="cartremove" type="button" aria-label={'Eliminar ' + item.nombre} onClick={() => eliminarDelCarrito(item.id, item.variante)}>
        <i className="fas fa-trash-alt"></i>
      </button>
    </div>
  );
}
