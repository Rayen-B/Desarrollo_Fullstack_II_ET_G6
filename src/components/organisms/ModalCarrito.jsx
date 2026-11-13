import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTienda } from '../../context/TiendaContext';
import { useOverlay } from '../../hooks/useOverlay';
import ItemCarrito from '../molecules/ItemCarrito';
import { formatearPrecio } from '../../utils/formato';
import { descontarVenta } from '../../utils/stock';

// Panel lateral del carrito. "Ir a pagar" lleva a la página de checkout (/checkout).
export default function ModalCarrito() {
  const { carrito, mostrarModalCarrito, totalPrecio, totalCantidad, vaciarCarrito } = useCart();
  const { cerrarCarrito, productos, insumos, recargarCatalogo } = useTienda();
  const [aviso, setAviso] = useState('');
  const navigate = useNavigate();

  useOverlay(mostrarModalCarrito, cerrarCarrito);

  // Al abrir el carrito se lee el stock actual
  useEffect(() => {
    if (mostrarModalCarrito) recargarCatalogo();
  }, [mostrarModalCarrito, recargarCatalogo]);

  useEffect(() => setAviso(''), [carrito]);

  const vacio = carrito.length === 0;

  const verProductos = () => {
    cerrarCarrito();
    navigate('/productos');
  };

  const irAPagar = () => {
    if (vacio) return;
    const stock = descontarVenta(productos, insumos, carrito);
    if (!stock.ok) {
      setAviso(`No hay stock suficiente de ${stock.faltante}. Ajusta la cantidad para continuar.`);
      return;
    }
    cerrarCarrito();
    navigate('/checkout');
  };

  return (
    <div
      id="cartPanel"
      className={mostrarModalCarrito ? 'open' : ''}
      aria-hidden={!mostrarModalCarrito}
      onClick={(e) => { if (e.target === e.currentTarget) cerrarCarrito(); }}
    >
      <div className="cartbox" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
        <div className="carthead">
          <div>
            <span className="slbl">Tu pedido</span>
            <h3 id="cartTitle">Carrito</h3>
          </div>
          <button className="cartclose" id="cartClose" type="button" aria-label="Cerrar carrito" onClick={cerrarCarrito}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="cartitems" id="cartItems">
          {carrito.map((item) => (
            <ItemCarrito key={`${item.id}-${item.variante}`} item={item} />
          ))}
        </div>
        <div className={`cartempty${vacio ? ' show' : ''}`} id="cartEmpty">
          <i className="fas fa-shopping-basket"></i>
          <p>Tu carrito está vacío.</p>
          <button className="btn-red" id="cartContinue" type="button" onClick={verProductos}>
            <i className="fas fa-utensils"></i>Ver productos
          </button>
        </div>
        <div className="cartfoot" id="cartFoot" style={{ display: vacio ? 'none' : 'block' }}>
          <div className="cartsummary" id="cartSummary" aria-live="polite">{totalCantidad} producto(s) en tu pedido</div>
          <div className="cartsum"><span>Subtotal</span><strong id="cartSubtotal">{formatearPrecio(totalPrecio)}</strong></div>
          <button className="cartcheckout" id="cartCheckout" type="button" onClick={irAPagar}>
            <i className="fas fa-check"></i>Ir a pagar
          </button>
          <button className="cartclear" id="cartClear" type="button" onClick={vaciarCarrito}>Vaciar carrito</button>
          {aviso && <p className="cartnotice cartitem-aviso" role="alert">{aviso}</p>}
        </div>
      </div>
    </div>
  );
}
