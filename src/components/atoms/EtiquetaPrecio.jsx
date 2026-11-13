import React from 'react';

export default function EtiquetaPrecio({ monto, className = '' }) {
  const formateado = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(monto || 0);

  return <span className={`fw-bold ${className}`}>{formateado}</span>;
}
