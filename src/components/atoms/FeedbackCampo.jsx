import React from 'react';

// Mensaje de validación bajo un campo (verde si es válido, rojo si no)
export default function FeedbackCampo({ resultado }) {
  if (!resultado) return null;
  return <div className={`feedback-msg ${resultado.valido ? 'success' : 'error'}`}>{resultado.mensaje}</div>;
}

// Clase extra del input según el resultado de su validación
export function claseValidacion(resultado) {
  if (!resultado) return '';
  return resultado.valido ? ' is-valid' : ' is-invalid';
}
