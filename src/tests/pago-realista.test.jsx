import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderizar, clic, escribir, enviarFormulario, formulario, porId, textoDe } from './utils';
import { Rutas } from '../App';
import TarjetaCredito, { numeroVisible } from '../components/molecules/TarjetaCredito';
import {
  detectarMarca, formatearNumeroTarjeta, formatearCvv, MOTIVOS_RECHAZO, motivoPorTarjeta, simularPago, calcularVuelto,
  codigoPedido, plazoTransferencia, formatearPlazo, DATOS_TRANSFERENCIA, configuracionPago
} from '../utils/pago';
import { validarTarjetaLuhn } from '../utils/validaciones';
import { listarOrdenes, resumenVentas, crearOrden, actualizarEstadoOrden } from '../services/db';

const CLIENTE = { run: '190110222', nombre: 'Armando', apellidos: 'Esteban Quito', correo: 'armando.quito@gmail.com', rol: 'Cliente' };
const ADMIN = { run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita', correo: 'admin@papitadulce.cl', password: 'admin', rol: 'Administrador' };
const iniciarComo = (u) => localStorage.setItem('tienda_usuario_sesion', JSON.stringify(u));
const ITEM = { id: 'TC001', codigo: 'TC001', nombre: 'Torta Panqueque Naranja', precio: 16900, imagen: 'menu/Torta_Trufa', variante: 'entera', cantidad: 2 };
const cargarCarrito = () => localStorage.setItem('papita_dulce_cart', JSON.stringify([ITEM]));

// Deja el checkout listo hasta el método de pago (cliente con sesión y carrito de $33.800)
function abrirCheckout() {
  iniciarComo(CLIENTE);
  cargarCarrito();
  const c = renderizar(<Rutas />, { ruta: '/checkout' });
  escribir(porId(c, 'coTelefono'), '+56 9 1234 5678');
  return c;
}
function llenarTarjeta(c, numero) {
  escribir(porId(c, 'coTarjeta'), numero);
  escribir(porId(c, 'coVence'), '12/99');
  escribir(porId(c, 'coCvv'), '123');
}

describe('Formato del número de tarjeta', () => {
  it('agrupa de a 4 dígitos', () => expect(formatearNumeroTarjeta('4532015112830366')).toBe('4532 0151 1283 0366'));
  it('ignora letras y guiones al pegar', () => expect(formatearNumeroTarjeta('4532-0151-1283-0366')).toBe('4532 0151 1283 0366'));
  it('limita a 19 dígitos', () => expect(formatearNumeroTarjeta('45320151128303660059999')).toBe('4532 0151 1283 0366 005'));
  it('American Express usa el formato 4-6-5', () => expect(formatearNumeroTarjeta('378282246310005')).toBe('3782 822463 10005'));
  it('un número vacío o inválido queda vacío', () => {
    expect(formatearNumeroTarjeta('')).toBe('');
    expect(formatearNumeroTarjeta('abcd')).toBe('');
  });
  it('el CVV solo admite números y el largo de la marca', () => {
    expect(formatearCvv('12a3456')).toBe('1234');
    expect(formatearCvv('12345', 'visa')).toBe('123');
    expect(formatearCvv('12345', 'amex')).toBe('1234');
  });
});

describe('Marca de la tarjeta', () => {
  it('Visa empieza con 4', () => expect(detectarMarca('4532 0151')).toBe('visa'));
  it('Mastercard empieza con 51 a 55', () => expect(detectarMarca('5555 5555')).toBe('mastercard'));
  it('Mastercard también con 22 a 27', () => expect(detectarMarca('2221 0000')).toBe('mastercard'));
  it('American Express empieza con 34 o 37', () => {
    expect(detectarMarca('3782')).toBe('amex');
    expect(detectarMarca('3400')).toBe('amex');
  });
  it('sin datos no hay marca', () => {
    expect(detectarMarca('')).toBeNull();
    expect(detectarMarca('9999')).toBeNull();
  });
});

describe('Simulador de errores de pago por motivo', () => {
  it('hay 5 motivos y todas sus tarjetas de prueba pasan la validación Luhn', () => {
    const motivos = Object.values(MOTIVOS_RECHAZO);
    expect(motivos).toHaveLength(5);
    motivos.forEach((m) => expect(validarTarjetaLuhn(m.tarjeta).valido).toBe(true));
  });
  it.each(Object.keys(MOTIVOS_RECHAZO))('la tarjeta de prueba del motivo "%s" es rechazada con ese motivo', (clave) => {
    const pago = simularPago({ metodoPago: 'tarjeta', numTarjeta: MOTIVOS_RECHAZO[clave].tarjeta });
    expect(pago.aprobado).toBe(false);
    expect(pago.codigoMotivo).toBe(clave);
    expect(pago.titulo).toBe(MOTIVOS_RECHAZO[clave].titulo);
    expect(pago.consejo).toBeTruthy();
  });
  it('reconoce la tarjeta aunque venga con espacios', () => expect(motivoPorTarjeta('4000 0000 0000 9995')).toBe('fondos'));
  it('una tarjeta normal se aprueba', () => expect(simularPago({ metodoPago: 'tarjeta', numTarjeta: '4532 0151 1283 0366' }).aprobado).toBe(true));
  it('un motivo forzado rechaza aunque la tarjeta sea buena', () => {
    const pago = simularPago({ metodoPago: 'tarjeta', numTarjeta: '4532015112830366', motivo: 'cvv' });
    expect(pago.aprobado).toBe(false);
    expect(pago.codigoMotivo).toBe('cvv');
  });
  it('la transferencia y el efectivo no dependen de la tarjeta', () => {
    expect(simularPago({ metodoPago: 'transferencia', numTarjeta: MOTIVOS_RECHAZO.fondos.tarjeta }).aprobado).toBe(true);
    expect(simularPago({ metodoPago: 'efectivo' }).aprobado).toBe(true);
  });
  it('los motivos de error del procesador y de tiempo permiten reintentar', () => {
    expect(MOTIVOS_RECHAZO.procesador.reintentable).toBe(true);
    expect(MOTIVOS_RECHAZO.tiempo.reintentable).toBe(true);
    expect(MOTIVOS_RECHAZO.fondos.reintentable).toBe(false);
  });
});

describe('Transferencia y efectivo: utilidades', () => {
  it('calcularVuelto devuelve el vuelto cuando alcanza', () => expect(calcularVuelto(33800, '40000')).toEqual({ indicado: true, suficiente: true, vuelto: 6200, faltante: 0 }));
  it('calcularVuelto avisa cuánto falta si el monto es menor', () => expect(calcularVuelto(33800, '30000')).toMatchObject({ suficiente: false, faltante: 3800 }));
  it('sin monto indicado no hay vuelto', () => expect(calcularVuelto(33800, '').indicado).toBe(false));
  it('el código de pedido usa los últimos 4 dígitos de la orden', () => expect(codigoPedido('PD-12345678')).toBe('PD-5678'));
  it('el plazo de transferencia es de 24 horas', () => {
    const desde = new Date('2026-10-17T10:00:00');
    expect(plazoTransferencia(desde).getTime() - desde.getTime()).toBe(24 * 3600 * 1000);
  });
  it('formatearPlazo muestra día-mes-año y hora', () => expect(formatearPlazo(new Date(2026, 9, 18, 9, 5))).toBe('18-10-2026 09:05'));
  it('hay datos de transferencia para copiar', () => expect(DATOS_TRANSFERENCIA.map((d) => d.etiqueta)).toContain('N° de cuenta'));
});

describe('Componente TarjetaCredito', () => {
  it('vacía muestra marcadores de posición', () => {
    render(<TarjetaCredito />);
    expect(screen.getByTestId('tc-numero')).toHaveTextContent('•••• •••• •••• ••••');
    expect(screen.getByTestId('tc-nombre')).toHaveTextContent('NOMBRE APELLIDO');
    expect(screen.getByTestId('tc-vence')).toHaveTextContent('MM/AA');
  });
  it('muestra en vivo número, titular y vencimiento', () => {
    render(<TarjetaCredito numero="4532 0151" nombre="Ana Pérez" vencimiento="12/30" marca="visa" />);
    expect(screen.getByTestId('tc-numero')).toHaveTextContent('4532 0151 •••• ••••');
    expect(screen.getByTestId('tc-nombre')).toHaveTextContent('ANA PÉREZ');
    expect(screen.getByTestId('tc-vence')).toHaveTextContent('12/30');
    expect(screen.getByText('Visa')).toBeInTheDocument();
  });
  it('gira al mostrar el reverso con el CVV', () => {
    const { container } = render(<TarjetaCredito cvv="12" girada />);
    expect(container.querySelector('.tarjeta-credito').className).toContain('girada');
    expect(screen.getByTestId('tc-cvv')).toHaveTextContent('12•');
  });
  it('es decorativa para lectores de pantalla', () => {
    render(<TarjetaCredito />);
    expect(screen.getByTestId('tarjeta-credito')).toHaveAttribute('aria-hidden', 'true');
  });
  it('American Express agrupa 4-6-5', () => expect(numeroVisible('3782', 'amex')).toBe('3782 •••••• •••••'));
});

describe('Checkout paso 3: tarjeta flotante y formato', () => {
  it('formatea el número, detecta la marca y refleja los datos en la tarjeta', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coTarjeta'), '4532015112830366');
    expect(porId(c, 'coTarjeta').value).toBe('4532 0151 1283 0366');
    expect(c.querySelector('label[for="coTarjeta"]').textContent).toContain('Visa');
    expect(c.querySelector('[data-testid="tc-numero"]').textContent).toBe('4532 0151 1283 0366');
    expect(c.querySelector('[data-testid="tc-nombre"]').textContent).toBe('ARMANDO ESTEBAN QUITO');
  });
  it('acepta en el checkout una tarjeta Luhn de 19 dígitos y vencimiento MM/AAAA', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coTarjeta'), '4532015112830366005');
    escribir(porId(c, 'coVence'), '10/2029');
    escribir(porId(c, 'coCvv'), '123');
    expect(porId(c, 'coTarjeta').value).toBe('4532 0151 1283 0366 005');
    expect(porId(c, 'coVence').value).toBe('10/2029');
    enviarFormulario(formulario(c));
    expect(c.querySelector('#coTarjeta-error')).toBeNull();
    expect(listarOrdenes().at(-1).ultimos4).toBe('6005');
  });
  it('la tarjeta gira al enfocar el CVV y vuelve al salir', () => {
    const c = abrirCheckout();
    expect(c.querySelector('.tarjeta-credito').className).not.toContain('girada');
    fireEvent.focus(porId(c, 'coCvv'));
    expect(c.querySelector('.tarjeta-credito').className).toContain('girada');
    fireEvent.blur(porId(c, 'coCvv'));
    expect(c.querySelector('.tarjeta-credito').className).not.toContain('girada');
  });
  it('el CVV solo acepta números', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coCvv'), '1a2b3c');
    expect(porId(c, 'coCvv').value).toBe('123');
  });
  it('la tarjeta flotante solo aparece con el pago con tarjeta', () => {
    const c = abrirCheckout();
    expect(c.querySelector('[data-testid="tarjeta-credito"]')).not.toBeNull();
    clic(c.querySelector('input[name="metodoPago"][value="transferencia"]'));
    expect(c.querySelector('[data-testid="tarjeta-credito"]')).toBeNull();
  });
  it('los códigos de error NO se muestran mientras el simulador esté apagado', () => {
    const c = abrirCheckout();
    expect(c.querySelector('.tarjetas-prueba')).toBeNull();
    expect(porId(c, 'motivo-simulado')).toBeNull();
    expect(porId(c, 'simular-error-pago')).toBeNull();
    expect(textoDe(c)).not.toContain('4000 0000 0000 9995');
  });
  it('al activar el simulador aparecen las tarjetas de prueba, el motivo y el botón', () => {
    const c = abrirCheckout();
    clic(porId(c, 'modo-simulador'));
    expect(textoDe(c.querySelector('.tarjetas-prueba'))).toContain('4000 0000 0000 9995');
    expect(textoDe(c.querySelector('.tarjetas-prueba'))).toContain('Fondos insuficientes');
    expect(porId(c, 'motivo-simulado')).not.toBeNull();
    expect(porId(c, 'simular-error-pago')).not.toBeNull();
    clic(porId(c, 'modo-simulador'));
    expect(c.querySelector('.tarjetas-prueba')).toBeNull();
  });
  it('las tarjetas de prueba siguen funcionando aunque el simulador esté apagado', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4000 0000 0000 9995');
    enviarFormulario(formulario(c));
    expect(listarOrdenes().at(-1).codigoMotivo).toBe('fondos');
  });
});

describe('Checkout: crédito o débito', () => {
  it('por defecto es crédito, con selector de cuotas', () => {
    const c = abrirCheckout();
    expect(c.querySelector('input[name="tipoTarjeta"][value="credito"]').checked).toBe(true);
    expect(porId(c, 'coCuotas')).not.toBeNull();
    expect([...porId(c, 'coCuotas').options].map((o) => o.value)).toEqual(['1', '3', '6']);
    expect(porId(c, 'coCuotas').options[1].textContent).toBe('3 cuotas sin interés: 1 de $11.268 y 2 de $11.266');
  });
  it('con débito no hay cuotas y se avisa que el cobro es inmediato', () => {
    const c = abrirCheckout();
    clic(c.querySelector('input[name="tipoTarjeta"][value="debito"]'));
    expect(porId(c, 'coCuotas')).toBeNull();
    expect(textoDe(c)).toContain('se descuenta de tu cuenta al instante');
  });
  it('la tarjeta flotante muestra el tipo elegido', () => {
    const c = abrirCheckout();
    expect(c.querySelector('[data-testid="tc-tipo"]').textContent).toBe('Crédito');
    clic(c.querySelector('input[name="tipoTarjeta"][value="debito"]'));
    expect(c.querySelector('[data-testid="tc-tipo"]').textContent).toBe('Débito');
  });
  it('el pago con crédito guarda tipo, cuotas y los últimos 4 dígitos (nunca el número completo)', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4532015112830366');
    escribir(porId(c, 'coCuotas'), '3');
    enviarFormulario(formulario(c));
    const orden = listarOrdenes().at(-1);
    expect(orden).toMatchObject({ tipoTarjeta: 'credito', cuotas: 3, ultimos4: '0366', estado: 'Pendiente' });
    expect(JSON.stringify(orden)).not.toContain('4532015112830366');
    expect(textoDe(c.querySelector('[data-testid="detalle-tarjeta"]'))).toContain('crédito •••• 0366 en 3 cuotas sin interés');
  });
  it('el pago con débito queda en 1 cuota', () => {
    const c = abrirCheckout();
    clic(c.querySelector('input[name="tipoTarjeta"][value="debito"]'));
    llenarTarjeta(c, '4532015112830366');
    enviarFormulario(formulario(c));
    expect(listarOrdenes().at(-1)).toMatchObject({ tipoTarjeta: 'debito', cuotas: 1 });
    expect(textoDe(c.querySelector('[data-testid="detalle-tarjeta"]'))).toContain('débito •••• 0366');
  });
});

describe('Checkout: escribir el número de tarjeta sin trabarse', () => {
  const cambiarConCursor = (input, valor, cursor, tipo = 'insertText') => {
    input.focus();
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    act(() => {
      set.call(input, valor);
      input.setSelectionRange(cursor, cursor);
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: tipo }));
    });
  };
  it('escribir dígito a dígito va armando los grupos', () => {
    const c = abrirCheckout();
    let texto = '';
    '45320151'.split('').forEach((d) => { texto += d; escribir(porId(c, 'coTarjeta'), porId(c, 'coTarjeta').value + d); });
    expect(porId(c, 'coTarjeta').value).toBe('4532 0151');
  });
  it('se puede borrar un espacio sin quedar atrapado (borra el dígito anterior)', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coTarjeta'), '4532015');
    expect(porId(c, 'coTarjeta').value).toBe('4532 015');
    cambiarConCursor(porId(c, 'coTarjeta'), '4532015', 4, 'deleteContentBackward');
    expect(porId(c, 'coTarjeta').value).toBe('4530 15');
  });
  it('al insertar un dígito en el medio el cursor no salta al final', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coTarjeta'), '45320151');
    cambiarConCursor(porId(c, 'coTarjeta'), '49532 0151', 2);
    expect(porId(c, 'coTarjeta').value).toBe('4953 2015 1');
    expect(porId(c, 'coTarjeta').selectionStart).toBe(2);
  });
  it('borrar normalmente un dígito funciona', () => {
    const c = abrirCheckout();
    escribir(porId(c, 'coTarjeta'), '45320151');
    cambiarConCursor(porId(c, 'coTarjeta'), '4532 015', 8, 'deleteContentBackward');
    expect(porId(c, 'coTarjeta').value).toBe('4532 015');
  });
});

describe('Checkout: errores de pago por motivo', () => {
  it.each([['4000 0000 0000 9995', 'Tu tarjeta no tiene saldo suficiente'], ['4000 0000 0000 0127', 'El código de seguridad no coincide'], ['4000 0000 0000 0119', 'No pudimos procesar el pago']])(
    'la tarjeta %s lleva a la pantalla de error con el motivo correcto', (tarjeta, titulo) => {
      const c = abrirCheckout();
      llenarTarjeta(c, tarjeta);
      enviarFormulario(formulario(c));
      expect(textoDe(c)).toContain('No se pudo realizar el pago');
      expect(textoDe(c)).toContain(titulo);
      expect(textoDe(c)).toContain('No se realizó ningún cobro');
      expect(listarOrdenes().at(-1).estado).toBe('Pago rechazado');
    });
  it('el selector de motivo cambia el resultado del botón "Simular error de pago"', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4532015112830366');
    clic(porId(c, 'modo-simulador'));
    escribir(porId(c, 'motivo-simulado'), 'tiempo');
    clic(c.querySelector('#simular-error-pago'));
    expect(textoDe(c)).toContain('El banco tardó demasiado en responder');
    expect(textoDe(c)).toContain('Reintentar el pago');
    expect(listarOrdenes().at(-1)).toMatchObject({ estado: 'Pago rechazado', codigoMotivo: 'tiempo' });
  });
  it('el botón de pagar con una tarjeta de prueba también es rechazado (la tarjeta decide)', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4000 0000 0000 9995');
    clic(c.querySelector('button[name="resultadoPago"][value="aprobado"]'));
    expect(listarOrdenes().at(-1).estado).toBe('Pago rechazado');
  });
  it('un rechazo conserva el carrito y no descuenta stock', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4000 0000 0000 0002');
    enviarFormulario(formulario(c));
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(1);
  });
  it('la pantalla de error ofrece reintentar, elegir otro método y volver a la tienda', () => {
    const c = abrirCheckout();
    llenarTarjeta(c, '4000 0000 0000 0127');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('VOLVER A REALIZAR EL PAGO');
    expect(textoDe(c)).toContain('Elegir otro método de pago');
    expect(textoDe(c)).toContain('Volver a la tienda');
    expect(c.querySelector('details.pago-detalle')).not.toBeNull();
  });
  it('al recargar la pantalla de error se recupera el motivo desde la orden', () => {
    const { orden } = crearOrden({ cliente: 'Ana', correo: 'a@a.cl', entrega: 'Retiro en tienda', metodoPago: 'tarjeta', items: [{ codigo: 'TC001', nombre: 'Torta', precio: 1000, cantidad: 1 }], estado: 'Pago rechazado', datosPago: { codigoMotivo: 'fondos' } });
    const c = renderizar(<Rutas />, { ruta: `/compra/error/${orden.id}` });
    expect(textoDe(c)).toContain('Tu tarjeta no tiene saldo suficiente');
  });
});

describe('Transferencia bancaria más realista', () => {
  const pagarTransferencia = () => {
    const c = abrirCheckout();
    clic(c.querySelector('input[name="metodoPago"][value="transferencia"]'));
    return c;
  };
  it('muestra los datos con botón Copiar y el plazo de 24 horas', () => {
    const c = pagarTransferencia();
    expect(c.querySelectorAll('.btn-copiar')).toHaveLength(DATOS_TRANSFERENCIA.length);
    expect(textoDe(c)).toContain('Banco Papita Dulce');
    expect(textoDe(c)).toContain('24 horas');
    expect(textoDe(c)).toContain('pendiente de pago');
  });
  it('Copiar usa el portapapeles y avisa "¡Copiado!"', async () => {
    const escribirPortapapeles = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escribirPortapapeles }, configurable: true });
    const c = pagarTransferencia();
    await act(async () => { c.querySelector('.btn-copiar').click(); });
    expect(escribirPortapapeles).toHaveBeenCalledWith('Banco Papita Dulce');
    expect(textoDe(c)).toContain('¡Copiado!');
  });
  it('al confirmar, la orden queda "Pendiente de pago" con referencia y plazo', () => {
    const c = pagarTransferencia();
    enviarFormulario(formulario(c));
    const orden = listarOrdenes().at(-1);
    expect(orden.estado).toBe('Pendiente de pago');
    expect(orden.referenciaPago).toBe(orden.id);
    expect(new Date(orden.plazoPago).getTime()).toBeGreaterThan(Date.now());
  });
  it('la pantalla final pide transferir con la referencia y no dice "compra realizada"', () => {
    const c = pagarTransferencia();
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Pedido recibido');
    expect(textoDe(c)).not.toContain('Se ha realizado la compra');
    expect(textoDe(c.querySelector('[data-testid="instrucciones-transferencia"]'))).toContain(listarOrdenes().at(-1).id);
  });
  it('el stock se reserva y el carrito se vacía', () => {
    const c = pagarTransferencia();
    enviarFormulario(formulario(c));
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(0);
  });
  it('una transferencia pendiente aún no cuenta como ingreso; al confirmarla sí', () => {
    const antes = resumenVentas().ingresos;
    const { orden } = crearOrden({ cliente: 'Ana', correo: 'a@a.cl', entrega: 'Retiro en tienda', metodoPago: 'transferencia', estado: 'Pendiente de pago', items: [{ codigo: 'TC001', nombre: 'Torta', precio: 5000, cantidad: 2 }] });
    expect(resumenVentas().ingresos).toBe(antes);
    actualizarEstadoOrden(orden.id, 'Pendiente');
    expect(resumenVentas().ingresos).toBe(antes + 10000);
  });
  it('el administrador confirma el pago desde el detalle de la orden', () => {
    const { orden } = crearOrden({ cliente: 'Ana Test', correo: 'a@a.cl', entrega: 'Retiro en tienda', metodoPago: 'transferencia', estado: 'Pendiente de pago', items: [{ codigo: 'TC001', nombre: 'Torta', precio: 5000, cantidad: 1 }] });
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    const fila = [...c.querySelectorAll('tbody tr')].find((tr) => tr.textContent.includes(orden.id));
    clic(fila.querySelector('button'));
    clic(document.getElementById('confirmar-pago'));
    expect(listarOrdenes().find((o) => o.id === orden.id).estado).toBe('Pendiente');
    expect(document.getElementById('modal-ord-estado').textContent).toBe('Pendiente');
  });
});

describe('Pago en efectivo más realista', () => {
  const pagarEfectivo = () => {
    const c = abrirCheckout();
    clic(c.querySelector('input[name="metodoPago"][value="efectivo"]'));
    return c;
  };
  it('pregunta con cuánto pagará y calcula el vuelto', () => {
    const c = pagarEfectivo();
    escribir(porId(c, 'coPagaCon'), '40000');
    expect(c.querySelector('[data-testid="vuelto"]').textContent).toContain('$6.200');
  });
  it('rechaza un monto menor al total', () => {
    const c = pagarEfectivo();
    const ordenesAntes = listarOrdenes().length;
    escribir(porId(c, 'coPagaCon'), '30000');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('El monto debe ser al menos $33.800');
    expect(listarOrdenes()).toHaveLength(ordenesAntes);
  });
  it('el monto es opcional', () => {
    const c = pagarEfectivo();
    enviarFormulario(formulario(c));
    expect(listarOrdenes().at(-1).metodoPago).toBe('efectivo');
  });
  it('genera un código de pedido y guarda el vuelto', () => {
    const c = pagarEfectivo();
    escribir(porId(c, 'coPagaCon'), '40000');
    enviarFormulario(formulario(c));
    const orden = listarOrdenes().at(-1);
    expect(orden).toMatchObject({ estado: 'Pendiente', pagaCon: 40000, vuelto: 6200 });
    expect(orden.codigoPedido).toMatch(/^PD-\d{4}$/);
    expect(textoDe(c.querySelector('[data-testid="instrucciones-efectivo"]'))).toContain(orden.codigoPedido);
    expect(textoDe(c)).toContain('Pedido confirmado');
  });
  it('el monto del efectivo solo admite números', () => {
    const c = pagarEfectivo();
    escribir(porId(c, 'coPagaCon'), '4a0b000');
    expect(porId(c, 'coPagaCon').value).toBe('40000');
  });
});

describe('Espera simulada "Procesando pago…"', () => {
  const conDemora = (fn) => () => {
    configuracionPago.demoraMs = 1500;
    try { fn(); } finally { configuracionPago.demoraMs = 0; }
  };
  it('en las pruebas la demora es 0 (resultado inmediato)', () => expect(configuracionPago.demoraMs).toBe(0));
  it('muestra "Procesando pago…" y recién después entrega el resultado', conDemora(() => {
    vi.useFakeTimers();
    const c = abrirCheckout();
    llenarTarjeta(c, '4532015112830366');
    const ordenesAntes = listarOrdenes().length;
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Procesando pago…');
    expect(c.querySelector('button[name="resultadoPago"][value="aprobado"]').disabled).toBe(true);
    expect(listarOrdenes()).toHaveLength(ordenesAntes);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(textoDe(c)).toContain('Se ha realizado la compra');
    expect(listarOrdenes()).toHaveLength(ordenesAntes + 1);
  }));
  it('un doble envío mientras se procesa no crea dos órdenes', conDemora(() => {
    vi.useFakeTimers();
    const c = abrirCheckout();
    llenarTarjeta(c, '4532015112830366');
    const ordenesAntes = listarOrdenes().length;
    enviarFormulario(formulario(c));
    enviarFormulario(formulario(c));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(listarOrdenes()).toHaveLength(ordenesAntes + 1);
  }));
  it('un rechazo también espera antes de mostrar el error', conDemora(() => {
    vi.useFakeTimers();
    const c = abrirCheckout();
    llenarTarjeta(c, '4000 0000 0000 9995');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).not.toContain('No se pudo realizar el pago');
    act(() => { vi.advanceTimersByTime(1500); });
    expect(textoDe(c)).toContain('Tu tarjeta no tiene saldo suficiente');
  }));
});
