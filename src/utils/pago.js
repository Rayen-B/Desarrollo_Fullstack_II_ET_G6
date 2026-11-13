// Revisa si la fecha de vencimiento (formato "MM/AA") ya pasó
export function tarjetaVencida(vencimiento, hoy = new Date()) {
  const coincidencia = String(vencimiento).match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!coincidencia) return true;
  const [, mesTxt, anioTxt] = coincidencia;
  const mes = parseInt(mesTxt, 10);
  const anio = anioTxt.length === 2 ? 2000 + parseInt(anioTxt, 10) : parseInt(anioTxt, 10);
  if (mes < 1 || mes > 12 || Number.isNaN(anio)) return true;
  return anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
}

export function formatearVencimiento(valor, eliminar = false) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 6);
  if (digitos.length < 2) return digitos;
  if (digitos.length === 2) return eliminar ? digitos : `${digitos}/`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

// ---------- Formato del número de tarjeta, vencimiento y CVV (se aplican mientras se escribe) ----------

// Marca según el inicio del número: Visa (4), Mastercard (51-55 y 22-27), American Express (34 y 37)
export function detectarMarca(numero) {
  const d = String(numero || '').replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return null;
}

export const NOMBRES_MARCA = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

// "4532015112830366" -> "4532 0151 1283 0366". American Express va en grupos 4-6-5 (15 dígitos).
export function formatearNumeroTarjeta(valor) {
  const crudo = String(valor || '').replace(/\D/g, '');
  if (detectarMarca(crudo) === 'amex') {
    const d = crudo.slice(0, 15);
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  }
  return crudo.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// CVV: solo números. American Express usa 4 dígitos; las demás marcas, 3.
export function formatearCvv(valor, marca = null) {
  const max = marca === 'amex' ? 4 : marca ? 3 : 4;
  return String(valor || '').replace(/\D/g, '').slice(0, max);
}

// ---------- Espera simulada de la pasarela ----------

// Tiempo que se muestra "Procesando pago…" antes del resultado. En las pruebas es 0 (resultado inmediato);
// una prueba puede subirlo para verificar el estado de espera.
export const configuracionPago = { demoraMs: import.meta.env?.MODE === 'test' ? 0 : 1500 };

// ---------- Simulador de pago con distintos motivos de rechazo ----------

// Cada tarjeta de prueba provoca un rechazo distinto (todas pasan la validación Luhn)
export const MOTIVOS_RECHAZO = {
  rechazo: {
    tarjeta: '4000000000000002', icono: 'fa-university', etiqueta: 'Rechazo del banco',
    titulo: 'Tu banco rechazó la transacción',
    motivo: 'Tu banco rechazó la transacción. Revisa los datos o prueba con otra tarjeta.',
    consejo: 'Comunícate con tu banco o prueba con otra tarjeta.', campo: 'numTarjeta', reintentable: false
  },
  fondos: {
    tarjeta: '4000000000009995', icono: 'fa-wallet', etiqueta: 'Fondos insuficientes',
    titulo: 'Tu tarjeta no tiene saldo suficiente',
    motivo: 'El pago fue rechazado por fondos insuficientes.',
    consejo: 'Prueba con otra tarjeta o paga con transferencia bancaria.', campo: 'numTarjeta', reintentable: false
  },
  cvv: {
    tarjeta: '4000000000000127', icono: 'fa-lock', etiqueta: 'CVV incorrecto',
    titulo: 'El código de seguridad no coincide',
    motivo: 'El código de seguridad (CVV) ingresado no es correcto.',
    consejo: 'Revisa el código de 3 dígitos que está en el reverso de tu tarjeta.', campo: 'cvv', reintentable: false
  },
  procesador: {
    tarjeta: '4000000000000119', icono: 'fa-server', etiqueta: 'Error del procesador',
    titulo: 'No pudimos procesar el pago',
    motivo: 'Hubo un problema al procesar el pago. No se realizó ningún cobro.',
    consejo: 'Es un problema temporal: reintenta en unos minutos.', campo: null, reintentable: true
  },
  tiempo: {
    tarjeta: '4000000000000259', icono: 'fa-clock', etiqueta: 'Tiempo de espera agotado',
    titulo: 'El banco tardó demasiado en responder',
    motivo: 'El banco no respondió a tiempo.',
    consejo: 'Reintenta el pago: tus datos siguen guardados.', campo: null, reintentable: true
  }
};

// Número de tarjeta que el banco siempre rechaza (4000 0000 0000 0002, pasa Luhn)
export const TARJETA_RECHAZADA = MOTIVOS_RECHAZO.rechazo.tarjeta;

export const motivoPorTarjeta = (numTarjeta) => {
  const d = String(numTarjeta || '').replace(/\D/g, '');
  return Object.keys(MOTIVOS_RECHAZO).find((k) => MOTIVOS_RECHAZO[k].tarjeta === d) || null;
};

export const obtenerMotivo = (codigo) => MOTIVOS_RECHAZO[codigo] || MOTIVOS_RECHAZO.rechazo;

// Respuesta de la pasarela de pago.
//  - motivo (opcional): fuerza un rechazo con ese motivo (se usa en el botón "Simular error de pago")
//  - si no se indica, solo las tarjetas de prueba de MOTIVOS_RECHAZO son rechazadas
export function simularPago({ metodoPago, numTarjeta = '', motivo = null }) {
  const codigo = motivo || (metodoPago === 'tarjeta' ? motivoPorTarjeta(numTarjeta) : null);
  if (!codigo) return { aprobado: true, motivo: '', codigoMotivo: null };
  const m = obtenerMotivo(codigo);
  return { aprobado: false, motivo: m.motivo, codigoMotivo: MOTIVOS_RECHAZO[codigo] ? codigo : 'rechazo', titulo: m.titulo, consejo: m.consejo };
}

// ---------- Transferencia bancaria ----------

export const DATOS_TRANSFERENCIA = [
  { etiqueta: 'Banco', valor: 'Banco Papita Dulce' },
  { etiqueta: 'Tipo de cuenta', valor: 'Cuenta corriente' },
  { etiqueta: 'N° de cuenta', valor: '00-123-4567-89' },
  { etiqueta: 'RUT', valor: '76.543.210-3' },
  { etiqueta: 'Comprobante a', valor: 'pagos@papitadulce.cl' }
];

export const HORAS_PLAZO_TRANSFERENCIA = 24;

// Fecha límite para transferir (24 horas desde la compra)
export const plazoTransferencia = (desde = new Date()) => new Date(new Date(desde).getTime() + HORAS_PLAZO_TRANSFERENCIA * 3600 * 1000);

// "2026-10-17T14:30:00" -> "17-10-2026 14:30"
export function formatearPlazo(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(d.getDate())}-${dos(d.getMonth() + 1)}-${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

// ---------- Efectivo ----------

// Calcula el vuelto cuando el cliente indica con cuánto pagará
export function calcularVuelto(total, paga) {
  const t = Number(total) || 0;
  const p = Number(String(paga ?? '').replace(/\D/g, '')) || 0;
  if (!p) return { indicado: false, suficiente: true, vuelto: 0, faltante: 0 };
  return { indicado: true, suficiente: p >= t, vuelto: Math.max(0, p - t), faltante: Math.max(0, t - p) };
}

// Código corto para mostrar al retirar o al repartidor: "PD-12345678" -> "PD-5678"
// Divide el total en cuotas enteras; la primera lleva los pesos que sobran
export function dividirEnCuotas(total, n) {
  const base = Math.floor(total / n);
  return { primera: total - base * (n - 1), resto: base };
}

export const codigoPedido = (id) => 'PD-' + String(id || '').replace(/\D/g, '').slice(-4);
