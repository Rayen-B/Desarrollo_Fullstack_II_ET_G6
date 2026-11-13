import React from 'react';
import TarjetaProducto from '../molecules/TarjetaProducto';
import { useTienda } from '../../context/TiendaContext';
import { disponiblePorFactor, FACTOR_TROZO } from '../../utils/stock';

// Grilla responsiva de productos (1 columna en móvil, 2 en tablet, 3 en escritorio)
export default function GrillaProductos({ productos, mensajeVacio = 'No encontramos productos para mostrar.' }) {
  const { abrirCarrito, agregarConStock, insumos } = useTienda();

  const agregar = (producto) => {
    agregarConStock(producto, 'entera', 1);
    abrirCarrito();
  };

  if (productos.length === 0) {
    return <p className="text-center text-muted py-4" role="status">{mensajeVacio}</p>;
  }

  return (
    <div className="row g-4">
      {productos.map((producto) => (
        <div className="col-12 col-sm-6 col-lg-4" key={producto.codigo}>
          <TarjetaProducto
            producto={producto}
            disponible={disponiblePorFactor(producto, insumos)}
            hayTrozos={producto.categoria === 'Tortas' && disponiblePorFactor(producto, insumos, FACTOR_TROZO) > 0}
            onAgregar={agregar}
          />
        </div>
      ))}
    </div>
  );
}
