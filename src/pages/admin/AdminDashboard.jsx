import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import { obtenerProductos, obtenerUsuarios, obtenerOrdenes } from '../../services/storage';
import images, { obtenerImagen } from '../../assets/images';
import { useSoloAdmin } from '../../hooks/useSoloAdmin';
import { obtenerInsumos } from '../../services/insumos';
import { esProductoCritico, disponibleProducto, stockVitrina, calcularPreparables } from '../../utils/stock';
import { ordenarProductos } from './AdminProductos';

export default function AdminDashboard() {
  const [productos] = useState(obtenerProductos);
  const [usuarios] = useState(obtenerUsuarios);
  const [ordenes] = useState(obtenerOrdenes);
  const ocultarSoloAdmin = useSoloAdmin();

  const totalProductos = productos.length;
  // crítico si lo disponible (vitrina + preparables) está en o bajo su stock crítico
  const insumos = obtenerInsumos();
  const stockCriticoCount = productos.filter((p) => esProductoCritico(p, insumos)).length;
  // Resumen: los más críticos primero (mismo orden que el Inventario)
  const resumen = ordenarProductos(productos, 'prioridad', insumos).slice(0, 5);
  const totalOrdenes = ordenes.length;
  const totalUsuarios = usuarios.length;

  const getImagenUrl = (img) => obtenerImagen(img);


  return (
    <AdminLayout tituloPagina="¡Hola, Administrador!" claseTitulo="fw-bold text-principal" tituloDocumento="Administrador - Dashboard" selectorRol>
      {/* Banner Principal */}
      <div className="card text-white border-0 mb-4 shadow-sm bg-banner-admin">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="fw-bold mb-2">Panel de Administración - Pastelería Papita Dulce</h2>
              <p className="mb-3 text-white-50">Gestiona productos, órdenes de compra y usuarios.</p>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <Link to="/admin/producto-form" className="btn btn-pasteleria btn-sm solo-admin" style={ocultarSoloAdmin}>
                  <i className="ti ti-plus me-1"></i> Agregar Producto
                </Link>
                <Link to="/admin/productos" className="btn btn-outline-light btn-sm fw-semibold">
                  <i className="ti ti-list me-1"></i> Ver Inventario
                </Link>
              </div>
            </div>
            <div className="col-md-4 text-center d-none d-md-block">
              <div className="banner-logo-container">
                <img
                  src={images['favicon_io/Logo_Papita_Dulce']}
                  alt="Logo Pastelería Papita Dulce"
                  className="banner-logo-img"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-shape icon-shape-primary me-3">
                <i className="ti ti-box"></i>
              </div>
              <div>
                <h6 className="text-muted small mb-1">Total Productos</h6>
                <h4 className="mb-0 fw-bold" id="dash-total-productos">{totalProductos}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-shape bg-danger-subtle text-danger me-3">
                <i className="ti ti-alert-triangle"></i>
              </div>
              <div>
                <h6 className="text-muted small mb-1">Stock Crítico</h6>
                <h4 className="mb-0 fw-bold text-danger" id="dash-stock-critico">{stockCriticoCount}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-shape bg-success-subtle text-success me-3">
                <i className="ti ti-shopping-cart"></i>
              </div>
              <div>
                <h6 className="text-muted small mb-1">Órdenes</h6>
                <h4 className="mb-0 fw-bold" id="dash-total-ordenes">{totalOrdenes}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3 solo-admin" style={ocultarSoloAdmin}>
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div className="icon-shape icon-shape-secondary me-3">
                <i className="ti ti-users"></i>
              </div>
              <div>
                <h6 className="text-muted small mb-1">Usuarios</h6>
                <h4 className="mb-0 fw-bold" id="dash-total-usuarios">{totalUsuarios}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Resumen de Inventario */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal">
            <i className="ti ti-cake me-1"></i> Resumen de Productos
          </h6>
          <div className="d-flex gap-2">
            <Link to="/admin/insumos" className="btn btn-outline-pasteleria btn-sm">
              <i className="ti ti-chef-hat me-1"></i> Ver Insumos
            </Link>
            <Link to="/admin/productos" className="btn btn-outline-pasteleria btn-sm">
              <i className="ti ti-list me-1"></i> Ver Todo
            </Link>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody id="dash-tabla-resumen-body">
              {productos.length === 0 && (
                <tr><td colSpan="6" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> No hay productos registrados.</td></tr>
              )}
              {resumen.map((p) => {
                const critico = esProductoCritico(p, insumos);
                return (
                  <tr key={p.codigo || p.id}>
                    <td className="fw-semibold font-monospace" data-label="Código">{p.codigo || p.id}</td>
                    <td data-label="Producto">
                      <div className="d-flex align-items-center">
                        <img
                          src={getImagenUrl(p.imagen)}
                          alt={p.nombre}
                          className="avatar-producto me-2"
                        />
                        <span className="fw-semibold">{p.nombre}</span>
                      </div>
                    </td>
                    <td data-label="Categoría">
                      <span className="badge-soft-primary">{p.categoria || 'Pastelería'}</span>
                    </td>
                    <td className="fw-bold" data-label="Precio">${Number(p.precio).toLocaleString('es-CL')}</td>
                    <td data-label="Stock">
                      <div className="d-flex flex-column text-end">
                        <span className={`fw-bold ${critico ? 'text-danger' : ''}`}>{disponibleProducto(p, insumos)}</span>
                        <small className="text-muted text-nowrap">Vitrina {stockVitrina(p)} · Prep. {(p.receta || []).length ? calcularPreparables(p.receta, insumos) : '—'}</small>
                      </div>
                    </td>
                    <td data-label="Estado">
                      {critico ? (
                        <span className="badge-soft-danger">
                          <i className="ti ti-alert-triangle me-1"></i> Crítico (Min: {p.stockCritico || 0})
                        </span>
                      ) : (
                        <span className="badge-soft-success">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
