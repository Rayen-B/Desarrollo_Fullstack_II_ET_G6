import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { renderizar, clic, escribir, enviarFormulario, porId, textoDe, formulario } from './utils';
import { Rutas } from '../App';
import { obtenerProductos, guardarProductos } from '../services/storage';
import { http } from '../services/api';
import EditorDescripcion from '../components/molecules/EditorDescripcion';

// ---------- Ayudas ----------
const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const crearToken = (segundos = 3600) => `${b64({ alg: 'HS256' })}.${b64({ sub: '1', rol: 'Administrador', exp: Math.floor(Date.now() / 1000) + segundos })}.firma`;

const ADMIN = { id: 1, run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita Dulce', correo: 'admin@papitadulce.cl', rol: 'Administrador', region: 'Región Metropolitana de Santiago', comuna: 'Santiago', direccion: 'Av. 1' };
const comoAdminConToken = (segundos) => {
  localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));
  localStorage.setItem('papita_token', crearToken(segundos));
};

const respuesta = (status, cuerpo) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
// Enruta el fetch simulado por "MÉTODO /ruta"; lo no configurado "no responde"
const servidor = (rutas) => {
  globalThis.fetch = vi.fn((url, opciones = {}) => {
    const clave = `${opciones.method || 'GET'} ${String(url).replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')}`;
    return rutas[clave] ? rutas[clave](url, opciones) : new Promise(() => {});
  });
};
const esperar = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const esperarEditor = async (c) => {
  for (let i = 0; i < 80 && !c.querySelector('.ProseMirror'); i++) await esperar(25);
  expect(c.querySelector('.ProseMirror')).not.toBeNull();
};
const llamadas = (metodo) => globalThis.fetch.mock.calls.filter(([, o]) => (o && o.method) === metodo);

beforeEach(() => { vi.stubEnv('VITE_MODO_SERVIDOR', 'true'); });

// ---------- Login con JWT ----------
describe('Login con JWT (modo servidor)', () => {
  const completar = (c, usuario, password) => {
    escribir(porId(c, 'loginUsuario'), usuario);
    escribir(porId(c, 'loginPassword'), password);
    enviarFormulario(formulario(c));
  };
  const USUARIO_SERVIDOR = { id: 9, run: null, usuario: null, nombre: 'Persona', apellidos: '', correo: 'persona@correo.cl', rol: 'Cliente' };

  it('el servidor valida la contraseña, entrega el JWT y la sesión no guarda la contraseña', async () => {
    const token = crearToken();
    servidor({ 'POST /api/v1/auth/login': () => respuesta(200, { accessToken: token, refreshToken: 'refresh-1', tipo: 'Bearer', expiraEn: 900, usuario: USUARIO_SERVIDOR }) });
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completar(c, 'persona@correo.cl', 'Secreta#1');
    await esperar();

    const [url, opciones] = llamadas('POST')[0];
    expect(url).toContain('/api/v1/auth/login');
    expect(JSON.parse(opciones.body)).toEqual({ identificador: 'persona@correo.cl', password: 'Secreta#1' });
    expect(localStorage.getItem('papita_token')).toBe(token);
    expect(localStorage.getItem('papita_refresh')).toBe('refresh-1');
    const sesion = localStorage.getItem('tienda_usuario_sesion');
    expect(JSON.parse(sesion).correo).toBe('persona@correo.cl');
    expect(sesion).not.toContain('Secreta#1');
    expect(sesion).not.toContain('password');
  });

  it('contraseña incorrecta: muestra el mensaje del servidor y no deja sesión ni token', async () => {
    servidor({ 'POST /api/v1/auth/login': () => respuesta(401, { status: 401, mensaje: 'Usuario o contraseña incorrectos.' }) });
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completar(c, 'persona@correo.cl', 'Equivocada#1');
    await esperar();
    expect(textoDe(c)).toContain('Usuario o contraseña incorrectos.');
    expect(localStorage.getItem('papita_token')).toBeNull();
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });

  it('NO hay entrada de respaldo: admin/admin local no sirve si el servidor lo rechaza', async () => {
    servidor({ 'POST /api/v1/auth/login': () => respuesta(401, { status: 401, mensaje: 'Usuario o contraseña incorrectos.' }) });
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completar(c, 'admin', 'admin'); // existe en la lista local de demostración
    await esperar();
    expect(textoDe(c)).toContain('Usuario o contraseña incorrectos.');
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });

  it('demasiados intentos (429) muestra el aviso del servidor', async () => {
    servidor({ 'POST /api/v1/auth/login': () => respuesta(429, { status: 429, mensaje: 'Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.' }) });
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completar(c, 'persona@correo.cl', 'x1234');
    await esperar();
    expect(textoDe(c)).toContain('Demasiados intentos fallidos');
  });

  it('con el servidor caído avisa que no hay conexión', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completar(c, 'persona@correo.cl', 'Secreta#1');
    await esperar();
    expect(textoDe(c)).toContain('No se pudo conectar con el servidor');
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });

  it('cerrar sesión borra los tokens y anula el refreshToken en el servidor', async () => {
    comoAdminConToken();
    localStorage.setItem('papita_refresh', 'refresh-guardado');
    servidor({ 'POST /api/v1/auth/logout': () => respuesta(204, null) });
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(localStorage.getItem('papita_token')).not.toBeNull();
    const salir = [...c.querySelectorAll('a,button')].find((el) => /cerrar sesi[oó]n/i.test(el.textContent));
    expect(salir).toBeTruthy();
    clic(salir);
    expect(localStorage.getItem('papita_token')).toBeNull();
    expect(localStorage.getItem('papita_refresh')).toBeNull();
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
    const [url, opciones] = llamadas('POST').find(([u]) => String(u).includes('/auth/logout'));
    expect(url).toContain('/api/v1/auth/logout');
    expect(JSON.parse(opciones.body)).toEqual({ refreshToken: 'refresh-guardado' });
  });

  it('al recargar con el JWT vencido pero con refreshToken, la sesión sigue', () => {
    comoAdminConToken(-60);
    localStorage.setItem('papita_refresh', 'refresh-guardado');
    servidor({});
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(textoDe(c)).not.toContain('Iniciar sesión');
    expect(localStorage.getItem('tienda_usuario_sesion')).not.toBeNull();
  });
});

describe('Registro (modo servidor)', () => {
  const completar = (c) => {
    escribir(porId(c, 'regNombre'), 'Nuevo Cliente');
    escribir(porId(c, 'regCorreo'), 'nuevo@correo.cl');
    escribir(porId(c, 'regPassword'), 'Clave@1234');
    escribir(porId(c, 'regConfirmar'), 'Clave@1234');
    escribir(porId(c, 'regRegion'), 'Valparaíso');
    escribir(porId(c, 'regComuna'), 'Viña del Mar');
    enviarFormulario(formulario(c));
  };

  it('crea la cuenta en el servidor y no la guarda en el navegador', async () => {
    servidor({ 'POST /api/v1/auth/registro': (u, o) => respuesta(201, { id: 5, ...JSON.parse(o.body), rol: 'Cliente' }) });
    const c = renderizar(<Rutas />, { ruta: '/registro' });
    completar(c);
    await esperar();
    expect(textoDe(c)).toContain('Cuenta creada correctamente');
    const cuerpo = JSON.parse(llamadas('POST')[0][1].body);
    expect(cuerpo).toMatchObject({ nombre: 'Nuevo Cliente', correo: 'nuevo@correo.cl', password: 'Clave@1234', region: 'Valparaíso', comuna: 'Viña del Mar' });
    expect(cuerpo.rol).toBeUndefined(); // el rol Cliente lo fija el servidor, el cliente no puede pedir otro
    expect(localStorage.getItem('tienda_usuarios_db') || '').not.toContain('nuevo@correo.cl');
  });

  it('muestra el error si el correo ya existe', async () => {
    servidor({ 'POST /api/v1/auth/registro': () => respuesta(409, { status: 409, mensaje: 'Ya existe una cuenta con ese correo.' }) });
    const c = renderizar(<Rutas />, { ruta: '/registro' });
    completar(c);
    await esperar();
    expect(textoDe(c)).toContain('Ya existe una cuenta con ese correo.');
  });
});

// ---------- Sesión y expiración ----------
describe('Expiración de la sesión', () => {
  it('con un token vencido al abrir la app, la sesión se cierra y se pide iniciar sesión', () => {
    comoAdminConToken(-60);
    servidor({});
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(porId(c, 'loginUsuario')).not.toBeNull();
    expect(localStorage.getItem('papita_token')).toBeNull();
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });

  it('con un token vigente la sesión se mantiene', () => {
    comoAdminConToken(3600);
    servidor({});
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(porId(c, 'loginUsuario')).toBeNull();
  });

  it('si el servidor responde 401 a una llamada con token, se cierra la sesión', async () => {
    comoAdminConToken(3600);
    servidor({ 'GET /api/v1/algo': () => respuesta(401, { status: 401, mensaje: 'Sesión inválida o expirada' }) });
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    await act(async () => { await http('/api/v1/algo').catch(() => {}); });
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
    expect(localStorage.getItem('papita_token')).toBeNull();
    expect(porId(c, 'loginUsuario')).not.toBeNull();
  });

  it('si el JWT venció, lo renueva con el refreshToken y repite la llamada', async () => {
    comoAdminConToken(3600);
    localStorage.setItem('papita_refresh', 'refresh-viejo');
    const nuevo = crearToken(900);
    servidor({
      'GET /api/v1/algo': (url, o) => (o.headers.Authorization === `Bearer ${nuevo}` ? respuesta(200, { ok: true }) : respuesta(401, { mensaje: 'El token expiró' })),
      'POST /api/v1/auth/refresh': () => respuesta(200, { accessToken: nuevo, refreshToken: 'refresh-nuevo', usuario: ADMIN })
    });
    let resultado;
    await act(async () => { resultado = await http('/api/v1/algo'); });
    expect(resultado).toEqual({ ok: true });
    expect(localStorage.getItem('papita_token')).toBe(nuevo);
    expect(localStorage.getItem('papita_refresh')).toBe('refresh-nuevo');
  });

  it('dos llamadas que vencen al mismo tiempo usan una sola renovación', async () => {
    comoAdminConToken(3600);
    localStorage.setItem('papita_refresh', 'refresh-viejo');
    const nuevo = crearToken(900);
    servidor({
      'GET /api/v1/algo': (url, o) => (o.headers.Authorization === `Bearer ${nuevo}` ? respuesta(200, { ok: true }) : respuesta(401, {})),
      'POST /api/v1/auth/refresh': () => respuesta(200, { accessToken: nuevo, refreshToken: 'refresh-nuevo' })
    });
    await act(async () => { await Promise.all([http('/api/v1/algo'), http('/api/v1/algo')]); });
    expect(llamadas('POST').filter(([u]) => String(u).includes('/auth/refresh'))).toHaveLength(1);
  });

  it('si el refreshToken ya no sirve, se cierra la sesión', async () => {
    comoAdminConToken(3600);
    localStorage.setItem('papita_refresh', 'refresh-usado');
    servidor({
      'GET /api/v1/algo': () => respuesta(401, {}),
      'POST /api/v1/auth/refresh': () => respuesta(401, { mensaje: 'La sesión expiró, inicia sesión de nuevo.' })
    });
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    await act(async () => { await http('/api/v1/algo').catch(() => {}); });
    expect(localStorage.getItem('papita_refresh')).toBeNull();
    expect(porId(c, 'loginUsuario')).not.toBeNull();
  });
});

// ---------- Usuarios del panel ----------
describe('Panel de usuarios (modo servidor)', () => {
  const LISTA = [
    { ...ADMIN },
    { id: 2, run: '184561239', usuario: null, nombre: 'Vendedora', apellidos: 'Del Servidor', correo: 'vende@correo.cl', rol: 'Vendedor', fechaNacimiento: '', region: 'Región Metropolitana de Santiago', comuna: 'Providencia', direccion: 'Av. Providencia 456' }
  ];

  it('el administrador ve la lista real del servidor, no la de demostración', async () => {
    comoAdminConToken();
    servidor({ 'GET /api/v1/usuarios': () => respuesta(200, LISTA) });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuarios' });
    await esperar();
    const texto = textoDe(c);
    expect(texto).toContain('Del Servidor');
    expect(texto).not.toContain('Armando');
    expect(localStorage.getItem('tienda_usuarios_db')).not.toContain('Armando');
  });

  it('al crear un usuario lo envía al servidor y no guarda su contraseña en el navegador', async () => {
    comoAdminConToken();
    let lista = LISTA;
    servidor({
      'GET /api/v1/usuarios': () => respuesta(200, lista),
      'POST /api/v1/usuarios': (u, o) => {
        const { password, ...creado } = { id: 3, ...JSON.parse(o.body) };
        lista = [...LISTA, creado];
        return respuesta(201, creado);
      }
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form' });
    await esperar();
    escribir(porId(c, 'run'), '123456785');
    escribir(porId(c, 'nombre'), 'Nuevo');
    escribir(porId(c, 'apellidos'), 'Usuario Prueba');
    escribir(porId(c, 'correo'), 'nuevo.usuario@correo.cl');
    escribir(porId(c, 'password'), 'Ab1@');
    escribir(porId(c, 'select-region'), 'Región Metropolitana de Santiago');
    escribir(porId(c, 'select-comuna'), 'Santiago');
    escribir(porId(c, 'direccion'), 'Calle 123');
    enviarFormulario(porId(c, 'form-usuario'));
    await esperar();

    const [, opciones] = llamadas('POST').find(([u]) => String(u).endsWith('/api/v1/usuarios'));
    expect(JSON.parse(opciones.body)).toMatchObject({ run: '123456785', correo: 'nuevo.usuario@correo.cl', password: 'Ab1@', rol: 'Cliente' });
    expect(opciones.headers.Authorization).toMatch(/^Bearer /);
    const local = JSON.parse(localStorage.getItem('tienda_usuarios_db')).find((u) => u.run === '123456785');
    expect(local).toBeTruthy();
    expect(local.password).toBeUndefined();
  });

  it('al editar se puede dejar la contraseña vacía y el servidor recibe la actualización por id', async () => {
    comoAdminConToken();
    servidor({
      'GET /api/v1/usuarios': () => respuesta(200, LISTA),
      'PUT /api/v1/usuarios/2': (u, o) => respuesta(200, JSON.parse(o.body))
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form?id=2' });
    await esperar();
    escribir(porId(c, 'nombre'), 'Vendedora Renombrada');
    enviarFormulario(porId(c, 'form-usuario'));
    await esperar();
    expect(llamadas('PUT')).toHaveLength(1); // el formulario se validó y se envió
    const [url, opciones] = llamadas('PUT')[0];
    expect(url).toContain('/api/v1/usuarios/2');
    expect(JSON.parse(opciones.body)).toMatchObject({ nombre: 'Vendedora Renombrada', password: '' });
  });

  it('un usuario nuevo con el correo de OTRA persona se envía como alta (no pisa la cuenta ajena)', async () => {
    comoAdminConToken();
    servidor({
      'GET /api/v1/usuarios': () => respuesta(200, LISTA),
      'POST /api/v1/usuarios': (u, o) => respuesta(201, JSON.parse(o.body)),
      'PUT /api/v1/usuarios/2': (u, o) => respuesta(200, JSON.parse(o.body))
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form' });
    await esperar();
    escribir(porId(c, 'run'), '123456785');
    escribir(porId(c, 'nombre'), 'Intruso');
    escribir(porId(c, 'apellidos'), 'Usuario Prueba');
    escribir(porId(c, 'correo'), 'vende@correo.cl'); // el correo de la Vendedora (id 2)
    escribir(porId(c, 'password'), 'Ab1@');
    escribir(porId(c, 'select-region'), 'Región Metropolitana de Santiago');
    escribir(porId(c, 'select-comuna'), 'Santiago');
    escribir(porId(c, 'direccion'), 'Calle 123');
    enviarFormulario(porId(c, 'form-usuario'));
    await esperar();
    expect(llamadas('PUT')).toHaveLength(0);
    expect(llamadas('POST')).toHaveLength(1);
    expect(JSON.parse(llamadas('POST')[0][1].body).run).toBe('123456785');
  });

  it('si el servidor rechaza el cambio, muestra su mensaje y no cambia nada en el navegador', async () => {
    comoAdminConToken();
    servidor({
      'GET /api/v1/usuarios': () => respuesta(200, LISTA),
      'POST /api/v1/usuarios': () => respuesta(409, { status: 409, mensaje: 'Ya existe una cuenta con ese correo.' })
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form' });
    await esperar();
    escribir(porId(c, 'run'), '123456785');
    escribir(porId(c, 'nombre'), 'Nuevo');
    escribir(porId(c, 'apellidos'), 'Usuario Prueba');
    escribir(porId(c, 'correo'), 'vende@correo.cl');
    escribir(porId(c, 'password'), 'Ab1@');
    escribir(porId(c, 'select-region'), 'Región Metropolitana de Santiago');
    escribir(porId(c, 'select-comuna'), 'Santiago');
    escribir(porId(c, 'direccion'), 'Calle 123');
    enviarFormulario(porId(c, 'form-usuario'));
    await esperar();
    expect(textoDe(c)).toContain('Ya existe una cuenta con ese correo.');
    expect(localStorage.getItem('tienda_usuarios_db')).not.toContain('Nuevo');
  });
});

// ---------- Productos del panel ----------
describe('Panel de productos (modo servidor)', () => {
  // Rutas que usa la recarga del catálogo después de guardar
  const catalogoServidor = (productos) => ({
    'GET /api/v1/productos': () => respuesta(200, productos()),
    'GET /api/v1/categorias': () => respuesta(200, [{ id: 'tortas', nombre: 'Tortas', descripcion: '', imagen: 'menu/x' }]),
    'GET /api/v1/insumos': () => respuesta(200, [{ id: 'harina', nombre: 'Harina', unidad: 'g', stock: 1000, minimo: 100 }])
  });
  const tc001 = () => obtenerProductos().find((p) => p.codigo === 'TC001');

  it('al editar un producto hace PUT con el JWT y después muestra lo que guardó el servidor', async () => {
    comoAdminConToken();
    let enServidor = [];
    servidor({
      ...catalogoServidor(() => enServidor),
      'PUT /api/v1/productos/TC001': (u, o) => {
        const guardado = { ...JSON.parse(o.body), stock: 3, categoria: 'Tortas' };
        enServidor = [guardado];
        return respuesta(200, guardado);
      }
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    escribir(porId(c, 'precio'), '17777');
    enviarFormulario(porId(c, 'form-producto'));
    await esperar();

    const [url, opciones] = llamadas('PUT')[0];
    expect(url).toContain('/api/v1/productos/TC001');
    expect(opciones.headers.Authorization).toMatch(/^Bearer /);
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo).toMatchObject({ codigo: 'TC001', precio: 17777 });
    expect(cuerpo.receta.length).toBeGreaterThan(0);
    expect(tc001()).toMatchObject({ precio: 17777, stock: 3 });
    expect(textoDe(c)).toContain('actualizado correctamente');
  });

  it('un producto nuevo se crea con POST', async () => {
    comoAdminConToken();
    servidor({
      ...catalogoServidor(() => []),
      'POST /api/v1/productos': (u, o) => respuesta(201, JSON.parse(o.body))
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form' });
    await esperarEditor(c);
    escribir(porId(c, 'codigo'), 'zz100');
    escribir(porId(c, 'nombre'), 'Torta Nueva');
    escribir(porId(c, 'categoria'), 'Tortas');
    escribir(porId(c, 'precio'), '9990');
    escribir(porId(c, 'stock'), '2');
    enviarFormulario(porId(c, 'form-producto'));
    await esperar();
    expect(llamadas('PUT')).toHaveLength(0);
    const [, opciones] = llamadas('POST').find(([u]) => String(u).endsWith('/api/v1/productos'));
    expect(JSON.parse(opciones.body)).toMatchObject({ codigo: 'ZZ100', nombre: 'Torta Nueva', precio: 9990 });
  });

  it('si el catálogo rechaza el producto, muestra su mensaje y no cambia nada en el navegador', async () => {
    comoAdminConToken();
    const precioAntes = tc001().precio;
    servidor({ 'PUT /api/v1/productos/TC001': () => respuesta(400, { status: 400, mensaje: 'El precio debe ser mayor a 0' }) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    escribir(porId(c, 'precio'), '18000');
    enviarFormulario(porId(c, 'form-producto'));
    await esperar();
    expect(textoDe(c)).toContain('El precio debe ser mayor a 0');
    expect(tc001().precio).toBe(precioAntes);
  });

  it('modo local: guardar un producto no llama al servidor', async () => {
    vi.unstubAllEnvs();
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    escribir(porId(c, 'precio'), '17001');
    enviarFormulario(porId(c, 'form-producto'));
    await esperar();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(tc001().precio).toBe(17001);
  });

  const elegirArchivo = (c, archivo) => {
    const input = porId(c, 'imagen');
    Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
    act(() => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  };
  const JPEG = () => new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0])], 'foto.jpg', { type: 'image/jpeg' });

  it('la foto se sube al guardar, a la carpeta media del producto', async () => {
    comoAdminConToken();
    const base = { ...tc001() };
    let enServidor = [base];
    servidor({
      ...catalogoServidor(() => enServidor),
      'PUT /api/v1/productos/TC001': (u, o) => respuesta(200, JSON.parse(o.body)),
      'POST /api/v1/productos/TC001/foto': () => {
        const conFoto = { ...base, imagen: '/api/v1/productos/media/tc001-1.webp' };
        enServidor = [conFoto];
        return respuesta(200, conFoto);
      }
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    elegirArchivo(c, JPEG());
    await esperar();
    expect(llamadas('POST')).toHaveLength(0);
    expect(textoDe(c)).toContain('se subirá al servidor al guardar');

    enviarFormulario(porId(c, 'form-producto'));
    await esperar();
    const [, subida] = llamadas('POST').find(([u]) => String(u).includes('/foto'));
    expect(subida.body).toBeInstanceOf(FormData);
    expect(subida.body.get('archivo')).toBeInstanceOf(File);
    expect(subida.headers.Authorization).toMatch(/^Bearer /);
    expect(subida.headers['Content-Type']).toBeUndefined();
    expect(tc001().imagen).toBe('/api/v1/productos/media/tc001-1.webp');
  });

  it('el botón Guardar queda bloqueado mientras el servidor responde', async () => {
    comoAdminConToken();
    servidor({ 'PUT /api/v1/productos/TC001': () => new Promise(() => {}) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    enviarFormulario(porId(c, 'form-producto'));
    await esperar();
    expect(porId(c, 'form-producto').querySelector('button[type="submit"]').disabled).toBe(true);
  });
});

// ---------- Catálogo en la tienda ----------
describe('Catálogo del servidor en la tienda', () => {
  it('el servidor manda: reemplaza los productos del navegador, stock incluido', async () => {
    servidor({
      'GET /api/v1/productos': () => respuesta(200, [
        { codigo: 'ZZ999', nombre: 'Torta del Servidor', categoria: 'Tortas', precio: 12345, precioAnterior: null, stock: 7, stockCritico: 2, imagen: null, descripcion: '<p>Hola</p>', receta: [] },
        { codigo: 'TC001', nombre: 'Torta Naranja EDITADA', categoria: 'Tortas', precio: 999, precioAnterior: null, stock: 1, stockCritico: 4, imagen: null, descripcion: '', receta: [] }
      ]),
      'GET /api/v1/categorias': () => respuesta(200, [{ id: 'tortas', nombre: 'Tortas', descripcion: '', imagen: 'menu/x' }]),
      'GET /api/v1/insumos': () => respuesta(200, [])
    });
    const c = renderizar(<Rutas />, { ruta: '/productos' });
    await esperar();
    const productos = JSON.parse(localStorage.getItem('pasteleria_productos_db'));
    expect(productos).toHaveLength(2);
    expect(productos.find((p) => p.codigo === 'TC001')).toMatchObject({ nombre: 'Torta Naranja EDITADA', precio: 999, stock: 1 });
    expect(textoDe(c)).toContain('Torta del Servidor');
  });

  it('sin servidor la tienda sigue con su catálogo local', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const c = renderizar(<Rutas />, { ruta: '/productos' });
    await esperar();
    expect(textoDe(c)).toContain('Torta Panqueque Naranja');
  });
});

// ---------- Descripción: seguridad ----------
describe('Descripción del producto (XSS)', () => {
  const MALICIOSA = '<p>Torta <strong>segura</strong></p><script>window.__xss=1</script><img src=x onerror="window.__xss=2">'
    + '<a href="javascript:window.__xss=3" onclick="window.__xss=4">enlace</a><iframe src="https://evil.test"></iframe>';
  const conDescripcion = (d) => guardarProductos(obtenerProductos().map((p) => (p.codigo === 'TC001' ? { ...p, descripcion: d } : p)));

  it('la ficha muestra el formato permitido y elimina todo lo peligroso', () => {
    vi.unstubAllEnvs();
    conDescripcion(MALICIOSA);
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    const caja = c.querySelector('.descripcion-producto');
    expect(caja.querySelector('strong').textContent).toBe('segura');
    expect(caja.querySelector('script, img, iframe, a')).toBeNull();
    expect(caja.innerHTML).not.toMatch(/onerror|onclick|javascript:/i);
    expect(window.__xss).toBeUndefined();
  });

  it('las tarjetas y el buscador usan texto plano, sin etiquetas', () => {
    vi.unstubAllEnvs();
    conDescripcion('<p>Torta <strong>segura</strong></p><ul><li>sin gluten</li></ul>');
    const c = renderizar(<Rutas />, { ruta: '/productos?q=gluten' });
    const tarjeta = [...c.querySelectorAll('.mdesc')].find((e) => e.textContent.includes('segura'));
    expect(tarjeta.textContent).toBe('Torta segura sin gluten');
    expect(tarjeta.innerHTML).not.toContain('<');
  });

  it('una descripción antigua en texto plano se sigue viendo bien', () => {
    vi.unstubAllEnvs();
    conDescripcion('Torta clásica & "casera"');
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    expect(c.querySelector('.descripcion-producto').textContent).toBe('Torta clásica & "casera"');
  });
});

// ---------- Editor Tiptap ----------
describe('Editor de descripción (Tiptap)', () => {
  it('muestra la barra de formato y convierte el texto antiguo en párrafo', () => {
    const c = renderizar(<EditorDescripcion valor="Hola mundo" onCambio={() => {}} />, { conProviders: false });
    expect(c.querySelectorAll('[role="toolbar"] button')).toHaveLength(8);
    expect(c.querySelector('.ProseMirror').innerHTML).toBe('<p>Hola mundo</p>');
    expect(textoDe(porId(c, 'contador-desc'))).toBe('10 / 500 caracteres');
  });

  it('entrega HTML con formato al editar y cadena vacía si se borra todo', () => {
    const onCambio = vi.fn();
    const c = renderizar(<EditorDescripcion valor="" onCambio={onCambio} />, { conProviders: false });
    const editor = c.querySelector('.ProseMirror').editor;
    act(() => { editor.commands.setContent('<p>Hola <strong>fuerte</strong></p>', true); });
    expect(onCambio).toHaveBeenLastCalledWith('<p>Hola <strong>fuerte</strong></p>');
    act(() => { editor.commands.setContent('', true); });
    expect(onCambio).toHaveBeenLastCalledWith('');
  });

  it('los botones aplican el formato', () => {
    const onCambio = vi.fn();
    const c = renderizar(<EditorDescripcion valor="<p>Texto</p>" onCambio={onCambio} />, { conProviders: false });
    const editor = c.querySelector('.ProseMirror').editor;
    act(() => { editor.commands.selectAll(); });
    clic(c.querySelector('button[aria-label="Negrita"]'));
    expect(onCambio).toHaveBeenLastCalledWith('<p><strong>Texto</strong></p>');
    clic(c.querySelector('button[aria-label="Lista con viñetas"]'));
    expect(onCambio.mock.lastCall[0]).toContain('<ul>');
  });

  it('no permite pegar etiquetas que el sitio no admite (se descartan en el editor)', () => {
    const onCambio = vi.fn();
    const c = renderizar(<EditorDescripcion valor="" onCambio={onCambio} />, { conProviders: false });
    const editor = c.querySelector('.ProseMirror').editor;
    act(() => { editor.commands.setContent('<p>ok</p><script>alert(1)</script><img src=x onerror=alert(2)><iframe src="x"></iframe>', true); });
    const html = onCambio.mock.lastCall[0];
    expect(html).toBe('<p>ok</p>');
  });

  it('respeta el límite de 500 caracteres', () => {
    const c = renderizar(<EditorDescripcion valor="" onCambio={() => {}} />, { conProviders: false });
    const editor = c.querySelector('.ProseMirror').editor;
    act(() => { editor.commands.insertContent('a'.repeat(450)); });
    act(() => { editor.commands.insertContent('b'.repeat(200)); });
    expect(editor.storage.characterCount.characters()).toBeLessThanOrEqual(500);
  });

  it('el formulario de producto guarda la descripción con formato', async () => {
    vi.unstubAllEnvs();
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    await esperarEditor(c);
    const editor = c.querySelector('.ProseMirror').editor;
    act(() => { editor.commands.setContent('<p>Receta <strong>de la casa</strong></p><ul><li>sin gluten</li></ul>', true); });
    enviarFormulario(porId(c, 'form-producto'));
    expect(obtenerProductos().find((p) => p.codigo === 'TC001').descripcion).toBe('<p>Receta <strong>de la casa</strong></p><ul><li><p>sin gluten</p></li></ul>');
  });
});

// ---------- Compra (checkout) ----------
describe('Checkout (modo servidor)', () => {
  const CLIENTE = { id: 4, run: '201239877', nombre: 'Armando', apellidos: 'Esteban Quito', correo: 'armando.quito@gmail.com', rol: 'Cliente', region: 'Región del Biobío', comuna: 'Concepción', direccion: 'Calle Prat 789' };
  const ITEM = { id: 'TC001', codigo: 'TC001', nombre: 'Torta Panqueque Naranja', precio: 1, imagen: 'menu/Torta_Trufa', variante: 'entera', cantidad: 2 };

  const preparar = (rutasOrden) => {
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(CLIENTE));
    localStorage.setItem('papita_token', crearToken());
    localStorage.setItem('papita_dulce_cart', JSON.stringify([ITEM]));
    const productos = obtenerProductos();
    servidor({
      'GET /api/v1/productos': () => respuesta(200, productos),
      'GET /api/v1/categorias': () => respuesta(200, [{ id: 'tortas', nombre: 'Tortas', descripcion: '', imagen: 'menu/x' }]),
      'GET /api/v1/insumos': () => respuesta(200, []),
      'GET /api/v1/ordenes/mias': () => respuesta(200, []),
      ...rutasOrden
    });
  };
  const pagarEnEfectivo = async (c) => {
    escribir(porId(c, 'coNombre'), 'Armando Esteban Quito');
    escribir(porId(c, 'coRun'), '201239877');
    escribir(porId(c, 'coCorreo'), 'armando.quito@gmail.com');
    escribir(porId(c, 'coTelefono'), '+56 9 6543 2109');
    clic(c.querySelector('input[name="metodoEntrega"][value="retiro"]'));
    clic(c.querySelector('input[name="metodoPago"][value="efectivo"]'));
    enviarFormulario(porId(c, 'coNombre').closest('form'));
    await esperar(10);
  };

  it('crea la orden en el servidor (el precio lo pone el backend) y muestra la boleta', async () => {
    preparar({
      'POST /api/v1/ordenes': (u, o) => respuesta(201, {
        id: 'PD-12345678', numero: '#PD-12345678', fecha: '2026-11-22', hora: '15:00', cliente: 'Armando Esteban Quito',
        correo: 'armando.quito@gmail.com', entrega: 'Retiro en tienda', tipoEntrega: 'retiro', metodoPago: 'efectivo',
        estado: 'Pendiente', total: 33800, montoTotal: '$33.800', codigoPedido: 'PD-5678',
        detalle: [{ codigo: 'TC001', nombre: 'Torta Panqueque Naranja', precio: 16900, cantidad: 2, variante: 'completa' }]
      })
    });
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    await pagarEnEfectivo(c);

    const [url, opciones] = llamadas('POST').find(([ruta]) => String(ruta).endsWith('/api/v1/ordenes'));
    expect(url).toContain('/api/v1/ordenes');
    expect(opciones.headers.Authorization).toMatch(/^Bearer /);
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo).toMatchObject({ metodoPago: 'efectivo', tipoEntrega: 'retiro', pagoAprobado: true });
    expect(cuerpo.items).toEqual([{ codigo: 'TC001', cantidad: 2, variante: 'completa' }]);
    expect(cuerpo.items[0].precio).toBeUndefined();
    expect(textoDe(c)).toContain('PD-12345678');
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(0);
  });

  it('si ya no hay stock, muestra el mensaje del servidor y conserva el carrito', async () => {
    preparar({ 'POST /api/v1/ordenes': () => respuesta(409, { status: 409, mensaje: 'Ya no hay stock suficiente de Torta Panqueque Naranja.' }) });
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    await pagarEnEfectivo(c);
    expect(textoDe(c)).toContain('Ya no hay stock suficiente de Torta Panqueque Naranja.');
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(1);
  });
});

// ---------- Descripción en el inventario del admin ----------
describe('Descripción en el inventario del admin', () => {
  it('la lista muestra texto sin etiquetas y "Ver" muestra el formato sin scripts', () => {
    vi.unstubAllEnvs();
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));
    guardarProductos(obtenerProductos().map((p) => (p.codigo === 'TC001'
      ? { ...p, descripcion: '<p>Torta <strong>rica</strong></p><script>window.__xss=1</script>' } : p)));
    const c = renderizar(<Rutas />, { ruta: '/admin/productos' });

    const fila = [...c.querySelectorAll('tbody tr')].find((tr) => tr.textContent.includes('TC001'));
    expect(fila.textContent).toContain('Torta rica');
    expect(fila.textContent).not.toContain('<p>');

    clic([...fila.querySelectorAll('button')].find((b) => /ver/i.test(b.textContent)));
    const desc = document.getElementById('modal-prod-desc');
    expect(desc.querySelector('strong').textContent).toBe('rica');
    expect(desc.innerHTML).not.toContain('script');
    expect(window.__xss).toBeUndefined();
  });
});
