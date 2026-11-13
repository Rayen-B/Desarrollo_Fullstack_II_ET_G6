import React, { useEffect, useRef, useState } from 'react';

// Suscripción al newsletter
export default function Boletin() {
  const [correo, setCorreo] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [usado, setUsado] = useState(false); // después de la primera suscripción el botón dice "Suscribirse"
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const suscribir = () => {
    if (!correo || !correo.includes('@')) return;
    setSuscrito(true);
    setUsado(true);
    setCorreo('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSuscrito(false), 3000);
  };

  let contenidoBoton = <><i className="fas fa-paper-plane me-1"></i>Suscríbete</>;
  if (suscrito) contenidoBoton = '¡Suscrito!';
  else if (usado) contenidoBoton = 'Suscribirse';

  return (
    <section id="newsletter">
      <div className="nlbg"></div>
      <div className="container">
        <div className="nlw text-center" data-aos="zoom-in">
          <span className="slbl text-white-light">Mantente conectado</span>
          <h2 className="mb-3 text-white">Suscríbete y obtén <span>ofertas exclusivas</span></h2>
          <p className="mb-4 text-white-muted">Obtén 15% de descuento en tu primer pedido más acceso anticipado a nuevas preparaciones del menú</p>
          <div className="nl-form-wrap">
            <input className="nlinput" type="email" id="nlEmail" placeholder="Ingresa tu dirección de correo electrónico..." value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <button className="nlbtn" id="nlBtn" style={suscrito ? { background: '#4ade80', color: '#222' } : undefined} onClick={suscribir}>
              {contenidoBoton}
            </button>
          </div>
          <p className="text-white-faded text-sm mt-3 mb-0"><i className="fas fa-lock me-1"></i>Sin spam, desuscríbete en cualquier momento.</p>
        </div>
      </div>
    </section>
  );
}
