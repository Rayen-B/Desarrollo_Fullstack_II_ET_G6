import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import GrillaProductos from '../components/organisms/GrillaProductos';
import { listarProductos, listarCategorias, crearSlug } from '../services/db';

// Filtra por categoría (id/slug) y por texto (nombre, código, descripción)
export function filtrarCatalogo(productos, { categoria = '', texto = '' }) {
  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const consulta = normalizar(texto);
  return productos.filter((p) => {
    const coincideCategoria = !categoria || crearSlug(p.categoria) === crearSlug(categoria);
    const coincideTexto = !consulta || normalizar([p.nombre, p.codigo, p.categoria, p.descripcion].join(' ')).includes(consulta);
    return coincideCategoria && coincideTexto;
  });
}

// Catálogo completo con filtros (?categoria=tortas&q=chocolate)
export default function Productos() {
  const [params, setParams] = useSearchParams();
  const categoria = params.get('categoria') || '';
  const texto = params.get('q') || '';
  useSeo({ titulo: 'Menú', descripcion: 'Menú completo de Papita Dulce: tortas, bebestibles, infusiones, sándwiches, tartaletas y postres.' });

  const productos = filtrarCatalogo(listarProductos(), { categoria, texto });

  const cambiar = (clave, valor) => {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(clave, valor); else nuevos.delete(clave);
    setParams(nuevos);
  };

  return (
    <section aria-labelledby="tituloProductos">
      <div className="container">
        <EncabezadoSeccion id="tituloProductos" etiqueta="Hecho con amor" titulo={<>Nuestro <span>menú</span></>} descripcion="Elige entre todas nuestras preparaciones artesanales." />

        <div className="menu-filters">
          <form className="menu-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="filtroTexto" className="visually-hidden">Buscar en el menú</label>
            <i className="fas fa-search" aria-hidden="true"></i>
            <input id="filtroTexto" type="search" className="fctrl" placeholder="Buscar por nombre o descripción..." value={texto} onChange={(e) => cambiar('q', e.target.value)} />
          </form>

          <div className="menu-categories" role="group" aria-label="Filtrar por categoría">
            <button type="button" className={`filtbtn${!categoria ? ' active' : ''}`} aria-pressed={!categoria} onClick={() => cambiar('categoria', '')}>Todo</button>
            {listarCategorias().map((c) => (
              <button key={c.id} type="button" className={`filtbtn${crearSlug(categoria) === c.id ? ' active' : ''}`} aria-pressed={crearSlug(categoria) === c.id} onClick={() => cambiar('categoria', c.id)}>{c.nombre}</button>
            ))}
          </div>
          {(categoria || texto) && (
            <button type="button" className="menu-clear-filters" onClick={() => setParams({})}>
              <i className="fas fa-times" aria-hidden="true"></i> Limpiar filtros
            </button>
          )}
        </div>

        <p className="text-center text-muted" role="status" aria-live="polite">
          {productos.length} {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
        </p>
        <GrillaProductos productos={productos} mensajeVacio="No encontramos productos con esos filtros. Prueba con otra búsqueda." />
        <p className="text-center mt-4"><Link to="/categorias">Ver por categorías</Link></p>
      </div>
    </section>
  );
}
