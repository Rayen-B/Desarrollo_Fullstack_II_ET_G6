import { describe, it, expect } from 'vitest';
import { validarEmail, validarTelefono, validarRUN, validarPassword, validarTarjetaLuhn, validarPrecio, validarStock, validarCodigoProducto } from '../utils/validaciones';
import { formatearPrecio, precioANumero } from '../utils/formato';
import { tarjetaVencida, simularPago, TARJETA_RECHAZADA } from '../utils/pago';
import { crearSlug, descuentoPorcentaje, obtenerProducto } from '../services/db';

describe('Validaciones con entradas fuera del negocio', () => {
  it('validarEmail rechaza null y undefined', () => {
    expect(validarEmail(null).valido).toBe(false);
    expect(validarEmail(undefined).valido).toBe(false);
  });

  it('validarTelefono rechaza null', () => {
    expect(validarTelefono(null).valido).toBe(false);
  });

  it('validarRUN rechaza null y vacío con mensaje de requerido', () => {
    expect(validarRUN(null).mensaje).toContain('requerido');
    expect(validarRUN('').mensaje).toContain('requerido');
  });

  it('validarPassword rechaza null', () => {
    expect(validarPassword(null).valido).toBe(false);
  });

  it('validarTarjetaLuhn rechaza null y vacío', () => {
    expect(validarTarjetaLuhn(null).valido).toBe(false);
    expect(validarTarjetaLuhn('').valido).toBe(false);
  });

  it('validarPrecio rechaza negativos y texto', () => {
    expect(validarPrecio(-5).valido).toBe(false);
    expect(validarPrecio('abc').valido).toBe(false);
  });

  it('validarPrecio acepta 0 como producto gratuito', () => {
    expect(validarPrecio(0).valido).toBe(true);
  });

  it('validarStock rechaza negativos, decimales y texto', () => {
    expect(validarStock(-1).valido).toBe(false);
    expect(validarStock(1.5).valido).toBe(false);
    expect(validarStock('x').valido).toBe(false);
  });

  it('validarCodigoProducto exige mínimo 3 caracteres', () => {
    expect(validarCodigoProducto('').valido).toBe(false);
    expect(validarCodigoProducto('ab').mensaje).toContain('3');
  });
});

describe('formatearPrecio y precioANumero', () => {
  it('da formato chileno a un número', () => {
    expect(formatearPrecio(3200)).toBe('$3.200');
  });

  it('un valor null se muestra como $0', () => {
    expect(formatearPrecio(null)).toBe('$0');
  });

  it('un valor undefined no debería mostrarse como $NaN', () => {
    expect(formatearPrecio(undefined)).not.toContain('NaN');
  });

  it('un texto que no es número no debería mostrarse como $NaN', () => {
    expect(formatearPrecio('abc')).toBe('$0');
  });

  it('precioANumero convierte "$16.900" en 16900', () => {
    expect(precioANumero('$16.900')).toBe(16900);
  });

  it('precioANumero devuelve 0 con null, undefined o texto sin dígitos', () => {
    expect(precioANumero(null)).toBe(0);
    expect(precioANumero(undefined)).toBe(0);
    expect(precioANumero('abc')).toBe(0);
  });
});

describe('Pago', () => {
  it('una tarjeta con fecha pasada está vencida', () => {
    expect(tarjetaVencida('01/20')).toBe(true);
  });

  it('una tarjeta con fecha futura no está vencida', () => {
    expect(tarjetaVencida('12/99')).toBe(false);
  });

  it('un mes inválido (13) cuenta como vencida', () => {
    expect(tarjetaVencida('13/30')).toBe(true);
  });

  it('un texto o undefined como vencimiento cuenta como vencida', () => {
    expect(tarjetaVencida('abc')).toBe(true);
    expect(tarjetaVencida(undefined)).toBe(true);
  });

  it('la tarjeta de prueba de rechazo es rechazada por el banco', () => {
    const respuesta = simularPago({ metodoPago: 'tarjeta', numTarjeta: '4000 0000 0000 0002' });
    expect(respuesta.aprobado).toBe(false);
    expect(respuesta.motivo).toContain('rechazó');
  });

  it('TARJETA_RECHAZADA coincide con el número documentado', () => {
    expect(TARJETA_RECHAZADA).toBe('4000000000000002');
  });

  it('cualquier otra tarjeta es aprobada', () => {
    expect(simularPago({ metodoPago: 'tarjeta', numTarjeta: '4532015112830366' }).aprobado).toBe(true);
  });

  it('la tarjeta de rechazo solo falla si el método es tarjeta', () => {
    expect(simularPago({ metodoPago: 'transferencia', numTarjeta: TARJETA_RECHAZADA }).aprobado).toBe(true);
  });
});

describe('Servicios de datos (db.js)', () => {
  it('crearSlug quita tildes, símbolos y espacios', () => {
    expect(crearSlug('Torta de Chocolate Ñandú!')).toBe('torta-de-chocolate-nandu');
  });

  it('crearSlug de un texto vacío devuelve string vacío', () => {
    expect(crearSlug('')).toBe('');
  });

  it('descuentoPorcentaje calcula el 20% de rebaja', () => {
    expect(descuentoPorcentaje({ precio: 80, precioAnterior: 100 })).toBe(20);
  });

  it('descuentoPorcentaje es 0 sin precio anterior', () => {
    expect(descuentoPorcentaje({ precio: 80 })).toBe(0);
  });

  it('descuentoPorcentaje es 0 si el precio subió (no hay descuento negativo)', () => {
    expect(descuentoPorcentaje({ precio: 120, precioAnterior: 100 })).toBe(0);
  });

  it('obtenerProducto con un código que no existe devuelve null', () => {
    expect(obtenerProducto('NO-EXISTE')).toBeNull();
  });
});
