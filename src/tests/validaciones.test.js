import { describe, it, expect } from 'vitest';
import {
  validarEmail, validarTelefono, validarNombrePersona, validarMensaje, validarRUN, validarPassword,
  validarTarjetaLuhn, validarLogin, validarRegistro, validarContacto, validarCheckout, evaluarReglasPassword, validarOpcion
} from '../utils/validaciones';

describe('validarEmail', () => {
  it('acepta un correo válido', () => expect(validarEmail('ana@correo.cl').valido).toBe(true));
  it('rechaza correo sin extensión de dominio (a@b)', () => expect(validarEmail('a@b').valido).toBe(false));
  it('rechaza correo vacío con mensaje', () => expect(validarEmail('').mensaje).toContain('requerido'));
  it('rechaza más de 100 caracteres', () => expect(validarEmail('a'.repeat(96) + '@x.cl').valido).toBe(false));
});

describe('validarTelefono (corrección: antes aceptaba letras)', () => {
  it('acepta móvil con +56', () => expect(validarTelefono('+56 9 1234 5678').valido).toBe(true));
  it('acepta móvil sin prefijo', () => expect(validarTelefono('912345678').valido).toBe(true));
  it('rechaza texto de 8 o más letras', () => expect(validarTelefono('abcdefghij').valido).toBe(false));
  it('rechaza números demasiado cortos', () => expect(validarTelefono('1234').valido).toBe(false));
});

describe('validarNombrePersona', () => {
  it('acepta nombres con tilde y ñ', () => expect(validarNombrePersona('María Ñuñez').valido).toBe(true));
  it('rechaza números', () => expect(validarNombrePersona('Juan 123').valido).toBe(false));
  it('rechaza nombres muy cortos', () => expect(validarNombrePersona('Al').valido).toBe(false));
});

describe('validarMensaje / validarOpcion', () => {
  it('exige largo mínimo', () => expect(validarMensaje('hola').valido).toBe(false));
  it('acepta mensaje correcto', () => expect(validarMensaje('Quisiera cotizar una torta').valido).toBe(true));
  it('rechaza opción fuera de la lista', () => expect(validarOpcion('x', ['a', 'b']).valido).toBe(false));
});

describe('validarRUN, validarPassword y Luhn', () => {
  it('RUN con dígito verificador correcto', () => expect(validarRUN('123456785').valido).toBe(true));
  it('RUN con puntos y guión es inválido', () => expect(validarRUN('19.011.022-K').valido).toBe(false));
  it('contraseña con letra, número y símbolo', () => expect(validarPassword('ab1@').valido).toBe(true));
  it('tarjeta válida según Luhn', () => expect(validarTarjetaLuhn('4532 0151 1283 0366').valido).toBe(true));
  it('acepta tarjetas válidas de 19 dígitos', () => expect(validarTarjetaLuhn('4532015112830366005').valido).toBe(true));
  it('tarjeta inválida según Luhn', () => expect(validarTarjetaLuhn('1234567890123456').valido).toBe(false));
  it('reglas de contraseña de registro', () => {
    expect(evaluarReglasPassword('Abcdef1!')).toEqual({ length: true, uppercase: true, number: true, special: true });
    expect(evaluarReglasPassword('abc').length).toBe(false);
  });
});

describe('validarLogin (corrección del login)', () => {
  it('acepta admin / admin', () => expect(validarLogin({ usuario: 'admin', password: 'admin' })).toEqual({}));
  it('acepta correo + contraseña', () => expect(validarLogin({ usuario: 'a@b.cl', password: 'Admin@2026' })).toEqual({}));
  it('pide usuario y contraseña cuando están vacíos', () => {
    const e = validarLogin({ usuario: '', password: '' });
    expect(e.usuario).toBeDefined();
    expect(e.password).toBeDefined();
  });
  it('rechaza correo mal formado', () => expect(validarLogin({ usuario: 'ana@', password: 'abcd' }).usuario).toBeDefined());
  it('rechaza espacios en el usuario', () => expect(validarLogin({ usuario: 'ad min', password: 'abcd' }).usuario).toContain('espacios'));
  it('rechaza contraseña de menos de 4 caracteres', () => expect(validarLogin({ usuario: 'admin', password: 'abc' }).password).toBeDefined());
});

describe('validarRegistro', () => {
  const valido = { nombre: 'Ana Pérez', correo: 'ana@correo.cl', password: 'Clave@123', confirmar: 'Clave@123', region: 'R', comuna: 'C' };
  it('sin errores con datos correctos', () => expect(validarRegistro(valido)).toEqual({}));
  it('detecta contraseñas distintas', () => expect(validarRegistro({ ...valido, confirmar: 'otra' }).confirmar).toContain('no coinciden'));
  it('detecta contraseña débil', () => expect(validarRegistro({ ...valido, password: 'abc', confirmar: 'abc' }).password).toBeDefined());
  it('exige región y comuna', () => {
    const e = validarRegistro({ ...valido, region: '', comuna: '' });
    expect(e.region).toBeDefined();
    expect(e.comuna).toBeDefined();
  });
});

describe('validarContacto (corrección del formulario de contacto)', () => {
  const valido = { nombre: 'Ana Pérez', correo: 'ana@correo.cl', telefono: '', asunto: 'Comentario', mensaje: 'Hola, quiero hacer una consulta.' };
  it('el teléfono es opcional', () => expect(validarContacto(valido)).toEqual({}));
  it('valida el teléfono si se escribe', () => expect(validarContacto({ ...valido, telefono: 'abc' }).telefono).toBeDefined());
  it('rechaza nombre con números', () => expect(validarContacto({ ...valido, nombre: 'Ana 99' }).nombre).toBeDefined());
  it('rechaza mensaje corto', () => expect(validarContacto({ ...valido, mensaje: 'hola' }).mensaje).toBeDefined());
  it('rechaza asunto inválido', () => expect(validarContacto({ ...valido, asunto: 'xx' }).asunto).toBeDefined());
});

describe('validarCheckout', () => {
  const base = { nombre: 'Ana Pérez', run: '123456785', correo: 'ana@correo.cl', telefono: '912345678', metodoEntrega: 'retiro', metodoPago: 'efectivo' };
  it('retiro + efectivo no pide dirección ni tarjeta', () => expect(validarCheckout(base)).toEqual({}));
  it('despacho exige dirección', () => expect(validarCheckout({ ...base, metodoEntrega: 'despacho', region: 'R', comuna: 'C', direccion: '' }).direccion).toBeDefined());
  it('tarjeta exige número, vencimiento y CVV válidos', () => {
    const e = validarCheckout({ ...base, metodoPago: 'tarjeta', numTarjeta: '', vencimiento: '', cvv: '' });
    expect(Object.keys(e)).toEqual(['numTarjeta', 'vencimiento', 'cvv']);
  });
  it('rechaza tarjeta vencida', () => expect(validarCheckout({ ...base, metodoPago: 'tarjeta', numTarjeta: '4532015112830366', vencimiento: '01/20', cvv: '123' }).vencimiento).toContain('vencida'));
  it('acepta tarjeta correcta', () => expect(validarCheckout({ ...base, metodoPago: 'tarjeta', numTarjeta: '4532015112830366', vencimiento: '12/99', cvv: '123' })).toEqual({}));
  it('acepta tarjeta con vencimiento MM/AAAA a tres años', () => expect(validarCheckout({ ...base, metodoPago: 'tarjeta', numTarjeta: '4532015112830366005', vencimiento: '10/2029', cvv: '123' })).toEqual({}));
});
