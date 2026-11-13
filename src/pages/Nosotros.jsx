import React from 'react';
import { useSeo } from '../hooks/useSeo';
import NosotrosSeccion from '../components/secciones/Nosotros';
import Historia from '../components/secciones/Historia';
import Chefs from '../components/secciones/Chefs';
import Horarios from '../components/secciones/Horarios';

// Vista /nosotros: quiénes somos, historia, equipo y horarios
export default function Nosotros() {
  useSeo({ titulo: 'Nosotros', descripcion: 'Conoce la historia, el equipo y los horarios de Papita Dulce, pastelería y cafetería artesanal en Santiago.' });
  return (
    <>
      <h1 className="visually-hidden">Sobre Papita Dulce</h1>
      <NosotrosSeccion />
      <Historia />
      <Chefs />
      <Horarios />
    </>
  );
}
