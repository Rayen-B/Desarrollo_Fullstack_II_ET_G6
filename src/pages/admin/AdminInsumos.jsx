import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import AdminLayout from '../../components/organisms/AdminLayout';
import { obtenerProductos } from '../../services/storage';
import { obtenerInsumos, guardarInsumos, esInsumoCritico, textoCantidad, UNIDADES } from '../../services/insumos';
import { useSoloAdmin } from '../../hooks/useSoloAdmin';

// Productos cuya receta usa el insumo
export const productosQueUsan = (insumoId, productos) =>
  productos.filter((p) => (p.receta || []).some((r) => r.insumoId === insumoId));

// Críticos primero luego por nombre
export function ordenarInsumos(insumos) {
  const proporcion = (i) => (i.minimo > 0 ? i.stock / i.minimo : Infinity);
  return [...insumos].sort((a, b) => {
    const ca = esInsumoCritico(a), cb = esInsumoCritico(b);
    if (ca !== cb) return ca ? -1 : 1;
    if (ca) return proporcion(a) - proporcion(b);
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

const textoUnidad = (unidad) => (UNIDADES.find((u) => u.valor === unidad) || { texto: unidad }).texto;

export default function AdminInsumos() {
  const [insumos, setInsumos] = useState(obtenerInsumos);
  const [productos] = useState(obtenerProductos);
  const [busqueda, setBusqueda] = useState('');
  const [insumoAEliminar, setInsumoAEliminar] = useState(null);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const ocultarSoloAdmin = useSoloAdmin();

  const texto = busqueda.toLowerCase().trim();
  const filtrados = ordenarInsumos(insumos.filter((i) => i.nombre.toLowerCase().includes(texto) || i.id.includes(texto)));
  const cantidadCriticos = insumos.filter(esInsumoCritico).length;
  const usadoPor = insumoAEliminar ? productosQueUsan(insumoAEliminar.id, productos) : [];

  const pedirEliminar = (i) => {
    setInsumoAEliminar(i);
    setMostrarEliminar(true);
  };

  // Solo se eliminan insumos que ninguna receta usa
  const confirmarEliminar = () => {
    if (!insumoAEliminar || usadoPor.length) return;
    const nuevos = insumos.filter((i) => i.id !== insumoAEliminar.id);
    guardarInsumos(nuevos);
    setInsumos(nuevos);
    setMostrarEliminar(false);
  };

  const acciones = (
    <Link to="/admin/insumo-form" className="btn btn-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}>
      <i className="ti ti-plus me-1"></i> NUEVO INSUMO
    </Link>
  );

  return (
    <AdminLayout tituloPagina="Insumos de Pastelería" tituloDocumento="Administrador - Insumos" acciones={acciones}>
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-chef-hat me-1"></i> Listado de Insumos</h6>
          <input
            type="text"
            id="buscador-insumos"
            className="form-control form-control-sm input-buscar"
            placeholder="Buscar insumo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Usado en</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> No se encontraron insumos coincidentes.</td></tr>
              ) : (
                filtrados.map((i) => {
                  const critico = esInsumoCritico(i);
                  const usos = productosQueUsan(i.id, productos).length;
                  return (
                    <tr key={i.id}>
                      <td data-label="Insumo">
                        <div className="d-flex flex-column text-end">
                          <span className="fw-bold">{i.nombre}</span>
                          <small className="text-muted font-monospace">{i.id}</small>
                        </div>
                      </td>
                      <td data-label="Unidad">{textoUnidad(i.unidad)}</td>
                      <td data-label="Stock"><span className={`fw-bold ${critico ? 'text-danger' : ''}`}>{textoCantidad(i.stock, i.unidad)}</span></td>
                      <td data-label="Mínimo">{textoCantidad(i.minimo, i.unidad)}</td>
                      <td data-label="Estado">
                        {critico
                          ? <span className="badge-soft-danger"><i className="ti ti-alert-triangle me-1"></i> Reponer</span>
                          : <span className="badge-soft-success">Normal</span>}
                      </td>
                      <td data-label="Usado en"><span className="badge-soft-primary">{usos} {usos === 1 ? 'producto' : 'productos'}</span></td>
                      <td className="text-end" data-label="Acciones">
                        <div className="d-inline-flex gap-2">
                          <Link to={`/admin/insumo-form?id=${i.id}`} className="btn btn-outline-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}><i className="ti ti-edit"></i> Editar</Link>
                          <button type="button" className="btn btn-outline-danger btn-sm solo-admin" style={ocultarSoloAdmin} onClick={() => pedirEliminar(i)}><i className="ti ti-trash"></i> Eliminar</button>
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
          <small className="text-muted">
            Mostrando {filtrados.length} de {insumos.length} insumos
            {cantidadCriticos > 0 && <span className="text-danger fw-semibold"> · {cantidadCriticos} por reponer</span>}
          </small>
        </div>
      </div>

      <Modal show={mostrarEliminar} onHide={() => setMostrarEliminar(false)} centered size="sm" contentClassName="border-0 shadow">
        <div className="modal-body text-center p-4">
          <div className={`${usadoPor.length ? 'text-warning' : 'text-danger'} mb-3`}>
            <i className={`ti ${usadoPor.length ? 'ti-alert-triangle' : 'ti-trash-x'}`} style={{ fontSize: '3rem' }}></i>
          </div>
          {usadoPor.length ? (
            <>
              <h5 className="fw-bold text-principal mb-2">No se puede eliminar</h5>
              <p className="text-muted small mb-4">
                <strong>{insumoAEliminar && insumoAEliminar.nombre}</strong> se usa en la receta de: {usadoPor.map((p) => p.nombre).join(', ')}. Quítalo de esas recetas antes de eliminarlo.
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarEliminar(false)}><i className="ti ti-check me-1"></i> Entendido</button>
              </div>
            </>
          ) : (
            <>
              <h5 className="fw-bold text-principal mb-2">¿Eliminar insumo?</h5>
              <p className="text-muted small mb-4">
                ¿Estás seguro de que deseas eliminar permanentemente <strong>{insumoAEliminar && insumoAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
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
