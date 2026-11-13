import React from 'react';
import { Link } from 'react-router-dom';
import GrillaProductos from '../organisms/GrillaProductos';
import { listarProductos, descuentoPorcentaje, disponibleDe } from '../../services/db';

// Productos destacados del inicio: los 6 con mayor descuento (datos de la base de datos)
export function elegirDestacados(productos, cantidad = 6) {
  return [...productos]
    .filter((p) => disponibleDe(p) > 0)
    .sort((a, b) => descuentoPorcentaje(b) - descuentoPorcentaje(a))
    .slice(0, cantidad);
}

export default function Destacados() {
  return (
    <section id="menu" aria-labelledby="tituloDestacados">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl">Hecho con amor</span>
          <h2 className="stitle" id="tituloDestacados">Los favoritos de <span>Papita</span></h2>
          <div className="sline"></div>
        </div>
        <GrillaProductos productos={elegirDestacados(listarProductos())} />
        <div className="text-center mt-5"><Link to="/productos" className="btn-red"><i className="fas fa-th-large"></i>Ver todos los productos</Link></div>
      </div>
    </section>
  );
}
