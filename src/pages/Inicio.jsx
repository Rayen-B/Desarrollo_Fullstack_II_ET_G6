import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import LightboxImagen from '../components/molecules/LightboxImagen';
import CarruselTestimonios from '../components/organisms/CarruselTestimonios';
import Hero from '../components/secciones/Hero';
import Categorias from '../components/secciones/Categorias';
import Nosotros from '../components/secciones/Nosotros';
import Destacados from '../components/secciones/Destacados';
import OfertaEspecial from '../components/secciones/OfertaEspecial';
import Galeria from '../components/secciones/Galeria';
import Historia from '../components/secciones/Historia';
import Chefs from '../components/secciones/Chefs';
import Horarios from '../components/secciones/Horarios';
import Reservacion from '../components/secciones/Reservacion';
import Entregas from '../components/secciones/Entregas';
import Blog from '../components/secciones/Blog';
import Boletin from '../components/secciones/Boletin';
import Contacto from '../components/secciones/Contacto';
import images from '../assets/images';

export default function Inicio() {
  useSeo({
    titulo: '',
    descripcion: 'Papita Dulce: pastelería y cafetería artesanal en Santiago. Tortas caseras, tartaletas, postres, sándwiches e infusiones. Compra online y retira en tienda.'
  });
  const location = useLocation();
  const [historiaAbierta, setHistoriaAbierta] = useState(false);

  // Los enlaces de la barra superior (/#about, /#chefs...) bajan hasta el panel pedido
  useEffect(() => {
    if (!location.hash) return undefined;
    const t = setTimeout(() => {
      const destino = document.querySelector(location.hash);
      if (destino) window.scrollTo({ top: destino.offsetTop - 78, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(t);
  }, [location.hash, location.key]);

  const cerrarHistoria = useCallback(() => setHistoriaAbierta(false), []);

  return (
    <>
      <Hero onVerHistoria={() => setHistoriaAbierta(true)} />
      <Categorias />
      <Nosotros />
      <Destacados />
      <OfertaEspecial />
      <Galeria />
      <Historia />
      <Chefs />
      <Horarios />
      <CarruselTestimonios />
      <Reservacion />
      <Entregas />
      <Blog limite={3} conVerTodos />
      <Boletin />
      <Contacto />
      <LightboxImagen src={images['Historia']} abierto={historiaAbierta} onCerrar={cerrarHistoria} />
    </>
  );
}
