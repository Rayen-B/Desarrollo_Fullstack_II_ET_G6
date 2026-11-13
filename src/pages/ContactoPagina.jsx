import React from 'react';
import { useSeo } from '../hooks/useSeo';
import Contacto from '../components/secciones/Contacto';

// Vista /contacto: formulario de contacto con validación
export default function ContactoPagina() {
  useSeo({ titulo: 'Contacto', descripcion: 'Escríbenos o visítanos: formulario de contacto, dirección, teléfono y horarios de Papita Dulce.' });
  return <Contacto comoPagina />;
}
