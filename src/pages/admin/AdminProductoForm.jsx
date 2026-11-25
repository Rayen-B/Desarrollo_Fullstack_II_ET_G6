import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { obtenerProductos, guardarProductos } from '../../services/storage';
import { validarCodigoProducto, validarPrecio, validarStock } from '../../utils/validaciones';
import { useCategorias } from '../../hooks/useCategorias';
import { obtenerInsumos } from '../../services/insumos';
import { calcularPreparables } from '../../utils/stock';
import { calcularNutricion } from '../../services/nutricion';
import { recetaParaApi, describirErrorNutricion, formatearNutriente } from '../../utils/nutricion';
import InfoNutricional from '../../components/molecules/InfoNutricional';
// El editor (Tiptap/ProseMirror pesa ~340 KB) se descarga solo cuando el admin abre este formulario
const EditorDescripcion = lazy(() => import('../../components/molecules/EditorDescripcion'));
import { modoServidor } from '../../config';
import { guardarEnServidor } from '../../services/sincronizacion';
import { crearProductoServidor, actualizarProductoServidor, subirFotoServidor } from '../../services/catalogo';
import { comprimirImagen } from '../../utils/imagen';

const FORM_VACIO = { codigo: '', nombre: '', categoria: '', precio: '', stock: '', stockCritico: '', descripcion: '' };
const IMAGEN_POR_DEFECTO = 'menu/Torta_Selva_Negra';

export function validarNombreProducto(nombre) {
  const valido = nombre.trim() !== '' && nombre.length <= 100;
  return { valido, mensaje: valido ? 'Nombre correcto' : 'Requerido (máx 100 caracteres)' };
}

// Aviso cuando el stock ingresado queda en o bajo el stock crítico
export function avisoStockCritico(stock, critico) {
  const valStock = parseInt(stock, 10);
  const valCritico = parseInt(critico, 10);
  if (isNaN(valStock) || isNaN(valCritico) || valCritico <= 0) return null;
  return valStock <= valCritico ? { valStock, valCritico } : false;
}

// Revisa las filas de la receta: insumo elegido, cantidad mayor a 0 y sin insumos repetidos
export function validarReceta(filas) {
  const usados = new Set();
  for (const f of filas) {
    if (!f.insumoId) return { valido: false, mensaje: 'Elige el insumo de cada fila de la receta' };
    if (f.cantidad === '' || isNaN(f.cantidad) || Number(f.cantidad) <= 0) return { valido: false, mensaje: 'Cada insumo de la receta necesita una cantidad mayor a 0' };
    if (usados.has(f.insumoId)) return { valido: false, mensaje: 'Hay insumos repetidos en la receta' };
    usados.add(f.insumoId);
  }
  return { valido: true, mensaje: 'Receta correcta' };
}

const recetaANumeros = (filas) => filas
  .filter((f) => f.insumoId && Number(f.cantidad) > 0)
  .map((f) => ({ insumoId: f.insumoId, cantidad: Number(f.cantidad) }));

// Guarda o actualiza el producto (por código)
function guardarProducto(producto) {
  const productos = obtenerProductos();
  const index = productos.findIndex((p) => (p.codigo || p.id).toUpperCase() === producto.codigo);
  if (index !== -1) productos[index] = { ...productos[index], ...producto };
  else productos.push(producto);
  guardarProductos(productos);
}

export default function AdminProductoForm() {
  const categorias = useCategorias();
  const [searchParams] = useSearchParams();
  const codigoParam = searchParams.get('codigo');

  const [productoEditado, setProductoEditado] = useState(null); // modo edición si se llega con ?codigo=
  const [form, setForm] = useState(FORM_VACIO);
  const [imagenNueva, setImagenNueva] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null); // modo servidor: la foto se sube después de guardar el producto
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState('');
  const [feedback, setFeedback] = useState({}); // { campo: { valido, mensaje } }
  const [alerta, setAlerta] = useState(null);   // { tipo, contenido }
  const [insumos] = useState(obtenerInsumos);
  const [receta, setReceta] = useState([]);       // [{ insumoId, cantidad }]
  const [nutricion, setNutricion] = useState({ cargando: false, datos: null, error: null }); // cálculo en el backend

  useEffect(() => {
    if (!codigoParam) return;
    const p = obtenerProductos().find((item) => (item.codigo || item.id).toUpperCase() === codigoParam.trim().toUpperCase());
    if (!p) return;
    setProductoEditado(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre || '',
      categoria: p.categoria || 'Tortas',
      precio: p.precio || 0,
      stock: p.stock || 0,
      stockCritico: p.stockCritico || 0,
      descripcion: p.descripcion || ''
    });
    setReceta((p.receta || []).map((r) => ({ insumoId: r.insumoId, cantidad: String(r.cantidad) })));
  }, [codigoParam]);

  const esEdicion = productoEditado !== null;
  const preparables = calcularPreparables(recetaANumeros(receta), insumos);
  const unidadDe = (id) => (insumos.find((i) => i.id === id) || { unidad: '' }).unidad;

  // Revisa el aviso de stock crítico con lo disponible (vitrina + preparables)
  const revisarStockCritico = (stock, critico, filas = receta) => {
    const extra = calcularPreparables(recetaANumeros(filas), insumos);
    const aviso = avisoStockCritico(stock === '' ? stock : Number(stock) + extra, critico);
    if (aviso) {
      setAlerta({
        tipo: 'warning',
        contenido: <><i className="ti ti-alert-triangle me-1"></i> <strong>Aviso de Stock Crítico:</strong> El stock disponible ({aviso.valStock}, vitrina + preparables) es menor o igual al límite crítico ({aviso.valCritico}).</>
      });
    } else if (aviso === false) {
      setAlerta((actual) => (actual && actual.tipo === 'warning' ? null : actual));
    }
  };

  // Al escribir se valida en vivo (codigo, nombre, precio y stock)
  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    const nuevo = { ...form, [campo]: valor };
    setForm(nuevo);
    if (campo === 'codigo') setFeedback((f) => ({ ...f, codigo: validarCodigoProducto(valor) }));
    if (campo === 'nombre') setFeedback((f) => ({ ...f, nombre: validarNombreProducto(valor) }));
    if (campo === 'precio') setFeedback((f) => ({ ...f, precio: validarPrecio(valor) }));
    if (campo === 'stock') setFeedback((f) => ({ ...f, stock: validarStock(valor) }));
    if (campo === 'stock' || campo === 'stockCritico') revisarStockCritico(nuevo.stock, nuevo.stockCritico);
  };

  const cambiarReceta = (nuevas) => {
    setReceta(nuevas);
    if (feedback.receta) setFeedback((f) => ({ ...f, receta: validarReceta(nuevas) }));
    revisarStockCritico(form.stock, form.stockCritico, nuevas);
  };
  const cambiarFila = (indice, campo) => (e) => cambiarReceta(receta.map((f, i) => (i === indice ? { ...f, [campo]: e.target.value } : f)));
  const agregarFila = () => cambiarReceta([...receta, { insumoId: '', cantidad: '' }]);
  const quitarFila = (indice) => cambiarReceta(receta.filter((_, i) => i !== indice));

  const cambiarImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (modoServidor()) {
      // Modo servidor: se reduce la foto en el navegador y se sube a la carpeta media al guardar el producto
      setSubiendoImagen(true);
      setErrorImagen('');
      try {
        setArchivoFoto(await comprimirImagen(archivo));
      } catch {
        setArchivoFoto(null);
        setErrorImagen('No se pudo leer la imagen. Prueba con un JPG, PNG o WEBP.');
      } finally {
        setSubiendoImagen(false);
      }
      return;
    }
    const lector = new FileReader();
    lector.onloadend = () => setImagenNueva(lector.result);
    lector.readAsDataURL(archivo);
  };

  // Pide al servidor de nutrición el cálculo de UNA unidad completa con la receta que se ve en pantalla.
  // La primera vez usa la caché del servidor; "Recalcular" fuerza una consulta nueva.
  const calcularInfoNutricional = async () => {
    const items = recetaParaApi(receta);
    const codigo = String(form.codigo || '').trim().toUpperCase();
    if (!validarCodigoProducto(codigo).valido) {
      setNutricion({ cargando: false, datos: null, error: 'Ingresa un código de producto válido antes de calcular.' });
      return;
    }
    if (items.length === 0 || !validarReceta(receta).valido) {
      setNutricion({ cargando: false, datos: null, error: 'Completa la receta (insumo y cantidad mayor a 0, sin repetidos) antes de calcular.' });
      return;
    }
    setNutricion((n) => ({ cargando: true, datos: n.datos, error: null }));
    try {
      const datos = await calcularNutricion(codigo, items, Boolean(nutricion.datos));
      setNutricion({ cargando: false, datos, error: null });
    } catch (err) {
      setNutricion((n) => ({ cargando: false, datos: n.datos, error: describirErrorNutricion(err) }));
    }
  };

  const limpiarFormulario = (formulario) => {
    setForm(FORM_VACIO);
    setFeedback({});
    setReceta([]);
    setImagenNueva(null);
    setArchivoFoto(null);
    if (formulario) formulario.reset();
  };

  // Modo servidor: crea (POST) o edita (PUT), sube la foto si hay una nueva y recién ahí avisa que se guardó
  const guardarEnElServidor = async (producto, formulario) => {
    setGuardando(true);
    const resultado = await guardarEnServidor(async () => {
      const cuerpo = { ...producto, precioAnterior: productoEditado ? productoEditado.precioAnterior : null };
      const guardado = esEdicion ? await actualizarProductoServidor(cuerpo) : await crearProductoServidor(cuerpo);
      return archivoFoto ? subirFotoServidor(guardado.codigo, archivoFoto) : guardado;
    });
    setGuardando(false);
    if (!resultado.exito) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> {resultado.mensaje}</> });
      return;
    }
    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Producto <strong>{producto.nombre}</strong> {esEdicion ? 'actualizado' : 'guardado'} correctamente!</>
    });
    if (esEdicion) {
      setProductoEditado(resultado.datos);
      setArchivoFoto(null);
    } else {
      limpiarFormulario(formulario);
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    const formulario = e.currentTarget;
    const valCodigo = validarCodigoProducto(form.codigo);
    const valPrecio = validarPrecio(form.precio);
    const valStock = validarStock(form.stock);
    const valNombre = validarNombreProducto(form.nombre).valido;
    const valCategoria = form.categoria !== '';
    const valReceta = validarReceta(receta);
    setFeedback((f) => ({ ...f, codigo: valCodigo, precio: valPrecio, stock: valStock, receta: valReceta }));

    if (!(valCodigo.valido && valPrecio.valido && valStock.valido && valNombre && valCategoria && valReceta.valido)) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos marcados en rojo.</> });
      return;
    }

    const producto = {
      id: form.codigo.trim().toUpperCase(),
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock, 10),
      stockCritico: parseInt(form.stockCritico, 10) || 0,
      descripcion: form.descripcion.trim(),
      receta: recetaANumeros(receta),
      // si no se sube una foto nueva se conserva la anterior
      imagen: imagenNueva || (productoEditado && productoEditado.imagen) || IMAGEN_POR_DEFECTO
    };
    if (modoServidor()) {
      guardarEnElServidor(producto, formulario);
      return;
    }
    guardarProducto(producto);

    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Producto <strong>{producto.nombre}</strong> {esEdicion ? 'actualizado' : 'guardado'} correctamente!</>
    });
    // Si es un registro nuevo se limpia el formulario y los colores de validación
    if (!esEdicion) limpiarFormulario(formulario);
  };

  const acciones = (
    <Link to="/admin/productos" className="btn btn-outline-secondary btn-sm">
      <i className="ti ti-arrow-left me-1"></i> Volver al Inventario
    </Link>
  );

  return (
    <AdminLayout
      tituloPagina={esEdicion ? 'Editar Producto' : 'Gestión de Producto'}
      claseTitulo="fw-semibold"
      tituloDocumento="Administrador - Formulario de Producto"
      acciones={acciones}
      pieDestacado
    >
      <div className="row justify-content-center">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold">
                {esEdicion
                  ? <><i className="ti ti-edit me-2 text-secundario"></i> Editar Producto: {productoEditado.nombre}</>
                  : <><i className="ti ti-box me-2 text-primary"></i> Registrar / Editar Producto</>}
              </h5>
              <p className="card-subtitle text-muted small">Completa los campos.</p>
            </div>
            <div className="card-body p-4">
              <div id="alerta-producto" className={alerta ? `alert alert-${alerta.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alerta && alerta.contenido}
              </div>
              <form id="form-producto" noValidate onSubmit={enviar}>
                {/* Código Producto */}
                <div className="mb-3">
                  <label htmlFor="codigo" className="form-label">Código Producto <span className="text-danger">*</span></label>
                  <input type="text" className={'form-control' + claseValidacion(feedback.codigo)} id="codigo" placeholder="Ej: TC001" minLength={3} maxLength={20} required readOnly={esEdicion} value={form.codigo} onChange={cambiar('codigo')} />
                  <div className="form-text small">Requerido, de 3 a 20 letras o números.</div>
                  <FeedbackCampo resultado={feedback.codigo} />
                </div>
                {/* Nombre del Producto */}
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">Nombre <span className="text-danger">*</span></label>
                  <input type="text" className={'form-control' + claseValidacion(feedback.nombre)} id="nombre" placeholder="Ej: Torta de Piña" maxLength={100} required value={form.nombre} onChange={cambiar('nombre')} />
                  <div className="form-text small">Requerido, máximo 100 caracteres.</div>
                  <FeedbackCampo resultado={feedback.nombre} />
                </div>
                {/* Categoría */}
                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">Categorías <span className="text-danger">*</span></label>
                  <select className="form-select" id="categoria" required value={form.categoria} onChange={cambiar('categoria')}>
                    <option value="">-- Selecciona una categoría --</option>
                    {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    {form.categoria && !categorias.some((c) => c.nombre === form.categoria) && <option value={form.categoria}>{form.categoria}</option>}
                  </select>
                  <div className="form-text small">Requerido.</div>
                </div>
                {/* Precio y Stock */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="precio" className="form-label">Precio ($) <span className="text-danger">*</span></label>
                    <input type="number" className={'form-control' + claseValidacion(feedback.precio)} id="precio" placeholder="0" min="0" step="1" required value={form.precio} onChange={cambiar('precio')} />
                    <div className="form-text small">Requerido, en pesos y sin decimales. 0 = producto gratuito.</div>
                    <FeedbackCampo resultado={feedback.precio} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="stock" className="form-label">Stock en vitrina <span className="text-danger">*</span></label>
                    <input type="number" className={'form-control' + claseValidacion(feedback.stock)} id="stock" placeholder="0" min="0" step="1" required value={form.stock} onChange={cambiar('stock')} />
                    <div className="form-text small">Requerido. Unidades ya preparadas, listas para vender.</div>
                    <FeedbackCampo resultado={feedback.stock} />
                  </div>
                </div>
                {/* Stock Crítico e Imagen */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="stock-critico" className="form-label">Stock Crítico (Opcional)</label>
                    <input type="number" className="form-control" id="stock-critico" placeholder="Ej: 3" min="0" step="1" value={form.stockCritico} onChange={cambiar('stockCritico')} />
                    <div className="form-text small">Opcional. Mínimo 0, enteros. Alerta cuando lo disponible (vitrina + preparables) sea igual o inferior.</div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="imagen" className="form-label">Imagen (Opcional)</label>
                    <input type="file" className="form-control" id="imagen" accept="image/*" onChange={cambiarImagen} />
                    <div className="form-text small">Opcional.</div>
                    {subiendoImagen && <div className="small text-muted mt-1" role="status">Preparando imagen…</div>}
                    {archivoFoto && !subiendoImagen && <div className="small text-success mt-1">La imagen se subirá al servidor al guardar el producto.</div>}
                    {errorImagen && <div className="small text-danger mt-1" role="alert">{errorImagen}</div>}
                  </div>
                </div>
                {/* Receta */}
                <div className="mb-3">
                  <label className="form-label"><i className="ti ti-chef-hat me-1"></i> Receta (Opcional)</label>
                  <div className="form-text small mt-0 mb-2">Insumos que usa una unidad completa (un trozo usa 1/4). Sin receta, solo se vende lo que hay en vitrina.</div>
                  {receta.map((fila, i) => (
                    <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                      <select className="form-select form-select-sm" aria-label="Insumo" value={fila.insumoId} onChange={cambiarFila(i, 'insumoId')}>
                        <option value="">-- Insumo --</option>
                        {insumos.map((ins) => <option key={ins.id} value={ins.id}>{ins.nombre}</option>)}
                      </select>
                      <div className="input-group input-group-sm" style={{ maxWidth: '170px' }}>
                        <input type="number" className="form-control" aria-label="Cantidad" placeholder="0" min="0" step="any" value={fila.cantidad} onChange={cambiarFila(i, 'cantidad')} />
                        <span className="input-group-text" style={{ minWidth: '42px' }}>{unidadDe(fila.insumoId) || '—'}</span>
                      </div>
                      <button type="button" className="btn btn-outline-danger btn-sm" aria-label="Quitar insumo" onClick={() => quitarFila(i)}><i className="ti ti-x"></i></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-pasteleria btn-sm" onClick={agregarFila}><i className="ti ti-plus me-1"></i> Agregar insumo</button>
                  {feedback.receta && !feedback.receta.valido && <div className="text-danger small mt-2">{feedback.receta.mensaje}</div>}
                  {receta.length > 0 && (
                    <div className="small mt-2 text-muted">
                      Con los insumos actuales se pueden preparar <strong className="text-principal">{preparables}</strong> unidad(es) más.
                      {form.stock !== '' && <> Disponible total: <strong className="text-principal">{(parseInt(form.stock, 10) || 0) + preparables}</strong>.</>}
                    </div>
                  )}
                  {receta.length > 0 && (
                    <div className="mt-3" id="bloque-nutricion">
                      <button type="button" id="btn-calcular-nutricion" className="btn btn-outline-pasteleria btn-sm" disabled={nutricion.cargando} onClick={calcularInfoNutricional}>
                        <i className="ti ti-leaf me-1"></i> {nutricion.cargando ? 'Calculando…' : nutricion.datos ? 'Recalcular información nutricional' : 'Calcular información nutricional'}
                      </button>
                      {nutricion.error && <div className="text-danger small mt-2" role="alert">{nutricion.error}</div>}
                      {nutricion.datos && (
                        <>
                          <InfoNutricional datos={nutricion.datos} />
                          {nutricion.datos.porTrozo && (
                            <p className="small text-muted mt-2 mb-0">Por trozo (1/4): <strong>{formatearNutriente(nutricion.datos.porTrozo.calorias)} kcal</strong>. Se guarda en el servidor y se muestra en la ficha del producto.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Descripción */}
                <div className="mb-4">
                  <label htmlFor="descripcion" className="form-label">Descripción (Opcional)</label>
                  <Suspense fallback={<div className="form-text small" role="status">Cargando editor…</div>}>
                    <EditorDescripcion valor={form.descripcion} onCambio={(html) => setForm((f) => ({ ...f, descripcion: html }))} />
                  </Suspense>
                </div>
                {/* Botones */}
                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/admin/productos" className="btn btn-light"><i className="ti ti-x me-1"></i> Cancelar</Link>
                  <button type="submit" className="btn btn-pasteleria px-4 fw-semibold" disabled={subiendoImagen || guardando}>
                    <i className="ti ti-device-floppy me-1"></i> {esEdicion ? 'GUARDAR CAMBIOS' : 'GUARDAR PRODUCTO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
