import React from 'react';

// Título de página/sección con el estilo de la tienda
export default function EncabezadoSeccion({ etiqueta, titulo, descripcion, nivel = 1, alineado = 'center', id }) {
  const Titulo = nivel === 1 ? 'h1' : 'h2';
  return (
    <div className={`text-${alineado} mb-5`}>
      {etiqueta && <span className="slbl">{etiqueta}</span>}
      <Titulo id={id} className="stitle">{titulo}</Titulo>
      <div className="sline"></div>
      {descripcion && <p className="sdesc mx-auto max-w-480">{descripcion}</p>}
    </div>
  );
}
