import { describe, it, expect } from 'vitest';
import {
  validarRUN, validarEmail, validarPassword, validarCodigoProducto,
  validarPrecio, validarStock, validarTarjetaLuhn, validarTexto
} from '../utils/validaciones';

describe('validarRUN()', () => {
  it('acepta un RUN con dígito verificador correcto', () => {
    expect(validarRUN('190110222').valido).toBe(true);
  });

  it('acepta el dígito verificador K en mayúscula o minúscula', () => {
    expect(validarRUN('12345670K').valido).toBe(true);
    expect(validarRUN('12345670k').valido).toBe(true);
  });

  it('acepta RUT de empresa (50 a 99 millones)', () => {
    expect(validarRUN('765432103').valido).toBe(true);
    expect(validarRUN('500000007').valido).toBe(true);
    expect(validarRUN('999999999').valido).toBe(true);
  });

  it('acepta RUN antiguos de menos de 7 dígitos', () => {
    expect(validarRUN('10000009').valido).toBe(true);
    expect(validarRUN('999999K').valido).toBe(true);
  });

  it('rechaza RUT de 100 millones o más (más de 9 caracteres)', () => {
    expect(validarRUN('1000000007').valido).toBe(false);
  });

  it('rechaza un RUN con dígito verificador incorrecto', () => {
    const resultado = validarRUN('190110221');
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toMatch(/dígito verificador/);
  });

  it('rechaza el RUN con puntos o guión', () => {
    expect(validarRUN('19.011.022-2').valido).toBe(false);
  });

  it('rechaza un RUN vacío, muy corto o con letras en el cuerpo', () => {
    expect(validarRUN('').mensaje).toBe('El RUN es requerido');
    expect(validarRUN(null).valido).toBe(false);
    expect(validarRUN('12345').valido).toBe(false);
    expect(validarRUN('19A110222').valido).toBe(false);
  });
});

describe('validarEmail()', () => {
  it('acepta un correo con formato válido', () => {
    expect(validarEmail('alan.brito@duoc.cl').valido).toBe(true);
  });

  it('rechaza correos sin @, vacíos o demasiado largos', () => {
    expect(validarEmail('alan.duoc.cl').valido).toBe(false);
    expect(validarEmail('').valido).toBe(false);
    expect(validarEmail('a'.repeat(96) + '@x.cl').valido).toBe(false);
  });
});

describe('validarPassword()', () => {
  it('acepta una contraseña de 4 a 10 caracteres con letra, número y símbolo', () => {
    expect(validarPassword('Admin@2026').valido).toBe(true);
  });

  it('rechaza contraseñas sin símbolo o fuera del largo permitido', () => {
    expect(validarPassword('Admin2026').valido).toBe(false);
    expect(validarPassword('A@1').valido).toBe(false);
    expect(validarPassword('Admin@20261').valido).toBe(false);
    expect(validarPassword(undefined).mensaje).toBe('La contraseña es requerida');
  });
});

describe('validaciones del producto', () => {
  it('el código necesita al menos 3 caracteres', () => {
    expect(validarCodigoProducto('TC001').valido).toBe(true);
    expect(validarCodigoProducto('TC').valido).toBe(false);
    expect(validarCodigoProducto('   ').valido).toBe(false);
  });

  it('el precio no puede faltar ni ser negativo', () => {
    expect(validarPrecio('16900').valido).toBe(true);
    expect(validarPrecio(0).mensaje).toBe('Producto gratuito');
    expect(validarPrecio(-1).valido).toBe(false);
    expect(validarPrecio('abc').valido).toBe(false);
    expect(validarPrecio('').valido).toBe(false);
  });

  it('el stock debe ser un entero mayor o igual a 0', () => {
    expect(validarStock('12').valido).toBe(true);
    expect(validarStock(0).valido).toBe(true);
    expect(validarStock('2.5').mensaje).toBe('Debe ser un número entero');
    expect(validarStock(-3).valido).toBe(false);
    expect(validarStock(null).valido).toBe(false);
  });
});

describe('validarTarjetaLuhn()', () => {
  it('acepta un número de tarjeta que cumple Luhn, aunque tenga espacios', () => {
    expect(validarTarjetaLuhn('4242 4242 4242 4242').valido).toBe(true);
  });

  it('rechaza números que no cumplen Luhn o con largo inválido', () => {
    expect(validarTarjetaLuhn('4242424242424241').valido).toBe(false);
    expect(validarTarjetaLuhn('1234').valido).toBe(false);
    expect(validarTarjetaLuhn('').valido).toBe(false);
  });
});

describe('validarTexto()', () => {
  it('usa el nombre del campo y el mínimo en el mensaje', () => {
    expect(validarTexto('Ana', 'El nombre', 3).valido).toBe(true);
    expect(validarTexto('An', 'El nombre', 3).mensaje).toBe('El nombre debe tener al menos 3 caracteres');
    expect(validarTexto('  ', 'El nombre').mensaje).toBe('El nombre es requerido');
  });
});
