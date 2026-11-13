import React from 'react';

// Mensaje de validación bajo un campo (solo se muestra si hay error)
export default function ErrorCampo({ mensaje }) {
  if (!mensaje) return null;
  return <span className="ferr" role="alert">{mensaje}</span>;
}
