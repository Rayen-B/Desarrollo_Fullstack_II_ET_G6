import React, { useState } from 'react';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { useAuth } from '../../context/AuthContext';
import { regionesYComunas } from '../../utils/regiones';
import { validarEmail, validarPassword } from '../../utils/validaciones';
import { validarNombreUsuario, validarApellidos, validarDireccion } from './AdminUsuarioForm';
import images from '../../assets/images';
import { estiloRol } from './AdminUsuarios';

// Validación del cambio de contraseña: la actual debe coincidir y la nueva cumplir las reglas
export function validarCambioPassword({ actual, nueva, confirmar }, passwordGuardada) {
  const errores = {};
  if (actual !== passwordGuardada) errores.actual = { valido: false, mensaje: 'La contraseña actual no es correcta' };
  const vNueva = validarPassword(nueva);
  if (!vNueva.valido) errores.nueva = vNueva;
  if (nueva !== confirmar) errores.confirmar = { valido: false, mensaje: 'Las contraseñas no coinciden' };
  return errores;
}

const PASSWORD_VACIA = { actual: '', nueva: '', confirmar: '' };

export default function AdminPerfil() {
  const { usuario, actualizarPerfil } = useAuth();

  const [datos, setDatos] = useState(() => ({
    nombre: usuario.nombre || '',
    apellidos: usuario.apellidos || '',
    correo: usuario.correo || '',
    fechaNacimiento: usuario.fechaNacimiento || '',
    region: usuario.region || '',
    comuna: usuario.comuna || '',
    direccion: usuario.direccion || ''
  }));
  const [feedback, setFeedback] = useState({});
  const [alertaDatos, setAlertaDatos] = useState(null);

  const [password, setPassword] = useState(PASSWORD_VACIA);
  const [feedbackPass, setFeedbackPass] = useState({});
  const [alertaPass, setAlertaPass] = useState(null);

  const regionActual = regionesYComunas.find((r) => r.region === datos.region);
  const rol = estiloRol(usuario.rol);

  const VALIDADORES = { nombre: validarNombreUsuario, apellidos: validarApellidos, correo: validarEmail, direccion: validarDireccion };

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setDatos((d) => (campo === 'region' ? { ...d, region: valor, comuna: '' } : { ...d, [campo]: valor }));
    if (VALIDADORES[campo]) setFeedback((f) => ({ ...f, [campo]: VALIDADORES[campo](valor) }));
  };

  const guardarDatos = (e) => {
    e.preventDefault();
    const resultados = Object.fromEntries(Object.entries(VALIDADORES).map(([campo, validar]) => [campo, validar(datos[campo])]));
    setFeedback(resultados);
    const todoValido = Object.values(resultados).every((r) => r.valido) && datos.region && datos.comuna;
    if (!todoValido) {
      setAlertaDatos({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos marcados en rojo.</> });
      return;
    }
    const res = actualizarPerfil({
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim(),
      fechaNacimiento: datos.fechaNacimiento,
      region: datos.region,
      comuna: datos.comuna,
      direccion: datos.direccion.trim()
    });
    setAlertaDatos(res.exito
      ? { tipo: 'success', contenido: <><i className="ti ti-check-circle me-1"></i> ¡Tus datos fueron actualizados correctamente!</> }
      : { tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> {res.mensaje}</> });
  };

  const cambiarPassword = (campo) => (e) => setPassword((p) => ({ ...p, [campo]: e.target.value }));

  const guardarPassword = (e) => {
    e.preventDefault();
    const errores = validarCambioPassword(password, usuario.password);
    setFeedbackPass(errores);
    if (Object.keys(errores).length) {
      setAlertaPass({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> No se pudo cambiar la contraseña.</> });
      return;
    }
    actualizarPerfil({ password: password.nueva });
    setPassword(PASSWORD_VACIA);
    setFeedbackPass({});
    setAlertaPass({ tipo: 'success', contenido: <><i className="ti ti-check-circle me-1"></i> ¡Contraseña actualizada correctamente!</> });
  };

  return (
    <AdminLayout tituloPagina="Mi Perfil" tituloDocumento="Administrador - Mi Perfil">
      <div className="row g-4">
        {/* Resumen del usuario */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4 text-center">
              <img src={images['avatar/ryan']} alt="Avatar" className="rounded-circle shadow-sm mb-3" style={{ width: '96px', height: '96px', objectFit: 'cover' }} />
              <h5 className="fw-bold text-principal mb-1">{usuario.nombre} {usuario.apellidos || ''}</h5>
              <span className={rol.clase}><i className={`ti ${rol.icono} me-1`}></i> {usuario.rol}</span>
              <div className="list-group list-group-flush border-top mt-4 small text-start">
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-id me-1"></i> RUN</span>
                  <span className="fw-bold font-monospace">{usuario.run || 'No registrado'}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-mail me-1"></i> Correo</span>
                  <span className="fw-semibold text-truncate ms-2">{usuario.correo}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between px-0 py-2">
                  <span className="text-muted"><i className="ti ti-map-pin me-1"></i> Ubicación</span>
                  <span className="fw-semibold text-end ms-2">{usuario.comuna || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Datos personales */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold text-principal"><i className="ti ti-user-circle me-2 text-secundario"></i> Mis Datos</h5>
              <p className="card-subtitle text-muted small">Todos los campos con (*) son obligatorios.</p>
            </div>
            <div className="card-body p-4">
              <div className={alertaDatos ? `alert alert-${alertaDatos.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alertaDatos && alertaDatos.contenido}
              </div>
              <form noValidate onSubmit={guardarDatos}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="perfil-nombre" className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.nombre)} id="perfil-nombre" maxLength={50} value={datos.nombre} onChange={cambiar('nombre')} />
                    <FeedbackCampo resultado={feedback.nombre} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="perfil-apellidos" className="form-label">Apellidos <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.apellidos)} id="perfil-apellidos" maxLength={100} value={datos.apellidos} onChange={cambiar('apellidos')} />
                    <FeedbackCampo resultado={feedback.apellidos} />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label htmlFor="perfil-correo" className="form-label">Correo Electrónico <span className="text-danger">*</span></label>
                    <input type="email" className={'form-control' + claseValidacion(feedback.correo)} id="perfil-correo" maxLength={100} value={datos.correo} onChange={cambiar('correo')} />
                    <FeedbackCampo resultado={feedback.correo} />
                  </div>
                  <div className="col-md-5">
                    <label htmlFor="perfil-fecha" className="form-label">Fecha de Nacimiento (Opcional)</label>
                    <input type="date" className="form-control" id="perfil-fecha" lang="es-CL" value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="perfil-region" className="form-label">Región <span className="text-danger">*</span></label>
                    <select className="form-select" id="perfil-region" value={datos.region} onChange={cambiar('region')}>
                      <option value="">-- Seleccione la región --</option>
                      {regionesYComunas.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="perfil-comuna" className="form-label">Comuna <span className="text-danger">*</span></label>
                    <select className="form-select" id="perfil-comuna" disabled={!regionActual} value={datos.comuna} onChange={cambiar('comuna')}>
                      <option value="">{regionActual ? '-- Seleccione la comuna --' : '-- Primero seleccione una región --'}</option>
                      {regionActual && regionActual.comunas.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="perfil-direccion" className="form-label">Dirección <span className="text-danger">*</span></label>
                  <input type="text" className={'form-control' + claseValidacion(feedback.direccion)} id="perfil-direccion" maxLength={300} value={datos.direccion} onChange={cambiar('direccion')} />
                  <FeedbackCampo resultado={feedback.direccion} />
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-pasteleria px-4 fw-semibold"><i className="ti ti-device-floppy me-1"></i> GUARDAR MIS DATOS</button>
                </div>
              </form>
            </div>
          </div>

          {/* Cambio de contraseña */}
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold text-principal"><i className="ti ti-lock me-2 text-secundario"></i> Cambiar Contraseña</h5>
              <p className="card-subtitle text-muted small">4 a 10 caracteres, alfanumérica y al menos 1 símbolo.</p>
            </div>
            <div className="card-body p-4">
              <div className={alertaPass ? `alert alert-${alertaPass.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alertaPass && alertaPass.contenido}
              </div>
              <form noValidate onSubmit={guardarPassword}>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label htmlFor="pass-actual" className="form-label">Contraseña actual</label>
                    <input type="password" className={'form-control' + claseValidacion(feedbackPass.actual)} id="pass-actual" maxLength={10} value={password.actual} onChange={cambiarPassword('actual')} />
                    <FeedbackCampo resultado={feedbackPass.actual} />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="pass-nueva" className="form-label">Nueva contraseña</label>
                    <input type="password" className={'form-control' + claseValidacion(feedbackPass.nueva)} id="pass-nueva" maxLength={10} value={password.nueva} onChange={cambiarPassword('nueva')} />
                    <FeedbackCampo resultado={feedbackPass.nueva} />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="pass-confirmar" className="form-label">Confirmar nueva</label>
                    <input type="password" className={'form-control' + claseValidacion(feedbackPass.confirmar)} id="pass-confirmar" maxLength={10} value={password.confirmar} onChange={cambiarPassword('confirmar')} />
                    <FeedbackCampo resultado={feedbackPass.confirmar} />
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-outline-pasteleria px-4 fw-semibold"><i className="ti ti-key me-1"></i> CAMBIAR CONTRASEÑA</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
