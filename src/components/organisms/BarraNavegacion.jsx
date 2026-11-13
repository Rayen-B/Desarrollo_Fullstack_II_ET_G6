import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTienda } from '../../context/TiendaContext';
import images from '../../assets/images';

// Enlaces de la barra superior: cada uno baja al panel de la página de inicio con ese id.
export const ENLACES = [
  { seccion: 'hero', texto: 'Inicio' },
  { seccion: 'about', texto: 'Nosotros' },
  { seccion: 'menu', texto: 'Menú' },
  { seccion: 'chefs', texto: 'Equipo' },
  { seccion: 'reservation', texto: 'Reservacion' },
  { seccion: 'testimonials', texto: 'Reseñas' },
  { seccion: 'contact-section', texto: 'Contacto' }
];

export default function BarraNavegacion() {
  const { totalCantidad, mostrarModalCarrito } = useCart();
  const { usuario, cerrarSesion } = useAuth();
  const { setBuscadorAbierto, abrirCarrito } = useTienda();
  const navigate = useNavigate();
  const enInicio = useLocation().pathname === '/';
  const [seccionActiva, setSeccionActiva] = useState('hero');

  // En la portada se marca como activo el enlace del panel que se está viendo
  useEffect(() => {
    if (!enInicio) return undefined;
    const onScroll = () => {
      document.querySelectorAll('section[id]').forEach((sec) => {
        const top = sec.offsetTop - 110;
        const bot = top + sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bot) setSeccionActiva(sec.id);
      });
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [enInicio]);
  const esPersonal = usuario && (usuario.rol === 'Administrador' || usuario.rol === 'Vendedor');

  const salir = () => {
    cerrarSesion();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-xl" id="nav" aria-label="Navegación principal">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <div className="blogo">
            <div className="bico"><img src={images['logopapita']} alt="Papita Dulce logo" /></div>
            <div>
              <div className="bname">Papita<span>Dulce</span></div>
              <div className="bsub">Pastelería &amp; Cafetería</div>
            </div>
          </div>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu" aria-controls="navmenu" aria-label="Abrir menú">
          <i className="fas fa-bars"></i>
        </button>
        <div className="collapse navbar-collapse" id="navmenu">
          <ul className="navbar-nav mx-auto">
            {ENLACES.map((enlace) => (
              <li className="nav-item" key={enlace.seccion}>
                <Link
                  className={`nav-link${enInicio && seccionActiva === enlace.seccion ? ' active' : ''}`}
                  to={{ pathname: '/', hash: '#' + enlace.seccion }}
                >
                  {enlace.texto}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-actions d-flex align-items-center gap-1">
            <button id="navSearchBtn" title="Buscar en el menú" aria-label="Buscar productos del menú" type="button" onClick={() => setBuscadorAbierto(true)}>
              <i className="fas fa-search"></i>
            </button>
            {usuario ? (
              <>
                {esPersonal && (
                  <Link to="/admin" className="account-toggle is-logged-in" title="Ir al panel de administración">
                    <i className="fas fa-user-shield"></i><span>Panel admin</span>
                  </Link>
                )}
                <button id="accountLogout" className="account-toggle is-logged-in" type="button" title={'Sesión iniciada como ' + usuario.correo} onClick={salir}>
                  <i className="fas fa-sign-out-alt"></i><span>Salir ({usuario.nombre.split(' ')[0]})</span>
                </button>
              </>
            ) : (
              <>
                <Link id="accountToggle" to="/login" className="account-toggle" aria-label="Iniciar sesión">
                  <i className="fas fa-user"></i><span>Iniciar sesión</span>
                </Link>
                <Link to="/registro" className="account-toggle" aria-label="Crear cuenta">
                  <i className="fas fa-user-plus"></i><span>Crear cuenta</span>
                </Link>
              </>
            )}
            <button
              id="cartToggle" className="nav-link nav-cta" type="button" aria-label="Abrir carrito"
              aria-controls="cartPanel" aria-expanded={mostrarModalCarrito} onClick={abrirCarrito}
            >
              <i className="fas fa-shopping-bag me-1"></i>Carrito{' '}
              <span id="cartCount" aria-label="Productos en el carrito">{totalCantidad}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
