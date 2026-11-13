import { describe, it, expect } from 'vitest';
import {
  obtenerProductos, guardarProductos, obtenerUsuarios, obtenerSesionActiva, obtenerOrdenes,
  PRODUCTOS_DEFAULT, USUARIOS_DEFAULT, PRODUCTOS_KEY, USERS_KEY, AUTH_KEY, CATALOGO_VERSION
} from '../services/storage';
import {
  obtenerInsumos, guardarInsumos, INSUMOS_DEFAULT, INSUMOS_KEY, esInsumoCritico,
  textoCantidad, crearIdInsumo, validarNombreInsumo, validarCantidad
} from '../services/insumos';
import { RECETAS_DEFAULT } from '../data/recetas';
import { CATEGORIAS_DEFAULT } from '../services/categorias';
import { validarRUN } from '../utils/validaciones';

describe('catálogo de productos (CRUD en localStorage)', () => {
  it('la primera vez guarda el catálogo inicial', () => {
    expect(obtenerProductos()).toHaveLength(PRODUCTOS_DEFAULT.length);
    expect(JSON.parse(localStorage.getItem(PRODUCTOS_KEY))).toHaveLength(PRODUCTOS_DEFAULT.length);
  });

  it('guarda y vuelve a leer los cambios', () => {
    const productos = obtenerProductos().map((p) => (p.codigo === 'TC001' ? { ...p, precio: 1 } : p));
    guardarProductos(productos);
    expect(obtenerProductos().find((p) => p.codigo === 'TC001').precio).toBe(1);
  });

  it('todos los productos usan una de las 6 categorías', () => {
    const nombres = new Set(CATEGORIAS_DEFAULT.map((c) => c.nombre));
    PRODUCTOS_DEFAULT.forEach((p) => expect(nombres.has(p.categoria)).toBe(true));
  });

  it('todas las recetas usan insumos que existen', () => {
    const ids = new Set(INSUMOS_DEFAULT.map((i) => i.id));
    Object.values(RECETAS_DEFAULT).flat().forEach((r) => expect(ids.has(r.insumoId)).toBe(true));
  });
});

describe('actualización del catálogo guardado en una versión anterior', () => {
  const guardarVersionAnterior = (cambios) => {
    const anteriores = PRODUCTOS_DEFAULT.map(({ receta, ...p }) => ({ ...p, ...(cambios[p.codigo] || {}) }));
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(anteriores));
    localStorage.setItem('papita_catalogo_version', '4');
  };

  it('agrega las recetas y marca la versión nueva', () => {
    guardarVersionAnterior({});
    const tortaTrufa = obtenerProductos().find((p) => p.codigo === 'TL004');
    expect(tortaTrufa.receta).toEqual(RECETAS_DEFAULT.TL004);
    expect(localStorage.getItem('papita_catalogo_version')).toBe(CATALOGO_VERSION);
  });

  it('no pisa el stock que el admin ya había editado', () => {
    guardarVersionAnterior({ TC002: { stock: 7 }, POS006: { stock: 14 } });
    const productos = obtenerProductos();
    expect(productos.find((p) => p.codigo === 'TC002').stock).toBe(7);
    expect(productos.find((p) => p.codigo === 'POS006').stock).toBe(0);
  });

  it('separa otra vez "Infusiones & Bebestibles" en Bebestibles e Infusiones', () => {
    guardarVersionAnterior({ BEB001: { categoria: 'Infusiones & Bebestibles' }, INF001: { categoria: 'Infusiones & Bebestibles' } });
    const productos = obtenerProductos();
    expect(productos.find((p) => p.codigo === 'BEB001').categoria).toBe('Bebestibles');
    expect(productos.find((p) => p.codigo === 'INF001').categoria).toBe('Infusiones');
  });

  it('si los datos guardados están dañados, usa el catálogo inicial', () => {
    localStorage.setItem(PRODUCTOS_KEY, '{no es json');
    expect(obtenerProductos()).toEqual(PRODUCTOS_DEFAULT);
  });
});

describe('usuarios y sesión', () => {
  it('los RUN de los usuarios de ejemplo son válidos', () => {
    USUARIOS_DEFAULT.forEach((u) => expect(validarRUN(u.run).valido).toBe(true));
  });

  it('corrige los RUN de ejemplo antiguos ya guardados en el navegador', () => {
    localStorage.setItem(USERS_KEY, JSON.stringify([USUARIOS_DEFAULT[0], { ...USUARIOS_DEFAULT[1], run: '19011022K' }]));
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...USUARIOS_DEFAULT[1], run: '19011022K' }));
    expect(obtenerUsuarios()[1].run).toBe('190110222');
    expect(obtenerSesionActiva().run).toBe('190110222');
  });

  it('agrega el usuario "admin" si el navegador tenía usuarios guardados sin él', () => {
    localStorage.setItem(USERS_KEY, JSON.stringify([USUARIOS_DEFAULT[1]]));
    const usuarios = obtenerUsuarios();
    expect(usuarios[0]).toMatchObject({ usuario: 'admin', rol: 'Administrador' });
    expect(usuarios).toHaveLength(2);
  });

  it('sin sesión guardada devuelve null', () => {
    expect(obtenerSesionActiva()).toBeNull();
  });
});

describe('órdenes', () => {
  it('completa los campos que faltan en las órdenes de ejemplo antiguas', () => {
    localStorage.setItem('papita_dulce_orders', JSON.stringify([{ id: 'ORD-1001', estado: 'Enviado' }]));
    const [orden] = obtenerOrdenes();
    expect(orden.estado).toBe('Enviado');
    expect(orden.metodoPago).toBe('tarjeta');
  });
});

describe('insumos', () => {
  it('la primera vez guarda los insumos iniciales', () => {
    expect(obtenerInsumos()).toHaveLength(INSUMOS_DEFAULT.length);
    expect(localStorage.getItem(INSUMOS_KEY)).not.toBeNull();
  });

  it('guarda y vuelve a leer los insumos', () => {
    guardarInsumos([{ id: 'sal', nombre: 'Sal', unidad: 'g', stock: 10, minimo: 1 }]);
    expect(obtenerInsumos()).toEqual([{ id: 'sal', nombre: 'Sal', unidad: 'g', stock: 10, minimo: 1 }]);
  });

  it('es crítico cuando el stock está en o bajo el mínimo', () => {
    expect(esInsumoCritico({ stock: 5, minimo: 5 })).toBe(true);
    expect(esInsumoCritico({ stock: 6, minimo: 5 })).toBe(false);
  });

  it('muestra cantidades con unidad y separador chileno', () => {
    expect(textoCantidad(10000, 'g')).toBe('10.000 g');
    expect(textoCantidad(5.625, 'u')).toBe('5,63 u');
    expect(textoCantidad(undefined, 'ml')).toBe('0 ml');
  });

  it('crea el id a partir del nombre, sin tildes ni espacios', () => {
    expect(crearIdInsumo('Crema de Leche')).toBe('crema-de-leche');
    expect(crearIdInsumo('Azúcar flor')).toBe('azucar-flor');
  });

  it('valida el nombre: requerido, largo y sin repetirse', () => {
    expect(validarNombreInsumo('Sal', INSUMOS_DEFAULT).valido).toBe(true);
    expect(validarNombreInsumo('', INSUMOS_DEFAULT).mensaje).toBe('El nombre es requerido');
    expect(validarNombreInsumo('Al', INSUMOS_DEFAULT).valido).toBe(false);
    expect(validarNombreInsumo('HARINA', INSUMOS_DEFAULT).mensaje).toBe('Ya existe un insumo con ese nombre');
  });

  it('al editar, el insumo puede conservar su propio nombre', () => {
    expect(validarNombreInsumo('Harina', INSUMOS_DEFAULT, 'harina').valido).toBe(true);
  });

  it('valida que la cantidad exista y no sea negativa', () => {
    expect(validarCantidad('2.5').valido).toBe(true);
    expect(validarCantidad('', 'el stock').mensaje).toBe('Ingresa el stock');
    expect(validarCantidad(-1).valido).toBe(false);
    expect(validarCantidad('abc').valido).toBe(false);
  });
});
