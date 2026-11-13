import React from 'react';
import { Link } from 'react-router-dom';
import { listarCategorias, contarProductosDeCategoria } from '../../services/db';
import { obtenerImagen } from '../../assets/images';

// Tarjetas de categorías (vienen de la base de datos). Cada una lleva a /categorias/:id
export default function Categorias({ mostrarEncabezado = true }) {
  const categorias = listarCategorias();
  return (
    <section id="category" className={mostrarEncabezado ? '' : 'categories-list-only'} aria-label={mostrarEncabezado ? undefined : 'Listado de categorías'} aria-labelledby={mostrarEncabezado ? 'tituloCategorias' : undefined}>
      <div className="container">
        {mostrarEncabezado && (
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="slbl">Lo que preparamos para ti</span>
            <h2 className="stitle" id="tituloCategorias">Explora nuestras <span>categorías</span></h2>
            <div className="sline"></div>
            <p className="sdesc mx-auto max-w-480">Desde tortas artesanales y café de especialidad hasta antojos para consentir a tu Papita interior.</p>
          </div>
        )}
        <div className="row g-3 justify-content-center">
          {categorias.map((c, i) => {
            const cantidad = contarProductosDeCategoria(c);
            return (
              <div key={c.id} className="col-6 col-sm-4 col-md-3 col-lg-2" data-aos="zoom-in" data-aos-delay={i * 70}>
                <Link to={`/categorias/${c.id}`} className="catcard d-block text-decoration-none">
                  <img className="catimg" src={obtenerImagen(c.imagen)} alt={c.nombre} loading="lazy" />
                  <div className="catnm">{c.nombre}</div>
                  <div className="catct">{cantidad} {cantidad === 1 ? 'producto' : 'productos'}</div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
