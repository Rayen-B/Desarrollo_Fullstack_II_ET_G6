import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/organisms/AdminLayout';
import FeedbackCampo, { claseValidacion } from '../../components/atoms/FeedbackCampo';
import { obtenerProductos, guardarProductos } from '../../services/storage';
import { obtenerCategorias, guardarCategorias, crearIdCategoria, validarNombreCategoria } from '../../services/categorias';
import { obtenerImagen } from '../../assets/images';

const FORM_VACIO = { nombre: '', descripcion: '' };
const IMAGEN_POR_DEFECTO = 'imgc1';

export default function AdminCategoriaForm() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  const [categorias, setCategorias] = useState(obtenerCategorias);
  const [categoriaEditada, setCategoriaEditada] = useState(null); // modo edición si se llega con ?id=
  const [form, setForm] = useState(FORM_VACIO);
  const [imagen, setImagen] = useState(null); // imagen nueva subida (data URL)
  const [feedback, setFeedback] = useState(null);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (!idParam) return;
    const c = categorias.find((cat) => cat.id === idParam);
    if (!c) return;
    setCategoriaEditada(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion || '' });
  }, [idParam]);

  const esEdicion = categoriaEditada !== null;
  const idActual = esEdicion ? categoriaEditada.id : null;
  const vistaPrevia = imagen || (esEdicion ? categoriaEditada.imagen : IMAGEN_POR_DEFECTO);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    if (campo === 'nombre') setFeedback(validarNombreCategoria(valor, categorias, idActual));
  };

  const cambiarImagen = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onloadend = () => setImagen(lector.result);
    lector.readAsDataURL(archivo);
  };

  const enviar = (e) => {
    e.preventDefault();
    const valNombre = validarNombreCategoria(form.nombre, categorias, idActual);
    setFeedback(valNombre);
    if (!valNombre.valido) {
      setAlerta({ tipo: 'danger', contenido: <><i className="ti ti-alert-triangle me-1"></i> Por favor verifique los campos marcados en rojo.</> });
      return;
    }

    const nombre = form.nombre.trim();
    let nuevas;
    if (esEdicion) {
      const actualizada = { ...categoriaEditada, nombre, descripcion: form.descripcion.trim(), imagen: imagen || categoriaEditada.imagen };
      nuevas = categorias.map((c) => (c.id === categoriaEditada.id ? actualizada : c));
      // Los productos de la categoría pasan a usar el nuevo nombre
      if (nombre !== categoriaEditada.nombre) {
        guardarProductos(obtenerProductos().map((p) => (p.categoria === categoriaEditada.nombre ? { ...p, categoria: nombre } : p)));
      }
      setCategoriaEditada(actualizada);
    } else {
      nuevas = [...categorias, { id: crearIdCategoria(nombre), nombre, descripcion: form.descripcion.trim(), imagen: imagen || IMAGEN_POR_DEFECTO }];
    }
    guardarCategorias(nuevas);
    setCategorias(nuevas);

    setAlerta({
      tipo: 'success',
      contenido: <><i className="ti ti-check-circle me-1"></i> ¡Categoría <strong>{nombre}</strong> {esEdicion ? 'actualizada' : 'creada'} correctamente!</>
    });
    if (!esEdicion) {
      setForm(FORM_VACIO);
      setImagen(null);
      setFeedback(null);
      e.currentTarget.reset();
    }
  };

  const acciones = (
    <Link to="/admin/categorias" className="btn btn-outline-secondary btn-sm">
      <i className="ti ti-arrow-left me-1"></i> Volver a Categorías
    </Link>
  );

  return (
    <AdminLayout
      tituloPagina={esEdicion ? 'Editar Categoría' : 'Gestión de Categoría'}
      tituloDocumento="Administrador - Formulario de Categoría"
      acciones={acciones}
    >
      <div className="row justify-content-center">
        <div className="col-lg-9 col-xl-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-1 fw-bold text-principal">
                {esEdicion
                  ? <><i className="ti ti-edit me-2 text-secundario"></i> Editar Categoría: {categoriaEditada.nombre}</>
                  : <><i className="ti ti-category-plus me-2 text-secundario"></i> Registrar Nueva Categoría</>}
              </h5>
              <p className="card-subtitle text-muted small">Completa los campos.</p>
            </div>
            <div className="card-body p-4">
              <div id="alerta-categoria" className={alerta ? `alert alert-${alerta.tipo} alert-dismissible fade show` : 'alert d-none'} role="alert">
                {alerta && alerta.contenido}
              </div>
              <form id="form-categoria" noValidate onSubmit={enviar}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="nombre-categoria" className="form-label">Nombre <span className="text-danger">*</span></label>
                    <input type="text" className={'form-control' + claseValidacion(feedback)} id="nombre-categoria" placeholder="Ej: Galletas" maxLength={30} required value={form.nombre} onChange={cambiar('nombre')} />
                    <div className="form-text small">Requerido, 3 a 30 caracteres.</div>
                    <FeedbackCampo resultado={feedback} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="descripcion-categoria" className="form-label">Descripción (Opcional)</label>
                    <input type="text" className="form-control" id="descripcion-categoria" placeholder="Ej: Galletas caseras recién horneadas." maxLength={120} value={form.descripcion} onChange={cambiar('descripcion')} />
                    <div className="form-text small">Opcional. Se muestra en la página de Categorías de la tienda.</div>
                  </div>
                </div>
                <div className="row g-3 mb-4 align-items-center">
                  <div className="col-md-8">
                    <label htmlFor="imagen-categoria" className="form-label">Imagen (Opcional)</label>
                    <input type="file" className="form-control" id="imagen-categoria" accept="image/*" onChange={cambiarImagen} />
                    <div className="form-text small">Opcional.</div>
                  </div>
                  <div className="col-md-4 text-center">
                    <img src={obtenerImagen(vistaPrevia)} alt="Vista previa" className="rounded shadow-sm" style={{ width: '96px', height: '96px', objectFit: 'cover' }} />
                    <div className="form-text small">Vista previa</div>
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <Link to="/admin/categorias" className="btn btn-light"><i className="ti ti-x me-1"></i> Cancelar</Link>
                  <button type="submit" className="btn btn-pasteleria px-4 fw-semibold">
                    <i className="ti ti-device-floppy me-1"></i> {esEdicion ? 'GUARDAR CAMBIOS' : 'GUARDAR CATEGORÍA'}
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
