import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import AdminLayout from '../../components/organisms/AdminLayout';
import { obtenerProductos } from '../../services/storage';
import { obtenerCategorias, guardarCategorias, categoriaDeProducto } from '../../services/categorias';
import { obtenerImagen } from '../../assets/images';

// Cantidad de productos del inventario que pertenecen a cada categoría
export function contarProductosPorCategoria(productos, categorias) {
  const conteo = {};
  productos.forEach((p) => {
    const c = categoriaDeProducto(p.categoria, categorias);
    if (c) conteo[c.id] = (conteo[c.id] || 0) + 1;
  });
  return conteo;
}

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState(obtenerCategorias);
  const [productos] = useState(obtenerProductos);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);

  const conteo = contarProductosPorCategoria(productos, categorias);
  // Productos que impiden eliminar la categoría
  const productosDe = (c) => conteo[c.id] || 0;
  const texto = busqueda.toLowerCase().trim();
  const filtradas = categorias.filter((c) => c.nombre.toLowerCase().includes(texto) || (c.descripcion || '').toLowerCase().includes(texto));

  const pedirEliminar = (c) => {
    setCategoriaAEliminar(c);
    setMostrarEliminar(true);
  };

  // Solo se eliminan categorías sin productos
  const confirmarEliminar = () => {
    if (!categoriaAEliminar || productosDe(categoriaAEliminar)) return;
    const nuevas = categorias.filter((c) => c.id !== categoriaAEliminar.id);
    guardarCategorias(nuevas);
    setCategorias(nuevas);
    setMostrarEliminar(false);
  };

  const productosAEliminar = categoriaAEliminar ? productosDe(categoriaAEliminar) : 0;

  const acciones = (
    <Link to="/admin/categoria-form" className="btn btn-pasteleria btn-sm">
      <i className="ti ti-category-plus me-1"></i> NUEVA CATEGORÍA
    </Link>
  );

  return (
    <AdminLayout tituloPagina="Categorías de Productos" tituloDocumento="Administrador - Categorías" acciones={acciones}>
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-category me-1"></i> Listado de Categorías</h6>
          <input
            type="text"
            id="buscador-categorias"
            className="form-control form-control-sm input-buscar"
            placeholder="Buscar categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Productos</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> No se encontraron categorías coincidentes.</td></tr>
              ) : (
                filtradas.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Imagen"><img src={obtenerImagen(c.imagen)} alt={c.nombre} className="avatar-producto" /></td>
                    <td data-label="Nombre">
                      <div className="d-flex flex-column text-end">
                        <span className="fw-bold">{c.nombre}</span>
                        <small className="text-muted font-monospace">{c.id}</small>
                      </div>
                    </td>
                    <td data-label="Descripción"><small className="text-muted">{c.descripcion || '—'}</small></td>
                    <td data-label="Productos"><span className="badge-soft-primary">{conteo[c.id] || 0} {conteo[c.id] === 1 ? 'producto' : 'productos'}</span></td>
                    <td className="text-end" data-label="Acciones">
                      <div className="d-inline-flex gap-2">
                        <Link to={`/admin/categoria-form?id=${c.id}`} className="btn btn-outline-pasteleria btn-sm"><i className="ti ti-edit"></i> Editar</Link>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => pedirEliminar(c)}><i className="ti ti-trash"></i> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
          <small className="text-muted">Mostrando {filtradas.length} de {categorias.length} categorías</small>
        </div>
      </div>

      <Modal show={mostrarEliminar} onHide={() => setMostrarEliminar(false)} centered size="sm" contentClassName="border-0 shadow">
        <div className="modal-body text-center p-4">
          <div className={`${productosAEliminar ? 'text-warning' : 'text-danger'} mb-3`}>
            <i className={`ti ${productosAEliminar ? 'ti-alert-triangle' : 'ti-trash-x'}`} style={{ fontSize: '3rem' }}></i>
          </div>
          {productosAEliminar ? (
            <>
              <h5 className="fw-bold text-principal mb-2">No se puede eliminar</h5>
              <p className="text-muted small mb-4">
                La categoría <strong>{categoriaAEliminar && categoriaAEliminar.nombre}</strong> tiene {productosAEliminar} {productosAEliminar === 1 ? 'producto' : 'productos'}. Cámbialos de categoría o elimínalos desde el Inventario antes de eliminarla.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarEliminar(false)}><i className="ti ti-check me-1"></i> Entendido</button>
                <Link to="/admin/productos" className="btn btn-pasteleria btn-sm"><i className="ti ti-box me-1"></i> Ir al Inventario</Link>
              </div>
            </>
          ) : (
            <>
              <h5 className="fw-bold text-principal mb-2">¿Eliminar categoría?</h5>
              <p className="text-muted small mb-4">
                ¿Estás seguro de que deseas eliminar permanentemente la categoría <strong>{categoriaAEliminar && categoriaAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarEliminar(false)}><i className="ti ti-x me-1"></i> Cancelar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={confirmarEliminar}>
                  <i className="ti ti-trash me-1"></i> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}
