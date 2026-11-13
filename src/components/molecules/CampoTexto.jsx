import React from 'react';
import ErrorCampo from '../atoms/ErrorCampo';

// Campo de formulario: etiqueta + control (input, select o textarea) + mensaje de error accesible.
// as: 'input' (por defecto) | 'select' | 'textarea'
export default function CampoTexto({ id, label, error, as: Control = 'input', requerido = false, children, className = '', ...resto }) {
  const idError = `${id}-error`;
  return (
    <div className="mb-3">
      <label className="flbl" htmlFor={id}>{label}{requerido && ' *'}</label>
      <Control
        id={id}
        className={`fctrl${error ? ' is-invalid' : ''} ${className}`.trim()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? idError : undefined}
        {...resto}
      >
        {children}
      </Control>
      {error && <span id={idError} className="ferr" role="alert">{error}</span>}
    </div>
  );
}
