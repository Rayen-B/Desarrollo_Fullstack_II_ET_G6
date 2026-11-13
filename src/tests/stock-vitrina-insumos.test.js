import { describe, it, expect } from 'vitest';
import {
  FACTOR_TROZO, factorDeItem, calcularPreparables, disponibleProducto, esProductoCritico,
  disponiblePorFactor, descontarVenta, maximoAgregable
} from '../utils/stock';

const insumos = [
  { id: 'harina', stock: 1000 },
  { id: 'huevos', stock: 6 },
  { id: 'naranjas', stock: 2 }
];
const tarta = {
  codigo: 'TAR', nombre: 'Tartaleta', stock: 2, stockCritico: 3,
  receta: [{ insumoId: 'harina', cantidad: 250 }, { insumoId: 'huevos', cantidad: 3 }, { insumoId: 'naranjas', cantidad: 2 }]
};
const sandwich = { codigo: 'SAN', nombre: 'Sándwich', stock: 4, stockCritico: 2, receta: [] };

describe('calcularPreparables()', () => {
  it('lo limita el insumo que alcanza para menos unidades', () => {
    // harina alcanza para 4, huevos para 2, naranjas para 1
    expect(calcularPreparables(tarta.receta, insumos)).toBe(1);
  });

  it('un trozo usa 1/4 de la receta', () => {
    // naranjas: 2 / (2 * 1/4) = 4 trozos; huevos: 6 / (3/4) = 8
    expect(calcularPreparables(tarta.receta, insumos, FACTOR_TROZO)).toBe(4);
  });

  it('sin receta no se puede preparar nada', () => {
    expect(calcularPreparables([], insumos)).toBe(0);
    expect(calcularPreparables(undefined, insumos)).toBe(0);
  });

  it('si la receta usa un insumo que no existe, no se puede preparar', () => {
    expect(calcularPreparables([{ insumoId: 'chocolate', cantidad: 100 }], insumos)).toBe(0);
  });
});

describe('disponibilidad y stock crítico', () => {
  it('disponible = vitrina + preparables', () => {
    expect(disponibleProducto(tarta, insumos)).toBe(3);
    expect(disponibleProducto(sandwich, insumos)).toBe(4);
  });

  it('es crítico cuando lo disponible es menor o igual al stock crítico', () => {
    expect(esProductoCritico(tarta, insumos)).toBe(true);
    expect(esProductoCritico(sandwich, insumos)).toBe(false);
  });

  it('un stock de vitrina negativo o vacío cuenta como 0', () => {
    expect(disponibleProducto({ ...sandwich, stock: -5 }, insumos)).toBe(0);
    expect(disponibleProducto({ ...sandwich, stock: undefined }, insumos)).toBe(0);
  });

  it('los trozos no cuentan la vitrina', () => {
    expect(disponiblePorFactor(tarta, insumos, FACTOR_TROZO)).toBe(4);
    expect(disponiblePorFactor(sandwich, insumos, FACTOR_TROZO)).toBe(0);
  });
});

describe('descontarVenta()', () => {
  it('vende primero desde la vitrina y luego prepara con los insumos', () => {
    const r = descontarVenta([tarta], insumos, [{ codigo: 'TAR', factor: 1, cantidad: 3 }]);
    expect(r.ok).toBe(true);
    expect(r.productos[0].stock).toBe(0);
    expect(r.insumos.find((i) => i.id === 'naranjas').stock).toBe(0);
    expect(r.insumos.find((i) => i.id === 'harina').stock).toBe(750);
  });

  it('si alcanza la vitrina, no toca los insumos', () => {
    const r = descontarVenta([tarta], insumos, [{ codigo: 'TAR', factor: 1, cantidad: 2 }]);
    expect(r.productos[0].stock).toBe(0);
    expect(r.insumos).toEqual(insumos);
  });

  it('un trozo descuenta 1/4 de cada insumo y no toca la vitrina', () => {
    const r = descontarVenta([tarta], insumos, [{ codigo: 'TAR', factor: FACTOR_TROZO, cantidad: 1 }]);
    expect(r.productos[0].stock).toBe(2);
    expect(r.insumos.find((i) => i.id === 'huevos').stock).toBe(5.25);
  });

  it('falla y avisa qué producto falta si no hay stock suficiente', () => {
    const r = descontarVenta([tarta], insumos, [{ codigo: 'TAR', factor: 1, cantidad: 4, nombre: 'Tartaleta' }]);
    expect(r.ok).toBe(false);
    expect(r.faltante).toBe('Tartaleta');
  });

  it('un producto sin receta no puede venderse más allá de su vitrina', () => {
    expect(descontarVenta([sandwich], insumos, [{ codigo: 'SAN', cantidad: 5 }]).ok).toBe(false);
  });

  it('no modifica las listas originales', () => {
    descontarVenta([tarta], insumos, [{ codigo: 'TAR', factor: 1, cantidad: 3 }]);
    expect(tarta.stock).toBe(2);
    expect(insumos.find((i) => i.id === 'naranjas').stock).toBe(2);
  });

  it('ignora las líneas del carrito que no están en el inventario', () => {
    const r = descontarVenta([tarta], insumos, [{ codigo: 'NO-EXISTE', cantidad: 10 }]);
    expect(r.ok).toBe(true);
  });
});

describe('maximoAgregable()', () => {
  it('descuenta lo que ya está en el carrito', () => {
    expect(maximoAgregable(tarta, 1, [], [tarta], insumos)).toBe(3);
    expect(maximoAgregable(tarta, 1, [{ codigo: 'TAR', factor: 1, cantidad: 2 }], [tarta], insumos)).toBe(1);
  });

  it('las tartaletas enteras del carrito reducen los trozos disponibles', () => {
    const carrito = [{ codigo: 'TAR', factor: 1, cantidad: 3 }];
    expect(maximoAgregable(tarta, FACTOR_TROZO, carrito, [tarta], insumos)).toBe(0);
  });

  it('es 0 si el carrito ya supera lo disponible', () => {
    expect(maximoAgregable(sandwich, 1, [{ codigo: 'SAN', cantidad: 9 }], [sandwich], insumos)).toBe(0);
  });
});

describe('factorDeItem()', () => {
  it('usa el factor guardado o lo deduce de la variante (carritos antiguos)', () => {
    expect(factorDeItem({ factor: 1 })).toBe(1);
    expect(factorDeItem({ variante: 'trozo' })).toBe(FACTOR_TROZO);
    expect(factorDeItem({ variante: 'entera' })).toBe(1);
    expect(factorDeItem({})).toBe(1);
  });
});
