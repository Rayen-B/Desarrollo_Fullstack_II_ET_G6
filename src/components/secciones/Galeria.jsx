import React, { useCallback, useState } from 'react';
import { useOverlay } from '../../hooks/useOverlay';
import images from '../../assets/images';

export const FOTOS_GALERIA = [
  { img: images['menu/Torta_Trufa'], alt: 'tortas', titulo: 'Tortas gourmet', desc: 'Tortas artesanales preparadas con ingredientes seleccionados y recetas de la casa.' },
  { img: images['menu/Bebestible5'], alt: 'bebestibles', titulo: 'Bebestibles de la casa', desc: 'Bebestibles frescos preparados para acompañar tus preparaciones favoritas.' },
  { img: images['menu/sandwich4'], alt: 'sandwiches', titulo: 'Sándwiches crujientes', desc: 'Sándwiches preparados con ingredientes frescos, rellenos abundantes y mucho sabor.' },
  { img: images['menu/Arroz_con_Leche'], alt: 'Postres', titulo: 'Postres dulces', desc: 'Postres artesanales preparados con recetas caseras e ingredientes frescos de temporada.' },
  { img: images['menu/tartaleta4'], alt: 'tartaletas', titulo: 'Tartaletas frescas', desc: 'Tartaletas artesanales con rellenos cremosos, frutas frescas y bases crujientes.' }
];

// Galería de fotos con visor (circular: de la última vuelve a la primera)
export default function Galeria({ fotos = FOTOS_GALERIA }) {
  const [indice, setIndice] = useState(null); // null = todavía no se abre ninguna foto
  const [abierto, setAbierto] = useState(false);

  const cerrar = useCallback(() => setAbierto(false), []);
  useOverlay(abierto, cerrar);

  const abrir = (i) => {
    setIndice(i);
    setAbierto(true);
  };

  const foto = indice !== null ? fotos[indice] : null;

  return (
    <>
      <section id="gallery">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="slbl">Nuestros favoritos</span>
            <h2 className="stitle">Conoce nuestra <span>pastelería</span></h2>
            <div className="sline"></div>
          </div>
          <div className="ggrid" data-aos="fade-up">
            {fotos.map((f, i) => (
              <div className="gitem" key={f.img} data-gi={i} onClick={() => abrir(i)}>
                <img src={f.img} alt={f.alt} />
                <div className="gover"><span><i className="fas fa-expand-alt"></i> {f.titulo}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="galPop" className={abierto ? 'open' : ''} onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
        <div className="gpbox">
          <button className="gpclose" id="gpClose" onClick={cerrar}><i className="fas fa-times"></i></button>
          <img id="gpImg" src={foto ? foto.img : undefined} alt="" />
          <div className="gpcap">
            <h5 id="gpTitle">{foto ? foto.titulo : ''}</h5>
            <p id="gpDesc">{foto ? foto.desc : ''}</p>
          </div>
          <div className="gpnav">
            <button id="gpPrev" onClick={() => setIndice((indice - 1 + fotos.length) % fotos.length)}><i className="fas fa-chevron-left me-1"></i>Anterior</button>
            <button id="gpNext" onClick={() => setIndice((indice + 1) % fotos.length)}>Siguiente <i className="fas fa-chevron-right ms-1"></i></button>
          </div>
        </div>
      </div>
    </>
  );
}
