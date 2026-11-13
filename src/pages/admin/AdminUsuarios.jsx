import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import AdminLayout from '../../components/organisms/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useSoloAdmin } from '../../hooks/useSoloAdmin';

// Color e ícono de la insignia según el rol
export function estiloRol(rol) {
  if (rol === 'Administrador') return { clase: 'badge-soft-secondary', icono: 'ti-shield' };
  if (rol === 'Vendedor') return { clase: 'badge-soft-primary', icono: 'ti-user' };
  return { clase: 'badge-soft-info', icono: 'ti-user' };
}

// Filtra por RUN, nombre, apellidos o correo
export function filtrarUsuarios(usuarios, filtro) {
  const texto = filtro.toLowerCase().trim();
  return usuarios.filter((u) =>
    (u.run || '').toLowerCase().includes(texto) ||
    (u.nombre || '').toLowerCase().includes(texto) ||
    (u.apellidos && u.apellidos.toLowerCase().includes(texto)) ||
    (u.correo && u.correo.toLowerCase().includes(texto))
  );
}

const nombreCompleto = (u) => `${u.nombre} ${u.apellidos || ''}`;

export default function AdminUsuarios() {
  const { usuario, usuariosDB, setUsuariosDB } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const ocultarSoloAdmin = useSoloAdmin();

  const [usuarioModal, setUsuarioModal] = useState(null);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);

  const filtrados = filtrarUsuarios(usuariosDB, busqueda);

  const verUsuario = (u) => {
    setUsuarioModal(u);
    setMostrarFicha(true);
  };

  const pedirEliminar = (u) => {
    // Evita que el usuario conectado se elimine a sí mismo
    if (usuario && usuario.run && u.run && usuario.run.toUpperCase() === u.run.toUpperCase()) {
      alert('No puedes eliminar tu propio usuario activo actualmente conectado.');
      return;
    }
    setUsuarioAEliminar(u);
    setMostrarEliminar(true);
  };

  const confirmarEliminar = () => {
    if (!usuarioAEliminar) return;
    setUsuariosDB(usuariosDB.filter((u) => u !== usuarioAEliminar));
    setMostrarEliminar(false);
  };

  useEffect(() => {
    // si se elimina el usuario que estaba abierto en la ficha, se cierra
    if (usuarioModal && !usuariosDB.includes(usuarioModal)) setMostrarFicha(false);
  }, [usuariosDB, usuarioModal]);

  const acciones = (
    <Link to="/admin/usuario-form" className="btn btn-pasteleria btn-sm">
      <i className="ti ti-user-plus me-1"></i> NUEVO USUARIO
    </Link>
  );

  return (
    <AdminLayout tituloPagina="Gestión de Usuarios y Roles" tituloDocumento="Administrador - Gestión de Usuarios" acciones={acciones}>
      <div className="alert alert-roles d-flex align-items-center mb-4 border-0 shadow-sm" role="alert">
        <div className="small">
          <b>Roles:</b>{' '}
          <span className="badge bg-secondary ms-1">Administrador: Acceso total</span>{' '}
          <span className="badge bg-success ms-1">Vendedor: Solo Productos y Órdenes</span>{' '}
          <span className="badge bg-light text-dark border ms-1">Cliente: Solo Tienda</span>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-users me-1"></i> Listado de Usuarios Registrados</h6>
          <input
            type="text"
            id="buscador-usuarios"
            className="form-control form-control-sm input-buscar"
            placeholder="Buscar por RUN, nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>RUN</th>
                <th>Usuario / Nombre Completo</th>
                <th>Correo Electrónico</th>
                <th>Rol / Perfil</th>
                <th>Región / Comuna</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-usuarios-body">
              {filtrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> No se encontraron usuarios coincidentes.</td></tr>
              ) : (
                filtrados.map((u, i) => {
                  const rol = estiloRol(u.rol);
                  return (
                    <tr key={u.run || u.correo || i}>
                      <td className="fw-bold font-monospace" data-label="RUN">{u.run}</td>
                      <td data-label="Usuario / Nombre Completo">
                        <div>
                          <div className="fw-semibold">{nombreCompleto(u)}</div>
                          <small className="text-muted">{u.direccion || 'Sin dirección'}</small>
                        </div>
                      </td>
                      <td data-label="Correo Electrónico"><a href={`mailto:${u.correo}`} className="text-decoration-none text-secundario">{u.correo}</a></td>
                      <td data-label="Rol / Perfil"><span className={rol.clase}><i className={`ti ${rol.icono} me-1`}></i> {u.rol || 'Cliente'}</span></td>
                      <td data-label="Región / Comuna">{u.comuna || (u.region ? u.region.split(' ')[0] : 'Santiago')}</td>
                      <td className="text-end" data-label="Acciones">
                        <div className="d-inline-flex gap-2">
                          <button type="button" className="btn btn-outline-info btn-sm btn-ver-usuario" onClick={() => verUsuario(u)}><i className="ti ti-eye"></i> Ver</button>
                          <Link to={`/admin/usuario-form?run=${u.run || ''}`} className="btn btn-outline-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}><i className="ti ti-edit"></i> Editar</Link>
                          <button type="button" className="btn btn-outline-danger btn-sm btn-eliminar-usuario solo-admin" style={ocultarSoloAdmin} onClick={() => pedirEliminar(u)}><i className="ti ti-trash"></i> Eliminar</button>
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
          <small id="conteo-usuarios" className="text-muted">Mostrando {filtrados.length} usuarios registrados</small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>«</a></li>
              <li className="page-item active"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>1</a></li>
              <li className="page-item"><a className="page-link" href="#" onClick={(e) => e.preventDefault()}>»</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Modal Mostrar Usuario */}
      <Modal show={mostrarFicha} onHide={() => setMostrarFicha(false)} centered contentClassName="border-0 shadow" aria-labelledby="modalMostrarUsuarioLabel">
        {usuarioModal && (
          <>
            <div className="modal-header bg-white border-bottom">
              <h5 className="modal-title fw-bold text-principal" id="modalMostrarUsuarioLabel">
                <i className="ti ti-user me-1 text-secundario"></i> Ficha de Usuario
              </h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMostrarFicha(false)}></button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-3">
                <h5 id="modal-usr-nombre" className="fw-bold text-principal mb-1">{nombreCompleto(usuarioModal)}</h5>
                <span id="modal-usr-rol" className={estiloRol(usuarioModal.rol).clase}>{usuarioModal.rol || 'Cliente'}</span>
              </div>
              <div className="list-group list-group-flush border-top border-bottom mb-3 small">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-id me-1"></i> RUN</span>
                  <span id="modal-usr-run" className="fw-bold font-monospace">{usuarioModal.run}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-mail me-1"></i> Correo</span>
                  <span id="modal-usr-correo" className="fw-semibold">{usuarioModal.correo}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-calendar me-1"></i> Fecha de Nacimiento</span>
                  <span id="modal-usr-fecha" className="text-muted">{usuarioModal.fechaNacimiento || 'No registrada'}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-map-pin me-1"></i> Ubicación</span>
                  <span id="modal-usr-ubicacion" className="fw-semibold">{usuarioModal.comuna || 'Santiago'}, {usuarioModal.region || 'Región Metropolitana'}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-home me-1"></i> Dirección</span>
                  <span id="modal-usr-direccion" className="text-muted">{usuarioModal.direccion || 'Sin dirección registrada'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light border-0 py-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarFicha(false)}><i className="ti ti-x me-1"></i> Cerrar</button>
              <Link id="modal-usr-btn-editar" to={`/admin/usuario-form?run=${usuarioModal.run || ''}`} className="btn btn-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}>
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
          <h5 className="fw-bold text-principal mb-2" id="modal-eliminar-titulo">¿Eliminar usuario?</h5>
          <p className="text-muted small mb-4" id="modal-eliminar-mensaje">
            ¿Estás seguro de que deseas eliminar al usuario <b>{usuarioAEliminar ? nombreCompleto(usuarioAEliminar) : ''}</b> (RUN: <code>{usuarioAEliminar ? usuarioAEliminar.run : ''}</code>)? Esta acción no se puede deshacer.
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
