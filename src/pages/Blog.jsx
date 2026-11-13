import React from 'react';
import { useSeo } from '../hooks/useSeo';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import BlogSeccion from '../components/secciones/Blog';

// Vista /blog: listado de artículos
export default function PaginaBlog() {
  useSeo({ titulo: 'Blog', descripcion: 'Recetas, secretos de repostería y novedades del blog de Papita Dulce.' });
  return (
    <>
      <div className="container pt-5"><EncabezadoSeccion etiqueta="Noticias & Actualizaciones" titulo={<>Nuestro <span>blog</span></>} /></div>
      <BlogSeccion mostrarEncabezado={false} />
    </>
  );
}
