import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import GrillaProductos from '../components/organisms/GrillaProductos';
import FormLogin from '../components/organisms/FormLogin';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { TiendaProvider } from '../context/TiendaContext';

const producto = { codigo: 'TC001', nombre: 'Torta Panqueque', categoria: 'Tortas', precio: 16000, precioAnterior: 0, stock: 5, descripcion: 'Rica torta', imagen: 'menu/Torta_Trufa' };

const conProviders = (ui, ruta = '/') => (
  <MemoryRouter initialEntries={[ruta]}>
    <AuthProvider><CartProvider><TiendaProvider>{ui}</TiendaProvider></CartProvider></AuthProvider>
  </MemoryRouter>
);

describe('GrillaProductos', () => {
  it('renderiza una tarjeta por cada producto', () => {
    const lista = [producto, { ...producto, codigo: 'TC002', nombre: 'Otra' }, { ...producto, codigo: 'TC003', nombre: 'Tercera' }];
    render(conProviders(<GrillaProductos productos={lista} />));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('muestra el mensaje por defecto cuando la lista está vacía', () => {
    render(conProviders(<GrillaProductos productos={[]} />));
    expect(screen.getByRole('status').textContent).toBe('No encontramos productos para mostrar.');
  });

  it('muestra un mensaje personalizado cuando la lista está vacía', () => {
    render(conProviders(<GrillaProductos productos={[]} mensajeVacio="Sin resultados" />));
    expect(screen.getByText('Sin resultados')).toBeTruthy();
  });

  it('con productos no muestra el mensaje de lista vacía', () => {
    render(conProviders(<GrillaProductos productos={[producto]} />));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('agregar un producto guarda el carrito en localStorage', () => {
    render(conProviders(<GrillaProductos productos={[producto]} />));
    fireEvent.click(screen.getByRole('button', { name: /agregar torta panqueque/i }));
    expect(localStorage.length).toBeGreaterThan(0);
  });
});

describe('FormLogin', () => {
  const abrirLogin = () => render(
    conProviders(
      <Routes>
        <Route path="/" element={<FormLogin />} />
        <Route path="/admin" element={<p>Panel de administración</p>} />
      </Routes>
    )
  );

  it('muestra los campos de usuario y contraseña', () => {
    abrirLogin();
    expect(screen.getByLabelText(/correo o usuario/i)).toBeTruthy();
    expect(screen.getByLabelText(/contraseña/i)).toBeTruthy();
  });

  it('no muestra errores al abrir el formulario', () => {
    abrirLogin();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('con los campos vacíos muestra los errores al enviar', () => {
    abrirLogin();
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getAllByRole('alert').length).toBe(2);
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeTruthy();
  });

  it('rechaza un correo mal formado', () => {
    abrirLogin();
    fireEvent.change(screen.getByLabelText(/correo o usuario/i), { target: { value: 'ana@' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'abcd' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getAllByRole('alert').length).toBe(1);
  });

  it('con credenciales incorrectas muestra el mensaje de error', () => {
    abrirLogin();
    fireEvent.change(screen.getByLabelText(/correo o usuario/i), { target: { value: 'nadie@correo.cl' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'Clave@123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getByText('Usuario o contraseña incorrectos.')).toBeTruthy();
  });

  it('admin / admin entra directo al panel de administración', () => {
    abrirLogin();
    fireEvent.change(screen.getByLabelText(/correo o usuario/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getByText('Panel de administración')).toBeTruthy();
  });

  it('el enlace "¿Olvidaste tu contraseña?" cambia al modo recuperar', () => {
    abrirLogin();
    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));
    expect(screen.getByRole('button', { name: /enviar instrucciones/i })).toBeTruthy();
    expect(screen.queryByLabelText(/^contraseña/i)).toBeNull();
  });

  it('en modo recuperar un correo no registrado muestra el aviso', () => {
    abrirLogin();
    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'nadie@correo.cl' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar instrucciones/i }));
    expect(screen.getByText('No encontramos una cuenta con ese correo.')).toBeTruthy();
  });

  it('tiene un link para registrarse', () => {
    abrirLogin();
    expect(screen.getByRole('link', { name: /regístrate aquí/i }).getAttribute('href')).toBe('/registro');
  });
});
