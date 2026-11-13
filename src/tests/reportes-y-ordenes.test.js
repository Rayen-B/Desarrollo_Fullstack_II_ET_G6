import { describe, it, expect } from 'vitest';
import {
  productoDeLinea, resumenVentas, productosMasVendidos,
  ventasPorCategoria, ventasPorMetodoPago, ordenesPorEstado
} from '../utils/reportes';
import { detalleOrden, resumenProductos, entregaOrden, desgloseIva, numeroOrden, fechaChilena, textoMetodoPago } from '../utils/ordenes';

const productos = [
  { codigo: 'TL004', nombre: 'Torta Trufa', categoria: 'Tortas' },
  { codigo: 'SAN003', nombre: 'Sándwich de Jamón y Queso', categoria: 'Sándwiches' }
];

const ordenes = [
  { id: 'A', fecha: '2026-10-14', estado: 'Pendiente', total: 18900, metodoPago: 'tarjeta', tipoEntrega: 'retiro', detalle: [{ codigo: 'TL004', nombre: 'Torta Trufa', cantidad: 1, precio: 18900 }] },
  { id: 'B', fecha: '2026-10-01', estado: 'Enviado', total: 8200, metodoPago: 'efectivo', tipoEntrega: 'despacho', detalle: [{ codigo: 'SAN003', nombre: 'Sándwich de jamón y queso', cantidad: 2, precio: 2200 }, { nombre: 'Trozo de Torta Trufa', cantidad: 1, precio: 3800 }] },
  { id: 'C', fecha: '2026-06-02', estado: 'Cancelado', total: 25000, metodoPago: 'efectivo', items: '1x Empolvados ($25.000)' }
];

describe('productoDeLinea()', () => {
  it('encuentra el producto por código', () => {
    expect(productoDeLinea({ codigo: 'TL004', nombre: 'otro nombre' }, productos).nombre).toBe('Torta Trufa');
  });

  it('si no hay código, compara el nombre sin mayúsculas, tildes, "de" ni "Trozo de"', () => {
    expect(productoDeLinea({ nombre: 'Torta de Trufa' }, productos).codigo).toBe('TL004');
    expect(productoDeLinea({ nombre: 'Trozo de Torta Trufa' }, productos).codigo).toBe('TL004');
    expect(productoDeLinea({ nombre: 'sandwich de jamon y queso' }, productos).codigo).toBe('SAN003');
  });

  it('devuelve null si el producto no existe', () => {
    expect(productoDeLinea({ nombre: 'Empolvados' }, productos)).toBeNull();
  });
});

describe('resumen y rankings de ventas', () => {
  it('suma totales, cuenta órdenes y calcula el ticket promedio', () => {
    expect(resumenVentas(ordenes.slice(0, 2))).toEqual({ total: 27100, cantidad: 2, promedio: 13550, unidades: 4 });
  });

  it('sin órdenes todo es 0 (sin dividir por cero)', () => {
    expect(resumenVentas([])).toEqual({ total: 0, cantidad: 0, promedio: 0, unidades: 0 });
  });

  it('junta las ventas del mismo producto aunque el nombre venga distinto', () => {
    const ranking = productosMasVendidos(ordenes.slice(0, 2), productos);
    expect(ranking).toHaveLength(2);
    expect(ranking.find((r) => r.nombre === 'Torta Trufa')).toMatchObject({ unidades: 2, monto: 22700 });
  });

  it('ordena por unidades y, si empatan, por lo recaudado', () => {
    const ranking = productosMasVendidos(ordenes.slice(0, 2), productos);
    expect(ranking.map((r) => r.nombre)).toEqual(['Torta Trufa', 'Sándwich de Jamón y Queso']);
  });

  it('agrupa por categoría y los porcentajes suman 100', () => {
    const categorias = ventasPorCategoria(ordenes, productos);
    expect(categorias.map((c) => c.nombre)).toEqual(['Sin categoría', 'Tortas', 'Sándwiches']);
    expect(categorias.reduce((t, c) => t + c.porcentaje, 0)).toBe(100);
  });

  it('agrupa por método de pago con texto legible', () => {
    expect(ventasPorMetodoPago(ordenes).map((m) => m.nombre)).toEqual(['Efectivo', 'Tarjeta de crédito / débito']);
  });

  it('cuenta las órdenes por estado', () => {
    expect(ordenesPorEstado(ordenes)).toEqual({ Pendiente: 1, Enviado: 1, Cancelado: 1 });
  });
});

describe('utilidades de órdenes y boleta', () => {
  it('lee el detalle de órdenes antiguas guardadas solo como texto', () => {
    expect(detalleOrden(ordenes[2])).toEqual([{ nombre: 'Empolvados', cantidad: 1, precio: 25000 }]);
  });

  it('resume los productos de una orden para la tabla', () => {
    expect(resumenProductos(ordenes[1])).toBe('2x Sándwich de jamón y queso y 1 más (3 un.)');
    expect(resumenProductos({ items: '' })).toBe('Sin productos');
  });

  it('separa neto e IVA (19%) y el total no cambia', () => {
    const { neto, iva, total } = desgloseIva(11900);
    expect(neto).toBe(10000);
    expect(iva).toBe(1900);
    expect(neto + iva).toBe(total);
  });

  it('identifica el tipo de entrega y el método de pago', () => {
    expect(entregaOrden(ordenes[1]).tipo).toBe('Despacho a domicilio');
    expect(entregaOrden({ entrega: 'Retiro en tienda' }).tipo).toBe('Retiro en tienda');
    expect(textoMetodoPago('bitcoin')).toBe('No registrado');
  });

  it('formatea el número y la fecha de la orden', () => {
    expect(numeroOrden({ numero: '#ORD-1001' })).toBe('ORD-1001');
    expect(fechaChilena('2026-06-01')).toBe('01-06-2026');
  });
});
