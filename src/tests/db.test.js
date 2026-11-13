import { describe, it, expect } from 'vitest';
import * as db from '../services/db';
import { obtenerUsuarios, USERS_KEY, PRODUCTOS_KEY } from '../services/storage';
import { obtenerInsumos } from '../services/insumos';

const nuevoProducto = { codigo: 'zz001', nombre: 'Producto Prueba', categoria: 'Tortas', precio: '1000', stock: '5', stockCritico: 2 };

describe('db: utilidades', () => {
  it('crearSlug quita tildes y espacios', () => expect(db.crearSlug('Sándwiches Fríos')).toBe('sandwiches-frios'));
  it('descuentoPorcentaje calcula el % rebajado', () => expect(db.descuentoPorcentaje({ precio: 750, precioAnterior: 1000 })).toBe(25));
  it('sin precio anterior no hay descuento', () => expect(db.descuentoPorcentaje({ precio: 750 })).toBe(0));
  it('esOferta exige el descuento mínimo', () => {
    expect(db.esOferta({ precio: 800, precioAnterior: 1000 })).toBe(true);
    expect(db.esOferta({ precio: 950, precioAnterior: 1000 })).toBe(false);
  });
});

describe('db: CRUD de productos', () => {
  it('lista el catálogo inicial', () => expect(db.listarProductos().length).toBeGreaterThan(30));
  it('crea un producto y lo puede leer', () => {
    const r = db.crearProducto(nuevoProducto);
    expect(r.exito).toBe(true);
    expect(db.obtenerProducto('ZZ001').precio).toBe(1000);
  });
  it('no permite códigos duplicados', () => {
    db.crearProducto(nuevoProducto);
    expect(db.crearProducto(nuevoProducto).exito).toBe(false);
  });
  it('actualiza un producto', () => {
    db.crearProducto(nuevoProducto);
    db.actualizarProducto('ZZ001', { precio: 2500, nombre: 'Nuevo nombre' });
    expect(db.obtenerProducto('ZZ001').precio).toBe(2500);
    expect(db.obtenerProducto('ZZ001').nombre).toBe('Nuevo nombre');
  });
  it('elimina un producto', () => {
    db.crearProducto(nuevoProducto);
    expect(db.eliminarProducto('ZZ001').exito).toBe(true);
    expect(db.obtenerProducto('ZZ001')).toBeNull();
  });
  it('actualizar o eliminar un producto inexistente falla', () => {
    expect(db.actualizarProducto('NOEXISTE', {}).exito).toBe(false);
    expect(db.eliminarProducto('NOEXISTE').exito).toBe(false);
  });
  it('productosCriticos devuelve los que están en o bajo el mínimo', () => {
    db.crearProducto({ ...nuevoProducto, stock: 2 });
    expect(db.productosCriticos().map((p) => p.codigo)).toContain('ZZ001');
  });
  it('productosPorCategoria acepta slug o nombre', () => {
    expect(db.productosPorCategoria('sandwiches').length).toBe(db.productosPorCategoria('Sándwiches').length);
    expect(db.productosPorCategoria('sandwiches').length).toBeGreaterThan(0);
  });
  it('buscarProductos filtra por texto', () => {
    const r = db.buscarProductos('selva negra');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => (p.nombre + p.descripcion).toLowerCase().includes('selva'))).toBe(true);
  });
  it('productosEnOferta devuelve solo productos con descuento suficiente', () => {
    expect(db.productosEnOferta().every(db.esOferta)).toBe(true);
  });
  it('descontarStock vende primero lo que hay en vitrina', () => {
    db.crearProducto(nuevoProducto);
    expect(db.descontarStock([{ codigo: 'ZZ001', cantidad: 2, variante: 'entera' }]).exito).toBe(true);
    expect(db.obtenerProducto('ZZ001').stock).toBe(3);
  });
  it('un trozo (1/4 de torta) se prepara con los insumos y no toca la vitrina', () => {
    db.crearProducto({ ...nuevoProducto, receta: [{ insumoId: 'harina', cantidad: 400 }] });
    const harinaAntes = obtenerInsumos().find((i) => i.id === 'harina').stock;
    db.descontarStock([{ codigo: 'ZZ001', cantidad: 4, variante: 'trozo' }]);
    expect(db.obtenerProducto('ZZ001').stock).toBe(5);
    expect(obtenerInsumos().find((i) => i.id === 'harina').stock).toBe(harinaAntes - 400);
  });
  it('si no alcanza el stock no descuenta nada y avisa qué falta', () => {
    db.crearProducto(nuevoProducto);
    const r = db.descontarStock([{ codigo: 'ZZ001', cantidad: 99, variante: 'entera', nombre: 'Producto Prueba' }]);
    expect(r.exito).toBe(false);
    expect(r.mensaje).toContain('Producto Prueba');
    expect(db.obtenerProducto('ZZ001').stock).toBe(5);
  });
  it('hayStockPara revisa sin descontar', () => {
    db.crearProducto(nuevoProducto);
    expect(db.hayStockPara([{ codigo: 'ZZ001', cantidad: 5 }]).exito).toBe(true);
    expect(db.hayStockPara([{ codigo: 'ZZ001', cantidad: 6 }]).exito).toBe(false);
    expect(db.obtenerProducto('ZZ001').stock).toBe(5);
  });
});

describe('db: CRUD de categorías', () => {
  it('lista las 6 categorías iniciales', () => expect(db.listarCategorias().length).toBe(6));
  it('crea una categoría con slug', () => {
    const r = db.crearCategoria({ nombre: 'Pan Dulce' });
    expect(r.categoria.id).toBe('pan-dulce');
  });
  it('rechaza categorías duplicadas', () => expect(db.crearCategoria({ nombre: 'tortas' }).exito).toBe(false));
  it('al renombrar actualiza los productos', () => {
    db.actualizarCategoria('tortas', { nombre: 'Tortas Caseras' });
    expect(db.productosPorCategoria('Tortas Caseras').length).toBe(6);
  });
  it('no elimina una categoría con productos', () => expect(db.eliminarCategoria('tortas').exito).toBe(false));
  it('elimina una categoría vacía', () => {
    db.crearCategoria({ nombre: 'Vacía' });
    expect(db.eliminarCategoria('vacia').exito).toBe(true);
  });
});

describe('db: usuarios', () => {
  it('incluye el usuario admin (admin / admin)', () => {
    const admin = db.listarUsuarios().find((u) => u.usuario === 'admin');
    expect(admin.password).toBe('admin');
    expect(admin.rol).toBe('Administrador');
  });
  it('agrega admin si el navegador ya tenía usuarios antiguos', () => {
    localStorage.setItem(USERS_KEY, JSON.stringify([{ run: '1', correo: 'x@x.cl', nombre: 'X', rol: 'Cliente', password: 'a' }]));
    expect(obtenerUsuarios().some((u) => u.usuario === 'admin')).toBe(true);
  });
  it('crea, actualiza y elimina un usuario', () => {
    expect(db.crearUsuario({ run: '222222222', nombre: 'Ana', correo: 'ANA@x.cl', password: 'x' }).exito).toBe(true);
    expect(db.obtenerUsuarioPorCorreo('ana@x.cl').nombre).toBe('Ana');
    db.actualizarUsuario('222222222', { nombre: 'Anita' });
    expect(db.obtenerUsuarioPorRun('222222222').nombre).toBe('Anita');
    expect(db.eliminarUsuario('222222222').exito).toBe(true);
    expect(db.obtenerUsuarioPorRun('222222222')).toBeNull();
  });
  it('no repite correo ni RUN', () => {
    db.crearUsuario({ run: '222222222', nombre: 'Ana', correo: 'ana@x.cl', password: 'x' });
    expect(db.crearUsuario({ run: '333', nombre: 'B', correo: 'ana@x.cl', password: 'x' }).exito).toBe(false);
    expect(db.crearUsuario({ run: '222222222', nombre: 'B', correo: 'b@x.cl', password: 'x' }).exito).toBe(false);
  });
});

describe('db: órdenes y reportes', () => {
  const items = [{ codigo: 'TC001', nombre: 'Torta', precio: 1000, cantidad: 2 }, { codigo: 'BEB001', nombre: 'Jugo', precio: 500, cantidad: 1 }];
  const datos = { cliente: 'Ana', correo: 'ana@x.cl', entrega: 'Retiro en tienda', metodoPago: 'tarjeta', items };

  it('crea una orden con total y detalle', () => {
    const { orden } = db.crearOrden(datos);
    expect(orden.total).toBe(2500);
    expect(orden.montoTotal).toBe('$2.500');
    expect(db.detalleDeOrden(orden)).toHaveLength(2);
    expect(db.obtenerOrden(orden.id).cliente).toBe('Ana');
  });
  it('no crea órdenes vacías', () => expect(db.crearOrden({ ...datos, items: [] }).exito).toBe(false));
  it('cambia el estado y rechaza estados inválidos', () => {
    const { orden } = db.crearOrden(datos);
    expect(db.actualizarEstadoOrden(orden.id, 'Enviado').orden.estado).toBe('Enviado');
    expect(db.actualizarEstadoOrden(orden.id, 'Inventado').exito).toBe(false);
  });
  it('interpreta el texto de las órdenes antiguas', () => {
    expect(db.detalleDeOrden({ items: '2x Torta ($20.000); 1x Jugo ($1.500)' })).toEqual([
      { nombre: 'Torta', cantidad: 2, precio: 10000 }, { nombre: 'Jugo', cantidad: 1, precio: 1500 }
    ]);
  });
  it('ordenesDeUsuario filtra por correo', () => {
    db.crearOrden(datos);
    expect(db.ordenesDeUsuario('ANA@x.cl')).toHaveLength(1);
  });
  it('resumenVentas no cuenta ingresos de pagos rechazados', () => {
    const antes = db.resumenVentas().ingresos;
    db.crearOrden({ ...datos, estado: 'Pago rechazado' });
    expect(db.resumenVentas().ingresos).toBe(antes);
    db.crearOrden(datos);
    expect(db.resumenVentas().ingresos).toBe(antes + 2500);
  });
  it('inventarioPorCategoria entrega una fila por categoría', () => {
    expect(db.inventarioPorCategoria()).toHaveLength(6);
    expect(db.inventarioPorCategoria()[0]).toHaveProperty('valor');
  });
  it('usuariosPorRol cuenta por rol', () => expect(db.usuariosPorRol().Administrador).toBeGreaterThan(0));
  it('persiste en localStorage', () => {
    db.crearProducto(nuevoProducto);
    expect(JSON.parse(localStorage.getItem(PRODUCTOS_KEY)).some((p) => p.codigo === 'ZZ001')).toBe(true);
  });
  it('lista artículos del blog', () => {
    expect(db.listarArticulos().length).toBe(3);
    expect(db.obtenerArticulo('receta-merengues-crujientes').autor).toContain('Elena');
    expect(db.obtenerArticulo('x')).toBeNull();
  });
});
