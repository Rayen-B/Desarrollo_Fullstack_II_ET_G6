import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { obtenerArticulo, listarArticulos } from '../services/db';
import { obtenerImagen } from '../assets/images';

// Vista /blog/:id con el artículo completo
export default function BlogDetalle() {
  const { id } = useParams();
  const articulo = obtenerArticulo(id);
  useSeo({ titulo: articulo ? articulo.titulo : 'Artículo no encontrado', descripcion: articulo ? articulo.resumen : undefined });

  if (!articulo) {
    return (
      <section className="container text-center">
        <h1 className="stitle">Artículo no encontrado</h1>
        <Link to="/blog" className="btn-red">Volver al blog</Link>
      </section>
    );
  }

  const otros = listarArticulos().filter((a) => a.id !== articulo.id).slice(0, 2);

  return (
    <section>
      <div className="container" style={{ maxWidth: 820 }}>
        <nav aria-label="Ruta de navegación" className="mb-3 small"><Link to="/blog">Blog</Link> / <span>{articulo.categoria}</span></nav>
        <article>
          <span className="slbl">{articulo.categoria}</span>
          <h1 className="stitle text-start" style={{ fontSize: '2.2rem' }}>{articulo.titulo}</h1>
          <p className="text-muted"><i className="fas fa-user me-1"></i>{articulo.autor} · <time dateTime={articulo.fecha}>{new Date(articulo.fecha + 'T00:00:00').toLocaleDateString('es-CL', { dateStyle: 'long' })}</time> · {articulo.comentarios} comentarios</p>
          <img src={obtenerImagen(articulo.imagen)} alt={articulo.titulo} className="img-fluid rounded-4 shadow-sm my-3 w-100" style={{ maxHeight: 420, objectFit: 'cover' }} />
          {articulo.contenido.map((parrafo, i) => <p key={i} className="sdesc" style={{ margin: '0 0 1rem' }}>{parrafo}</p>)}
        </article>
        <aside className="mt-5" aria-label="Otros artículos">
          <h2 className="h5">Sigue leyendo</h2>
          <ul>{otros.map((a) => <li key={a.id}><Link to={`/blog/${a.id}`}>{a.titulo}</Link></li>)}</ul>
          <Link to="/blog" className="btn-red"><i className="fas fa-arrow-left"></i>Volver al blog</Link>
        </aside>
      </div>
    </section>
  );
}
