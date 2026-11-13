import React from 'react';
import images from '../../assets/images';
import IconoX from '../atoms/IconoX';

const CHEFS = [
  { img: images['chefs/chef1'], nombre: 'Ramon Perez', rol: 'Jefe de cocina', experiencia: '12 años de experiencia', delay: 0 },
  { img: images['chefs/chef2'], nombre: 'Johnny Bravo', rol: 'Maestro pastelero', experiencia: '8 años de experiencia', delay: 80 },
  { img: images['chefs/chef3'], nombre: 'Pepito Clavito', rol: 'Pastelero', experiencia: '10 años de experiencia', delay: 160 },
  { img: images['chefs/chef4'], nombre: 'Carlos Lopez', rol: 'Ayudante pastelero', experiencia: '9 años de experiencia', delay: 240 }
];

export default function Chefs() {
  return (
    <section id="chefs">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl">El equipo de cocina</span>
          <h2 className="stitle">Conoce Nuestro equipo de <span>Chefs</span></h2>
          <div className="sline"></div>
        </div>
        <div className="row g-4">
          {CHEFS.map((chef) => (
            <div className="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay={chef.delay} key={chef.nombre}>
              <div className="chcard">
                <div className="chimg">
                  <img src={chef.img} alt="" />
                  <div className="chsoc"><a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a><a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a><a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><IconoX /></a></div>
                </div>
                <div className="chbody">
                  <div className="chnm">{chef.nombre}</div>
                  <div className="chrole">{chef.rol}</div>
                  <div className="chexp">{chef.experiencia}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
