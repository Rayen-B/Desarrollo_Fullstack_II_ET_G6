import { describe, it, expect } from 'vitest';
import { formatearVencimiento, formatearNumeroTarjeta, tarjetaVencida, simularPago, TARJETA_RECHAZADA, dividirEnCuotas } from '../utils/pago';
import { formatearPrecio, precioANumero } from '../utils/formato';

describe('utils/formato', () => {
  it('formatea el precio en pesos chilenos', () => expect(formatearPrecio(16900)).toBe('$16.900'));
  it('convierte texto a número', () => expect(precioANumero('$16.900')).toBe(16900));
  it('devuelve 0 con texto vacío', () => expect(precioANumero('')).toBe(0));
});

describe('utils/pago', () => {
  it('formatea vencimientos con año de dos o cuatro dígitos', () => {
    expect(formatearVencimiento('12')).toBe('12/');
    expect(formatearVencimiento('1230')).toBe('12/30');
    expect(formatearVencimiento('12/30')).toBe('12/30');
    expect(formatearVencimiento('122029')).toBe('12/2029');
    expect(formatearVencimiento('12202999')).toBe('12/2029');
    expect(formatearVencimiento('12', true)).toBe('12');
  });
  it('detecta tarjeta vencida', () => expect(tarjetaVencida('01/20', new Date(2026, 9, 18))).toBe(true));
  it('detecta tarjeta vigente en formato de dos dígitos', () => expect(tarjetaVencida('12/99', new Date(2026, 9, 18))).toBe(false));
  it('acepta vencimiento a tres años en formato de cuatro dígitos', () => expect(tarjetaVencida('10/2029', new Date(2026, 9, 18))).toBe(false));
  it('considera vigente la tarjeta durante todo el mes de vencimiento', () => expect(tarjetaVencida('10/2026', new Date(2026, 9, 31, 23, 59, 59))).toBe(false));
  it('mes inválido cuenta como vencida', () => expect(tarjetaVencida('13/30')).toBe(true));
  it('formatea tarjetas genéricas de hasta 19 dígitos', () => {
    expect(formatearNumeroTarjeta('4532015112830366005')).toBe('4532 0151 1283 0366 005');
  });
  it('la tarjeta de prueba es rechazada', () => expect(simularPago({ metodoPago: 'tarjeta', numTarjeta: TARJETA_RECHAZADA }).aprobado).toBe(false));
  it('otras tarjetas son aprobadas', () => expect(simularPago({ metodoPago: 'tarjeta', numTarjeta: '4532015112830366' }).aprobado).toBe(true));
  it('efectivo siempre se aprueba', () => expect(simularPago({ metodoPago: 'efectivo' }).aprobado).toBe(true));
});

describe('dividirEnCuotas()', () => {
  it('las cuotas suman exactamente el total', () => {
    for (const [total, n] of [[16900, 3], [16900, 6], [33800, 3], [2500, 6]]) {
      const { primera, resto } = dividirEnCuotas(total, n);
      expect(primera + resto * (n - 1)).toBe(total);
    }
  });
  it('si la división es exacta, todas las cuotas son iguales', () => {
    expect(dividirEnCuotas(18000, 3)).toEqual({ primera: 6000, resto: 6000 });
  });
  it('la primera cuota lleva los pesos que sobran', () => {
    expect(dividirEnCuotas(16900, 3)).toEqual({ primera: 5634, resto: 5633 });
  });
});
