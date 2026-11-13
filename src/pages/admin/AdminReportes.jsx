import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import { obtenerOrdenes, obtenerProductos } from '../../services/storage';
import { obtenerInsumos, esInsumoCritico } from '../../services/insumos';
import { disponibleProducto, esProductoCritico, stockVitrina } from '../../utils/stock';
import { ordenarProductos } from './AdminProductos';
import { claseEstadoModal } from './AdminOrdenes';
import {
  resumenVentas, productosMasVendidos, ventasPorCategoria,
  ventasPorMetodoPago, ventasPorEntrega, ordenesPorEstado
} from '../../utils/reportes';

const ESTADOS_SIN_VENTA = ['Cancelado', 'Pago rechazado', 'Pendiente de pago'];

const pesos = (n) => '$' + Math.round(n).toLocaleString('es-CL');

function TarjetaMetrica({ icono, claseIcono, titulo, valor, id }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card h-100">
        <div className="card-body d-flex align-items-center">
          <div className={`icon-shape ${claseIcono} me-3`}><i className={`ti ${icono}`}></i></div>
          <div>
            <h6 className="text-muted small mb-1">{titulo}</h6>
            <h4 className="mb-0 fw-bold" id={id}>{valor}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lista de barras horizontales con monto y porcentaje
function ListaBarras({ datos, detalle }) {
  if (!datos.length) return <p className="text-muted small mb-0">Sin ventas registradas.</p>;
  return datos.map((d) => (
    <div key={d.nombre} className="mb-3">
      <div className="d-flex justify-content-between small mb-1">
        <span className="fw-semibold">{d.nombre}</span>
        <span className="text-muted">{pesos(d.monto)} · {d.porcentaje}%</span>
      </div>
      <div className="progress" style={{ height: '8px' }} role="progressbar" aria-label={d.nombre} aria-valuenow={d.porcentaje} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar" style={{ width: `${d.porcentaje}%`, background: 'var(--color-primario)' }}></div>
      </div>
      {detalle && <small className="text-muted">{detalle(d)}</small>}
    </div>
  ));
}

export default function AdminReportes() {
  const [ordenes] = useState(obtenerOrdenes);
  const [productos] = useState(obtenerProductos);
  const [insumos] = useState(obtenerInsumos);
  const [incluirCanceladas, setIncluirCanceladas] = useState(false);

  // Las órdenes canceladas o con pago rechazado no son ventas
  const validas = incluirCanceladas ? ordenes : ordenes.filter((o) => !ESTADOS_SIN_VENTA.includes(o.estado));
  const resumen = resumenVentas(validas);
  const ranking = productosMasVendidos(validas, productos);
  const maxUnidades = Math.max(1, ...ranking.map((r) => r.unidades));
  const estados = ordenesPorEstado(ordenes);

  const criticos = ordenarProductos(productos.filter((p) => esProductoCritico(p, insumos)), 'prioridad', insumos);
  const agotados = productos.filter((p) => disponibleProducto(p, insumos) <= 0).length;
  const insumosCriticos = insumos.filter(esInsumoCritico).length;
  const valorVitrina = productos.reduce((t, p) => t + stockVitrina(p) * (Number(p.precio) || 0), 0);

  const filtros = (
    <div className="d-flex gap-3 flex-wrap align-items-center justify-content-sm-end mb-3">
      <div className="form-check form-switch mb-0 small">
        <input className="form-check-input" type="checkbox" role="switch" id="incluir-canceladas" checked={incluirCanceladas} onChange={(e) => setIncluirCanceladas(e.target.checked)} />
        <label className="form-check-label" htmlFor="incluir-canceladas">Incluir canceladas y rechazadas</label>
      </div>
    </div>
  );

  return (
    <AdminLayout tituloPagina="Reportes" tituloDocumento="Administrador - Reportes">
      {filtros}
      {/* Ventas */}
      <div className="row g-3 mb-4">
        <TarjetaMetrica icono="ti-cash" claseIcono="bg-success-subtle text-success" titulo="Ventas totales" valor={pesos(resumen.total)} id="rep-total" />
        <TarjetaMetrica icono="ti-receipt" claseIcono="icon-shape-primary" titulo="Órdenes" valor={resumen.cantidad} id="rep-ordenes" />
        <TarjetaMetrica icono="ti-chart-bar" claseIcono="icon-shape-secondary" titulo="Ticket promedio" valor={pesos(resumen.promedio)} id="rep-promedio" />
        <TarjetaMetrica icono="ti-cake" claseIcono="bg-warning-subtle text-warning" titulo="Unidades vendidas" valor={resumen.unidades} id="rep-unidades" />
      </div>

      <div className="row g-3 mb-4">
        {/* Productos más vendidos */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-trophy me-1"></i> Productos más vendidos</h6>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Unidades</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody id="rep-ranking">
                  {ranking.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-muted"><i className="ti ti-alert-circle me-1"></i> Sin ventas registradas.</td></tr>
                  ) : ranking.map((r, i) => (
                    <tr key={r.nombre}>
                      <td className="fw-bold" data-label="#">{i + 1}</td>
                      <td data-label="Producto"><span className="fw-semibold">{r.nombre}</span></td>
                      <td data-label="Unidades" style={{ minWidth: '140px' }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold">{r.unidades}</span>
                          <div className="progress flex-grow-1" style={{ height: '6px' }} aria-hidden="true">
                            <div className="progress-bar" style={{ width: `${(r.unidades / maxUnidades) * 100}%`, background: 'var(--color-secundario)' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold" data-label="Ingresos">{pesos(r.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ventas por categoría */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-category me-1"></i> Ventas por categoría</h6>
            </div>
            <div className="card-body">
              <ListaBarras datos={ventasPorCategoria(validas, productos)} detalle={(d) => `${d.unidades} ${d.unidades === 1 ? 'unidad' : 'unidades'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-credit-card me-1"></i> Método de pago</h6>
            </div>
            <div className="card-body">
              <ListaBarras datos={ventasPorMetodoPago(validas)} detalle={(d) => `${d.unidades} ${d.unidades === 1 ? 'orden' : 'órdenes'}`} />
            </div>
          </div>
        </div>
        <div className="col-md-6 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-truck-delivery me-1"></i> Tipo de entrega</h6>
            </div>
            <div className="card-body">
              <ListaBarras datos={ventasPorEntrega(validas)} detalle={(d) => `${d.unidades} ${d.unidades === 1 ? 'orden' : 'órdenes'}`} />
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-list-check me-1"></i> Estado de órdenes</h6>
              <Link to="/admin/ordenes" className="btn btn-outline-pasteleria btn-sm text-nowrap"><i className="ti ti-receipt me-1"></i> Ver Órdenes</Link>
            </div>
            <div className="card-body">
              {Object.keys(estados).length === 0 ? (
                <p className="text-muted small mb-0">Sin órdenes registradas.</p>
              ) : (
                <ul className="list-unstyled mb-0" id="rep-estados">
                  {Object.entries(estados).sort((a, b) => b[1] - a[1]).map(([estado, n]) => (
                    <li key={estado} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <span className={claseEstadoModal(estado)}>{estado}</span>
                      <span className="fw-bold">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inventario estado actual */}
      <div className="card mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold text-principal"><i className="ti ti-box me-1"></i> Estado del inventario <small className="text-muted fw-normal"></small></h6>
          <div className="d-flex gap-2">
            <Link to="/admin/insumos" className="btn btn-outline-pasteleria btn-sm"><i className="ti ti-chef-hat me-1"></i> Ver Insumos</Link>
            <Link to="/admin/productos" className="btn btn-outline-pasteleria btn-sm"><i className="ti ti-box me-1"></i> Ver Inventario</Link>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3 text-center mb-3">
            <div className="col-6 col-md-3">
              <small className="text-muted d-block">Productos críticos</small>
              <span className="fw-bold fs-4 text-danger" id="rep-criticos">{criticos.length}</span>
            </div>
            <div className="col-6 col-md-3 border-start">
              <small className="text-muted d-block">Agotados</small>
              <span className="fw-bold fs-4 text-danger" id="rep-agotados">{agotados}</span>
            </div>
            <div className="col-6 col-md-3 border-start">
              <small className="text-muted d-block">Insumos por reponer</small>
              <span className="fw-bold fs-4 text-warning" id="rep-insumos">{insumosCriticos}</span>
            </div>
            <div className="col-6 col-md-3 border-start">
              <small className="text-muted d-block">Valor en vitrina</small>
              <span className="fw-bold fs-4 text-principal" id="rep-vitrina">{pesos(valorVitrina)}</span>
            </div>
          </div>
          {criticos.length > 0 && (
            <>
              <small className="text-muted fw-semibold d-block mb-2">Productos críticos</small>
              <div className="d-flex flex-wrap gap-2">
                {criticos.map((p) => (
                  <Link key={p.codigo} to={`/admin/producto-form?codigo=${p.codigo}`} className="badge-soft-danger text-decoration-none">
                    {p.nombre}: {disponibleProducto(p, insumos)} / mín. {p.stockCritico || 0}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
