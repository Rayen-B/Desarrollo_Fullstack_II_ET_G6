import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderizar, clic, escribir, enviarFormulario, formulario, porId, textoDe } from './utils';
import { Rutas } from '../App';
import Contacto from '../components/secciones/Contacto';
import { listarOrdenes, obtenerProducto, crearProducto, buscarProductos, listarProductos } from '../services/db';
import { filtrarProductos } from '../pages/admin/AdminProductos';
import { filtrarCatalogo } from '../pages/Productos';
import { validarNombreCategoria, CATEGORIAS_DEFAULT } from '../services/categorias';
import images, { obtenerImagen } from '../assets/images';

const ADMIN = { run: '111111111', usuario: 'admin', nombre: 'Admin', apellidos: 'Papita', correo: 'admin@papitadulce.cl', password: 'admin', rol: 'Administrador' };
const CLIENTE = { run: '190110222', nombre: 'Armando', apellidos: 'Esteban Quito', correo: 'armando.quito@gmail.com', rol: 'Cliente' };
const iniciarComo = (usuario) => localStorage.setItem('tienda_usuario_sesion', JSON.stringify(usuario));
const cargarCarrito = (items) => localStorage.setItem('papita_dulce_cart', JSON.stringify(items));
const ITEM = { id: 'TC001', codigo: 'TC001', nombre: 'Torta Panqueque Naranja', precio: 16900, imagen: 'menu/Torta_Trufa', variante: 'entera', cantidad: 2 };

function completarLogin(c, usuario, password) {
  escribir(porId(c, 'loginUsuario'), usuario);
  escribir(porId(c, 'loginPassword'), password);
  enviarFormulario(formulario(c));
}

describe('Login (corrección: validación de campos y acceso admin/admin)', () => {
  it('admin / admin entra directo al panel de administración', () => {
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completarLogin(c, 'admin', 'admin');
    expect(textoDe(c)).toContain('Panel de Administración');
  });
  it('campos vacíos: muestra errores por campo y no inicia sesión', () => {
    const c = renderizar(<Rutas />, { ruta: '/login' });
    enviarFormulario(formulario(c));
    expect(c.querySelectorAll('.ferr')).toHaveLength(2);
    expect(localStorage.getItem('tienda_usuario_sesion')).toBeNull();
  });
  it('credenciales incorrectas muestran un mensaje', () => {
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completarLogin(c, 'admin', 'equivocada');
    expect(textoDe(c)).toContain('incorrectos');
  });
  it('un cliente inicia sesión con su correo y vuelve al inicio', () => {
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completarLogin(c, 'armando.quito@gmail.com', 'Cliente!2026');
    expect(c.querySelector('h1.htitle')).not.toBeNull();
  });
  it('un vendedor entra al panel', () => {
    const c = renderizar(<Rutas />, { ruta: '/login' });
    completarLogin(c, 'lola.mento@profesor.duoc.cl', 'Ventas#2026');
    expect(textoDe(c)).toContain('Panel de Administración');
  });
});

describe('Rutas protegidas del panel', () => {
  it('sin sesión /admin redirige al login', () => {
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(textoDe(c)).toContain('Iniciar sesión');
  });
  it('un cliente no puede ver /admin', () => {
    iniciarComo({ ...ADMIN, rol: 'Cliente' });
    const c = renderizar(<Rutas />, { ruta: '/admin' });
    expect(textoDe(c)).not.toContain('Panel de Administración');
  });
  it('un vendedor no entra a Usuarios: va al inventario', () => {
    iniciarComo({ ...ADMIN, rol: 'Vendedor' });
    const c = renderizar(<Rutas />, { ruta: '/admin/usuarios' });
    expect(textoDe(c)).toContain('Inventario de Productos');
  });
  it('el administrador ve reportes, categorías e insumos', () => {
    iniciarComo(ADMIN);
    expect(textoDe(renderizar(<Rutas />, { ruta: '/admin/reportes' }))).toContain('Estado de órdenes');
    expect(textoDe(renderizar(<Rutas />, { ruta: '/admin/categorias' }))).toContain('Tortas');
    expect(textoDe(renderizar(<Rutas />, { ruta: '/admin/insumos' }))).toContain('Harina');
  });
  it('el inventario muestra primero los productos críticos', () => {
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/admin/productos' });
    const primera = c.querySelector('#tabla-productos-body tr');
    expect(textoDe(primera)).toContain('Brownie con Nueces');
    expect(textoDe(primera)).toContain('Crítico');
  });
  it('el panel se marca noindex para buscadores', () => {
    iniciarComo(ADMIN);
    renderizar(<Rutas />, { ruta: '/admin' });
    expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  });
});

describe('Formulario de contacto (corrección de validación)', () => {
  const campos = (c) => ({ nombre: c.querySelector('[name=nombre]'), correo: c.querySelector('[name=correo]'), telefono: c.querySelector('[name=telefono]'), mensaje: c.querySelector('[name=mensaje]') });

  it('enviar vacío muestra errores en nombre, correo y mensaje', () => {
    const c = renderizar(<Contacto />);
    enviarFormulario(formulario(c));
    expect(c.querySelectorAll('.ferr')).toHaveLength(3);
    expect(c.querySelector('.sucmsg').style.display).not.toBe('block');
  });
  it('valida el teléfono con letras', () => {
    const c = renderizar(<Contacto />);
    escribir(campos(c).telefono, 'abcdefghij');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('solo puede contener números');
  });
  it('valida un correo mal escrito', () => {
    const c = renderizar(<Contacto />);
    escribir(campos(c).correo, 'ana@correo');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Formato de correo no válido');
  });
  it('con datos válidos envía el mensaje y limpia el formulario', () => {
    vi.useFakeTimers();
    const c = renderizar(<Contacto />);
    const f = campos(c);
    escribir(f.nombre, 'Ana Pérez');
    escribir(f.correo, 'ana@correo.cl');
    escribir(f.mensaje, 'Quisiera cotizar una torta para 20 personas.');
    enviarFormulario(formulario(c));
    act(() => { vi.advanceTimersByTime(1600); });
    expect(c.querySelector('.sucmsg').style.display).toBe('block');
    expect(f.nombre.value).toBe('');
  });
});

describe('Registro de clientes', () => {
  it('muestra errores si el formulario está vacío', () => {
    const c = renderizar(<Rutas />, { ruta: '/registro' });
    enviarFormulario(formulario(c));
    expect(c.querySelectorAll('.ferr').length).toBeGreaterThanOrEqual(5);
  });
  it('crea la cuenta con datos válidos', () => {
    vi.useFakeTimers();
    const c = renderizar(<Rutas />, { ruta: '/registro' });
    escribir(porId(c, 'regNombre'), 'Nuevo Cliente');
    escribir(porId(c, 'regCorreo'), 'nuevo@correo.cl');
    escribir(porId(c, 'regPassword'), 'Clave@1234');
    escribir(porId(c, 'regConfirmar'), 'Clave@1234');
    escribir(porId(c, 'regRegion'), 'Valparaíso');
    escribir(porId(c, 'regComuna'), 'Viña del Mar');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Cuenta creada correctamente');
    expect(JSON.parse(localStorage.getItem('tienda_usuarios_db')).some((u) => u.correo === 'nuevo@correo.cl')).toBe(true);
  });
});

describe('Hub principal, navegación y SEO', () => {
  it('el inicio (/) tiene hero, categorías y enlaces a las vistas principales', () => {
    const c = renderizar(<Rutas />, { ruta: '/' });
    expect(c.querySelector('h1.htitle')).not.toBeNull();
    const rutas = [...c.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    ['/productos', '/ofertas', '/nosotros', '/blog', '/contacto'].forEach((r) => expect(rutas).toContain(r));
    expect(c.querySelectorAll('#category a.catcard')).toHaveLength(6);
  });
  it('cada página define su propio título', () => {
    renderizar(<Rutas />, { ruta: '/ofertas' });
    expect(document.title).toContain('Ofertas');
  });
  it('rutas inexistentes vuelven al inicio', () => {
    const c = renderizar(<Rutas />, { ruta: '/no-existe' });
    expect(c.querySelector('h1.htitle')).not.toBeNull();
  });
  it('la barra muestra "Iniciar sesión" y "Crear cuenta" sin sesión', () => {
    const c = renderizar(<Rutas />, { ruta: '/' });
    expect(textoDe(c.querySelector('nav'))).toContain('Iniciar sesión');
    expect(textoDe(c.querySelector('nav'))).toContain('Crear cuenta');
    expect(c.querySelector('#nav .nav-actions')).not.toBeNull();
    expect(c.querySelector('#nav .nav-actions').classList.contains('flex-wrap')).toBe(false);
    expect(c.querySelector('#nav #cartToggle')).not.toBeNull();
  });
  it('con sesión de administrador aparece el acceso al panel', () => {
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/' });
    expect(c.querySelector('nav a[href="/admin"]')).not.toBeNull();
  });
});

describe('Vistas de la tienda conectadas a la base de datos', () => {
  it('/productos filtra por texto con ?q=', () => {
    const c = renderizar(<Rutas />, { ruta: '/productos?q=selva' });
    expect(c.querySelectorAll('article.mcard')).toHaveLength(1);
  });
  it('filtrarCatalogo combina categoría y texto', () => {
    const lista = [{ nombre: 'Torta A', categoria: 'Tortas' }, { nombre: 'Jugo A', categoria: 'Bebestibles' }];
    expect(filtrarCatalogo(lista, { categoria: 'tortas' })).toHaveLength(1);
    expect(filtrarCatalogo(lista, { texto: 'a' })).toHaveLength(2);
  });
  it('los filtros de texto encuentran coincidencias aunque la búsqueda no tenga acentos', () => {
    expect(filtrarCatalogo([{ nombre: 'Sándwich de la casa', categoria: 'Sándwiches' }], { texto: 'sandwich' })).toHaveLength(1);
    expect(buscarProductos('sandwich')).toEqual(expect.arrayContaining([expect.objectContaining({ categoria: 'Sándwiches' })]));
  });
  it('las imágenes del catálogo tienen una ruta resoluble y las desconocidas usan una imagen de respaldo', () => {
    expect(listarProductos().every((producto) => obtenerImagen(producto.imagen) !== producto.imagen)).toBe(true);
    expect(obtenerImagen('ruta-inexistente')).toBe(images.imgc1);
  });
  it('/categorias/sandwiches muestra solo sándwiches', () => {
    const c = renderizar(<Rutas />, { ruta: '/categorias/sandwiches' });
    expect(c.querySelectorAll('article.mcard')).toHaveLength(5);
  });
  it('categoría inexistente muestra mensaje', () => {
    expect(textoDe(renderizar(<Rutas />, { ruta: '/categorias/nada' }))).toContain('Categoría no encontrada');
  });
  it('/ofertas muestra solo productos con descuento', () => {
    const c = renderizar(<Rutas />, { ruta: '/ofertas' });
    const tarjetas = c.querySelectorAll('article.mcard');
    expect(tarjetas.length).toBeGreaterThan(0);
    tarjetas.forEach((t) => expect(t.querySelector('.mbdg.hot')).not.toBeNull());
  });
  it('/producto/:id muestra el detalle y permite agregar al carrito', () => {
    const c = renderizar(<Rutas />, { ruta: '/producto/TC001' });
    expect(textoDe(c)).toContain('Torta Panqueque Naranja');
    clic([...c.querySelectorAll('button')].find((b) => b.textContent.includes('Agregar al Carrito')));
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(1);
  });
  it('/blog/:id muestra el artículo', () => {
    expect(textoDe(renderizar(<Rutas />, { ruta: '/blog/receta-merengues-crujientes' }))).toContain('merengues');
  });
  it('un producto creado desde el admin aparece en la tienda (mismo origen de datos)', () => {
    crearProducto({ codigo: 'NEW01', nombre: 'Kuchen de Nuez', categoria: 'Postres', precio: 3000, stock: 10, stockCritico: 2, descripcion: 'Nuevo' });
    const c = renderizar(<Rutas />, { ruta: '/productos?q=kuchen' });
    expect(c.querySelectorAll('article.mcard')).toHaveLength(1);
  });
});

describe('Flujo de compra: checkout, pago correcto y pago con error', () => {
  beforeEach(() => iniciarComo(CLIENTE));

  const llenar = (c, tarjeta) => {
    escribir(porId(c, 'coNombre'), 'Ana Pérez');
    escribir(porId(c, 'coRun'), '123456785');
    escribir(porId(c, 'coCorreo'), 'ana@correo.cl');
    escribir(porId(c, 'coTelefono'), '+56 9 1234 5678');
    escribir(porId(c, 'coTarjeta'), tarjeta);
    escribir(porId(c, 'coVence'), '12/99');
    escribir(porId(c, 'coCvv'), '123');
  };

  it('carrito vacío: no permite pagar', () => {
    expect(textoDe(renderizar(<Rutas />, { ruta: '/checkout' }))).toContain('Tu carrito está vacío');
  });
  it('sin sesión redirige al login y vuelve al checkout al autenticarse', () => {
    localStorage.removeItem('tienda_usuario_sesion');
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    expect(textoDe(c)).toContain('Iniciar sesión');
    completarLogin(c, 'armando.quito@gmail.com', 'Cliente!2026');
    expect(porId(c, 'coNombre')).not.toBeNull();
  });
  it('muestra el total del carrito', () => {
    cargarCarrito([ITEM]);
    expect(porId(renderizar(<Rutas />, { ruta: '/checkout' }), 'coNombre')).not.toBeNull();
    expect(document.querySelector('[data-testid="total-checkout"]').textContent).toBe('$33.800');
  });
  it('no paga si faltan datos', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    enviarFormulario(formulario(c));
    expect(c.querySelectorAll('.ferr').length).toBeGreaterThanOrEqual(4);
    expect(listarOrdenes()).toHaveLength(5);
  });
  it('pago correcto: crea la orden, vacía el carrito y descuenta stock', () => {
    cargarCarrito([ITEM]);
    const stockAntes = obtenerProducto('TC001').stock;
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    llenar(c, '4532 0151 1283 0366');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('Se ha realizado la compra');
    expect(textoDe(c)).toContain('$33.800');
    expect(listarOrdenes()).toHaveLength(6);
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(0);
    expect(obtenerProducto('TC001').stock).toBe(stockAntes - 2);
  });
  it('ofrece un botón de pago aprobado y otro de pago rechazado', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    expect(c.querySelector('button[name="resultadoPago"][value="aprobado"]')).not.toBeNull();
    expect(c.querySelector('#simular-error-pago')).toBeNull(); // el simulador de errores solo aparece al activarlo
    clic(porId(c, 'modo-simulador'));
    expect(textoDe(c.querySelector('#simular-error-pago'))).toContain('Simular error de pago');
    expect(c.querySelector('.checkout-back')).not.toBeNull();
  });
  it('muestra instrucciones específicas para transferencia y efectivo', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    clic(c.querySelector('input[name="metodoPago"][value="transferencia"]'));
    expect(textoDe(c)).toContain('Banco Papita Dulce');
    expect(porId(c, 'coTarjeta')).toBeNull();
    clic(c.querySelector('input[name="metodoPago"][value="efectivo"]'));
    expect(textoDe(c)).toContain('El monto indicado en el resumen se paga al recibir o retirar');
    expect(porId(c, 'coTarjeta')).toBeNull();
  });
  it('el botón de pago incorrecto lleva a la vista de rechazo y conserva el carrito', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    llenar(c, '4532 0151 1283 0366');
    clic(porId(c, 'modo-simulador'));
    clic(c.querySelector('button[name="resultadoPago"][value="rechazado"]'));
    expect(textoDe(c)).toContain('No se pudo realizar el pago');
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(1);
  });
  it('formatea automáticamente el vencimiento ingresado en el checkout', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    escribir(porId(c, 'coVence'), '123');
    expect(porId(c, 'coVence').value).toBe('12/3');
  });
  it('pago con error: guarda la orden como rechazada y conserva el carrito', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    llenar(c, '4000 0000 0000 0002');
    enviarFormulario(formulario(c));
    expect(textoDe(c)).toContain('No se pudo realizar el pago');
    expect(textoDe(c)).toContain('VOLVER A REALIZAR EL PAGO');
    expect(listarOrdenes().at(-1).estado).toBe('Pago rechazado');
    expect(JSON.parse(localStorage.getItem('papita_dulce_cart'))).toHaveLength(1);
  });
  it('la boleta se puede imprimir (mock de window.print)', () => {
    cargarCarrito([ITEM]);
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    llenar(c, '4532015112830366');
    enviarFormulario(formulario(c));
    clic([...c.querySelectorAll('button')].find((b) => b.textContent.includes('Imprimir boleta')));
    expect(imprimir).toHaveBeenCalledTimes(1);
  });
  it('el admin ve la orden nueva en el panel y puede abrir su boleta', () => {
    cargarCarrito([ITEM]);
    const c = renderizar(<Rutas />, { ruta: '/checkout' });
    llenar(c, '4532015112830366');
    enviarFormulario(formulario(c));
    iniciarComo(ADMIN);
    const id = listarOrdenes().at(-1).id;
    const panel = renderizar(<Rutas />, { ruta: '/admin/ordenes' });
    expect(textoDe(panel)).toContain(id);
    expect(textoDe(panel)).toContain('Torta Panqueque Naranja');
  });
});

describe('Funciones del panel de administración', () => {
  it('filtrarProductos busca por nombre, código o categoría', () => {
    const lista = [{ nombre: 'Torta Trufa', codigo: 'TL004', categoria: 'Tortas' }, { nombre: 'Jugo', codigo: 'BEB001', categoria: 'Bebestibles' }];
    expect(filtrarProductos(lista, 'trufa')).toHaveLength(1);
    expect(filtrarProductos(lista, 'beb001')).toHaveLength(1);
    expect(filtrarProductos(lista, 'tortas')).toHaveLength(1);
  });
  it('validarNombreCategoria exige nombre y no permite repetidos', () => {
    expect(validarNombreCategoria('', CATEGORIAS_DEFAULT).valido).toBe(false);
    expect(validarNombreCategoria('Tortas', CATEGORIAS_DEFAULT).valido).toBe(false);
    expect(validarNombreCategoria('Panes', CATEGORIAS_DEFAULT).valido).toBe(true);
  });
  it('crear una categoría desde el formulario admin', () => {
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/admin/categoria-form' });
    escribir(porId(c, 'nombre-categoria'), 'Panes');
    escribir(porId(c, 'descripcion-categoria'), 'Pan amasado y hallullas.');
    enviarFormulario(porId(c, 'form-categoria'));
    expect(textoDe(c)).toContain('creada correctamente');
    expect(JSON.parse(localStorage.getItem('papita_dulce_categorias')).find((cat) => cat.id === 'panes').descripcion).toBe('Pan amasado y hallullas.');
  });
  it('actualizar el perfil valida el correo', () => {
    iniciarComo(ADMIN);
    const c = renderizar(<Rutas />, { ruta: '/admin/perfil' });
    escribir(porId(c, 'perfil-correo'), 'correo-invalido');
    enviarFormulario(porId(c, 'perfil-correo').closest('form'));
    expect(textoDe(c)).toContain('verifique los campos');
  });
});
