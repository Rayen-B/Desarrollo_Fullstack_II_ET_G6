import React from 'react';
import { useSeo } from '../hooks/useSeo';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import GrillaProductos from '../components/organisms/GrillaProductos';
import OfertaEspecial from '../components/secciones/OfertaEspecial';
import { productosEnOferta, DESCUENTO_MINIMO_OFERTA } from '../services/db';

// Vista /ofertas: todos los productos con descuento de al menos DESCUENTO_MINIMO_OFERTA %
export default function Ofertas() {
  useSeo({ titulo: 'Ofertas', descripcion: 'Aprovecha las ofertas de Papita Dulce: tortas, postres y sándwiches con más de 20% de descuento.' });
  return (
    <>
      <section>
        <div className="container">
          <EncabezadoSeccion etiqueta="Precios rebajados" titulo={<>Nuestras <span>ofertas</span></>} descripcion={`Productos con ${DESCUENTO_MINIMO_OFERTA}% o más de descuento.`} />
          <GrillaProductos productos={productosEnOferta()} mensajeVacio="Por ahora no hay ofertas activas. ¡Vuelve pronto!" />
        </div>
      </section>
      <OfertaEspecial />
    </>
  );
}
