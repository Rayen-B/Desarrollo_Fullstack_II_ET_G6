import React from 'react';
import { useSeo } from '../hooks/useSeo';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import Categorias from '../components/secciones/Categorias';

// Vista /categorias: tarjetas con todas las categorías de la tienda
export default function PaginaCategorias() {
  useSeo({ titulo: 'Categorías', descripcion: 'Explora los productos de Papita Dulce por categoría: tortas, tartaletas, postres, sándwiches, bebestibles e infusiones.' });
  return (
    <>
      <div className="container pt-5"><EncabezadoSeccion etiqueta="Lo que preparamos para ti" titulo={<>Todas las <span>categorías</span></>} /></div>
      <Categorias mostrarEncabezado={false} />
    </>
  );
}
