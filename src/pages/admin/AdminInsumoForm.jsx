import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { obtenerProductos } from '../../services/storage';
import { obtenerInsumos, guardarInsumos, crearIdInsumo, validarNombreInsumo, validarCantidad, UNIDADES } from '../../services/insumos';
import { productosQueUsan } from './AdminInsumos';

const FORM_VACIO = { nombre: '', unidad: 'g', stock: '', minimo: '' };

export default function AdminInsumoForm() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  const [insumos, setInsumos] = useState(obtenerInsumos);
  const [insumoEditado, setInsumoEditado] = useState(null); // modo edición si se llega con ?id=
  const [form, setForm] = useState(FORM_VACIO);
  const [feedback, setFeedback] = useState({});
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (!idParam) return;
    const i = insumos.find((ins) => ins.id === idParam);
    if (!i) return;
    setInsumoEditado(i);
    setForm({ nombre: i.nombre, unidad: i.unidad, stock: String(i.stock), minimo: String(i.minimo) });
  }, [idParam]);

  const esEdicion = insumoEditado !== null;
  const idActual = esEdicion ? insumoEditado.id : null;
  // La unidad no se cambia si alguna receta ya usa el insumo (sus cantidades quedarían mal)
  const usos = esEdicion ? productosQueUsan(insumoEditado.id, obtenerProductos()) : [];

  const validar = (campo, valor) => {
    if (campo === 'nombre') return validarNombreInsumo(valor, insumos, idActual);
    if (campo === 'stock') return validarCantidad(valor, 'el stock');
    if (campo === 'minimo') return validarCantidad(valor, 'el mínimo');
    return undefined;
  };

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    const resultado = validar(campo, valor);
    if (resultado) setFeedback((f) => ({ ...f, [campo]: resultado }));
  };

  const enviar = (e) => {
    e.preventDefault();
    const resultados = { nombre: validar('nombre', form.nombre), stock: validar('stock', form.stock), minimo: validar('minimo', form.minimo) };
    setFeedback(resultados);
    if (!Object.values(resultados).every((r) => r.valido)) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos marcados en rojo.</> });
      return;
    }

    const datos = { nombre: form.nombre.trim(), unidad: form.unidad, stock: Number(form.stock), minimo: Number(form.minimo) };
    let nuevos;
    if (esEdicion) {
      const actualizado = { ...insumoEditado, ...datos };
      nuevos = insumos.map((i) => (i.id === insumoEditado.id ? actualizado : i));
      setInsumoEditado(actualizado);
    } else {
      nuevos = [...insumos, { id: crearIdInsumo(datos.nombre), ...datos }];
    }
    guardarInsumos(nuevos);
    setInsumos(nuevos);

    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Insumo <strong>{datos.nombre}</strong> {esEdicion ? 'actualizado' : 'creado'} correctamente!</>
    });
    if (!esEdicion) {
      setForm(FORM_VACIO);
      setFeedback({});
      e.currentTarget.reset();
    }
  };

  const acciones = (
    <Link to="/admin/insumos" className="btn btn-outline-secondary btn-sm">
      <i className="ti ti-arrow-left me-1"></i> Volver a Insumos
    </Link>
  );

  return (
    <AdminLayout
      tituloPagina={esEdicion ? 'Editar Insumo' : 'Gestión de Insumo'}
      tituloDocumento="Administrador - Formulario de Insumo"
      acciones={acciones}
    >
      <div className="row justify-content-center">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold text-principal">
                {esEdicion
                  ? <><i className="ti ti-edit me-2 text-secundario"></i> Editar Insumo: {insumoEditado.nombre}</>
                  : <><i className="ti ti-basket me-2 text-secundario"></i> Registrar Nuevo Insumo</>}
              </h5>
              <p className="card-subtitle text-muted small">Completa los campos.</p>
            </div>
            <div className="card-body p-4">
              <div id="alerta-insumo" className={alerta ? `alert alert-${alerta.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alerta && alerta.contenido}
              </div>
              <form id="form-insumo" noValidate onSubmit={enviar}>
                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label htmlFor="nombre-insumo" className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.nombre)} id="nombre-insumo" placeholder="Ej: Harina" maxLength={40} required value={form.nombre} onChange={cambiar('nombre')} />
                    <div className="form-text small">Requerido, 3 a 40 caracteres.</div>
                    <FeedbackCampo resultado={feedback.nombre} />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="unidad-insumo" className="form-label">Unidad <span className="text-danger">*</span></label>
                    <select className="form-select" id="unidad-insumo" value={form.unidad} onChange={cambiar('unidad')} disabled={usos.length > 0}>
                      {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.texto}</option>)}
                    </select>
                    <div className="form-text small">{usos.length > 0 ? 'No se puede cambiar: lo usan recetas.' : 'Requerido.'}</div>
                  </div>
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label htmlFor="stock-insumo" className="form-label">Stock actual <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input type="number" className={'form-control' + claseValidacion(feedback.stock)} id="stock-insumo" placeholder="0" min="0" step="any" required value={form.stock} onChange={cambiar('stock')} />
                      <span className="input-group-text">{form.unidad}</span>
                    </div>
                    <div className="form-text small">Requerido. Cantidad que hay en bodega.</div>
                    <FeedbackCampo resultado={feedback.stock} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="minimo-insumo" className="form-label">Stock mínimo <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input type="number" className={'form-control' + claseValidacion(feedback.minimo)} id="minimo-insumo" placeholder="0" min="0" step="any" required value={form.minimo} onChange={cambiar('minimo')} />
                      <span className="input-group-text">{form.unidad}</span>
                    </div>
                    <div className="form-text small">Requerido. Bajo este valor se marca para reponer.</div>
                    <FeedbackCampo resultado={feedback.minimo} />
                  </div>
                </div>
                {usos.length > 0 && (
                  <p className="small text-muted mb-4"><i className="ti ti-chef-hat me-1"></i> Se usa en: {usos.map((p) => p.nombre).join(', ')}.</p>
                )}
                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/admin/insumos" className="btn btn-light"><i className="ti ti-x me-1"></i> Cancelar</Link>
                  <button type="submit" className="btn btn-pasteleria px-4 fw-semibold">
                    <i className="ti ti-device-floppy me-1"></i> {esEdicion ? 'GUARDAR CAMBIOS' : 'GUARDAR INSUMO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
