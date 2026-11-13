import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import GrillaProductos from '../components/organisms/GrillaProductos';
import { obtenerCategoria, productosPorCategoria } from '../services/db';

// Vista /categorias/:id con los productos de una categoría
export default function CategoriaDetalle() {
  const { id } = useParams();
  const categoria = obtenerCategoria(id);
  useSeo({
    titulo: categoria ? categoria.nombre : 'Categoría no encontrada',
    descripcion: categoria ? `${categoria.descripcion} Compra ${categoria.nombre.toLowerCase()} online en Papita Dulce.` : undefined
  });

  if (!categoria) {
    return (
      <section className="container text-center">
        <h1 className="stitle">Categoría no encontrada</h1>
        <Link to="/categorias" className="btn-red">Ver todas las categorías</Link>
      </section>
    );
  }

  return (
    <section>
      <div className="container">
        <nav aria-label="Ruta de navegación" className="mb-3 small"><Link to="/categorias">Categorías</Link> / <span>{categoria.nombre}</span></nav>
        <EncabezadoSeccion etiqueta="Categoría" titulo={categoria.nombre} descripcion={categoria.descripcion} />
        <GrillaProductos productos={productosPorCategoria(categoria.nombre)} mensajeVacio="Aún no hay productos en esta categoría." />
      </div>
    </section>
  );
}
