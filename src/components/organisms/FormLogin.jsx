import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CampoTexto from '../molecules/CampoTexto';
import { validarLogin, validarEmail } from '../../utils/validaciones';

// Formulario de inicio de sesión con validación por campo.
// Si el usuario es Administrador o Vendedor entra directo al panel de administración (/admin).
export default function FormLogin({ alIngresar }) {
  const { iniciarSesion, solicitarRecuperacion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [valores, setValores] = useState({ usuario: '', password: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState({ texto: '', esError: false });
  const [modoRecuperar, setModoRecuperar] = useState(false);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setValores((v) => ({ ...v, [name]: value }));
    if (errores[name]) setErrores((errs) => ({ ...errs, [name]: undefined }));
    setMensaje({ texto: '', esError: false });
  };

  const alSalir = (e) => {
    const { name } = e.target;
    setErrores((errs) => ({ ...errs, [name]: validarLogin(valores)[name] }));
  };

  const enviar = (e) => {
    e.preventDefault();
    const nuevos = validarLogin(valores);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setMensaje({ texto: 'Revisa los campos marcados en rojo.', esError: true });
      return;
    }
    const resp = iniciarSesion(valores.usuario, valores.password);
    if (!resp.exito) {
      setMensaje({ texto: resp.mensaje, esError: true });
      return;
    }
    setMensaje({ texto: `¡Bienvenido/a, ${resp.usuario.nombre}!`, esError: false });
    if (alIngresar) alIngresar(resp.usuario);
    const esPersonal = resp.usuario.rol === 'Administrador' || resp.usuario.rol === 'Vendedor';
    const rutaSolicitada = location.state?.from;
    const destinoSolicitado = typeof rutaSolicitada?.pathname === 'string'
      && rutaSolicitada.pathname.startsWith('/')
      && !rutaSolicitada.pathname.startsWith('//')
      ? `${rutaSolicitada.pathname}${rutaSolicitada.search || ''}${rutaSolicitada.hash || ''}`
      : null;
    navigate(destinoSolicitado || (esPersonal ? '/admin' : '/'), { replace: true });
  };

  const enviarRecuperacion = (e) => {
    e.preventDefault();
    const correo = validarEmail(valores.usuario);
    if (!correo.valido) {
      setErrores({ usuario: correo.mensaje });
      return;
    }
    const resp = solicitarRecuperacion(valores.usuario);
    setMensaje({ texto: resp.mensaje, esError: !resp.exito });
  };

  return (
    <form noValidate onSubmit={modoRecuperar ? enviarRecuperacion : enviar} aria-label="Formulario de inicio de sesión">
      <CampoTexto
        id="loginUsuario" name="usuario" label={modoRecuperar ? 'Correo electrónico' : 'Correo o usuario'}
        type="text" autoComplete="username" placeholder="tu@email.com o admin" requerido
        value={valores.usuario} onChange={cambiar} onBlur={alSalir} error={errores.usuario}
      />
      {!modoRecuperar && (
        <CampoTexto
          id="loginPassword" name="password" label="Contraseña" type="password" autoComplete="current-password"
          placeholder="Tu contraseña" requerido
          value={valores.password} onChange={cambiar} onBlur={alSalir} error={errores.password}
        />
      )}
      <button className="btn-red w-100 justify-content-center" type="submit">
        <i className={`fas ${modoRecuperar ? 'fa-envelope' : 'fa-sign-in-alt'}`}></i>
        {modoRecuperar ? 'Enviar instrucciones' : 'Iniciar sesión'}
      </button>
      <p className="mt-3 mb-1 text-center">
        <button type="button" className="btn btn-link p-0" onClick={() => { setModoRecuperar(!modoRecuperar); setMensaje({ texto: '', esError: false }); setErrores({}); }}>
          {modoRecuperar ? 'Volver a iniciar sesión' : '¿Olvidaste tu contraseña?'}
        </button>
      </p>
      <p className="text-center mb-0">¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
      <p className="text-center mt-3 mb-0" role="status" style={{ color: mensaje.esError ? 'var(--primary)' : 'var(--green)', minHeight: '1.5em' }}>
        {mensaje.texto}
      </p>
    </form>
  );
}
