import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { useAuth } from '../../context/AuthContext';
import { regionesYComunas } from '../../utils/regiones';
import { validarRUN, validarEmail, validarPassword } from '../../utils/validaciones';

const FORM_VACIO = { run: '', rol: 'Cliente', nombre: '', apellidos: '', correo: '', password: '', fechaNacimiento: '', region: '', comuna: '', direccion: '' };

// Validaciones de texto
const validarLargo = (valor, max, ok, error) => {
  const valido = valor.trim() !== '' && valor.length <= max;
  return { valido, mensaje: valido ? ok : error };
};
export const validarNombreUsuario = (v) => validarLargo(v, 50, 'Nombre correcto', 'Requerido (máx 50 caracteres)');
export const validarApellidos = (v) => validarLargo(v, 100, 'Apellidos correctos', 'Requerido (máx 100 caracteres)');
export const validarDireccion = (v) => validarLargo(v, 300, 'Dirección válida', 'Requerido (máx 300 caracteres)');

// Validación en vivo de cada campo
const VALIDADORES = {
  run: validarRUN,
  nombre: validarNombreUsuario,
  apellidos: validarApellidos,
  correo: validarEmail,
  password: validarPassword,
  direccion: validarDireccion
};

const normalizarRun = (run) => String(run || '').replace(/[.-]/g, '').trim().toUpperCase();

export default function AdminUsuarioForm() {
  const { usuariosDB, setUsuariosDB } = useAuth();
  const [searchParams] = useSearchParams();
  const runParam = searchParams.get('run');

  const [usuarioEditado, setUsuarioEditado] = useState(null); // modo edición si se llega con ?run=
  const [form, setForm] = useState(FORM_VACIO);
  const [feedback, setFeedback] = useState({});
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (!runParam) return;
    const u = usuariosDB.find((usr) => usr.run && usr.run.toUpperCase() === runParam.trim().toUpperCase());
    if (!u) return;
    setUsuarioEditado(u);
    setForm({
      run: u.run,
      rol: u.rol || 'Cliente',
      nombre: u.nombre || '',
      apellidos: u.apellidos || '',
      correo: u.correo || '',
      password: u.password || '',
      fechaNacimiento: u.fechaNacimiento || '',
      region: u.region || '',
      comuna: u.comuna || '',
      direccion: u.direccion || ''
    });
  }, [runParam]);

  const esEdicion = usuarioEditado !== null;
  const regionActual = regionesYComunas.find((r) => r.region === form.region);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => (campo === 'region' ? { ...f, region: valor, comuna: '' } : { ...f, [campo]: valor }));
    if (VALIDADORES[campo]) setFeedback((fb) => ({ ...fb, [campo]: VALIDADORES[campo](valor) }));
  };

  const enviar = (e) => {
    e.preventDefault();
    const vRun = validarRUN(form.run);
    const vCorreo = validarEmail(form.correo);
    const vPass = validarPassword(form.password);
    setFeedback((fb) => ({ ...fb, run: vRun, correo: vCorreo, password: vPass }));

    const todoValido = vRun.valido && vCorreo.valido && vPass.valido &&
      validarNombreUsuario(form.nombre).valido && validarApellidos(form.apellidos).valido &&
      validarDireccion(form.direccion).valido && form.region !== '' && form.comuna !== '';

    if (!todoValido) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos requeridos marcados en rojo.</> });
      return;
    }

    const nuevo = {
      run: normalizarRun(form.run),
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      password: form.password,
      fechaNacimiento: form.fechaNacimiento,
      rol: form.rol,
      region: form.region,
      comuna: form.comuna,
      direccion: form.direccion.trim()
    };

    // Guarda o actualiza (por RUN)
    const index = usuariosDB.findIndex((u) => u.run && u.run.toUpperCase() === nuevo.run);
    if (index !== -1) setUsuariosDB(usuariosDB.map((u, i) => (i === index ? { ...u, ...nuevo } : u)));
    else setUsuariosDB([...usuariosDB, nuevo]);

    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Usuario <b>{nuevo.nombre} {nuevo.apellidos}</b> {esEdicion ? 'actualizado' : 'registrado'} exitosamente!</>
    });
    // Si era un registro nuevo se limpia el formulario
    if (!esEdicion) {
      setForm(FORM_VACIO);
      setFeedback({});
    }
  };

  const acciones = (
    <Link to="/admin/usuarios" className="btn btn-outline-secondary btn-sm">
      <i className="ti ti-arrow-left me-1"></i> Volver a Usuarios
    </Link>
  );

  return (
    <AdminLayout
      tituloPagina={esEdicion ? 'Editar Usuario' : 'Gestión de Usuario'}
      tituloDocumento="Administrador - Formulario de Usuario"
      acciones={acciones}
    >
      <div className="row justify-content-center">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold text-principal">
                {esEdicion
                  ? <><i className="ti ti-user-check me-2 text-secundario"></i> Editar Usuario: {usuarioEditado.nombre} {usuarioEditado.apellidos || ''}</>
                  : <><i className="ti ti-user-plus me-2 text-secundario"></i> Registrar / Editar Usuario</>}
              </h5>
              <p className="card-subtitle text-muted small">Todos los campos con (*) son obligatorios.</p>
            </div>
            <div className="card-body p-4">
              <div id="alerta-usuario" className={alerta ? `alert alert-${alerta.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alerta && alerta.contenido}
              </div>
              <form id="form-usuario" noValidate onSubmit={enviar}>
                {/* RUN y Tipo de Usuario */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="run" className="form-label">RUN<span className="text-danger">*</span></label>
                    <input type="text" className={'form-control font-monospace' + claseValidacion(feedback.run)} id="run" placeholder="Ej: 190110222" maxLength={9} required readOnly={esEdicion} value={form.run} onChange={cambiar('run')} />
                    <div className="form-text small">Sin puntos ni guión.</div>
                    <FeedbackCampo resultado={feedback.run} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="rol" className="form-label">Tipo de Usuario (Rol) <span className="text-danger">*</span></label>
                    <select className="form-select" id="rol" required value={form.rol} onChange={cambiar('rol')}>
                      <option value="Administrador">Administrador (Acceso total)</option>
                      <option value="Vendedor">Vendedor (Productos y Órdenes)</option>
                      <option value="Cliente">Cliente (Solo Tienda)</option>
                    </select>
                    <div className="form-text small">Exclusivo de la vista de administración.</div>
                  </div>
                </div>
                {/* Nombre y Apellidos */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="nombre" className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.nombre)} id="nombre" placeholder="Ej: Juan" maxLength={50} required value={form.nombre} onChange={cambiar('nombre')} />
                    <div className="form-text small">Requerido, máximo 50 caracteres.</div>
                    <FeedbackCampo resultado={feedback.nombre} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="apellidos" className="form-label">Apellidos <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.apellidos)} id="apellidos" placeholder="Ej: Pérez González" maxLength={100} required value={form.apellidos} onChange={cambiar('apellidos')} />
                    <div className="form-text small">Requerido, máximo 100 caracteres.</div>
                    <FeedbackCampo resultado={feedback.apellidos} />
                  </div>
                </div>
                {/* Correo Electrónico */}
                <div className="mb-3">
                  <label htmlFor="correo" className="form-label">Correo Electrónico <span className="text-danger">*</span></label>
                  <input type="email" className={'form-control' + claseValidacion(feedback.correo)} id="correo" placeholder="ejemplo@correo.com" maxLength={100} required value={form.correo} onChange={cambiar('correo')} />
                  <div className="form-text small">Requerido. Máximo 100 caracteres.</div>
                  <FeedbackCampo resultado={feedback.correo} />
                </div>
                {/* Contraseña y Fecha de Nacimiento */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="password" className="form-label">Contraseña <span className="text-danger">*</span></label>
                    <input type="password" className={'form-control' + claseValidacion(feedback.password)} id="password" placeholder="••••••••" maxLength={10} required value={form.password} onChange={cambiar('password')} />
                    <div className="form-text small">4 a 10 caracteres, alfanumérica y al menos 1 símbolo.</div>
                    <FeedbackCampo resultado={feedback.password} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="fechaNacimiento" className="form-label">Fecha de Nacimiento (Opcional)</label>
                    <input type="date" className="form-control" id="fechaNacimiento" lang="es-CL" value={form.fechaNacimiento} onChange={cambiar('fechaNacimiento')} />
                    <div className="form-text small">Opcional.</div>
                  </div>
                </div>
                {/* Región y Comuna */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="select-region" className="form-label">Región <span className="text-danger">*</span></label>
                    <select className="form-select" id="select-region" required value={form.region} onChange={cambiar('region')}>
                      <option value="">-- Seleccione la región --</option>
                      {regionesYComunas.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="select-comuna" className="form-label">Comuna <span className="text-danger">*</span></label>
                    <select className="form-select" id="select-comuna" required disabled={!regionActual} value={form.comuna} onChange={cambiar('comuna')}>
                      <option value="">{regionActual ? '-- Seleccione la comuna --' : '-- Primero seleccione una región --'}</option>
                      {regionActual && regionActual.comunas.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {/* Dirección */}
                <div className="mb-4">
                  <label htmlFor="direccion" className="form-label">Dirección <span className="text-danger">*</span></label>
                  <input type="text" className={'form-control' + claseValidacion(feedback.direccion)} id="direccion" placeholder="Ej: Av. Vicuña Mackenna 4917" maxLength={300} required value={form.direccion} onChange={cambiar('direccion')} />
                  <div className="form-text small">Requerido, máximo 300 caracteres.</div>
                  <FeedbackCampo resultado={feedback.direccion} />
                </div>
                {/* Botones de Acción */}
                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/admin/usuarios" className="btn btn-light"><i className="ti ti-x me-1"></i> Cancelar</Link>
                  <button type="submit" className="btn btn-pasteleria px-4 fw-semibold">
                    <i className="ti ti-device-floppy me-1"></i> {esEdicion ? 'GUARDAR CAMBIOS' : 'GUARDAR USUARIO'}
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
