import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Rutas } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';
import { AUTH_KEY } from '../services/storage';

function abrirRuta(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider><CartProvider><TiendaProvider>
        <Rutas />
      </TiendaProvider></CartProvider></AuthProvider>
    </MemoryRouter>
  );
}

// Deja una sesión iniciada antes de abrir la ruta
const iniciarSesionComo = (rol) =>
  localStorage.setItem(AUTH_KEY, JSON.stringify({ nombre: 'Persona de prueba', correo: 'x@x.cl', rol }));

describe('Rutas públicas de la tienda', () => {
  it('/login muestra el título "Iniciar sesión"', () => {
    abrirRuta('/login');
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('/registro muestra el título "Crear cuenta"', () => {
    abrirRuta('/registro');
    expect(screen.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeTruthy();
  });

  it('sin sesión, /checkout redirige al login', () => {
    abrirRuta('/checkout');
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('/productos muestra el catálogo', () => {
    abrirRuta('/productos');
    expect(screen.getByRole('heading', { level: 1, name: /nuestro\s*menú/i })).toBeTruthy();
  });

  it('/ofertas muestra la página de ofertas', () => {
    abrirRuta('/ofertas');
    expect(screen.getByRole('heading', { level: 1, name: /nuestras\s*ofertas/i })).toBeTruthy();
  });

  it('la tienda muestra la barra de navegación y el pie de página', () => {
    abrirRuta('/productos');
    expect(screen.getByRole('navigation')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('una ruta que no existe redirige al inicio', () => {
    abrirRuta('/esta-ruta-no-existe');
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).toBeNull();
    expect(screen.getByRole('main')).toBeTruthy();
  });
});

describe('Rutas protegidas del panel de administración', () => {
  it('sin sesión, /admin redirige al login', () => {
    abrirRuta('/admin');
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('sin sesión, /admin/usuarios también redirige al login', () => {
    abrirRuta('/admin/usuarios');
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('un Cliente no puede entrar al panel: vuelve al inicio', () => {
    iniciarSesionComo('Cliente');
    abrirRuta('/admin');
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).toBeNull();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('un Administrador entra al panel y no ve la barra de la tienda', () => {
    iniciarSesionComo('Administrador');
    abrirRuta('/admin');
    expect(screen.getByText('Panel de Administración - Pastelería Papita Dulce')).toBeTruthy();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('un Vendedor no puede abrir /admin/usuarios: lo envían a productos', () => {
    iniciarSesionComo('Vendedor');
    abrirRuta('/admin/usuarios');
    expect(screen.getByText('Inventario de Productos')).toBeTruthy();
    expect(screen.queryByText('Gestión de Usuarios y Roles')).toBeNull();
  });

  it('con sesión iniciada, /login redirige y ya no muestra el formulario', () => {
    iniciarSesionComo('Cliente');
    abrirRuta('/login');
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).toBeNull();
  });
});
