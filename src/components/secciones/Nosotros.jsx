import React from 'react';
import { Link } from 'react-router-dom';
import images from '../../assets/images';

const CARACTERISTICAS = [
  { color: 'r', icono: 'fa-leaf', titulo: '100% Ingredientes frescos', texto: 'Elegimos insumos de la mejor calidad para que cada pastel y tarta tenga ese sabor casero único.' },
  { color: 'y', icono: 'fa-award', titulo: 'Recetas con Amor', texto: 'Cada preparación está inspirada en regalarte un momento dulce y reconfortante.' },
  { color: 'g', icono: 'fa-shipping-fast', titulo: 'Entregas & Despachos', texto: 'Llevamos tus postres favoritos y café recién hecho directo a la puerta de tu hogar.' }
];

export default function Nosotros() {
  return (
    <section id="about">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5" data-aos="fade-right">
            <div className="astack">
              <div className="aexp"><span className="anum">5</span><small>Años de<br />Excelencia</small></div>
              <div className="amain"><img src={images['vitrina1']} alt="Vitrina de pastelería" /></div>
              <div className="asm"><img src={images['vitrina2']} alt="Pastelería artesanal" /></div>
            </div>
          </div>
          <div className="col-lg-7" data-aos="fade-left">
            <span className="slbl">Nuestra historia</span>
            <h2 className="stitle text-start">Ven a Disfrutar de <br />Nuestra <span>Pastelería &amp; Cafetería</span></h2>
            <div className="sline lft"></div>
            <p className="sdesc mb-4">Inspirados en la dulzura y calidez de nuestra gatita Papita, nacimos como un rincón acogedor pensado para hacer una pausa en tu día. Hoy preparamos cada receta y cada taza de café con la misma dedicación y cariño del primer día, para que siempre te sientas como en casa.</p>
            <div className="mb-4">
              {CARACTERISTICAS.map((c) => (
                <div className="fti" key={c.titulo}>
                  <div className={`ftico ${c.color}`}><i className={`fas ${c.icono}`}></i></div>
                  <div><h6>{c.titulo}</h6><p>{c.texto}</p></div>
                </div>
              ))}
            </div>
            <Link to="/productos" className="btn-red"><i className="fas fa-book-open"></i>Ver menú completo</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
