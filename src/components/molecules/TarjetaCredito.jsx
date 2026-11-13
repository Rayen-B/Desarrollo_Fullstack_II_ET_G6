import React from 'react';
import { NOMBRES_MARCA } from '../../utils/pago';

// Agrupa el número en el formato visible; lo que falta se muestra como puntos
export function numeroVisible(numero, marca) {
  const d = String(numero || '').replace(/\D/g, '');
  const grupos = marca === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  let pos = 0;
  return grupos.map((n) => {
    const trozo = d.slice(pos, pos + n);
    pos += n;
    return trozo + '•'.repeat(n - trozo.length);
  }).join(' ');
}

// Tarjeta de crédito flotante que se llena en vivo mientras el cliente escribe.
// Al enfocar el CVV gira y muestra el reverso.
export default function TarjetaCredito({ numero = '', nombre = '', vencimiento = '', cvv = '', marca = null, tipo = null, girada = false }) {
  const clases = ['tarjeta-credito', marca ? `marca-${marca}` : '', girada ? 'girada' : ''].filter(Boolean).join(' ');
  const maxCvv = marca === 'amex' ? 4 : 3;
  return (
    <div className="tarjeta-credito-escena" aria-hidden="true" data-testid="tarjeta-credito">
      <div className={clases}>
        <div className="tc-cara tc-frente">
          <div className="tc-fila">
            <span className="tc-chip"></span>
            <span className="tc-marca">{marca ? NOMBRES_MARCA[marca] : <i className="fas fa-credit-card"></i>}{tipo && <small className="tc-tipo" data-testid="tc-tipo">{tipo === 'debito' ? 'Débito' : 'Crédito'}</small>}</span>
          </div>
          <div className="tc-numero" data-testid="tc-numero">{numeroVisible(numero, marca)}</div>
          <div className="tc-fila tc-pie">
            <div><small>Titular</small><strong data-testid="tc-nombre">{nombre.trim() ? nombre.toUpperCase() : 'NOMBRE APELLIDO'}</strong></div>
            <div><small>Vence</small><strong data-testid="tc-vence">{vencimiento || 'MM/AA'}</strong></div>
          </div>
        </div>
        <div className="tc-cara tc-reverso">
          <div className="tc-banda"></div>
          <div className="tc-firma"><span>CVV</span><strong data-testid="tc-cvv">{cvv + '•'.repeat(Math.max(0, maxCvv - cvv.length))}</strong></div>
        </div>
      </div>
    </div>
  );
}
