import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BarraNavegacion, { ENLACES } from '../components/organisms/BarraNavegacion';
import { Rutas } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';

const NOMBRES = ['Inicio', 'Nosotros', 'Menú', 'Equipo', 'Reservacion', 'Reseñas', 'Contacto'];

const conProviders = (ui, ruta = '/') => (
  <MemoryRouter initialEntries={[ruta]}>
    <AuthProvider><CartProvider><TiendaProvider>{ui}</TiendaProvider></CartProvider></AuthProvider>
  </MemoryRouter>
);
const enlacesDeLaBarra = (container) => [...container.querySelectorAll('#nav .navbar-nav a')];

describe('Barra superior', () => {
  it('muestra los siete nombres de PAPITA_REACT, en el mismo orden', () => {
    const { container } = render(conProviders(<BarraNavegacion />));
    expect(enlacesDeLaBarra(container).map((a) => a.textContent.trim())).toEqual(NOMBRES);
  });

  it('ENLACES define exactamente esos nombres', () => {
    expect(ENLACES.map((e) => e.texto)).toEqual(NOMBRES);
  });

  it('ya no muestra los nombres anteriores (Categorías, Ofertas, Blog)', () => {
    render(conProviders(<BarraNavegacion />));
    expect(screen.queryByRole('link', { name: 'Categorías' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ofertas' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull();
  });

  it('cada enlace apunta al panel de la portada con ese id', () => {
    const { container } = render(conProviders(<BarraNavegacion />));
    const hrefs = enlacesDeLaBarra(container).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#hero', '/#about', '/#menu', '/#chefs', '/#reservation', '/#testimonials', '/#contact-section']);
  });

  it('en la portada, "Inicio" parte marcado como activo y los demás no', () => {
    const { container } = render(conProviders(<BarraNavegacion />, '/'));
    const activos = enlacesDeLaBarra(container).filter((a) => a.className.includes('active'));
    expect(activos).toHaveLength(1);
    expect(activos[0].textContent).toBe('Inicio');
  });

  it('fuera de la portada ningún enlace aparece activo', () => {
    const { container } = render(conProviders(<BarraNavegacion />, '/productos'));
    expect(enlacesDeLaBarra(container).filter((a) => a.className.includes('active'))).toHaveLength(0);
  });

  it('mantiene el buscador, el carrito y el acceso a la cuenta', () => {
    const { container } = render(conProviders(<BarraNavegacion />));
    expect(container.querySelector('#navSearchBtn')).not.toBeNull();
    expect(container.querySelector('#cartToggle')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('el logo vuelve a la portada', () => {
    const { container } = render(conProviders(<BarraNavegacion />, '/productos'));
    expect(container.querySelector('.navbar-brand').getAttribute('href')).toBe('/');
  });
});

describe('Navegación desde la barra', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const abrirTienda = (ruta) => render(conProviders(<Rutas />, ruta)).container;

  it('desde otra página, "Equipo" lleva a la portada', () => {
    const c = abrirTienda('/productos');
    fireEvent.click(screen.getAllByRole('link', { name: 'Equipo' })[0]);
    expect(c.querySelector('h1.htitle')).not.toBeNull();
    expect(c.querySelector('#chefs')).not.toBeNull();
  });

  it('al elegir un enlace baja hasta su panel con scroll suave', () => {
    const c = abrirTienda('/productos');
    fireEvent.click(screen.getAllByRole('link', { name: 'Reservacion' })[0]);
    act(() => { vi.advanceTimersByTime(200); });
    expect(c.querySelector('#reservation')).not.toBeNull();
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });
});
