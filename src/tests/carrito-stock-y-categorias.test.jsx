import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { TiendaProvider, useTienda } from '../context/TiendaContext';
import ItemCarrito from '../components/molecules/ItemCarrito';
import TarjetaProducto from '../components/molecules/TarjetaProducto';
import { renderizar, escribir, enviarFormulario, formulario, porId, textoDe } from './utils';
import { Rutas } from '../App';
import { CART_KEY, PRODUCTOS_KEY, PRODUCTOS_DEFAULT, obtenerProductos } from '../services/storage';
import { obtenerInsumos } from '../services/insumos';
import { listarOrdenes } from '../services/db';
import { CATEGORIAS_DEFAULT, crearIdCategoria, categoriaDeProducto, validarNombreCategoria } from '../services/categorias';

// "La Cosecha de Papita" (SAN002): sin receta y 2 unidades en vitrina
const sandwich = PRODUCTOS_DEFAULT.find((p) => p.codigo === 'SAN002');
const lineaSandwich = (cantidad) => ({ id: 'SAN002', codigo: 'SAN002', factor: 1, nombre: sandwich.nombre, precio: 1800, imagen: 'menu/Sandwich1', variante: 'entera', cantidad });
const CLIENTE = { run: '201239877', nombre: 'Armando', apellidos: 'Esteban Quito', correo: 'armando.quito@gmail.com', rol: 'Cliente' };

let tienda;
let carrito;
function Espia() {
  tienda = useTienda();
  carrito = useCart();
  return null;
}

const montarCarrito = (lineas) => {
  localStorage.setItem(CART_KEY, JSON.stringify(lineas));
  return render(
    <CartProvider>
      <TiendaProvider>
        <Espia />
        {lineas.map((l) => <ItemCarrito key={l.id + l.variante} item={l} />)}
      </TiendaProvider>
    </CartProvider>
  );
};

describe('Carrito con límite de stock', () => {
  it('el botón + funciona mientras queda stock', () => {
    montarCarrito([lineaSandwich(1)]);
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
    expect(carrito.carrito[0].cantidad).toBe(2);
  });

  it('el botón + se deshabilita al llegar al stock disponible', () => {
    montarCarrito([lineaSandwich(2)]);
    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled();
  });

  it('avisa si en el carrito hay más de lo que queda', () => {
    montarCarrito([lineaSandwich(5)]);
    expect(screen.getByText('Solo quedan 2')).toBeInTheDocument();
  });

  it('agregarConStock no pasa del stock disponible y dice cuánto agregó', () => {
    montarCarrito([]);
    let agregadas;
    act(() => { agregadas = tienda.agregarConStock(sandwich, 'entera', 10); });
    expect(agregadas).toBe(2);
    expect(carrito.carrito[0].cantidad).toBe(2);
  });

  it('un producto agotado no se agrega', () => {
    montarCarrito([]);
    const brownie = PRODUCTOS_DEFAULT.find((p) => p.codigo === 'POS006');
    act(() => tienda.agregarConStock(brownie, 'entera', 1));
    expect(carrito.carrito).toHaveLength(0);
  });

  it('los trozos se agregan con 1/4 de porción y su propio precio', () => {
    montarCarrito([]);
    const trufa = PRODUCTOS_DEFAULT.find((p) => p.codigo === 'TL004');
    act(() => tienda.agregarConStock(trufa, 'trozo', 2));
    expect(carrito.carrito[0]).toMatchObject({ variante: 'trozo', factor: 0.25, cantidad: 2, precio: Math.round(trufa.precio * 0.25) });
  });

  it('bajar la cantidad a 0 quita el producto del carrito', () => {
    montarCarrito([lineaSandwich(1)]);
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad' }));
    expect(carrito.carrito).toEqual([]);
  });
});

describe('Tarjeta del catálogo según lo disponible', () => {
  const trufa = PRODUCTOS_DEFAULT.find((p) => p.codigo === 'TL004');
  const tarjeta = (props) => render(<MemoryRouter><TarjetaProducto producto={trufa} onAgregar={() => {}} {...props} /></MemoryRouter>);

  it('con stock muestra el botón Agregar', () => {
    tarjeta({ disponible: 5 });
    expect(screen.getByRole('button', { name: /agregar torta trufa/i })).toBeEnabled();
  });

  it('sin enteras ni trozos muestra Agotado', () => {
    tarjeta({ disponible: 0, hayTrozos: false });
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar torta trufa/i })).toBeDisabled();
  });

  it('sin enteras pero con trozos invita a ver los trozos', () => {
    tarjeta({ disponible: 0, hayTrozos: true });
    expect(screen.getByText('Solo por trozo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver trozos/i })).toHaveAttribute('href', '/producto/TL004');
  });
});

describe('Stock en las páginas de la tienda', () => {
  it('el catálogo marca como agotado el brownie', () => {
    const c = renderizar(<Rutas />, { ruta: '/productos?categoria=postres' });
    const brownie = [...c.querySelectorAll('.mcard')].find((t) => t.textContent.includes('Brownie con Nueces'));
    expect(brownie.textContent).toContain('Agotado');
  });

  it('el detalle no deja pedir más de lo disponible', () => {
    const c = renderizar(<Rutas />, { ruta: '/producto/TAR002' });
    const mas = [...c.querySelectorAll('button')].find((b) => b.textContent.trim() === '+');
    for (let i = 0; i < 5; i++) act(() => mas.click());
    expect(mas.previousElementSibling.textContent).toBe('3');
    expect(mas.disabled).toBe(true);
  });

  it('el pago aprobado descuenta de la vitrina y luego de los insumos', () => {
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(CLIENTE));
    localStorage.setItem(CART_KEY, JSON.stringify([{ ...lineaSandwich(1), id: 'TAR002', codigo: 'TAR002', nombre: 'Tartaleta Crema de Naranja', precio: 3700, cantidad: 3 }]));
    const naranjasAntes = obtenerInsumos().find((i) => i.id === 'naranjas').stock;
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    escribir(porId(c, 'coTelefono'), '+56 9 1234 5678');
    escribir(porId(c, 'coTarjeta'), '4532015112830366');
    escribir(porId(c, 'coVence'), '12/99');
    escribir(porId(c, 'coCvv'), '123');
    enviarFormulario(formulario(c));
    expect(obtenerProductos().find((p) => p.codigo === 'TAR002').stock).toBe(0);
    expect(obtenerInsumos().find((i) => i.id === 'naranjas').stock).toBe(naranjasAntes - 2);
    expect(listarOrdenes().at(-1)).toMatchObject({ estado: 'Pendiente', tipoEntrega: 'retiro' });
  });

  it('si el stock se acabó antes de pagar, avisa y no crea la orden', () => {
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(CLIENTE));
    localStorage.setItem(CART_KEY, JSON.stringify([lineaSandwich(2)]));
    obtenerProductos();
    const productos = JSON.parse(localStorage.getItem(PRODUCTOS_KEY)).map((p) => (p.codigo === 'SAN002' ? { ...p, stock: 1 } : p));
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
    const ordenesAntes = listarOrdenes().length;
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    escribir(porId(c, 'coTelefono'), '+56 9 1234 5678');
    escribir(porId(c, 'coTarjeta'), '4532015112830366');
    escribir(porId(c, 'coVence'), '12/99');
    escribir(porId(c, 'coCvv'), '123');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Ya no hay stock suficiente de La Cosecha de Papita');
    expect(listarOrdenes()).toHaveLength(ordenesAntes);
    expect(JSON.parse(localStorage.getItem(CART_KEY))).toHaveLength(1);
  });

  it('el pago rechazado no descuenta stock', () => {
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(CLIENTE));
    localStorage.setItem(CART_KEY, JSON.stringify([lineaSandwich(1)]));
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    escribir(porId(c, 'coTelefono'), '+56 9 1234 5678');
    escribir(porId(c, 'coTarjeta'), '4000 0000 0000 0002');
    escribir(porId(c, 'coVence'), '12/99');
    escribir(porId(c, 'coCvv'), '123');
    enviarFormulario(formulario(c));
    expect(listarOrdenes().at(-1).estado).toBe('Pago rechazado');
    expect(obtenerProductos().find((p) => p.codigo === 'SAN002').stock).toBe(2);
  });
});

describe('Categorías', () => {
  it('son 6, con Bebestibles e Infusiones separadas', () => {
    expect(CATEGORIAS_DEFAULT.map((c) => c.id)).toEqual(['tortas', 'bebestibles', 'infusiones', 'sandwiches', 'tartaletas', 'postres']);
    CATEGORIAS_DEFAULT.forEach((c) => expect(c.descripcion).toBeTruthy());
  });

  it('crea ids iguales a los de las URLs de la tienda', () => {
    expect(crearIdCategoria('Sin Azúcar')).toBe('sin-azucar');
    expect(crearIdCategoria('Pan & Café')).toBe('pan-cafe');
  });

  it('encuentra la categoría de un producto por su nombre', () => {
    expect(categoriaDeProducto('tortas', CATEGORIAS_DEFAULT).id).toBe('tortas');
    expect(categoriaDeProducto('Pan amasado', CATEGORIAS_DEFAULT)).toBeNull();
  });

  it('valida el nombre de una categoría nueva', () => {
    expect(validarNombreCategoria('Galletas', CATEGORIAS_DEFAULT).valido).toBe(true);
    expect(validarNombreCategoria('Po', CATEGORIAS_DEFAULT).valido).toBe(false);
    expect(validarNombreCategoria('x'.repeat(31), CATEGORIAS_DEFAULT).valido).toBe(false);
    expect(validarNombreCategoria('postres', CATEGORIAS_DEFAULT).mensaje).toBe('Ya existe una categoría con ese nombre');
    expect(validarNombreCategoria('Postres', CATEGORIAS_DEFAULT, 'postres').valido).toBe(true);
  });
});
