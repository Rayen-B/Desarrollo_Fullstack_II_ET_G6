import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import AdminLayout from '../../components/organisms/AdminLayout';
import { obtenerProductos, guardarProductos } from '../../services/storage';
import { obtenerImagen } from '../../assets/images';
import { useSoloAdmin } from '../../hooks/useSoloAdmin';
import { useCategorias } from '../../hooks/useCategorias';
import { obtenerInsumos, textoCantidad } from '../../services/insumos';
import { calcularPreparables, disponibleProducto, stockVitrina } from '../../utils/stock';

// crítico si lo disponible (vitrina + preparables) está en o bajo su stock crítico
export const esStockCritico = (p, insumos = []) => disponibleProducto(p, insumos) <= (p.stockCritico || 0);

// Filtra por nombre, código o categoría
export function filtrarProductos(productos, filtro) {
  const texto = filtro.toLowerCase().trim();
  return productos.filter((p) =>
    (p.nombre || '').toLowerCase().includes(texto) ||
    (p.codigo || '').toLowerCase().includes(texto) ||
    (p.categoria && p.categoria.toLowerCase().includes(texto))
  );
}

// Orden por prioridad: primero los productos con stock crítico
// luego el resto en el orden del catálogo.
export function ordenarProductos(productos, orden, insumos = []) {
  const disponible = (p) => disponibleProducto(p, insumos);
  const lista = productos.map((p, i) => ({ p, i }));
  if (orden === 'prioridad') {
    lista.sort((a, b) => {
      const ca = esStockCritico(a.p, insumos), cb = esStockCritico(b.p, insumos);
      if (ca !== cb) return ca ? -1 : 1;
      if (ca) return (disponible(a.p) - (a.p.stockCritico || 0)) - (disponible(b.p) - (b.p.stockCritico || 0));
      return a.i - b.i;
    });
  } else if (orden === 'nombre') {
    lista.sort((a, b) => a.p.nombre.localeCompare(b.p.nombre, 'es'));
  } else if (orden === 'stock') {
    lista.sort((a, b) => disponible(a.p) - disponible(b.p));
  }
  return lista.map((x) => x.p);
}

const precioTexto = (precio) => '$' + Number(precio).toLocaleString('es-CL');

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [insumos] = useState(obtenerInsumos);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');   // '' = todas
  const [orden, setOrden] = useState('prioridad');               // stock crítico primero
  const categorias = useCategorias();
  const ocultarSoloAdmin = useSoloAdmin();

  // Modal "Ver producto"
  const [productoModal, setProductoModal] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  // Modal "Eliminar producto"
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);

  useEffect(() => {
    setProductos(obtenerProductos());
  }, []);

  const filtrados = ordenarProductos(
    filtrarProductos(productos, busqueda).filter((p) => !categoriaFiltro || p.categoria === categoriaFiltro),
    orden,
    insumos
  );
  const cantidadCriticos = productos.filter((p) => esStockCritico(p, insumos)).length;
  const nombreInsumo = (id) => (insumos.find((i) => i.id === id) || { nombre: id }).nombre;
  const unidadInsumo = (id) => (insumos.find((i) => i.id === id) || { unidad: '' }).unidad;

  const verProducto = (p) => {
    setProductoModal(p);
    setMostrarDetalle(true);
  };

  const pedirEliminar = (p) => {
    setProductoAEliminar(p);
    setMostrarEliminar(true);
  };

  const confirmarEliminar = () => {
    if (!productoAEliminar) return;
    const nuevos = productos.filter((p) => p.codigo.toUpperCase() !== productoAEliminar.codigo.toUpperCase());
    setProductos(nuevos);
    guardarProductos(nuevos);
    setMostrarEliminar(false);
  };

  const acciones = (
    <Link to="/admin/producto-form" className="btn btn-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}>
      <i className="ti ti-plus me-1"></i> NUEVO PRODUCTO
    </Link>
  );

  return (
    <AdminLayout tituloPagina="Inventario de Productos" tituloDocumento="Administrador - Inventario de Productos" acciones={acciones}>
      {/* Tabla de Inventario de Productos */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-box me-1"></i> Listado de Productos</h6>
          <div className="d-flex gap-2 flex-wrap justify-content-sm-end">
            <select className="form-select form-select-sm" style={{ width: 'auto' }} id="filtro-categoria" aria-label="Filtrar por categoría" value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} id="orden-productos" aria-label="Ordenar productos" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="prioridad">Prioridad: stock crítico primero</option>
              <option value="catalogo">Orden del catálogo</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="stock">Menor disponibilidad primero</option>
            </select>
            <input
              type="text"
              id="buscador-productos"
              className="form-control form-control-sm input-buscar"
              placeholder="Buscar por código, nombre o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th>Stock Crítico / Alerta</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-productos-body">
              {filtrados.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> No se encontraron productos que coincidan</td></tr>
              ) : (
                filtrados.map((p) => {
                  const critico = esStockCritico(p, insumos);
                  const conReceta = (p.receta || []).length > 0;
                  return (
                    <tr key={p.codigo}>
                      <td className="fw-bold font-monospace" data-label="Código">{p.codigo}</td>
                      <td data-label="Imagen"><img src={obtenerImagen(p.imagen)} alt={p.nombre} className="avatar-producto" /></td>
                      <td data-label="Nombre">
                        <div className="d-flex flex-column text-end">
                          <span className="fw-bold">{p.nombre}</span>
                          <small className="text-muted mt-1">{p.descripcion || ''}</small>
                        </div>
                      </td>
                      <td data-label="Categoría"><span className="badge-soft-primary">{p.categoria || 'Pastelería'}</span></td>
                      <td className="fw-bold" data-label="Precio">{precioTexto(p.precio)}</td>
                      <td data-label="Disponible">
                        <div className="d-flex flex-column text-end">
                          <span className={`fw-bold ${critico ? 'text-danger' : ''}`}>{disponibleProducto(p, insumos)}</span>
                          <small className="text-muted text-nowrap">Vitrina {stockVitrina(p)} · Prep. {conReceta ? calcularPreparables(p.receta, insumos) : '—'}</small>
                        </div>
                      </td>
                      <td data-label="Stock Crítico / Alerta">
                        {critico
                          ? <span className="badge-soft-danger"><i className="ti ti-alert-triangle me-1"></i> Crítico (Min: {p.stockCritico || 0})</span>
                          : <span className="badge-soft-success">Normal</span>}
                      </td>
                      <td className="text-end" data-label="Acciones">
                        <div className="d-inline-flex gap-2">
                          <button type="button" className="btn btn-outline-info btn-sm btn-ver-producto" onClick={() => verProducto(p)}><i className="ti ti-eye"></i> Ver</button>
                          <Link to={`/admin/producto-form?codigo=${p.codigo}`} className="btn btn-outline-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}><i className="ti ti-edit"></i> Editar</Link>
                          <button type="button" className="btn btn-outline-danger btn-sm btn-eliminar-producto solo-admin" style={ocultarSoloAdmin} onClick={() => pedirEliminar(p)}><i className="ti ti-trash"></i> Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
          <small id="conteo-productos" className="text-muted">
            Mostrando {filtrados.length} de {productos.length} productos
            {cantidadCriticos > 0 && <span className="text-danger fw-semibold"> · {cantidadCriticos} con stock crítico</span>}
          </small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>«</a></li>
              <li className="page-item active"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>1</a></li>
              <li className="page-item"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>»</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Modal Mostrar Producto */}
      <Modal show={mostrarDetalle} onHide={() => setMostrarDetalle(false)} centered contentClassName="border-0 shadow" aria-labelledby="modalMostrarProductoLabel">
        {productoModal && (
          <>
            <div className="modal-header bg-white border-bottom">
              <h5 className="modal-title fw-bold text-principal" id="modalMostrarProductoLabel">
                <i className="ti ti-box me-1 text-secundario"></i> Detalle del Producto
              </h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMostrarDetalle(false)}></button>
            </div>
            <div className="modal-body p-4">
              <div className="text-center mb-3">
                <img id="modal-prod-img" src={obtenerImagen(productoModal.imagen)} alt={productoModal.nombre} className="rounded shadow-sm" style={{ maxHeight: '180px', width: 'auto', objectFit: 'cover' }} />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span id="modal-prod-codigo" className="badge bg-light text-dark font-monospace border">{productoModal.codigo}</span>
                <span id="modal-prod-categoria" className="badge-soft-primary">{productoModal.categoria || 'Pastelería'}</span>
              </div>
              <h4 id="modal-prod-nombre" className="fw-bold text-principal mb-2">{productoModal.nombre}</h4>
              <p id="modal-prod-desc" className="text-muted small mb-3">{productoModal.descripcion || 'Sin descripción disponible para este producto.'}</p>
              <div className="p-3 bg-light rounded-3 mb-3">
                <div className="row g-2 text-center">
                  <div className="col-6 col-sm-3">
                    <small className="text-muted d-block">Precio</small>
                    <span id="modal-prod-precio" className="fw-bold text-principal fs-5">{precioTexto(productoModal.precio)}</span>
                  </div>
                  <div className="col-6 col-sm-3 border-start">
                    <small className="text-muted d-block">Vitrina</small>
                    <span className="fw-bold fs-5">{stockVitrina(productoModal)}</span>
                  </div>
                  <div className="col-6 col-sm-3 border-start">
                    <small className="text-muted d-block">Disponible</small>
                    <span id="modal-prod-stock" className={esStockCritico(productoModal, insumos) ? 'fw-bold fs-5 text-danger' : 'fw-bold fs-5 text-success'}>{disponibleProducto(productoModal, insumos)}</span>
                  </div>
                  <div className="col-6 col-sm-3 border-start">
                    <small className="text-muted d-block">Stock Crítico</small>
                    <span id="modal-prod-critico" className="fw-bold text-muted fs-5">{productoModal.stockCritico || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted fw-semibold d-block mb-1"><i className="ti ti-chef-hat me-1"></i> Receta (por unidad completa)</small>
                {(productoModal.receta || []).length === 0 ? (
                  <small className="text-muted">Sin receta: se vende solo lo que hay en vitrina.</small>
                ) : (
                  <ul className="list-unstyled small mb-0">
                    {productoModal.receta.map((r) => (
                      <li key={r.insumoId} className="d-flex justify-content-between border-bottom py-1">
                        <span>{nombreInsumo(r.insumoId)}</span>
                        <span className="text-muted">{textoCantidad(r.cantidad, unidadInsumo(r.insumoId))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {esStockCritico(productoModal, insumos) ? (
                <div id="modal-prod-alerta" className="alert alert-danger py-2 px-3 mb-0 small d-flex align-items-center">
                  <i className="ti ti-alert-triangle me-2 fs-5"></i> <span><strong>¡Stock Crítico!</strong> Quedan solo {disponibleProducto(productoModal, insumos)} unidad(es) disponibles ({stockVitrina(productoModal)} en vitrina).</span>
                </div>
              ) : (
                <div id="modal-prod-alerta" className="alert alert-success py-2 px-3 mb-0 small d-flex align-items-center">
                  <i className="ti ti-circle-check me-2 fs-5"></i> <span>Nivel de stock óptimo ({disponibleProducto(productoModal, insumos)} disponibles).</span>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light border-0 py-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarDetalle(false)}><i className="ti ti-x me-1"></i> Cerrar</button>
              <Link id="modal-prod-btn-editar" to={`/admin/producto-form?codigo=${productoModal.codigo}`} className="btn btn-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}>
                <i className="ti ti-edit me-1"></i> Ir a Editar
              </Link>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal show={mostrarEliminar} onHide={() => setMostrarEliminar(false)} centered size="sm" contentClassName="border-0 shadow">
        <div className="modal-body text-center p-4">
          <div className="text-danger mb-3">
            <i className="ti ti-trash-x" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5 className="fw-bold text-principal mb-2" id="modal-eliminar-titulo">¿Eliminar producto?</h5>
          <p className="text-muted small mb-4" id="modal-eliminar-mensaje">
            ¿Estás seguro de que deseas eliminar permanentemente <strong>{productoAEliminar ? productoAEliminar.nombre : ''}</strong> (<code>{productoAEliminar ? productoAEliminar.codigo : ''}</code>)? Esta acción no se puede deshacer.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarEliminar(false)}><i className="ti ti-x me-1"></i> Cancelar</button>
            <button type="button" className="btn btn-danger btn-sm" id="btn-confirmar-eliminar-definitivo" onClick={confirmarEliminar}>
              <i className="ti ti-trash me-1"></i> Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
