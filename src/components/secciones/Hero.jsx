import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import images from '../../assets/images';

const ESTADISTICAS = [
  { numero: 850, sufijo: '+', etiqueta: 'Clientes satisfechos' },
  { numero: 120, sufijo: '+', etiqueta: 'Preparaciones' },
  { numero: 15, sufijo: '+', etiqueta: 'Reposteros expertos' },
  { numero: 5, sufijo: ' Años', etiqueta: 'Experiencia' }
];

// Al pasar el hero, los números suben de 0 a su valor en ~1,4 s (una sola vez)
function useContadores(heroId) {
  const [valores, setValores] = useState(null); // null = todavía sin animar

  useEffect(() => {
    let intervalos = [];
    const onScroll = () => {
      const hero = document.getElementById(heroId);
      if (!hero || window.scrollY <= hero.offsetHeight - 300) return;
      window.removeEventListener('scroll', onScroll);
      setValores(ESTADISTICAS.map(() => 0));
      intervalos = ESTADISTICAS.map((stat, i) => {
        const paso = Math.ceil(stat.numero / 55);
        let actual = 0;
        const iv = setInterval(() => {
          actual += paso;
          if (actual >= stat.numero) {
            actual = stat.numero;
            clearInterval(iv);
          }
          setValores((prev) => prev.map((v, j) => (j === i ? actual : v)));
        }, 1400 / 55);
        return iv;
      });
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      intervalos.forEach(clearInterval);
    };
  }, [heroId]);

  return valores;
}

export default function Hero({ onVerHistoria }) {
  const valores = useContadores('hero');

  return (
    <>
      <section id="hero">
        <div className="hs hs1"></div>
        <div className="hs hs2"></div>
        <div className="hbgtxt">COMIDA</div>
        <div className="container">
          <div className="row align-items-center g-5 min-h-88vh">
            <div className="col-lg-6">
              <div className="hbadge">
                <div className="hbi"><i className="fas fa-star"></i></div>
                <span>#1 El rincón dulce favorito de Santiago</span>
              </div>
              <h1 className="htitle">Delicioso <span className="hl">"Creado para despertar a tu Papita interior"</span><br />{'\n'}para cada momento</h1>
              <p className="hdesc">Ese lado tierno y relajado que sabe disfrutar de las cosas buenas de la vida,un trozo de pastel y un sorbo de café a la vez.</p>
              <div className="d-flex flex-wrap gap-3 mb-2">
                <Link to="/productos" className="btn-red"><i className="fas fa-utensils"></i>Explorar productos</Link>
                <a
                  href={images['Historia']}
                  className="magnific_popup btn-play"
                  onClick={(e) => {
                    e.preventDefault();
                    onVerHistoria();
                  }}
                >
                  <div className="pico"><i className="fas fa-play"></i></div>
                  <span>Mira nuestra historia</span>
                </a>
              </div>
              <div className="hstats d-flex gap-3 flex-wrap mt-4">
                {ESTADISTICAS.map((stat, i) => (
                  <React.Fragment key={stat.etiqueta}>
                    {i > 0 && <div className="sdiv"></div>}
                    <div className="hstat">
                      <span className="snum">{valores ? valores[i] + stat.sufijo : <>{stat.numero}<em>{stat.sufijo}</em></>}</span>
                      <small>{stat.etiqueta}</small>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="pos-rel-center">
                <div className="hcircle">
                  <img src={images['pastel_2']} alt="Pastel" />
                </div>
                <div className="fcard fc1">
                  <div className="fcoi r"><i className="fas fa-fire"></i></div>
                  <div><span className="fcnum">Oferta irresistible</span><span className="fcsm">30% de descuento hoy</span></div>
                </div>
                <div className="fcard fc2">
                  <div className="fcoi y"><i className="fas fa-star"></i></div>
                  <div><span className="fcnum">4.9/5</span><span className="fcsm">2k+ reseñas</span></div>
                </div>
                <div className="fcard fc3">
                  <div className="fcoi g"><i className="fas fa-clock"></i></div>
                  <div><span className="fcnum">20 min</span><span className="fcsm">Entrega rápida</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mqsec">
        <div className="mqtrack">
          {[
            'Pastelería Artesanal', 'Café de Especialidad', 'Tortas Caseras', 'Tartaletas', 'Infusiones & bebestibles',
            'Recetas con cariño', 'Postres', 'Pastelería artesanal', 'Café de Especialidad', 'Tortas caseras',
            'Tartaletas', 'Infusiones & bebestibles', 'Recetas con cariño', 'Postres'
          ].map((texto, i) => (
            <div className="mqitem" key={i}><i className="fas fa-circle"></i>{texto}</div>
          ))}
        </div>
      </div>
    </>
  );
}
