// Da formato de precio chileno 3200 a "$3.200" 
export function formatearPrecio(valor) {
  return '$' + (Number(valor) || 0).toLocaleString('es-CL');
}

// Precio para mostrar en la vitrina (tarjetas, detalle, botones): 0 se muestra como "Gratis".
// En el carrito, el pago y la boleta se usa formatearPrecio, que muestra "$0".
export const esGratis = (valor) => valor !== null && valor !== undefined && valor !== '' && Number(valor) === 0;

export function precioVitrina(valor) {
  return esGratis(valor) ? 'Gratis' : formatearPrecio(valor);
}

// Convierte un precio en texto ("$16.900") a número (16900)
export function precioANumero(texto) {
  return parseInt(String(texto || '$0').replace(/[^0-9]/g, ''), 10) || 0;
}
