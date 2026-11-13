import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderizar, clic } from './utils';
import { Rutas } from '../App';
import { descontarVenta, devolverVenta } from '../utils/stock';
import {
  listarOrdenes, listarProductos, crearOrden, descontarStock, cancelarOrden, cancelarTransferenciasVencidas, obtenerOrden
} from '../services/db';
import { obtenerInsumos } from '../services/insumos';

const ADMIN = { run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita', correo: 'admin@papitadulce.cl', password: 'admin', rol: 'Administrador' };
const iniciarComo = (u) => localStorage.setItem('tienda_usuario_sesion', JSON.stringify(u));

const stockDe = (codigo) => listarProductos().find((p) => p.codigo === codigo).stock;
const insumosActuales = () => Object.fromEntries(obtenerInsumos().map((i) => [i.id, i.stock]));

// Compra por transferencia que usa toda la vitrina de TS005 y prepara 2 tortas más con insumos
function comprarPorTransferencia({ plazo } = {}) {
  const vitrina = stockDe('TS005');
  const items = [{ codigo: 'TS005', nombre: 'Torta San Jorge', precio: 18900, cantidad: vitrina + 2, factor: 1 }];
  const stock = descontarStock(items);
  expect(stock.exito).toBe(true);
  const { orden } = crearOrden({
    cliente: 'Ana Test', correo: 'ana@gmail.com', entrega: 'Retiro en tienda', metodoPago: 'transferencia',
    estado: 'Pendiente de pago', items, movimientoStock: stock.movimientos
  });
  if (plazo) {
    localStorage.setItem('papita_dulce_orders', JSON.stringify(listarOrdenes().map((o) => (o.id === orden.id ? { ...o, plazoPago: plazo } : o))));
  }
  return orden;
}

describe('devolverVenta()', () => {
  const insumos = [{ id: 'harina', stock: 1000 }, { id: 'huevos', stock: 6 }];
  const productos = [{ codigo: 'TAR', stock: 1, receta: [{ insumoId: 'harina', cantidad: 250 }, { insumoId: 'huevos', cantidad: 3 }] }];

  it('deja la vitrina y los insumos como estaban antes de la venta', () => {
    const venta = descontarVenta(productos, insumos, [{ codigo: 'TAR', cantidad: 3, factor: 1 }]);
    expect(venta.movimientos).toEqual({ vitrina: { TAR: 1 }, insumos: { harina: 500, huevos: 6 } });
    const devuelto = devolverVenta(venta.productos, venta.insumos, venta.movimientos);
    expect(devuelto.productos[0].stock).toBe(1);
    expect(devuelto.insumos).toEqual(insumos);
  });

  it('sin movimientos no cambia nada', () => {
    expect(devolverVenta(productos, insumos, null)).toEqual({ productos, insumos });
  });
});

describe('Cancelar orden', () => {
  it('devuelve la vitrina y los ingredientes de lo que se preparó', () => {
    const vitrinaAntes = stockDe('TS005');
    const insumosAntes = insumosActuales();
    const orden = comprarPorTransferencia();
    expect(stockDe('TS005')).toBe(0);
    expect(insumosActuales().harina).toBeLessThan(insumosAntes.harina);

    const r = cancelarOrden(orden.id, 'Cancelada por la tienda');
    expect(r.exito).toBe(true);
    expect(r.orden.estado).toBe('Cancelado');
    expect(r.orden.motivoCancelacion).toBe('Cancelada por la tienda');
    expect(stockDe('TS005')).toBe(vitrinaAntes);
    expect(insumosActuales()).toEqual(insumosAntes);
  });

  it('no devuelve el stock dos veces', () => {
    const vitrinaAntes = stockDe('TS005');
    const orden = comprarPorTransferencia();
    cancelarOrden(orden.id);
    expect(cancelarOrden(orden.id).exito).toBe(false);
    expect(stockDe('TS005')).toBe(vitrinaAntes);
  });

  it('una orden antigua sin registro devuelve sus unidades a la vitrina', () => {
    const antes = stockDe('TC002');
    const { orden } = crearOrden({
      cliente: 'Ana', correo: 'a@a.cl', entrega: 'Retiro en tienda', metodoPago: 'transferencia', estado: 'Pendiente de pago',
      items: [{ codigo: 'TC002', nombre: 'Torta Selva Negra', precio: 19900, cantidad: 2 }]
    });
    cancelarOrden(orden.id);
    expect(stockDe('TC002')).toBe(antes + 2);
  });

  it('una orden que no existe no se puede cancelar', () => {
    expect(cancelarOrden('NO-EXISTE').exito).toBe(false);
  });
});

describe('Vencimiento automático de transferencias', () => {
  it('cancela las vencidas y devuelve su stock', () => {
    const vitrinaAntes = stockDe('TS005');
    const orden = comprarPorTransferencia({ plazo: new Date(Date.now() - 60 * 1000).toISOString() });
    expect(cancelarTransferenciasVencidas()).toBe(1);
    expect(obtenerOrden(orden.id).estado).toBe('Cancelado');
    expect(obtenerOrden(orden.id).motivoCancelacion).toBe('Plazo de pago vencido');
    expect(stockDe('TS005')).toBe(vitrinaAntes);
  });

  it('no toca las que aún están dentro del plazo', () => {
    const orden = comprarPorTransferencia();
    expect(cancelarTransferenciasVencidas()).toBe(0);
    expect(obtenerOrden(orden.id).estado).toBe('Pendiente de pago');
  });

  it('se revisan solas al abrir el panel de órdenes', () => {
    const orden = comprarPorTransferencia({ plazo: new Date(Date.now() - 60 * 1000).toISOString() });
    iniciarComo(ADMIN);
    renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    expect(obtenerOrden(orden.id).estado).toBe('Cancelado');
  });
});

describe('Botón "Cancelar orden" en el admin', () => {
  const abrirDetalle = (orden) => {
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    const fila = [...c.querySelectorAll('tbody tr')].find((tr) => tr.textContent.includes(orden.id));
    clic(fila.querySelector('button'));
    return c;
  };

  it('pide confirmación y, al aceptar, cancela y devuelve el stock', () => {
    const vitrinaAntes = stockDe('TS005');
    const orden = comprarPorTransferencia();
    abrirDetalle(orden);
    clic(document.getElementById('cancelar-orden'));
    expect(document.getElementById('confirmar-cancelacion')).toHaveTextContent('¿Cancelar la orden?');
    expect(obtenerOrden(orden.id).estado).toBe('Pendiente de pago');
    clic(document.getElementById('si-cancelar-orden'));
    expect(obtenerOrden(orden.id).estado).toBe('Cancelado');
    expect(stockDe('TS005')).toBe(vitrinaAntes);
    expect(document.getElementById('modal-ord-estado').textContent).toBe('Cancelado');
    expect(document.getElementById('modal-ord-cancelacion')).toHaveTextContent('Cancelada por la tienda');
  });

  it('al decir "No" la orden sigue pendiente', () => {
    const orden = comprarPorTransferencia();
    abrirDetalle(orden);
    clic(document.getElementById('cancelar-orden'));
    clic([...document.querySelectorAll('#confirmar-cancelacion button')].find((b) => b.textContent.includes('No')));
    expect(obtenerOrden(orden.id).estado).toBe('Pendiente de pago');
    expect(document.getElementById('cancelar-orden')).toBeInTheDocument();
  });

  it('solo aparece en órdenes pendientes de pago', () => {
    const { orden } = crearOrden({
      cliente: 'Ana', correo: 'a@a.cl', entrega: 'Retiro en tienda', metodoPago: 'tarjeta',
      items: [{ codigo: 'TS005', nombre: 'Torta', precio: 5000, cantidad: 1 }]
    });
    abrirDetalle(orden);
    expect(document.getElementById('cancelar-orden')).toBeNull();
  });
});
