import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';

const montados = [];

// Dibuja un componente dentro de un div real del DOM y devuelve el contenedor.
// conProviders: envuelve con Router (en la ruta indicada) + Auth + Carrito + Tienda.
export function renderizar(ui, { ruta = '/', conProviders = true } = {}) {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);
  const arbol = conProviders ? (
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider><CartProvider><TiendaProvider>{ui}</TiendaProvider></CartProvider></AuthProvider>
    </MemoryRouter>
  ) : ui;
  act(() => raiz.render(arbol));
  montados.push({ raiz, contenedor });
  return contenedor;
}

export function limpiarRenders() {
  while (montados.length) {
    const { raiz, contenedor } = montados.pop();
    act(() => raiz.unmount());
    contenedor.remove();
  }
}

// Simula un clic de usuario
export function clic(elemento) {
  act(() => { elemento.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
}

// Simula que el usuario escribe en un input/textarea/select (compatible con inputs controlados de React)
export function escribir(elemento, valor) {
  const proto = Object.getPrototypeOf(elemento);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  act(() => {
    setter.call(elemento, valor);
    elemento.dispatchEvent(new Event(elemento.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

// Simula que el campo pierde el foco
export function salirDe(elemento) {
  act(() => { elemento.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
}

export function enviarFormulario(form) {
  act(() => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
}

export const porId = (contenedor, id) => contenedor.querySelector('#' + id);
export const textoDe = (contenedor) => contenedor.textContent.replace(/\s+/g, ' ').trim();

// El formulario principal de la página (el buscador superpuesto también tiene un <form>)
export const formulario = (c) => c.querySelector('main form') || c.querySelector('form');
