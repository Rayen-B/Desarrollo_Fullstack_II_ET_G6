import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerCarrito, guardarCarrito } from '../services/storage';
import { FACTOR_TROZO } from '../utils/stock';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState(() => obtenerCarrito());
  const [mostrarModalCarrito, setMostrarModalCarrito] = useState(false);

  useEffect(() => {
    guardarCarrito(carrito);
  }, [carrito]);

  const agregarAlCarrito = (producto, variante = 'entera', cantidad = 1) => {
    setCarrito((prev) => {
      const itemExistente = prev.find(
        (item) => item.id === producto.id && item.variante === variante
      );
      if (itemExistente) {
        return prev.map((item) =>
          item.id === producto.id && item.variante === variante
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [
        ...prev,
        {
          id: producto.id || producto.codigo,
          codigo: producto.codigo,
          factor: variante === 'trozo' ? FACTOR_TROZO : 1,
          nombre: producto.nombre,
          precio: variante === 'trozo' ? Math.round(producto.precio * 0.25) : producto.precio,
          imagen: producto.imagen,
          variante: variante,
          cantidad: cantidad
        }
      ];
    });
  };

  const eliminarDelCarrito = (id, variante) => {
    setCarrito((prev) => prev.filter((item) => !(item.id === id && item.variante === variante)));
  };

  const actualizarCantidad = (id, variante, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, variante);
      return;
    }
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id && item.variante === variante ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        totalCantidad,
        totalPrecio,
        mostrarModalCarrito,
        setMostrarModalCarrito
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
