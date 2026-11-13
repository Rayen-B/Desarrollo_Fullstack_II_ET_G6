import React from 'react';
import { useSeo } from '../hooks/useSeo';
import FormRegistro from '../components/organisms/FormRegistro';

// Vista /registro
export default function Registro() {
  useSeo({ titulo: 'Crear cuenta', descripcion: 'Crea tu cuenta de Papita Dulce para guardar tus datos y revisar tus pedidos.', noindex: true });
  return (
    <section>
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="text-center mb-4"><span className="slbl">Únete a Papita</span><h1 className="stitle">Crear cuenta</h1><div className="sline"></div></div>
        <div className="p-4 bg-white rounded-4 shadow-sm"><FormRegistro /></div>
      </div>
    </section>
  );
}
