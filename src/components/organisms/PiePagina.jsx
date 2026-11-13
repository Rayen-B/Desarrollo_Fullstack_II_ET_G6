import React from 'react';
import { Link } from 'react-router-dom';
import { listarCategorias } from '../../services/db';
import IconoX from '../atoms/IconoX';

const ENLACES_RAPIDOS = [
  { to: '/', texto: 'Inicio' },
  { to: '/nosotros', texto: 'Sobre nosotros' },
  { to: '/productos', texto: 'Nuestros productos' },
  { to: '/ofertas', texto: 'Ofertas' },
  { to: '/blog', texto: 'Blog' },
  { to: '/contacto', texto: 'Contacto' }
];

const CONTACTO = [
  { icono: 'fa-map-marker-alt', titulo: 'Dirección', texto: 'Av. Papita Dulce, Santiago, Chile' },
  { icono: 'fa-phone-alt', titulo: 'Teléfono', texto: '+56 9 1234 5678' },
  { icono: 'fa-envelope', titulo: 'Correo electrónico', texto: 'papitadulce@gmail.com' },
  { icono: 'fa-clock', titulo: 'Horario', texto: 'Mar - Sab: 09 AM - 11 PM' }
];

export default function PiePagina() {
  const categorias = listarCategorias();
  return (
    <footer>
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4">
            <div className="fnm">Papita<span>Dulce</span></div>
            <p className="fdesc">Reunimos los mejores sabores del mundo en una experiencia rápida, amable y asequible. Cada comida está elaborada con amor.</p>
            <div className="fsoc">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X"><IconoX /></a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
            </div>
          </div>
          <div className="col-sm-6 col-lg-2">
            <div className="ftit">Enlaces rápidos</div>
            <ul className="flinks ps-0">
              {ENLACES_RAPIDOS.map((e) => (
                <li key={e.to}><Link to={e.to}><i className="fas fa-chevron-right"></i>{e.texto}</Link></li>
              ))}
            </ul>
          </div>
          <div className="col-sm-6 col-lg-2">
            <div className="ftit">Nuestro menú</div>
            <ul className="flinks ps-0">
              {categorias.map((c) => (
                <li key={c.id}><Link to={`/categorias/${c.id}`}><i className="fas fa-chevron-right"></i>{c.nombre}</Link></li>
              ))}
            </ul>
          </div>
          <div className="col-lg-4">
            <div className="ftit">Contáctanos</div>
            {CONTACTO.map((c) => (
              <div className="fci" key={c.titulo}>
                <div className="fciico"><i className={`fas ${c.icono}`}></i></div>
                <div className="fciinfo"><strong>{c.titulo}</strong>{c.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="fbot">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <p>&copy; 2026 <span>Papita Dulce</span>. Todos los derechos reservados. Hecho con <span><i className="fas fa-heart"></i></span></p>
            <div><Link to="/contacto">Política de privacidad</Link><Link to="/contacto">Términos</Link><Link to="/contacto">Cookies</Link></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
