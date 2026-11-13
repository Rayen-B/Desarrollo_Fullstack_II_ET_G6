import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';

const torta = { id: 'TC001', codigo: 'TC001', nombre: 'Torta', precio: 10000, imagen: 'x' };
const envoltura = ({ children }) => <CartProvider>{children}</CartProvider>;
const abrirCarrito = () => renderHook(() => useCart(), { wrapper: envoltura });

describe('CartContext', () => {
  it('empieza con el carrito vacío', () => {
    const { result } = abrirCarrito();
    expect(result.current.carrito).toEqual([]);
    expect(result.current.totalCantidad).toBe(0);
    expect(result.current.totalPrecio).toBe(0);
  });

  it('agrega un producto al carrito', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    expect(result.current.carrito).toHaveLength(1);
    expect(result.current.totalPrecio).toBe(10000);
  });

  it('agregar el mismo producto suma la cantidad (no duplica la fila)', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    act(() => result.current.agregarAlCarrito(torta, 'entera', 2));
    expect(result.current.carrito).toHaveLength(1);
    expect(result.current.totalCantidad).toBe(3);
  });

  it('la variante "trozo" cuesta el 25% del precio', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'trozo', 1));
    expect(result.current.carrito[0].precio).toBe(2500);
  });

  it('actualiza la cantidad de un producto', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    act(() => result.current.actualizarCantidad('TC001', 'entera', 5));
    expect(result.current.carrito[0].cantidad).toBe(5);
  });

  it('cantidad 0 elimina el producto', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    act(() => result.current.actualizarCantidad('TC001', 'entera', 0));
    expect(result.current.carrito).toHaveLength(0);
  });

  it('cantidad negativa también elimina el producto', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    act(() => result.current.actualizarCantidad('TC001', 'entera', -2));
    expect(result.current.carrito).toHaveLength(0);
  });

  it('eliminar un producto que no existe no cambia el carrito', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    act(() => result.current.eliminarDelCarrito('NO-EXISTE', 'entera'));
    expect(result.current.carrito).toHaveLength(1);
  });

  it('vaciar deja el carrito en cero', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 3));
    act(() => result.current.vaciarCarrito());
    expect(result.current.totalCantidad).toBe(0);
  });

  it('guarda el carrito en localStorage', () => {
    const { result } = abrirCarrito();
    act(() => result.current.agregarAlCarrito(torta, 'entera', 1));
    expect(JSON.stringify(Object.values(localStorage))).toContain('Torta');
  });
});
