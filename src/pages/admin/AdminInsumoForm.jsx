import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { obtenerProductos } from '../../services/storage';
import { obtenerInsumos, guardarInsumos, crearIdInsumo, validarNombreInsumo, validarCantidad, UNIDADES } from '../../services/insumos';
import { productosQueUsan } from './AdminInsumos';
import { modoServidor } from '../../config';
import { guardarEnServidor } from '../../services/sincronizacion';
import { crearInsumoServidor, actualizarInsumoServidor } from '../../services/catalogo';
import { guardarIngrediente, listarIngredientes } from '../../services/nutricion';
import { ALERGENOS, validarNombreIngles, describirErrorNutricion, capitalizar } from '../../utils/nutricion';

const FORM_VACIO = { nombre: '', unidad: 'g', stock: '', minimo: '' };
const NUTRI_VACIO = { nombreIngles: '', alergenos: [] };

export default function AdminInsumoForm() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  const [insumos, setInsumos] = useState(obtenerInsumos);
  const [insumoEditado, setInsumoEditado] = useState(null); // modo edición si se llega con ?id=
  const [form, setForm] = useState(FORM_VACIO);
  const [feedback, setFeedback] = useState({});
  const [alerta, setAlerta] = useState(null);
  // Datos nutricionales: viven en el backend (nutricion-service), no en el localStorage de la tienda
  const [nutri, setNutri] = useState(NUTRI_VACIO);
  const [estadoNutri, setEstadoNutri] = useState(null); // { tipo, texto } del último intento de sincronizar

  useEffect(() => {
    if (!idParam) return;
    const i = insumos.find((ins) => ins.id === idParam);
    if (!i) return;
    setInsumoEditado(i);
    setForm({ nombre: i.nombre, unidad: i.unidad, stock: String(i.stock), minimo: String(i.minimo) });
  }, [idParam]);

  // En edición, rellena los datos nutricionales que ya tiene el servidor (si está disponible)
  useEffect(() => {
    if (!idParam) return undefined;
    let activo = true;
    listarIngredientes()
      .then((lista) => {
        const ing = Array.isArray(lista) ? lista.find((x) => x.insumoId === idParam) : null;
        if (activo && ing) setNutri({ nombreIngles: ing.nombreIngles || '', alergenos: ing.alergenos || [] });
      })
      .catch(() => {
        if (activo) setEstadoNutri({ tipo: 'secondary', texto: 'No se pudieron cargar los datos nutricionales (servidor no disponible).' });
      });
    return () => { activo = false; };
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

  const cambiarNombreIngles = (e) => {
    const valor = e.target.value;
    setNutri((n) => ({ ...n, nombreIngles: valor }));
    setFeedback((f) => {
      const { nombreIngles, ...resto } = f;
      return valor.trim() ? { ...resto, nombreIngles: validarNombreIngles(valor) } : resto;
    });
  };

  const alternarAlergeno = (alergeno) => () => setNutri((n) => ({
    ...n,
    alergenos: n.alergenos.includes(alergeno) ? n.alergenos.filter((a) => a !== alergeno) : [...n.alergenos, alergeno]
  }));

  const enviar = (e) => {
    e.preventDefault();
    const nombreIngles = nutri.nombreIngles.trim();
    const resultados = {
      nombre: validar('nombre', form.nombre),
      stock: validar('stock', form.stock),
      minimo: validar('minimo', form.minimo),
      ...(nombreIngles ? { nombreIngles: validarNombreIngles(nombreIngles) } : {}) // opcional: solo se valida si lo escribe
    };
    setFeedback(resultados);
    if (!Object.values(resultados).every((r) => r.valido)) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos marcados en rojo.</> });
      return;
    }

    const datos = { nombre: form.nombre.trim(), unidad: form.unidad, stock: Number(form.stock), minimo: Number(form.minimo) };
    const formulario = e.currentTarget;
    if (modoServidor()) {
      guardarInsumoEnServidor(datos, nombreIngles, formulario);
      return;
    }
    const idInsumo = esEdicion ? insumoEditado.id : crearIdInsumo(datos.nombre);
    let nuevos;
    if (esEdicion) {
      const actualizado = { ...insumoEditado, ...datos };
      nuevos = insumos.map((i) => (i.id === insumoEditado.id ? actualizado : i));
      setInsumoEditado(actualizado);
    } else {
      nuevos = [...insumos, { id: idInsumo, ...datos }];
    }
    guardarInsumos(nuevos);
    setInsumos(nuevos);
    terminarGuardado(idInsumo, datos, nombreIngles, formulario);
  };

  // Modo servidor: se espera la respuesta de Catálogo; el id del insumo lo define el servidor
  const guardarInsumoEnServidor = async (datos, nombreIngles, formulario) => {
    const resultado = await guardarEnServidor(() => (esEdicion
      ? actualizarInsumoServidor(insumoEditado.id, datos)
      : crearInsumoServidor(datos)));
    if (!resultado.exito) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> {resultado.mensaje}</> });
      return;
    }
    setInsumos(obtenerInsumos());
    if (esEdicion) setInsumoEditado(resultado.datos);
    terminarGuardado(resultado.datos.id, datos, nombreIngles, formulario);
  };

  const terminarGuardado = (idInsumo, datos, nombreIngles, formulario) => {
    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Insumo <strong>{datos.nombre}</strong> {esEdicion ? 'actualizado' : 'creado'} correctamente!</>
    });
    if (!esEdicion) {
      setForm(FORM_VACIO);
      setFeedback({});
      setNutri(NUTRI_VACIO);
      if (formulario) formulario.reset();
    }

    // El insumo ya quedó guardado en la tienda. Los datos nutricionales se envían aparte al backend
    // y, si el servidor falla, no se pierde nada de lo anterior.
    if (nombreIngles) {
      setEstadoNutri({ tipo: 'info', texto: 'Guardando datos nutricionales en el servidor…' });
      guardarIngrediente(idInsumo, { insumoId: idInsumo, nombre: datos.nombre, nombreIngles, unidad: datos.unidad, alergenos: nutri.alergenos })
        .then(() => setEstadoNutri({ tipo: 'success', texto: 'Datos nutricionales guardados en el servidor.' }))
        .catch((err) => setEstadoNutri({ tipo: 'warning', texto: `El insumo se guardó, pero no se pudieron guardar sus datos nutricionales: ${describirErrorNutricion(err)}` }));
    } else {
      setEstadoNutri(null);
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
                <fieldset className="border rounded p-3 mb-4" id="datos-nutricionales">
                  <legend className="float-none w-auto px-2 fs-6 fw-semibold text-principal"><i className="ti ti-leaf me-1"></i> Datos nutricionales (Opcional)</legend>
                  <p className="form-text small mt-0 mb-3">Se usan para calcular la información nutricional de las recetas que llevan este insumo. Si dejas vacío el nombre en inglés, no se envía nada al servidor.</p>
                  <div className="mb-3">
                    <label htmlFor="nombre-ingles-insumo" className="form-label">Nombre en inglés</label>
                    <input type="text" className={'form-control' + claseValidacion(feedback.nombreIngles)} id="nombre-ingles-insumo" placeholder="Ej: flour" maxLength={60} value={nutri.nombreIngles} onChange={cambiarNombreIngles} />
                    <div className="form-text small">Solo letras sin tildes (ej: heavy cream). Es el nombre que entiende Spoonacular.</div>
                    <FeedbackCampo resultado={feedback.nombreIngles} />
                  </div>
                  <div>
                    <span className="form-label d-block">Alérgenos que contiene</span>
                    {[...new Set([...ALERGENOS, ...nutri.alergenos])].map((a) => (
                      <div key={a} className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" id={`alergeno-${a.replace(/\s+/g, '-')}`} checked={nutri.alergenos.includes(a)} onChange={alternarAlergeno(a)} />
                        <label className="form-check-label" htmlFor={`alergeno-${a.replace(/\s+/g, '-')}`}>{capitalizar(a)}</label>
                      </div>
                    ))}
                  </div>
                  {estadoNutri && <div className={`alert alert-${estadoNutri.tipo} py-2 small mt-3 mb-0`} role="status">{estadoNutri.texto}</div>}
                </fieldset>
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
