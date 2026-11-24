import React from 'react';
import { esGratis } from '../../utils/formato';

export default function EtiquetaPrecio({ monto, className = '' }) {
  // Se usa en la vitrina: un precio 0 se muestra como "Gratis"
  const formateado = esGratis(monto) ? 'Gratis' : new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(monto || 0);

  return <span className={`fw-bold ${className}`}>{formateado}</span>;
}
