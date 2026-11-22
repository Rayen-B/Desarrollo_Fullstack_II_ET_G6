import { describe, it, expect, vi } from 'vitest';
import { http, ApiError, API_URL } from '../services/api';
import { obtenerNutricion, calcularNutricion, listarIngredientes, guardarIngrediente } from '../services/nutricion';
import { formatearNutriente, validarNombreIngles, recetaParaApi, describirErrorNutricion, capitalizar } from '../utils/nutricion';

// Respuesta simulada del servidor
const respuesta = (status, cuerpo) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });

describe('Cliente HTTP (api.js)', () => {
  it('llama a la URL base + ruta y devuelve el JSON', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, { hola: 'mundo' }));
    expect(await http('/api/x')).toEqual({ hola: 'mundo' });
    expect(globalThis.fetch.mock.calls[0][0]).toBe(`${API_URL}/api/x`);
  });

  it('un error del servidor lanza ApiError con el mensaje y el status', async () => {
    globalThis.fetch = vi.fn(() => respuesta(404, { status: 404, mensaje: 'No existe' }));
    await expect(http('/api/x')).rejects.toMatchObject({ name: 'ApiError', status: 404, message: 'No existe' });
  });

  it('un error sin cuerpo JSON usa un mensaje genérico con el código', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 502, json: async () => { throw new Error('no json'); } }));
    const error = await http('/api/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).toContain('502');
  });

  it('si no hay conexión lanza ApiError con status 0', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(http('/api/x')).rejects.toMatchObject({ status: 0, message: 'No se pudo conectar con el servidor' });
  });

  it('si se agota el tiempo avisa que el servidor tardó demasiado', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(Object.assign(new Error('abort'), { name: 'AbortError' })));
    await expect(http('/api/x')).rejects.toMatchObject({ status: 0, message: 'El servidor tardó demasiado en responder' });
  });

  it('envía el cuerpo como JSON solo cuando existe', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, {}));
    await http('/api/x', { method: 'POST', body: { a: 1 } });
    const [, opciones] = globalThis.fetch.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(opciones.body).toBe('{"a":1}');
    expect(opciones.headers).toEqual({ 'Content-Type': 'application/json' });
    await http('/api/y');
    expect(globalThis.fetch.mock.calls[1][1].body).toBeUndefined();
  });
});

describe('Servicio de nutrición', () => {
  it('obtenerNutricion pide GET /productos/{codigo}', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, { codigoProducto: 'TC001' }));
    expect(await obtenerNutricion('TC001')).toEqual({ codigoProducto: 'TC001' });
    expect(globalThis.fetch.mock.calls[0][0]).toBe(`${API_URL}/api/v1/nutricion/productos/TC001`);
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('GET');
  });

  it('calcularNutricion hace POST con { items } y forzar=false por defecto', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, {}));
    await calcularNutricion('TC001', [{ insumoId: 'harina', cantidad: 500 }]);
    const [url, opciones] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/v1/nutricion/productos/TC001?forzar=false`);
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ items: [{ insumoId: 'harina', cantidad: 500 }] });
  });

  it('calcularNutricion con forzar=true recalcula', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, {}));
    await calcularNutricion('TC001', [{ insumoId: 'harina', cantidad: 1 }], true);
    expect(globalThis.fetch.mock.calls[0][0]).toContain('?forzar=true');
  });

  it('el código del producto se codifica para la URL', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, {}));
    await obtenerNutricion('A/B');
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/productos/A%2FB');
  });

  it('listarIngredientes y guardarIngrediente usan GET y PUT sobre /ingredientes', async () => {
    globalThis.fetch = vi.fn(() => respuesta(200, []));
    await listarIngredientes();
    expect(globalThis.fetch.mock.calls[0][0]).toBe(`${API_URL}/api/v1/nutricion/ingredientes`);
    await guardarIngrediente('harina', { insumoId: 'harina', nombre: 'Harina', nombreIngles: 'flour', unidad: 'g', alergenos: ['gluten'] });
    const [url, opciones] = globalThis.fetch.mock.calls[1];
    expect(url).toBe(`${API_URL}/api/v1/nutricion/ingredientes/harina`);
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(opciones.body).nombreIngles).toBe('flour');
  });
});

describe('Utilidades de nutrición', () => {
  it('formatearNutriente usa formato chileno y "—" cuando no hay dato', () => {
    expect(formatearNutriente(1234.56)).toBe('1.234,6');
    expect(formatearNutriente(12)).toBe('12');
    expect(formatearNutriente(0)).toBe('0');
    expect(formatearNutriente(null)).toBe('—');
    expect(formatearNutriente(undefined)).toBe('—');
    expect(formatearNutriente('abc')).toBe('—');
  });

  it('capitalizar pone la primera letra en mayúscula', () => {
    expect(capitalizar('frutos secos')).toBe('Frutos secos');
    expect(capitalizar('')).toBe('');
  });

  it('validarNombreIngles es opcional y aplica las reglas del backend', () => {
    expect(validarNombreIngles('')).toEqual({ valido: true, mensaje: '' });
    expect(validarNombreIngles('   ').valido).toBe(true);
    expect(validarNombreIngles('heavy cream').valido).toBe(true);
    expect(validarNombreIngles('Harína').valido).toBe(false);   // tilde
    expect(validarNombreIngles('flour2').valido).toBe(false);   // número
    expect(validarNombreIngles('a').valido).toBe(false);        // muy corto
    expect(validarNombreIngles('x'.repeat(61)).valido).toBe(false);
  });

  it('recetaParaApi descarta filas incompletas y convierte las cantidades a número', () => {
    expect(recetaParaApi([
      { insumoId: 'harina', cantidad: '500' },
      { insumoId: '', cantidad: '10' },
      { insumoId: 'leche', cantidad: '0' },
      { insumoId: 'huevos', cantidad: 3 }
    ])).toEqual([{ insumoId: 'harina', cantidad: 500 }, { insumoId: 'huevos', cantidad: 3 }]);
    expect(recetaParaApi(undefined)).toEqual([]);
  });

  it('describirErrorNutricion explica cada tipo de fallo', () => {
    expect(describirErrorNutricion({ status: 0, message: 'x' })).toContain('backend esté levantado');
    expect(describirErrorNutricion({ status: 503, message: 'Se alcanzó el límite diario de consultas a Spoonacular' })).toBe('Se alcanzó el límite diario de consultas a Spoonacular');
    expect(describirErrorNutricion({ status: 400, message: 'Estos insumos no tienen nombre en inglés registrado: crema-de-leche' })).toContain('Datos nutricionales');
    expect(describirErrorNutricion({ status: 400, message: 'Datos inválidos' })).toBe('Datos inválidos');
    expect(describirErrorNutricion({ status: 401, message: 'Debes iniciar sesión' })).toContain('modo servidor');
    expect(describirErrorNutricion({ status: 403, message: 'No tienes permisos para esta acción' })).toBe('Tu rol no tiene permiso para esta acción.');
    expect(describirErrorNutricion(null)).toBe('Error desconocido');
  });
});
