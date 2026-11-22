import { describe, it, expect, vi, beforeEach } from 'vitest';
import { guardarToken, obtenerToken, borrarToken, leerPayload, tokenVigente, guardarTokens, obtenerRefresh, sesionRecuperable } from '../services/sesion';
import { http, resolverUrlApi, API_URL, EVENTO_SESION_EXPIRADA } from '../services/api';
import { productoParaApi } from '../services/catalogo';
import { guardarEnServidor } from '../services/sincronizacion';
import { sanitizarHtml, descripcionAHtml, textoPlano } from '../utils/descripcion';
import { comprimirImagen } from '../utils/imagen';
import { modoServidor } from '../config';
import { obtenerImagen } from '../assets/images';

const respuesta = (status, cuerpo) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const crearToken = (exp) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '1', rol: 'Administrador', exp })}.firma`;
const ahora = () => Math.floor(Date.now() / 1000);

describe('Modo servidor (interruptor)', () => {
  it('está apagado por defecto y se enciende con VITE_MODO_SERVIDOR=true', () => {
    expect(modoServidor()).toBe(false);
    vi.stubEnv('VITE_MODO_SERVIDOR', 'true');
    expect(modoServidor()).toBe(true);
    vi.stubEnv('VITE_MODO_SERVIDOR', 'TRUE ');
    expect(modoServidor()).toBe(true);
    vi.stubEnv('VITE_MODO_SERVIDOR', 'no');
    expect(modoServidor()).toBe(false);
  });
});

describe('Token de sesión', () => {
  it('se guarda, se lee y se borra', () => {
    expect(obtenerToken()).toBeNull();
    guardarToken('abc');
    expect(obtenerToken()).toBe('abc');
    borrarToken();
    expect(obtenerToken()).toBeNull();
  });

  it('lee el contenido del JWT y sabe si venció', () => {
    expect(leerPayload(crearToken(123)).rol).toBe('Administrador');
    expect(tokenVigente(crearToken(ahora() + 600))).toBe(true);
    expect(tokenVigente(crearToken(ahora() - 5))).toBe(false);
  });

  it('un token roto, vacío o sin vencimiento no es vigente', () => {
    expect(tokenVigente(null)).toBe(false);
    expect(tokenVigente('')).toBe(false);
    expect(tokenVigente('basura')).toBe(false);
    expect(tokenVigente('a.b.c')).toBe(false);
    expect(tokenVigente(`${b64({})}.${b64({ sub: '1' })}.x`)).toBe(false);
    expect(leerPayload('no-es-un-jwt')).toBeNull();
  });
});

describe('Cliente HTTP con JWT', () => {
  beforeEach(() => { globalThis.fetch = vi.fn(() => respuesta(200, {})); });

  it('sin sesión no envía cabecera Authorization', async () => {
    await http('/api/x');
    expect(globalThis.fetch.mock.calls[0][1].headers).toBeUndefined();
  });

  it('con sesión envía el token como Bearer', async () => {
    guardarToken('mi-token');
    await http('/api/x');
    expect(globalThis.fetch.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer mi-token' });
    await http('/api/x', { method: 'POST', body: { a: 1 } });
    expect(globalThis.fetch.mock.calls[1][1].headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer mi-token' });
  });

  it('un archivo (FormData) se envía tal cual, sin Content-Type propio', async () => {
    const datos = new FormData();
    datos.append('archivo', new File(['x'], 'a.jpg'));
    await http('/api/x', { method: 'POST', body: datos });
    const [, opciones] = globalThis.fetch.mock.calls[0];
    expect(opciones.body).toBe(datos);
    expect(opciones.headers).toBeUndefined(); // el navegador agrega el "boundary" del multipart
  });

  it('un 401 con sesión borra el token y avisa a la aplicación', async () => {
    guardarToken('vencido');
    const oyente = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente);
    globalThis.fetch = vi.fn(() => respuesta(401, { mensaje: 'Sesión inválida o expirada' }));
    await expect(http('/api/x')).rejects.toMatchObject({ status: 401 });
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente);
    expect(obtenerToken()).toBeNull();
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it('un 401 sin sesión (login fallido) no dispara el cierre de sesión', async () => {
    const oyente = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente);
    globalThis.fetch = vi.fn(() => respuesta(401, { mensaje: 'Usuario o contraseña incorrectos.' }));
    await expect(http('/api/x')).rejects.toMatchObject({ message: 'Usuario o contraseña incorrectos.' });
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente);
    expect(oyente).not.toHaveBeenCalled();
  });

  it('un 403 (sin permisos) no cierra la sesión', async () => {
    guardarToken('valido');
    globalThis.fetch = vi.fn(() => respuesta(403, { mensaje: 'No tienes permisos para esta acción' }));
    await expect(http('/api/x')).rejects.toMatchObject({ status: 403 });
    expect(obtenerToken()).toBe('valido');
  });

  it('resolverUrlApi completa solo las rutas del propio API', () => {
    expect(resolverUrlApi('/api/v1/media/a.webp')).toBe(`${API_URL}/api/v1/media/a.webp`);
    expect(resolverUrlApi('https://bucket.s3.amazonaws.com/a.webp')).toBe('https://bucket.s3.amazonaws.com/a.webp');
    expect(resolverUrlApi('menu/Torta_Trufa')).toBe('menu/Torta_Trufa');
  });

  it('obtenerImagen entiende las imágenes subidas al servidor', () => {
    expect(obtenerImagen('/api/v1/media/abc.webp')).toBe(`${API_URL}/api/v1/media/abc.webp`);
    expect(obtenerImagen('https://cdn.test/x.webp')).toBe('https://cdn.test/x.webp');
  });
});

describe('Descripción segura (Tiptap + DOMPurify)', () => {
  it('conserva el formato permitido', () => {
    const html = '<p>Hola <strong>mundo</strong> <em>dulce</em></p><ul><li>uno</li></ul><h3>Título</h3><blockquote>cita</blockquote>';
    expect(sanitizarHtml(html)).toBe(html);
  });

  it('elimina scripts, manejadores de eventos, iframes, imágenes y enlaces peligrosos', () => {
    const malo = '<p onclick="x()">a</p><script>window.__xss=1</script><img src=x onerror="window.__xss=2">'
      + '<iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">enlace</a><style>p{}</style>'
      + '<svg onload="window.__xss=3"></svg><form action="https://evil.test"><input></form>';
    const limpio = sanitizarHtml(malo);
    expect(limpio).not.toMatch(/<script|<img|<iframe|<a |<style|<svg|<form|<input|onclick|onerror|onload|javascript:/i);
    expect(limpio).toContain('<p>a</p>');
    expect(globalThis.__xss).toBeUndefined();
  });

  it('el texto plano antiguo se convierte en párrafo y se escapa', () => {
    expect(descripcionAHtml('Torta de chocolate')).toBe('<p>Torta de chocolate</p>');
    expect(descripcionAHtml('línea 1\nlínea 2')).toBe('<p>línea 1<br>línea 2</p>');
    expect(descripcionAHtml('5 < 7 & "ok"')).toBe('<p>5 &lt; 7 &amp; &quot;ok&quot;</p>');
    expect(descripcionAHtml('')).toBe('');
    expect(descripcionAHtml(null)).toBe('');
  });

  it('textoPlano quita el formato y separa párrafos y listas', () => {
    expect(textoPlano('<p>Hola <strong>mundo</strong></p><p>Segundo</p>')).toBe('Hola mundo Segundo');
    expect(textoPlano('<ul><li>uno</li><li>dos</li></ul>')).toBe('uno dos');
    expect(textoPlano('Texto  normal\n con espacios')).toBe('Texto normal con espacios');
    expect(textoPlano('<p>a</p><script>alert(1)</script>')).toBe('a');
    expect(textoPlano(undefined)).toBe('');
  });
});

describe('Catálogo del servidor', () => {
  it('productoParaApi limpia y convierte el producto del panel', () => {
    const api = productoParaApi({
      codigo: ' tc001 ', nombre: 'Torta', categoria: 'Tortas', precio: '16900.4', precioAnterior: 0, stock: '5', stockCritico: undefined,
      imagen: 'data:image/png;base64,AAA', descripcion: '<p>x</p>',
      receta: [{ insumoId: 'harina', cantidad: '500' }, { insumoId: '', cantidad: 1 }, { insumoId: 'leche', cantidad: 0 }]
    });
    expect(api).toEqual({
      codigo: 'TC001', nombre: 'Torta', categoria: 'Tortas', precio: 16900, precioAnterior: null, stock: 5, stockCritico: 0,
      imagen: null, descripcion: '<p>x</p>', receta: [{ insumoId: 'harina', cantidad: 500 }]
    });
  });

  it('productoParaApi conserva claves de imagen y URLs', () => {
    expect(productoParaApi({ codigo: 'A1', imagen: 'menu/Torta_Trufa' }).imagen).toBe('menu/Torta_Trufa');
    expect(productoParaApi({ codigo: 'A1', imagen: '/api/v1/media/x.webp' }).imagen).toBe('/api/v1/media/x.webp');
    expect(productoParaApi({ codigo: 'A1', precioAnterior: 20000 }).precioAnterior).toBe(20000);
  });

});

describe('Guardar en el servidor (se espera su respuesta)', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})); // la recarga del catálogo no se espera en estas pruebas
  });

  it('si el servidor acepta, devuelve sus datos', async () => {
    const resultado = await guardarEnServidor(() => Promise.resolve({ codigo: 'TC001' }), { recargarCatalogo: false });
    expect(resultado).toEqual({ exito: true, datos: { codigo: 'TC001' } });
  });

  it('si el servidor rechaza, devuelve su mensaje y no lanza el error', async () => {
    const error = Object.assign(new Error('Ya existe un producto con el código TC001.'), { status: 409 });
    const resultado = await guardarEnServidor(() => Promise.reject(error), { recargarCatalogo: false });
    expect(resultado).toEqual({ exito: false, mensaje: 'Ya existe un producto con el código TC001.' });
  });

  it('sin conexión avisa con un mensaje claro', async () => {
    const error = Object.assign(new Error('x'), { status: 0 });
    const resultado = await guardarEnServidor(() => Promise.reject(error), { recargarCatalogo: false });
    expect(resultado.mensaje).toContain('No se pudo conectar con el servidor');
  });
});

describe('Sesión recuperable al recargar', () => {
  it('sigue viva con el JWT vigente o con un refreshToken', () => {
    expect(sesionRecuperable()).toBe(false);
    guardarTokens({ accessToken: 'vencido', refreshToken: 'r1' });
    expect(sesionRecuperable()).toBe(true);
    borrarToken();
    expect(obtenerRefresh()).toBeNull();
    expect(sesionRecuperable()).toBe(false);
  });
});

describe('Compresión de imágenes antes de subir', () => {
  it('si el navegador no puede comprimir, devuelve el archivo original', async () => {
    const archivo = new File(['x'.repeat(100)], 'foto.jpg', { type: 'image/jpeg' });
    expect(await comprimirImagen(archivo)).toBe(archivo); // jsdom no tiene createImageBitmap
  });

  it('los GIF y los archivos que no son imagen se dejan intactos', async () => {
    const gif = new File(['x'], 'a.gif', { type: 'image/gif' });
    const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    expect(await comprimirImagen(gif)).toBe(gif);
    expect(await comprimirImagen(pdf)).toBe(pdf);
    expect(await comprimirImagen(null)).toBeNull();
  });
});
