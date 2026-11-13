import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import AOS from 'aos';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TiendaProvider } from './context/TiendaContext';
import { cancelarTransferenciasVencidas } from './services/db';
import BarraNavegacion from './components/organisms/BarraNavegacion';
import PiePagina from './components/organisms/PiePagina';
import ModalCarrito from './components/organisms/ModalCarrito';
import BuscadorOverlay from './components/molecules/BuscadorOverlay';
import BotonVolverArriba from './components/atoms/BotonVolverArriba';

import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import DetalleProducto from './pages/DetalleProducto';
import PaginaCategorias from './pages/Categorias';
import CategoriaDetalle from './pages/CategoriaDetalle';
import Ofertas from './pages/Ofertas';
import Nosotros from './pages/Nosotros';
import PaginaBlog from './pages/Blog';
import BlogDetalle from './pages/BlogDetalle';
import ContactoPagina from './pages/ContactoPagina';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Checkout from './pages/Checkout';
import CompraExitosa from './pages/CompraExitosa';
import CompraError from './pages/CompraError';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductos from './pages/admin/AdminProductos';
import AdminProductoForm from './pages/admin/AdminProductoForm';
import AdminOrdenes from './pages/admin/AdminOrdenes';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminUsuarioForm from './pages/admin/AdminUsuarioForm';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminCategoriaForm from './pages/admin/AdminCategoriaForm';
import AdminInsumos from './pages/admin/AdminInsumos';
import AdminInsumoForm from './pages/admin/AdminInsumoForm';
import AdminReportes from './pages/admin/AdminReportes';
import AdminPerfil from './pages/admin/AdminPerfil';
import RutaProtegidaAdmin from './components/organisms/RutaProtegidaAdmin';
import estilosTienda from './assets/css/style.css?inline';
import { useEstilos } from './hooks/useEstilos';

export { RutaProtegidaAdmin };

function RutaProtegidaCompra({ children }) {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function TiendaLayout({ children }) {
  const location = useLocation();
  useEstilos(estilosTienda, 'tienda');

  useEffect(() => {
    AOS.init({ duration: 680, once: true, offset: 55 });
  }, []);

  // Al cambiar de página: scroll arriba y se refrescan las animaciones
  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => AOS.refreshHard(), 60);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      <BarraNavegacion />
      <BuscadorOverlay />
      <main id="contenido">{children}</main>
      <ModalCarrito />
      <PiePagina />
      <BotonVolverArriba />
    </>
  );
}

const admin = (elemento, soloAdministrador = false) => (
  <RutaProtegidaAdmin soloAdministrador={soloAdministrador}>{elemento}</RutaProtegidaAdmin>
);

export function Rutas() {
  const esRutaAdmin = useLocation().pathname.startsWith('/admin');

  const rutas = (
    <Routes>
      {/* Tienda (pública) */}
      <Route path="/" element={<Inicio />} />
      <Route path="/productos" element={<Productos />} />
      <Route path="/producto/:id" element={<DetalleProducto />} />
      <Route path="/categorias" element={<PaginaCategorias />} />
      <Route path="/categorias/:id" element={<CategoriaDetalle />} />
      <Route path="/ofertas" element={<Ofertas />} />
      <Route path="/nosotros" element={<Nosotros />} />
      <Route path="/blog" element={<PaginaBlog />} />
      <Route path="/blog/:id" element={<BlogDetalle />} />
      <Route path="/contacto" element={<ContactoPagina />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/checkout" element={<RutaProtegidaCompra><Checkout /></RutaProtegidaCompra>} />
      <Route path="/compra/exitosa/:id" element={<CompraExitosa />} />
      <Route path="/compra/error/:id" element={<CompraError />} />

      {/* Panel de administración (protegido) */}
      <Route path="/admin" element={admin(<AdminDashboard />)} />
      <Route path="/admin/ordenes" element={admin(<AdminOrdenes />)} />
      <Route path="/admin/productos" element={admin(<AdminProductos />)} />
      <Route path="/admin/producto-form" element={admin(<AdminProductoForm />, true)} />
      <Route path="/admin/insumos" element={admin(<AdminInsumos />)} />
      <Route path="/admin/insumo-form" element={admin(<AdminInsumoForm />, true)} />
      <Route path="/admin/reportes" element={admin(<AdminReportes />)} />
      <Route path="/admin/categorias" element={admin(<AdminCategorias />, true)} />
      <Route path="/admin/categoria-form" element={admin(<AdminCategoriaForm />, true)} />
      <Route path="/admin/usuarios" element={admin(<AdminUsuarios />, true)} />
      <Route path="/admin/usuario-form" element={admin(<AdminUsuarioForm />, true)} />
      <Route path="/admin/perfil" element={admin(<AdminPerfil />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return esRutaAdmin ? rutas : <TiendaLayout>{rutas}</TiendaLayout>;
}

export default function App() {
  // Antes de cargar el catálogo se cancelan las transferencias vencidas (devuelven su stock)
  useState(() => cancelarTransferenciasVencidas());
  return (
    <AuthProvider>
      <CartProvider>
        <TiendaProvider>
          <Rutas />
        </TiendaProvider>
      </CartProvider>
    </AuthProvider>
  );
}
