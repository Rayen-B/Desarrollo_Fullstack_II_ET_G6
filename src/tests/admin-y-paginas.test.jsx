import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderizar, clic, escribir, enviarFormulario, formulario, porId, textoDe } from './utils';
import { Rutas } from '../App';
import InsigniaEstado from '../components/atoms/InsigniaEstado';
import FeedbackCampo, { claseValidacion } from '../components/atoms/FeedbackCampo';
import { useAuth } from '../context/AuthContext';
import { obtenerProducto, obtenerUsuarioPorRun, listarUsuarios } from '../services/db';
import { USUARIOS_DEFAULT } from '../services/storage';

const ADMIN = { run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita', correo: 'admin@papitadulce.cl', password: 'admin', rol: 'Administrador' };
const comoAdmin = () => localStorage.setItem('tienda_usuario_sesion', JSON.stringify(ADMIN));

describe('Átomos', () => {
  it('InsigniaEstado indica agotado, crítico y en stock', () => {
    expect(textoDe(renderizar(<InsigniaEstado stock={0} />, { conProviders: false }))).toBe('Agotado');
    expect(textoDe(renderizar(<InsigniaEstado stock={2} stockCritico={3} />, { conProviders: false }))).toContain('Stock Crítico');
    expect(textoDe(renderizar(<InsigniaEstado stock={9} stockCritico={3} />, { conProviders: false }))).toContain('En Stock');
  });
  it('InsigniaEstado muestra el rol', () => expect(textoDe(renderizar(<InsigniaEstado estado="Vendedor" />, { conProviders: false }))).toBe('Vendedor'));
  it('FeedbackCampo pinta verde o rojo según la validación', () => {
    const ok = renderizar(<FeedbackCampo resultado={{ valido: true, mensaje: 'Bien' }} />, { conProviders: false });
    expect(ok.querySelector('.success')).not.toBeNull();
    const mal = renderizar(<FeedbackCampo resultado={{ valido: false, mensaje: 'Mal' }} />, { conProviders: false });
    expect(mal.querySelector('.error')).not.toBeNull();
    expect(claseValidacion({ valido: false })).toBe(' is-invalid');
  });
});

describe('AuthContext', () => {
  function Sonda({ alListo }) {
    const auth = useAuth();
    React.useEffect(() => { alListo(auth); });
    return null;
  }
  const obtenerAuth = () => {
    let auth; renderizar(<Sonda alListo={(a) => { auth = a; }} />);
    return () => auth;
  };
  it('iniciarSesion acepta el usuario "admin" y rechaza una clave incorrecta', () => {
    const a = obtenerAuth();
    expect(a().iniciarSesion('admin', 'admin').exito).toBe(true);
    expect(a().iniciarSesion('admin', 'mala').exito).toBe(false);
  });
  it('registrarUsuario rechaza correos repetidos', () => {
    const a = obtenerAuth();
    const datos = { nombre: 'Ana', correo: 'ana@x.cl', password: 'Clave@123' };
    let primero; let segundo;
    act(() => { primero = a().registrarUsuario(datos); });
    act(() => { segundo = a().registrarUsuario(datos); });
    expect(primero.exito).toBe(true);
    expect(segundo.exito).toBe(false);
  });
  it('registrarUsuario exige campos obligatorios', () => expect(obtenerAuth()().registrarUsuario({ nombre: '' }).exito).toBe(false));
  it('solicitarRecuperacion distingue correos registrados', () => {
    const a = obtenerAuth();
    expect(a().solicitarRecuperacion('alan.brito@duoc.cl').exito).toBe(true);
    expect(a().solicitarRecuperacion('nadie@x.cl').exito).toBe(false);
  });
  it('la sesión se guarda y se borra al cerrar sesión', () => {
    const a = obtenerAuth();
    act(() => { a().iniciarSesion('admin', 'admin'); });
    expect(localStorage.getItem('tienda_usuario_sesion')).not.toBeNull();
    act(() => { a().cerrarSesion(); });
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });
});

describe('Páginas públicas', () => {
  it('/categorias, /blog, /nosotros y /contacto se renderizan con su título', () => {
    const categorias = renderizar(<Rutas />, { ruta: '/categorias' });
    expect(textoDe(categorias)).toContain('Todas las categorías');
    expect(categorias.querySelectorAll('h1')).toHaveLength(1);
    expect(categorias.querySelectorAll('#tituloCategorias')).toHaveLength(0);
    expect(renderizar(<Rutas />, { ruta: '/blog' }).querySelectorAll('article.blcard')).toHaveLength(3);
    expect(textoDe(renderizar(<Rutas />, { ruta: '/nosotros' }))).toContain('Sobre Papita Dulce');
    expect(porId(renderizar(<Rutas />, { ruta: '/contacto' }), 'ctcBtn')).not.toBeNull();
  });
  it('la barra superior usa los nombres de PAPITA_REACT y la portada sigue su orden de paneles', () => {
    const c = renderizar(<Rutas />, { ruta: '/' });
    const nombres = [...c.querySelectorAll('#nav .navbar-nav a')].map((enlace) => enlace.textContent.trim());
    expect(nombres).toEqual(['Inicio', 'Nosotros', 'Menú', 'Equipo', 'Reservacion', 'Reseñas', 'Contacto']);
    const ids = ['testimonials', 'reservation', 'entregas', 'blog', 'newsletter', 'contact-section'];
    const secciones = ids.map((id) => c.querySelector(`#${id}`));
    expect(secciones.every(Boolean)).toBe(true);
    secciones.slice(1).forEach((seccion, i) => {
      expect(secciones[i].compareDocumentPosition(seccion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
  it('/producto/:id con torta permite elegir trozo y cambia el subtotal', () => {
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    const select = c.querySelector('select');
    escribir(select, 'trozo');
    expect(textoDe(c)).toContain('$4.225'); // 25% de 16.900
  });
  it('/producto/:id inexistente muestra mensaje', () => expect(textoDe(renderizar(<Rutas />, { ruta: '/producto/XXX' }))).toContain('Producto no encontrado'));
  it('el buscador sugiere productos mientras se escribe', () => {
    const c = renderizar(<Rutas />, { ruta: '/' });
    clic(c.querySelector('#navSearchBtn'));
    escribir(porId(c, 'searchInput'), 'trufa');
    expect(c.querySelectorAll('#searchOv li').length).toBeGreaterThan(0);
  });
  it('el carrito exige iniciar sesión antes de llegar al checkout', () => {
    localStorage.setItem('papita_dulce_cart', JSON.stringify([{ id: 'TC001', codigo: 'TC001', nombre: 'Torta', precio: 1000, variante: 'entera', cantidad: 1 }]));
    const c = renderizar(<Rutas />, { ruta: '/' });
    clic(porId(c, 'cartToggle'));
    clic(porId(c, 'cartCheckout'));
    expect(textoDe(c)).toContain('Iniciar sesión');
    expect(localStorage.getItem('papita_dulce_cart')).not.toBeNull();
  });
});

describe('Panel admin: productos', () => {
  const llenarProducto = (c, codigo) => {
    escribir(porId(c, 'codigo'), codigo);
    escribir(porId(c, 'nombre'), 'Kuchen Prueba');
    escribir(porId(c, 'categoria'), 'Postres');
    escribir(porId(c, 'precio'), '3500');
    escribir(porId(c, 'stock'), '12');
    escribir(porId(c, 'stock-critico'), '3');
  };
  it('crea un producto nuevo (CRUD: Crear)', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form' });
    llenarProducto(c, 'KU001');
    enviarFormulario(porId(c, 'form-producto'));
    expect(obtenerProducto('KU001').nombre).toBe('Kuchen Prueba');
  });
  it('no guarda si falta información', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form' });
    enviarFormulario(porId(c, 'form-producto'));
    expect(textoDe(c)).toContain('verifique los campos');
  });
  it('edita un producto existente (CRUD: Actualizar)', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/producto-form?codigo=TC001' });
    escribir(porId(c, 'precio'), '17777');
    enviarFormulario(porId(c, 'form-producto'));
    expect(obtenerProducto('TC001').precio).toBe(17777);
  });
  it('el inventario lista productos y muestra críticos', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/productos' });
    expect(c.querySelectorAll('#tabla-productos-body tr').length).toBeGreaterThan(30);
    expect(textoDe(c)).toContain('Crítico');
    escribir(porId(c, 'buscador-productos'), 'selva');
    expect(c.querySelectorAll('#tabla-productos-body tr')).toHaveLength(1);
  });
  it('los reportes muestran ventas y el estado del inventario', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/reportes' });
    expect(textoDe(c)).toContain('Ventas totales');
    expect(textoDe(c)).toContain('Valor en vitrina');
  });
});

describe('Panel admin: usuarios, órdenes y boletas', () => {
  it('lista los usuarios registrados', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/usuarios' });
    expect(textoDe(c)).toContain('alan.brito@duoc.cl');
    expect(textoDe(c)).toContain('admin@papitadulce.cl');
  });
  it('crea un usuario nuevo con RUN válido (CRUD: Crear)', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form' });
    escribir(porId(c, 'run'), '123456785');
    escribir(porId(c, 'nombre'), 'Nuevo');
    escribir(porId(c, 'apellidos'), 'Usuario Prueba');
    escribir(porId(c, 'correo'), 'nuevo.usuario@correo.cl');
    escribir(porId(c, 'password'), 'Ab1@');
    escribir(porId(c, 'select-region'), 'Región Metropolitana de Santiago');
    escribir(porId(c, 'select-comuna'), 'Santiago');
    escribir(porId(c, 'direccion'), 'Calle 123');
    enviarFormulario(porId(c, 'form-usuario'));
    expect(JSON.parse(localStorage.getItem('tienda_usuarios_db')).some((u) => u.run === '123456785')).toBe(true);
  });
  it('el formulario de usuario rechaza un RUN inválido', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/usuario-form' });
    escribir(porId(c, 'run'), '111111112');
    enviarFormulario(porId(c, 'form-usuario'));
    expect(textoDe(c)).toContain('verifique los campos');
  });
  it('la lista de órdenes se puede buscar', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    expect(c.querySelectorAll('tbody tr').length).toBe(5);
    escribir(porId(c, 'buscador-ordenes'), 'trufa');
    expect(c.querySelectorAll('tbody tr')).toHaveLength(1);
  });
  it('la boleta de una orden se abre y se puede imprimir', () => {
    comoAdmin();
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    const c = renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    escribir(porId(c, 'buscador-ordenes'), 'ORD-1002');
    clic([...c.querySelectorAll('tbody button')].find((b) => b.textContent.includes('Boleta')));
    expect(document.getElementById('boletaTitulo')).not.toBeNull();
    expect(textoDe(document.body)).toContain('ORD-1002');
    clic([...document.querySelectorAll('.modal button')].find((b) => b.textContent.includes('Imprimir Boleta')));
    expect(imprimir).toHaveBeenCalled();
  });
  it('el perfil no se guarda si faltan datos obligatorios', () => {
    comoAdmin();
    const c = renderizar(<Rutas />, { ruta: '/admin/perfil' });
    enviarFormulario(porId(c, 'perfil-nombre').closest('form'));
    expect(textoDe(c)).toContain('verifique los campos');
  });
  it('el perfil se actualiza y queda guardado', () => {
    localStorage.setItem('tienda_usuario_sesion', JSON.stringify(USUARIOS_DEFAULT[0]));
    const c = renderizar(<Rutas />, { ruta: '/admin/perfil' });
    escribir(porId(c, 'perfil-nombre'), 'Administrador');
    enviarFormulario(porId(c, 'perfil-nombre').closest('form'));
    expect(textoDe(c)).toContain('actualizados correctamente');
    expect(JSON.parse(localStorage.getItem('tienda_usuario_sesion')).nombre).toBe('Administrador');
  });
  it('listarUsuarios mantiene el admin incluso tras crear usuarios', () => {
    expect(listarUsuarios().some((u) => u.usuario === 'admin')).toBe(true);
    expect(obtenerUsuarioPorRun('111111111').rol).toBe('Administrador');
  });
});
