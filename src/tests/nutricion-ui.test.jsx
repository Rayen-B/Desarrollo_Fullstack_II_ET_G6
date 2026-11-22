import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderizar, clic, escribir, enviarFormulario, porId, textoDe } from './utils';
import { Rutas } from '../App';
import { obtenerInsumos } from '../services/insumos';

const ADMIN = { run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita', correo: 'admin@papitadulce.cl', password: 'admin', rol: 'Administrador' };
const comoAdmin = () => localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));

const NUTRICION = {
  codigoProducto: 'TC001',
  total: { calorias: 2400, azucares: 180.5, grasas: 110, proteinas: 38, carbohidratos: 310 },
  porTrozo: { calorias: 600, azucares: 45.1, grasas: 27.5, proteinas: 9.5, carbohidratos: 77.5 },
  alergenos: ['gluten', 'lactosa', 'huevo'],
  ingredientesSinDatos: [],
  calculadoEn: '2026-11-20T10:00:00',
  desdeCache: true
};

const respuesta = (status, cuerpo) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => cuerpo });
// Enruta el fetch simulado según método y URL; lo no configurado "no responde"
const simularBackend = (rutas) => {
  globalThis.fetch = vi.fn((url, opciones = {}) => {
    const clave = `${opciones.method || 'GET'} ${String(url).replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')}`;
    const manejador = rutas[clave];
    return manejador ? manejador(url, opciones) : new Promise(() => {});
  });
};
const esperar = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('Ficha de producto con información nutricional', () => {
  it('muestra la tabla y los alérgenos cuando el servidor tiene datos', async () => {
    simularBackend({ 'GET /api/v1/nutricion/productos/TC001': () => respuesta(200, NUTRICION) });
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    await esperar();
    const tarjeta = porId(c, 'info-nutricional');
    expect(tarjeta).not.toBeNull();
    const texto = textoDe(tarjeta);
    expect(texto).toContain('Por unidad completa');
    expect(texto).toContain('2.400 kcal');
    expect(texto).toContain('180,5 g'); // azúcares con decimales chilenos
    expect(textoDe(porId(c, 'alergenos-producto'))).toMatch(/Gluten.*Lactosa.*Huevo/);
  });

  it('al elegir "trozo" muestra los valores de un trozo', async () => {
    simularBackend({ 'GET /api/v1/nutricion/productos/TC001': () => respuesta(200, NUTRICION) });
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    await esperar();
    escribir(c.querySelector('select'), 'trozo');
    const texto = textoDe(porId(c, 'info-nutricional'));
    expect(texto).toContain('Por trozo (1/4 de la torta)');
    expect(texto).toContain('600 kcal');
    expect(texto).not.toContain('2.400 kcal');
  });

  it('mientras carga muestra un aviso discreto', () => {
    simularBackend({}); // el servidor no responde
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    expect(textoDe(c)).toContain('Cargando información nutricional');
  });

  it('si el producto aún no tiene cálculo (404) no muestra el bloque y la tienda sigue normal', async () => {
    simularBackend({ 'GET /api/v1/nutricion/productos/TC001': () => respuesta(404, { status: 404, mensaje: 'aún no tiene información nutricional calculada' }) });
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    await esperar();
    expect(porId(c, 'info-nutricional')).toBeNull();
    expect(textoDe(c)).not.toContain('Cargando información nutricional');
    expect(textoDe(c)).toContain('Torta Panqueque Naranja');
    expect(textoDe(c)).toContain('Agregar al Carrito');
  });

  it('si el servidor está caído la ficha del producto sigue funcionando', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    await esperar();
    expect(porId(c, 'info-nutricional')).toBeNull();
    expect(textoDe(c)).toContain('Agregar al Carrito');
  });

  it('sin alérgenos registrados lo indica y avisa si la estimación es incompleta', async () => {
    simularBackend({ 'GET /api/v1/nutricion/productos/TC001': () => respuesta(200, { ...NUTRICION, alergenos: [], ingredientesSinDatos: ['canela'] }) });
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    await esperar();
    expect(textoDe(porId(c, 'alergenos-producto'))).toContain('ninguno registrado');
    expect(textoDe(porId(c, 'info-nutricional'))).toContain('puede estar incompleta');
  });
});

describe('Admin: calcular información nutricional de un producto', () => {
  it('envía la receta del formulario y muestra el resultado', async () => {
    comoAdmin();
    simularBackend({ 'POST /api/v1/nutricion/productos/TC001': () => respuesta(200, NUTRICION) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    const boton = porId(c, 'btn-calcular-nutricion');
    expect(boton).not.toBeNull();
    expect(boton.textContent).toContain('Calcular información nutricional');
    clic(boton);
    await esperar();

    const [url, opciones] = globalThis.fetch.mock.calls.find(([, o]) => o && o.method === 'POST');
    expect(url).toContain('/api/v1/nutricion/productos/TC001?forzar=false');
    const items = JSON.parse(opciones.body).items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => typeof i.insumoId === 'string' && typeof i.cantidad === 'number' && i.cantidad > 0)).toBe(true);

    expect(textoDe(porId(c, 'info-nutricional'))).toContain('2.400 kcal');
    expect(textoDe(porId(c, 'bloque-nutricion'))).toContain('Por trozo (1/4): 600 kcal');
    expect(porId(c, 'btn-calcular-nutricion').textContent).toContain('Recalcular');
  });

  it('"Recalcular" fuerza una consulta nueva (forzar=true)', async () => {
    comoAdmin();
    simularBackend({ 'POST /api/v1/nutricion/productos/TC001': () => respuesta(200, NUTRICION) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    clic(porId(c, 'btn-calcular-nutricion'));
    await esperar();
    clic(porId(c, 'btn-calcular-nutricion'));
    await esperar();
    const llamadas = globalThis.fetch.mock.calls.filter(([, o]) => o && o.method === 'POST').map(([u]) => u);
    expect(llamadas[0]).toContain('forzar=false');
    expect(llamadas[1]).toContain('forzar=true');
  });

  it('muestra el error del servidor (ej. límite diario de Spoonacular)', async () => {
    comoAdmin();
    simularBackend({ 'POST /api/v1/nutricion/productos/TC001': () => respuesta(503, { status: 503, mensaje: 'Se alcanzó el límite diario de consultas a Spoonacular' }) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    clic(porId(c, 'btn-calcular-nutricion'));
    await esperar();
    expect(textoDe(porId(c, 'bloque-nutricion'))).toContain('límite diario');
    expect(porId(c, 'info-nutricional')).toBeNull();
  });

  it('si falta el nombre en inglés de un insumo orienta a completarlo', async () => {
    comoAdmin();
    simularBackend({ 'POST /api/v1/nutricion/productos/TC001': () => respuesta(400, { status: 400, mensaje: 'Estos insumos no tienen nombre en inglés registrado: harina' }) });
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    clic(porId(c, 'btn-calcular-nutricion'));
    await esperar();
    expect(textoDe(porId(c, 'bloque-nutricion'))).toContain('Datos nutricionales');
  });

  it('con el servidor caído avisa sin romper el formulario', async () => {
    comoAdmin();
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    clic(porId(c, 'btn-calcular-nutricion'));
    await esperar();
    expect(textoDe(porId(c, 'bloque-nutricion'))).toContain('backend esté levantado');
    expect(porId(c, 'form-producto')).not.toBeNull();
  });

  it('sin receta no ofrece el botón de calcular', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form' });
    expect(porId(c, 'btn-calcular-nutricion')).toBeNull();
  });
});

describe('Admin: datos nutricionales de un insumo', () => {
  const INGREDIENTES = [
    { insumoId: 'harina', nombre: 'Harina', nombreIngles: 'flour', unidad: 'g', alergenos: ['gluten'] },
    { insumoId: 'chocolate', nombre: 'Chocolate', nombreIngles: 'dark chocolate', unidad: 'g', alergenos: ['lactosa'] }
  ];

  it('al editar rellena nombre en inglés y alérgenos desde el servidor', async () => {
    comoAdmin();
    simularBackend({ 'GET /api/v1/nutricion/ingredientes': () => respuesta(200, INGREDIENTES) });
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form?id=harina' });
    await esperar();
    expect(porId(c, 'nombre-ingles-insumo').value).toBe('flour');
    expect(porId(c, 'alergeno-gluten').checked).toBe(true);
    expect(porId(c, 'alergeno-lactosa').checked).toBe(false);
  });

  it('guarda el insumo y envía los datos nutricionales al servidor (PUT)', async () => {
    comoAdmin();
    simularBackend({
      'GET /api/v1/nutricion/ingredientes': () => respuesta(200, INGREDIENTES),
      'PUT /api/v1/nutricion/ingredientes/harina': (u, o) => respuesta(200, JSON.parse(o.body))
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form?id=harina' });
    await esperar();
    clic(porId(c, 'alergeno-huevo'));
    escribir(porId(c, 'nombre-ingles-insumo'), 'wheat flour');
    enviarFormulario(porId(c, 'form-insumo'));
    await esperar();

    const [url, opciones] = globalThis.fetch.mock.calls.find(([, o]) => o && o.method === 'PUT');
    expect(url).toContain('/api/v1/nutricion/ingredientes/harina');
    expect(JSON.parse(opciones.body)).toEqual({ insumoId: 'harina', nombre: 'Harina', nombreIngles: 'wheat flour', unidad: 'g', alergenos: ['gluten', 'huevo'] });
    expect(textoDe(porId(c, 'datos-nutricionales'))).toContain('Datos nutricionales guardados en el servidor');
  });

  it('si el servidor falla, el insumo igual queda guardado en la tienda y se avisa', async () => {
    comoAdmin();
    simularBackend({
      'GET /api/v1/nutricion/ingredientes': () => respuesta(200, INGREDIENTES),
      'PUT /api/v1/nutricion/ingredientes/harina': () => respuesta(503, { status: 503, mensaje: 'Servicio no disponible' })
    });
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form?id=harina' });
    await esperar();
    escribir(porId(c, 'stock-insumo'), '7777');
    enviarFormulario(porId(c, 'form-insumo'));
    await esperar();
    expect(obtenerInsumos().find((i) => i.id === 'harina').stock).toBe(7777);
    expect(textoDe(porId(c, 'datos-nutricionales'))).toContain('El insumo se guardó, pero no se pudieron guardar sus datos nutricionales');
  });

  it('un insumo nuevo sin nombre en inglés no llama al servidor', async () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form' });
    escribir(porId(c, 'nombre-insumo'), 'Esencia de vainilla');
    escribir(porId(c, 'stock-insumo'), '100');
    escribir(porId(c, 'minimo-insumo'), '10');
    enviarFormulario(porId(c, 'form-insumo'));
    await esperar();
    expect(obtenerInsumos().some((i) => i.id === 'esencia-de-vainilla')).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('un insumo nuevo con nombre en inglés se registra con su id y se limpia el formulario', async () => {
    comoAdmin();
    simularBackend({ 'PUT /api/v1/nutricion/ingredientes/esencia-de-vainilla': (u, o) => respuesta(200, JSON.parse(o.body)) });
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form' });
    escribir(porId(c, 'nombre-insumo'), 'Esencia de vainilla');
    escribir(porId(c, 'stock-insumo'), '100');
    escribir(porId(c, 'minimo-insumo'), '10');
    escribir(porId(c, 'nombre-ingles-insumo'), 'vanilla extract');
    enviarFormulario(porId(c, 'form-insumo'));
    await esperar();
    const [, opciones] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(opciones.body)).toMatchObject({ insumoId: 'esencia-de-vainilla', nombre: 'Esencia de vainilla', nombreIngles: 'vanilla extract', alergenos: [] });
    expect(porId(c, 'nombre-ingles-insumo').value).toBe('');
  });

  it('un nombre en inglés inválido (con tildes) bloquea el guardado', async () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form' });
    escribir(porId(c, 'nombre-insumo'), 'Esencia de vainilla');
    escribir(porId(c, 'stock-insumo'), '100');
    escribir(porId(c, 'minimo-insumo'), '10');
    escribir(porId(c, 'nombre-ingles-insumo'), 'vainílla');
    enviarFormulario(porId(c, 'form-insumo'));
    await esperar();
    expect(obtenerInsumos().some((i) => i.id === 'esencia-de-vainilla')).toBe(false);
    expect(textoDe(c)).toContain('verifique los campos');
    expect(textoDe(porId(c, 'datos-nutricionales'))).toContain('Solo letras sin tildes');
  });

  it('con el servidor caído al editar avisa y deja usar el formulario', async () => {
    comoAdmin();
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const c = renderizar(<Rutas />, { ruta: '/admin/insumo-form?id=harina' });
    await esperar();
    expect(textoDe(porId(c, 'datos-nutricionales'))).toContain('servidor no disponible');
    expect(porId(c, 'nombre-insumo').value).toBe('Harina');
  });
});
