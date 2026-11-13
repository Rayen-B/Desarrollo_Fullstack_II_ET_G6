// Da formato de precio chileno 3200 a "$3.200" 
export function formatearPrecio(valor) {
  return '$' + (Number(valor) || 0).toLocaleString('es-CL');
}

// Convierte un precio en texto ("$16.900") a número (16900)
export function precioANumero(texto) {
  return parseInt(String(texto || '$0').replace(/[^0-9]/g, ''), 10) || 0;
}
