import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import images from '../../assets/images';

const INICIO = { h: 8, m: 45, s: 30 };

// Resta un segundo a la cuenta regresiva; al llegar a 00:00:00 vuelve a empezar.
export function restarSegundo({ h, m, s }) {
  s -= 1;
  if (s < 0) { s = 59; m -= 1; }
  if (m < 0) { m = 59; h -= 1; }
  if (h < 0) return { ...INICIO };
  return { h, m, s };
}

const dosDigitos = (n) => String(n).padStart(2, '0');

export default function OfertaEspecial() {
  const [tiempo, setTiempo] = useState(INICIO);

  useEffect(() => {
    const iv = setInterval(() => setTiempo(restarSegundo), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section id="special">
      <div className="spbg"></div>
      <div className="container pos-rel-z2">
        <div className="row align-items-center g-5">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="sptag"><i className="fas fa-bolt me-1"></i>Oferta por tiempo limitado</div>
            <h2 className="sptitle">Obten un 30% de descuento<br />Nuestro sello distintivo<br /><span>Torta</span> papita amor </h2>
            <p className="spdesc">Aprovecha la especialidad del fin de semana en Papita Dulce: llévate nuestro pastel estrella acompañado de un café de especialidad a un precio irresistible. </p>
            <div className="cdwrap">
              <div className="cditem"><span className="cdnum" id="cdH">{dosDigitos(tiempo.h)}</span><span className="cdlbl">Horas</span></div>
              <div className="cditem"><span className="cdnum" id="cdM">{dosDigitos(tiempo.m)}</span><span className="cdlbl">Minutos</span></div>
              <div className="cditem"><span className="cdnum" id="cdS">{dosDigitos(tiempo.s)}</span><span className="cdlbl">Segundos</span></div>
            </div>
            <Link to="/ofertas" className="btn-red"><i className="fas fa-shopping-cart"></i>Ver todas las ofertas</Link>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="spimgw">
              <div className="spglow"></div>
              <div className="sppbdg"><span className="old">$24.990</span><span className="np">$17.490</span></div>
              <img src={images['menu/tortapapita']} alt="Torta Papita" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
