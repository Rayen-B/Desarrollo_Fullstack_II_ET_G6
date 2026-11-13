import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import estilosAdmin from '../../assets/css/admin/styles.css?inline';
import { useEstilos } from '../../hooks/useEstilos';
import { useSoloAdmin } from '../../hooks/useSoloAdmin';
import images from '../../assets/images';

const NAVEGACION = [
  { to: '/admin', icono: 'ti-dashboard', texto: 'Dashboard' },
  { to: '/admin/ordenes', icono: 'ti-receipt', texto: 'Órdenes' },
  { to: '/admin/productos', icono: 'ti-box', texto: 'Inventario' },
  { to: '/admin/insumos', icono: 'ti-chef-hat', texto: 'Insumos' },
  { to: '/admin/reportes', icono: 'ti-chart-bar', texto: 'Reportes' },
  { to: '/admin/categorias', icono: 'ti-category', texto: 'Categorías', soloAdmin: true },
  { to: '/admin/usuarios', icono: 'ti-users', texto: 'Usuarios', soloAdmin: true }
];

const GESTION = [
  { to: '/admin/producto-form', icono: 'ti-circle-plus', texto: 'Nuevo Producto' },
  { to: '/admin/insumo-form', icono: 'ti-basket', texto: 'Nuevo Insumo' },
  { to: '/admin/categoria-form', icono: 'ti-category-plus', texto: 'Nueva Categoría' },
  { to: '/admin/usuario-form', icono: 'ti-user-plus', texto: 'Nuevo Usuario' }
];

// Estructura del panel admin: sidebar, barra superior y contenido.
// acciones: botones de la derecha de la barra superior; selectorRol: muestra "Probar Rol"
export default function AdminLayout({
  children,
  tituloPagina = '¡Hola, Administrador!',
  claseTitulo = 'fw-semibold text-principal',
  tituloDocumento = 'Administrador',
  acciones = null,
  selectorRol = false,
  pieDestacado = false
}) {
  const { usuario, cerrarSesion, cambiarRolActivo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const ocultarSoloAdmin = useSoloAdmin();

  useEstilos(estilosAdmin, 'admin');

  useEffect(() => {
    const anterior = document.title;
    document.title = `${tituloDocumento} | Pastelería Papita Dulce`;
    return () => { document.title = anterior; };
  }, [tituloDocumento]);

  // El panel no debe aparecer en buscadores
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const [colapsado, setColapsado] = useState(false); // sidebar angosto en escritorio
  const [menuMovil, setMenuMovil] = useState(false); // sidebar desplegado en celular

  const claseLink = (ruta) => `nav-link${location.pathname === ruta ? ' active' : ''}`;

  const handleCerrarSesion = (e) => {
    e.preventDefault();
    cerrarSesion();
    navigate('/');
  };

  return (
    <>
      <div id="overlay" className={`overlay${menuMovil ? ' show' : ''}`} onClick={() => setMenuMovil(false)}></div>

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside id="sidebar" className={`sidebar${colapsado ? ' collapsed' : ''}${menuMovil ? ' mobile-show' : ''}`}>
        <div className="logo-area">
          <div className="sidebar-logo-container">
            <img src={images['favicon_io/Logo_Papita_Dulce']} alt="Logo" className="sidebar-logo-img" />
          </div>
          <span className="logo-text fw-bold fs-5 ms-2">Papita Dulce</span>
        </div>

        <div className="nav-section-title">Navegación</div>
        <ul className="list-unstyled mb-0">
          {NAVEGACION.map((item) => (
            <li key={item.to} className={item.soloAdmin ? 'solo-admin' : undefined} style={item.soloAdmin ? ocultarSoloAdmin : undefined}>
              <Link to={item.to} className={claseLink(item.to)}>
                <i className={`ti ${item.icono}`}></i>
                <span className="nav-text">{item.texto}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-section-title solo-admin" style={ocultarSoloAdmin}>Gestión</div>
        <ul className="list-unstyled mb-3 solo-admin" style={ocultarSoloAdmin}>
          {GESTION.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className={claseLink(item.to)}>
                <i className={`ti ${item.icono}`}></i>
                <span className="nav-text">{item.texto}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-section-title">Cuenta</div>
        <ul className="list-unstyled mb-3">
          <li>
            <Link to="/admin/perfil" className={claseLink('/admin/perfil')}>
              <i className="ti ti-user-circle"></i>
              <span className="nav-text">Mi Perfil</span>
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer mt-auto">
          <div className="d-flex align-items-center mb-3">
            <img src={images['avatar/ryan']} alt="Avatar" className="avatar me-2" />
            <div className="overflow-hidden">
              <div id="usuario-nombre-actual" className="fw-semibold text-truncate small">
                {usuario ? `${usuario.nombre} ${usuario.apellidos || ''}` : 'Alan Brito'}
              </div>
              <span id="usuario-rol-actual" className={pieDestacado ? 'badge-soft-primary' : 'badge-soft-secondary'}>
                {usuario ? usuario.rol : 'Administrador'}
              </span>
            </div>
          </div>
          <div className="d-grid gap-2">
            <Link to="/" className={`btn ${pieDestacado ? 'btn-pasteleria' : 'btn-outline-pasteleria'} btn-sm`}>
              <i className="ti ti-building-store me-1"></i> Ir a la Tienda
            </Link>
            <a href="/" className="btn btn-outline-danger btn-sm" onClick={handleCerrarSesion}>
              <i className="ti ti-logout me-1"></i> Cerrar Sesión
            </a>
          </div>
        </div>
      </aside>

      {/* BARRA SUPERIOR (TOPBAR) */}
      <header id="topbar" className={`topbar fixed-top d-flex align-items-center justify-content-between px-3 px-lg-4${colapsado ? ' full' : ''}`}>
        <div className="d-flex align-items-center gap-2">
          <button id="toggleBtn" className="btn btn-light btn-icon d-none d-lg-inline-flex" onClick={() => setColapsado(!colapsado)}>
            <i className="ti ti-layout-sidebar-left-collapse"></i>
          </button>
          <button id="mobileBtn" className="btn btn-light btn-icon d-lg-none" onClick={() => setMenuMovil(true)}>
            <i className="ti ti-menu-2"></i>
          </button>
          <h5 className={`mb-0 ${claseTitulo}`}>{tituloPagina}</h5>
        </div>

        {selectorRol ? (
          <div className="d-flex align-items-center gap-3">
            <div className="dropdown">
              <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="ti ti-user-cog me-1"></i> Probar Rol
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                <li><button className="dropdown-item small" onClick={() => cambiarRolActivo('Administrador')}><i className=" text-primary me-2"></i> Administrador</button></li>
                <li><button className="dropdown-item small" onClick={() => cambiarRolActivo('Vendedor')}><i className=" text-success me-2"></i> Vendedor</button></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">{acciones}</div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main id="content" className={`content${colapsado ? ' full' : ''}`}>
        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </>
  );
}
