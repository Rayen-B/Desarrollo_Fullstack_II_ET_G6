import React from 'react';
import { Link } from 'react-router-dom';
import { listarArticulos } from '../../services/db';
import { obtenerImagen } from '../../assets/images';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function partesFecha(fechaISO) {
  const [, mes, dia] = String(fechaISO).split('-');
  return { dia: dia || '', mes: MESES[Number(mes) - 1] || '' };
}

// Tarjetas del blog. limite: cantidad de artículos a mostrar (todos si no se indica)
export default function Blog({ limite, mostrarEncabezado = true, conVerTodos = false }) {
  const articulos = listarArticulos().slice(0, limite);
  return (
    <section id="blog" aria-labelledby="tituloBlog">
      <div className="container">
        {mostrarEncabezado && (
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="slbl">Noticias &amp; Actualizaciones</span>
            <h2 className="stitle" id="tituloBlog">Nuestros últimos <span>artículos</span> del blog</h2>
            <div className="sline"></div>
          </div>
        )}
        <div className="row g-4">
          {articulos.map((a, i) => {
            const { dia, mes } = partesFecha(a.fecha);
            return (
              <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={i * 80} key={a.id}>
                <article className="blcard">
                  <div className="blimg">
                    <img src={obtenerImagen(a.imagen)} alt={a.titulo} loading="lazy" />
                    <div className="bldatebdg"><span className="bd">{dia}</span><span className="bm">{mes}</span></div>
                  </div>
                  <div className="blbody">
                    <div className="bltag">{a.categoria}</div>
                    <h3 className="bltit"><Link to={`/blog/${a.id}`}>{a.titulo}</Link></h3>
                    <div className="blmeta"><span><i className="fas fa-user"></i>{a.autor}</span><span><i className="fas fa-comment"></i>{a.comentarios} comentarios</span></div>
                    <Link to={`/blog/${a.id}`} className="blmore">Leer más <i className="fas fa-arrow-right"></i></Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
        {conVerTodos && <div className="text-center mt-5"><Link to="/blog" className="btn-red"><i className="fas fa-newspaper"></i>Ver todos los artículos</Link></div>}
      </div>
    </section>
  );
}
