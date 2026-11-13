import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useCart } from './CartContext';
import { obtenerProductos, PRODUCTOS_KEY } from '../services/storage';
import { obtenerInsumos, INSUMOS_KEY } from '../services/insumos';
import { maximoAgregable, FACTOR_TROZO } from '../utils/stock';

const leerCatalogo = () => ({ productos: obtenerProductos(), insumos: obtenerInsumos() });
const factorDe = (variante) => (variante === 'trozo' ? FACTOR_TROZO : 1);

// Estado compartido de la tienda: buscador superpuesto, panel lateral del carrito y stock disponible
const TiendaContext = createContext();

export function TiendaProvider({ children }) {
  const { carrito, agregarAlCarrito, setMostrarModalCarrito } = useCart();
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);

  // Productos e insumos actuales (para saber qué está disponible)
  const [catalogo, setCatalogo] = useState(leerCatalogo);
  const recargarCatalogo = useCallback(() => setCatalogo(leerCatalogo()), []);

  // Si el admin cambia el stock en otra pestaña, la tienda se actualiza
  useEffect(() => {
    const alCambiar = (e) => { if (e.key === PRODUCTOS_KEY || e.key === INSUMOS_KEY) recargarCatalogo(); };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, [recargarCatalogo]);

  // Máximo que puede tener en el carrito un producto/presentación (sinItem: línea del carrito que no se cuenta)
  const maximoPara = useCallback((codigo, factor = 1, sinItem = null) => {
    const producto = catalogo.productos.find((p) => p.codigo === codigo);
    const otros = carrito.filter((i) => !(sinItem && i.id === sinItem.id && i.variante === sinItem.variante));
    return maximoAgregable(producto, factor, otros, catalogo.productos, catalogo.insumos);
  }, [catalogo, carrito]);

  // Agrega al carrito sin pasar del stock disponible. Devuelve cuántas unidades se agregaron.
  const agregarConStock = useCallback((producto, variante = 'entera', cantidad = 1) => {
    const permitida = Math.min(cantidad, maximoPara(producto.codigo, factorDe(variante)));
    if (permitida > 0) agregarAlCarrito(producto, variante, permitida);
    return Math.max(0, permitida);
  }, [agregarAlCarrito, maximoPara]);

  const abrirCarrito = useCallback(() => setMostrarModalCarrito(true), [setMostrarModalCarrito]);
  const cerrarCarrito = useCallback(() => setMostrarModalCarrito(false), [setMostrarModalCarrito]);

  return (
    <TiendaContext.Provider
      value={{
        buscadorAbierto,
        setBuscadorAbierto,
        abrirCarrito,
        cerrarCarrito,
        productos: catalogo.productos,
        insumos: catalogo.insumos,
        recargarCatalogo,
        maximoPara,
        agregarConStock
      }}
    >
      {children}
    </TiendaContext.Provider>
  );
}

export function useTienda() {
  return useContext(TiendaContext);
}
