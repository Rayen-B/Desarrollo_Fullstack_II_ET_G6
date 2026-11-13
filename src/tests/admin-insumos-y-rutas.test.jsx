import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import RutaProtegidaAdmin from '../components/organisms/RutaProtegidaAdmin';
import AdminInsumos, { ordenarInsumos, productosQueUsan } from '../pages/admin/AdminInsumos';
import AdminProductos, { filtrarProductos, ordenarProductos } from '../pages/admin/AdminProductos';
import { USUARIOS_DEFAULT, AUTH_KEY, PRODUCTOS_DEFAULT } from '../services/storage';
import { INSUMOS_DEFAULT } from '../services/insumos';

const FUTURO = { v7_startTransition: true, v7_relativeSplatPath: true };

const iniciarSesionComo = (rol) => {
  const usuario = USUARIOS_DEFAULT.find((u) => u.rol === rol);
  localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
};

const montarEn = (ruta, pagina) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[ruta]} future={FUTURO}>
      <Routes>
        <Route path="/" element={<h1>Tienda</h1>} />
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/admin/productos" element={<h1>Inventario</h1>} />
        <Route path="/admin/usuarios" element={<RutaProtegidaAdmin soloAdministrador><h1>Usuarios</h1></RutaProtegidaAdmin>} />
        <Route path="/admin/insumos" element={<RutaProtegidaAdmin>{pagina || <h1>Insumos</h1>}</RutaProtegidaAdmin>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
);

describe('Rutas protegidas del admin (MemoryRouter)', () => {
  it('sin sesión iniciada redirige al login', () => {
    montarEn('/admin/insumos');
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('un cliente tampoco puede entrar al admin', () => {
    iniciarSesionComo('Cliente');
    montarEn('/admin/insumos');
    expect(screen.getByRole('heading', { name: 'Tienda' })).toBeInTheDocument();
  });

  it('el administrador entra a la página pedida', () => {
    iniciarSesionComo('Administrador');
    montarEn('/admin/usuarios');
    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('el vendedor entra a las páginas permitidas', () => {
    iniciarSesionComo('Vendedor');
    montarEn('/admin/insumos');
    expect(screen.getByRole('heading', { name: 'Insumos' })).toBeInTheDocument();
  });

  it('el vendedor es enviado al Inventario si entra a una página solo de administrador', () => {
    iniciarSesionComo('Vendedor');
    montarEn('/admin/usuarios');
    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
  });
});

describe('Página de Insumos', () => {
  const abrirInsumos = (rol = 'Administrador') => {
    iniciarSesionComo(rol);
    return montarEn('/admin/insumos', <AdminInsumos />);
  };
  const filas = () => screen.getAllByRole('row').slice(1);

  it('lista todos los insumos', () => {
    abrirInsumos();
    expect(filas()).toHaveLength(INSUMOS_DEFAULT.length);
    expect(screen.getByText(`Mostrando ${INSUMOS_DEFAULT.length} de ${INSUMOS_DEFAULT.length} insumos`, { exact: false })).toBeInTheDocument();
  });

  it('los insumos por reponer aparecen primero', () => {
    abrirInsumos();
    const criticos = INSUMOS_DEFAULT.filter((i) => i.stock <= i.minimo).length;
    filas().slice(0, criticos).forEach((fila) => expect(within(fila).getByText('Reponer')).toBeInTheDocument());
    expect(within(filas()[criticos]).getByText('Normal')).toBeInTheDocument();
  });

  it('el buscador filtra la lista mientras se escribe', () => {
    abrirInsumos();
    fireEvent.change(screen.getByPlaceholderText('Buscar insumo...'), { target: { value: 'har' } });
    expect(filas()).toHaveLength(1);
    expect(within(filas()[0]).getByText('Harina')).toBeInTheDocument();
  });

  it('si no hay coincidencias muestra un mensaje', () => {
    abrirInsumos();
    fireEvent.change(screen.getByPlaceholderText('Buscar insumo...'), { target: { value: 'zzz' } });
    expect(screen.getByText(/no se encontraron insumos/i)).toBeInTheDocument();
  });

  it('no deja eliminar un insumo que usa alguna receta', () => {
    abrirInsumos();
    fireEvent.change(screen.getByPlaceholderText('Buscar insumo...'), { target: { value: 'harina' } });
    fireEvent.click(within(filas()[0]).getByRole('button', { name: /eliminar/i }));
    expect(screen.getByText('No se puede eliminar')).toBeInTheDocument();
  });

  it('el vendedor no ve los botones de editar ni eliminar', () => {
    abrirInsumos('Vendedor');
    expect(filas()[0].querySelector('.btn-outline-danger')).toHaveStyle({ display: 'none' });
    expect(filas()[0].querySelector('a.btn-outline-pasteleria')).toHaveStyle({ display: 'none' });
    expect(within(filas()[0]).queryByRole('button', { name: /eliminar/i })).toBeNull();
  });
});

describe('Inventario de productos', () => {
  it('filtra por código, nombre o categoría sin importar mayúsculas', () => {
    expect(filtrarProductos(PRODUCTOS_DEFAULT, 'tl004')).toHaveLength(1);
    expect(filtrarProductos(PRODUCTOS_DEFAULT, 'TRUFA')[0].codigo).toBe('TL004');
    expect(filtrarProductos(PRODUCTOS_DEFAULT, 'tartaletas').every((p) => p.categoria === 'Tartaletas')).toBe(true);
    expect(filtrarProductos(PRODUCTOS_DEFAULT, 'xyz')).toEqual([]);
  });

  it('el orden por prioridad pone primero lo crítico y agotado', () => {
    const ordenados = ordenarProductos(PRODUCTOS_DEFAULT, 'prioridad', INSUMOS_DEFAULT);
    expect(ordenados.slice(0, 4).map((p) => p.codigo)).toEqual(['POS006', 'SAN002', 'SAN004', 'TAR002']);
  });

  it('el orden por nombre es alfabético', () => {
    const nombres = ordenarProductos(PRODUCTOS_DEFAULT, 'nombre').map((p) => p.nombre);
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('muestra en la tabla todos los productos y cuántos están críticos', () => {
    iniciarSesionComo('Administrador');
    render(
      <AuthProvider>
        <MemoryRouter future={FUTURO}><AdminProductos /></MemoryRouter>
      </AuthProvider>
    );
    expect(document.querySelectorAll('#tabla-productos-body tr')).toHaveLength(PRODUCTOS_DEFAULT.length);
    expect(screen.getByText('· 4 con stock crítico', { exact: false })).toBeInTheDocument();
  });
});

describe('ayudas de la página de insumos', () => {
  it('productosQueUsan encuentra las recetas que usan un insumo', () => {
    expect(productosQueUsan('arroz', PRODUCTOS_DEFAULT).map((p) => p.codigo)).toEqual(['PI006']);
    expect(productosQueUsan('no-existe', PRODUCTOS_DEFAULT)).toEqual([]);
  });

  it('ordenarInsumos pone primero el más bajo respecto de su mínimo', () => {
    const lista = [
      { nombre: 'B', stock: 100, minimo: 10 },
      { nombre: 'A', stock: 4, minimo: 5 },
      { nombre: 'C', stock: 0, minimo: 5 }
    ];
    expect(ordenarInsumos(lista).map((i) => i.nombre)).toEqual(['C', 'A', 'B']);
  });
});
