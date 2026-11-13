// Datos de la tienda con operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
import * as storage from './storage';
import { obtenerInsumos, guardarInsumos } from './insumos';
import { disponibleProducto, esProductoCritico, descontarVenta, devolverVenta } from '../utils/stock';

export const ESTADOS_ORDEN = ['Pendiente', 'Pendiente de pago', 'Procesando', 'Enviado', 'Cancelado', 'Pago rechazado'];
// "Pendiente de pago" = transferencia aún no confirmada: todavía no es un ingreso
export const ESTADOS_SIN_INGRESO = ['Cancelado', 'Pago rechazado', 'Pendiente de pago'];
export const DESCUENTO_MINIMO_OFERTA = 20; // % mínimo de descuento para aparecer en "Ofertas"

const resultado = (exito, datos = {}) => ({ exito, ...datos });

// "Sándwiches" -> "sandwiches" (se usa en las URLs: /categorias/sandwiches)
export function crearSlug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------- PRODUCTOS ------------------------------- */

export const listarProductos = () => storage.obtenerProductos();

export function obtenerProducto(codigo) {
  const buscado = String(codigo || '').toUpperCase();
  return listarProductos().find((p) => String(p.codigo || p.id).toUpperCase() === buscado) || null;
}

export function crearProducto(datos) {
  const codigo = String(datos.codigo || '').trim().toUpperCase();
  if (!codigo) return resultado(false, { mensaje: 'El código es requerido.' });
  if (obtenerProducto(codigo)) return resultado(false, { mensaje: `Ya existe un producto con el código ${codigo}.` });
  const producto = {
    stockCritico: 0,
    descripcion: '',
    imagen: 'menu/Torta_Panqueque_Naranja',
    ...datos,
    id: codigo,
    codigo,
    precio: Number(datos.precio),
    stock: Number(datos.stock)
  };
  storage.guardarProductos([...listarProductos(), producto]);
  return resultado(true, { producto });
}

export function actualizarProducto(codigo, cambios) {
  const existente = obtenerProducto(codigo);
  if (!existente) return resultado(false, { mensaje: 'El producto no existe.' });
  const producto = { ...existente, ...cambios, id: existente.id, codigo: existente.codigo };
  if (cambios.precio !== undefined) producto.precio = Number(cambios.precio);
  if (cambios.stock !== undefined) producto.stock = Number(cambios.stock);
  storage.guardarProductos(listarProductos().map((p) => (p.codigo === existente.codigo ? producto : p)));
  return resultado(true, { producto });
}

export function eliminarProducto(codigo) {
  const existente = obtenerProducto(codigo);
  if (!existente) return resultado(false, { mensaje: 'El producto no existe.' });
  storage.guardarProductos(listarProductos().filter((p) => p.codigo !== existente.codigo));
  return resultado(true, { producto: existente });
}

// Unidades disponibles de un producto: las de la vitrina más las que se pueden preparar con los insumos
export const disponibleDe = (p, insumos = obtenerInsumos()) => disponibleProducto(p, insumos);

// crítico si lo disponible está en o bajo su stock crítico
export const esStockCritico = (p, insumos = obtenerInsumos()) => esProductoCritico(p, insumos);
export const productosCriticos = () => {
  const insumos = obtenerInsumos();
  return listarProductos().filter((p) => esStockCritico(p, insumos));
};

export function descuentoPorcentaje(p) {
  if (!p.precioAnterior || Number(p.precioAnterior) <= Number(p.precio)) return 0;
  return Math.round((1 - Number(p.precio) / Number(p.precioAnterior)) * 100);
}
export const esOferta = (p) => descuentoPorcentaje(p) >= DESCUENTO_MINIMO_OFERTA;
export const productosEnOferta = () => listarProductos().filter(esOferta).sort((a, b) => descuentoPorcentaje(b) - descuentoPorcentaje(a));

// categoria puede ser el id (slug) o el nombre de la categoría
export function productosPorCategoria(categoria) {
  const clave = crearSlug(categoria);
  return listarProductos().filter((p) => crearSlug(p.categoria) === clave);
}

export function buscarProductos(texto) {
  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const consulta = normalizar(texto);
  if (!consulta) return listarProductos();
  return listarProductos().filter((p) =>
    normalizar([p.nombre, p.codigo, p.categoria, p.descripcion].join(' ')).includes(consulta)
  );
}

// Descuenta del inventario lo comprado: primero de la vitrina y lo que falte se prepara con los insumos.
// Un "trozo" usa 1/4 de la receta. Si no alcanza, no descuenta nada y avisa qué producto falta.
export function descontarStock(items) {
  const resultadoVenta = descontarVenta(listarProductos(), obtenerInsumos(), items);
  if (!resultadoVenta.ok) return resultado(false, { mensaje: `Ya no hay stock suficiente de ${resultadoVenta.faltante}.`, faltante: resultadoVenta.faltante });
  storage.guardarProductos(resultadoVenta.productos);
  guardarInsumos(resultadoVenta.insumos);
  return resultado(true, { productos: resultadoVenta.productos, insumos: resultadoVenta.insumos, movimientos: resultadoVenta.movimientos });
}

// Revisa si alcanza el stock para una compra, sin descontar nada
export function hayStockPara(items) {
  const r = descontarVenta(listarProductos(), obtenerInsumos(), items);
  return r.ok ? resultado(true) : resultado(false, { mensaje: `No hay stock suficiente de ${r.faltante}.`, faltante: r.faltante });
}

/* ------------------------------- CATEGORÍAS ------------------------------ */

export const listarCategorias = () => storage.obtenerCategorias();

export function obtenerCategoria(id) {
  const clave = crearSlug(id);
  return listarCategorias().find((c) => c.id === clave || crearSlug(c.nombre) === clave) || null;
}

export const contarProductosDeCategoria = (categoria) => productosPorCategoria(categoria.nombre || categoria).length;

export function crearCategoria({ nombre, descripcion = '', imagen = 'imgc1' }) {
  const id = crearSlug(nombre);
  if (!id) return resultado(false, { mensaje: 'El nombre de la categoría es requerido.' });
  if (obtenerCategoria(id)) return resultado(false, { mensaje: `La categoría "${nombre}" ya existe.` });
  const categoria = { id, nombre: String(nombre).trim(), descripcion, imagen };
  storage.guardarCategorias([...listarCategorias(), categoria]);
  return resultado(true, { categoria });
}

// Si cambia el nombre, también se actualizan los productos que la usaban.
export function actualizarCategoria(id, cambios) {
  const existente = obtenerCategoria(id);
  if (!existente) return resultado(false, { mensaje: 'La categoría no existe.' });
  const nuevoNombre = cambios.nombre ? String(cambios.nombre).trim() : existente.nombre;
  const duplicada = listarCategorias().some((c) => c.id !== existente.id && crearSlug(c.nombre) === crearSlug(nuevoNombre));
  if (duplicada) return resultado(false, { mensaje: `La categoría "${nuevoNombre}" ya existe.` });
  const categoria = { ...existente, ...cambios, nombre: nuevoNombre };
  storage.guardarCategorias(listarCategorias().map((c) => (c.id === existente.id ? categoria : c)));
  if (nuevoNombre !== existente.nombre) {
    storage.guardarProductos(listarProductos().map((p) => (p.categoria === existente.nombre ? { ...p, categoria: nuevoNombre } : p)));
  }
  return resultado(true, { categoria });
}

// No se puede eliminar una categoría que todavía tiene productos.
export function eliminarCategoria(id) {
  const existente = obtenerCategoria(id);
  if (!existente) return resultado(false, { mensaje: 'La categoría no existe.' });
  const cantidad = contarProductosDeCategoria(existente);
  if (cantidad > 0) return resultado(false, { mensaje: `No se puede eliminar: tiene ${cantidad} producto(s) asociados.` });
  storage.guardarCategorias(listarCategorias().filter((c) => c.id !== existente.id));
  return resultado(true, { categoria: existente });
}

/* -------------------------------- USUARIOS ------------------------------- */

export const listarUsuarios = () => storage.obtenerUsuarios();

const mismoRun = (a, b) => String(a || '').toUpperCase() === String(b || '').toUpperCase();
export const obtenerUsuarioPorRun = (run) => listarUsuarios().find((u) => mismoRun(u.run, run)) || null;
export const obtenerUsuarioPorCorreo = (correo) =>
  listarUsuarios().find((u) => String(u.correo).toLowerCase() === String(correo || '').trim().toLowerCase()) || null;

export function crearUsuario(datos) {
  if (datos.run && obtenerUsuarioPorRun(datos.run)) return resultado(false, { mensaje: 'El RUN ya se encuentra registrado.' });
  if (obtenerUsuarioPorCorreo(datos.correo)) return resultado(false, { mensaje: 'Ya existe una cuenta con ese correo.' });
  const usuario = { rol: 'Cliente', ...datos, correo: String(datos.correo).trim().toLowerCase() };
  storage.guardarUsuarios([...listarUsuarios(), usuario]);
  return resultado(true, { usuario });
}

export function actualizarUsuario(run, cambios) {
  const existente = obtenerUsuarioPorRun(run);
  if (!existente) return resultado(false, { mensaje: 'El usuario no existe.' });
  const usuario = { ...existente, ...cambios };
  storage.guardarUsuarios(listarUsuarios().map((u) => (mismoRun(u.run, run) ? usuario : u)));
  return resultado(true, { usuario });
}

export function eliminarUsuario(run) {
  const existente = obtenerUsuarioPorRun(run);
  if (!existente) return resultado(false, { mensaje: 'El usuario no existe.' });
  storage.guardarUsuarios(listarUsuarios().filter((u) => !mismoRun(u.run, run)));
  return resultado(true, { usuario: existente });
}

/* --------------------------- ÓRDENES / BOLETAS --------------------------- */

export const listarOrdenes = () => storage.obtenerOrdenes();

export function obtenerOrden(id) {
  const limpio = String(id || '').replace(/^#/, '');
  return listarOrdenes().find((o) => String(o.id).replace(/^#/, '') === limpio) || null;
}

export const formatearMonto = (n) => '$' + Number(n || 0).toLocaleString('es-CL');

// Líneas de la boleta: usa "detalle" (órdenes nuevas) o interpreta el texto "1x Torta ($45.000)" de las órdenes antiguas.
export function detalleDeOrden(orden) {
  if (Array.isArray(orden.detalle)) return orden.detalle;
  return String(orden.items || '')
    .split(/;|,(?=\s*\d+x )/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const m = t.match(/^(\d+)x\s+(.*?)\s*\(\$?([\d.]+)\)$/);
      if (!m) return { nombre: t, cantidad: 1, precio: 0 };
      const cantidad = Number(m[1]);
      const subtotal = Number(m[3].replace(/\./g, ''));
      return { nombre: m[2], cantidad, precio: Math.round(subtotal / cantidad) };
    });
}

// Crea una orden. items: [{ codigo, nombre, precio, cantidad, variante }]
// Fecha y hora local (toISOString usa la hora UTC y de noche puede cambiar el día)
const fechaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// datosPago (opcional): { pagaCon, vuelto, motivoRechazo, codigoMotivo } se guarda en la orden.
// Transferencia: se agrega referencia (n° de orden) y plazo de 24 horas. Efectivo: código de pedido.
export function crearOrden({ cliente, correo, telefono = '', run = '', entrega, tipoEntrega, metodoPago, items, estado = 'Pendiente', datosPago = {}, movimientoStock = null }) {
  if (!items || items.length === 0) return resultado(false, { mensaje: 'La orden no tiene productos.' });
  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const ahora = new Date();
  const id = 'PD-' + String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 90) + 10);
  const orden = {
    id,
    numero: '#' + id,
    fecha: fechaLocal(ahora),
    hora: ahora.toTimeString().slice(0, 5),
    cliente,
    correo,
    telefono,
    run,
    entrega,
    tipoEntrega: tipoEntrega || (entrega === 'Retiro en tienda' ? 'retiro' : 'despacho'),
    metodoPago,
    estado,
    total,
    montoTotal: formatearMonto(total),
    detalle: items.map((i) => ({ codigo: i.codigo || i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, variante: i.variante || '' })),
    items: items.map((i) => `${i.cantidad}x ${i.nombre} (${formatearMonto(i.precio * i.cantidad)})`).join('; ')
  };
  if (metodoPago === 'transferencia') {
    orden.referenciaPago = id;
    orden.plazoPago = new Date(ahora.getTime() + 24 * 3600 * 1000).toISOString();
  }
  if (metodoPago === 'efectivo') orden.codigoPedido = 'PD-' + id.replace(/\D/g, '').slice(-4);
  Object.assign(orden, datosPago);
  if (movimientoStock) orden.movimientoStock = movimientoStock;
  storage.guardarOrdenes([...listarOrdenes(), orden]);
  return resultado(true, { orden });
}

export function actualizarEstadoOrden(id, estado) {
  if (!ESTADOS_ORDEN.includes(estado)) return resultado(false, { mensaje: 'Estado no válido.' });
  const existente = obtenerOrden(id);
  if (!existente) return resultado(false, { mensaje: 'La orden no existe.' });
  const orden = { ...existente, estado };
  storage.guardarOrdenes(listarOrdenes().map((o) => (o.id === existente.id ? orden : o)));
  return resultado(true, { orden });
}

// Cancela una orden y devuelve al inventario lo que se había descontado (vitrina e insumos).
// Las órdenes antiguas sin registro de movimientos devuelven sus unidades completas a la vitrina.
export function cancelarOrden(id, motivo = '') {
  const existente = obtenerOrden(id);
  if (!existente) return resultado(false, { mensaje: 'La orden no existe.' });
  if (existente.estado === 'Cancelado' || existente.estado === 'Pago rechazado') {
    return resultado(false, { mensaje: 'La orden ya estaba cancelada.' });
  }
  const movimientos = existente.movimientoStock || {
    vitrina: detalleDeOrden(existente)
      .filter((d) => d.codigo && d.variante !== 'trozo')
      .reduce((acc, d) => ({ ...acc, [d.codigo]: (acc[d.codigo] || 0) + Number(d.cantidad) }), {}),
    insumos: {}
  };
  const devuelto = devolverVenta(listarProductos(), obtenerInsumos(), movimientos);
  storage.guardarProductos(devuelto.productos);
  guardarInsumos(devuelto.insumos);
  const orden = { ...existente, estado: 'Cancelado', motivoCancelacion: motivo, fechaCancelacion: new Date().toISOString() };
  delete orden.movimientoStock;
  storage.guardarOrdenes(listarOrdenes().map((o) => (o.id === existente.id ? orden : o)));
  return resultado(true, { orden });
}

// Cancela las transferencias que pasaron su plazo sin pagarse. Devuelve cuántas se cancelaron.
export function cancelarTransferenciasVencidas(ahora = new Date()) {
  const vencidas = listarOrdenes().filter((o) => o.estado === 'Pendiente de pago' && o.plazoPago && new Date(o.plazoPago) < ahora);
  vencidas.forEach((o) => cancelarOrden(o.id, 'Plazo de pago vencido'));
  return vencidas.length;
}

export function eliminarOrden(id) {
  const existente = obtenerOrden(id);
  if (!existente) return resultado(false, { mensaje: 'La orden no existe.' });
  storage.guardarOrdenes(listarOrdenes().filter((o) => o.id !== existente.id));
  return resultado(true, { orden: existente });
}

export const ordenesDeUsuario = (correo) =>
  listarOrdenes().filter((o) => String(o.correo).toLowerCase() === String(correo || '').toLowerCase());

/* --------------------------------- BLOG ---------------------------------- */

export const listarArticulos = () => storage.obtenerArticulos();
export const obtenerArticulo = (id) => listarArticulos().find((a) => a.id === id) || null;

/* -------------------------------- REPORTES ------------------------------- */

export function resumenVentas() {
  const ordenes = listarOrdenes();
  const validas = ordenes.filter((o) => !ESTADOS_SIN_INGRESO.includes(o.estado));
  const ingresos = validas.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const porEstado = ESTADOS_ORDEN.reduce((acc, e) => ({ ...acc, [e]: ordenes.filter((o) => o.estado === e).length }), {});
  return {
    totalOrdenes: ordenes.length,
    ordenesValidas: validas.length,
    ingresos,
    ticketPromedio: validas.length ? Math.round(ingresos / validas.length) : 0,
    porEstado
  };
}

export function inventarioPorCategoria() {
  return listarCategorias().map((c) => {
    const productos = productosPorCategoria(c.nombre);
    return {
      categoria: c.nombre,
      productos: productos.length,
      unidades: productos.reduce((acc, p) => acc + disponibleDe(p), 0),
      valor: productos.reduce((acc, p) => acc + Number(p.stock) * Number(p.precio), 0),
      criticos: productos.filter((p) => esStockCritico(p)).length
    };
  });
}

export function usuariosPorRol() {
  return listarUsuarios().reduce((acc, u) => ({ ...acc, [u.rol]: (acc[u.rol] || 0) + 1 }), {});
}
