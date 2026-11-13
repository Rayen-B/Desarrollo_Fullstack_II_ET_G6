import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CampoTexto from '../molecules/CampoTexto';
import { REGIONES_CHILE } from '../../data/regionesChile';
import { validarRegistro, evaluarReglasPassword } from '../../utils/validaciones';

const REGLAS = [
  { id: 'length', texto: '8 caracteres como mínimo' },
  { id: 'uppercase', texto: 'Una letra mayúscula' },
  { id: 'number', texto: 'Un número' },
  { id: 'special', texto: 'Un carácter especial' }
];

const VACIO = { nombre: '', correo: '', password: '', confirmar: '', region: '', comuna: '' };

// Formulario de registro de clientes: valida cada campo al salir de él y todo al enviar.
export default function FormRegistro() {
  const { registrarUsuario } = useAuth();
  const navigate = useNavigate();
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState({ texto: '', esError: false });

  const reglas = evaluarReglasPassword(valores.password);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setValores((v) => (name === 'region' ? { ...v, region: value, comuna: '' } : { ...v, [name]: value }));
    if (errores[name]) setErrores((errs) => ({ ...errs, [name]: undefined }));
  };

  const alSalir = (e) => {
    const { name } = e.target;
    setErrores((errs) => ({ ...errs, [name]: validarRegistro(valores)[name] }));
  };

  const enviar = (e) => {
    e.preventDefault();
    const nuevos = validarRegistro(valores);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setMensaje({ texto: 'Completa los campos con datos válidos.', esError: true });
      return;
    }
    const resp = registrarUsuario({
      nombre: valores.nombre.trim(), correo: valores.correo.trim(), password: valores.password,
      region: valores.region, comuna: valores.comuna
    });
    setMensaje({ texto: resp.mensaje, esError: !resp.exito });
    if (resp.exito) {
      setValores(VACIO);
      setTimeout(() => navigate('/login'), 1200);
    }
  };

  return (
    <form noValidate onSubmit={enviar} aria-label="Formulario de registro">
      <CampoTexto id="regNombre" name="nombre" label="Nombre completo" type="text" autoComplete="name" placeholder="Tu nombre" requerido
        value={valores.nombre} onChange={cambiar} onBlur={alSalir} error={errores.nombre} />
      <CampoTexto id="regCorreo" name="correo" label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@email.com" requerido
        value={valores.correo} onChange={cambiar} onBlur={alSalir} error={errores.correo} />
      <CampoTexto id="regPassword" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Crea una contraseña segura" requerido
        value={valores.password} onChange={cambiar} onBlur={alSalir} error={errores.password} />
      <ul className="password-rules list-unstyled small" aria-label="Requisitos de la contraseña">
        {REGLAS.map((r) => (
          <li key={r.id} className={reglas[r.id] ? 'text-success' : 'text-muted'}>
            <i className={`fas ${reglas[r.id] ? 'fa-check-circle' : 'fa-circle'} me-2`}></i>{r.texto}
          </li>
        ))}
      </ul>
      <CampoTexto id="regConfirmar" name="confirmar" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" requerido
        value={valores.confirmar} onChange={cambiar} onBlur={alSalir} error={errores.confirmar} />
      <div className="row">
        <div className="col-sm-6">
          <CampoTexto as="select" id="regRegion" name="region" label="Región" requerido value={valores.region} onChange={cambiar} onBlur={alSalir} error={errores.region}>
            <option value="">Selecciona tu región</option>
            {Object.keys(REGIONES_CHILE).map((region) => <option key={region} value={region}>{region}</option>)}
          </CampoTexto>
        </div>
        <div className="col-sm-6">
          <CampoTexto as="select" id="regComuna" name="comuna" label="Comuna" requerido disabled={!valores.region} value={valores.comuna} onChange={cambiar} onBlur={alSalir} error={errores.comuna}>
            <option value="">{valores.region ? 'Selecciona tu comuna' : 'Primero elige una región'}</option>
            {(REGIONES_CHILE[valores.region] || []).map((comuna) => <option key={comuna} value={comuna}>{comuna}</option>)}
          </CampoTexto>
        </div>
      </div>
      <button className="btn-red w-100 justify-content-center" type="submit"><i className="fas fa-user-plus"></i>Crear cuenta</button>
      <p className="text-center mt-3 mb-0">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      <p className="text-center mt-3 mb-0" role="status" style={{ color: mensaje.esError ? 'var(--primary)' : 'var(--green)', minHeight: '1.5em' }}>{mensaje.texto}</p>
    </form>
  );
}
