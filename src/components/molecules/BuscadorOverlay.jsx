import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTienda } from '../../context/TiendaContext';
import { useOverlay } from '../../hooks/useOverlay';
import { listarCategorias, buscarProductos } from '../../services/db';
import { obtenerImagen } from '../../assets/images';

// Buscador superpuesto: sugiere productos mientras se escribe y lleva a /productos?q=texto
const TENDENCIAS = ['Torta panqueque naranja', 'Torta selva negra', 'Limonada', 'Jugo de mango', 'Galletas', 'Empolvados'];

export default function BuscadorOverlay() {
  const { buscadorAbierto, setBuscadorAbierto } = useTienda();
  const [texto, setTexto] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const cerrar = useCallback(() => setBuscadorAbierto(false), [setBuscadorAbierto]);
  useOverlay(buscadorAbierto, cerrar);

  // Al abrir, el foco va al campo de búsqueda
  useEffect(() => {
    if (!buscadorAbierto) return undefined;
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 220);
    return () => clearTimeout(t);
  }, [buscadorAbierto]);

  const sugerencias = texto.trim().length >= 2 ? buscarProductos(texto).slice(0, 5) : [];

  const buscar = (e) => {
    e.preventDefault();
    const consulta = texto.trim();
    cerrar();
    setTexto('');
    navigate(consulta ? `/productos?q=${encodeURIComponent(consulta)}` : '/productos');
  };

  const irA = (ruta) => {
    cerrar();
    setTexto('');
    navigate(ruta);
  };

  return (
    <div id="searchOv" className={buscadorAbierto ? 'open' : ''} role="dialog" aria-label="Buscar productos" aria-hidden={!buscadorAbierto}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <button className="sovclose" id="searchClose" type="button" aria-label="Cerrar buscador" onClick={cerrar}>
        <i className="fas fa-times"></i>
      </button>
      <div className="sovbox">
        <h4>¿Qué se te antoja hoy?</h4>
        <form className="sovinput" onSubmit={buscar} role="search">
          <label htmlFor="searchInput" className="visually-hidden">Buscar productos</label>
          <input ref={inputRef} type="search" id="searchInput" placeholder="Busca tortas, jugos, postres..." autoComplete="off"
            value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button id="searchSubmit" type="submit" aria-label="Buscar"><i className="fas fa-search"></i></button>
        </form>

        {sugerencias.length > 0 && (
          <ul className="list-group mt-3 text-start" aria-label="Sugerencias de productos">
            {sugerencias.map((p) => (
              <li key={p.codigo} className="list-group-item list-group-item-action d-flex align-items-center gap-3" role="button" tabIndex={0}
                onClick={() => irA(`/producto/${p.codigo}`)} onKeyDown={(e) => { if (e.key === 'Enter') irA(`/producto/${p.codigo}`); }}>
                <img src={obtenerImagen(p.imagen)} alt="" width="44" height="44" style={{ objectFit: 'cover', borderRadius: 8 }} />
                <span>{p.nombre}<small className="d-block text-muted">{p.categoria}</small></span>
              </li>
            ))}
          </ul>
        )}

        <div className="sovcats">
          {listarCategorias().map((c) => (
            <div key={c.id} className="sovcat" role="button" tabIndex={0} onClick={() => irA(`/categorias/${c.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') irA(`/categorias/${c.id}`); }}>
              <img src={obtenerImagen(c.imagen)} alt="" />{c.nombre}
            </div>
          ))}
        </div>
        <div className="sovtrend">
          <p><i className="fas fa-fire me-1 text-secondary"></i>Búsquedas en tendencia</p>
          {TENDENCIAS.map((t) => (
            <React.Fragment key={t}>{' '}<span className="ttag" role="button" tabIndex={0} onClick={() => { setTexto(t); inputRef.current && inputRef.current.focus(); }}>{t}</span></React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
