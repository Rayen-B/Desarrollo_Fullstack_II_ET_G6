import React from 'react';
import { Link } from 'react-router-dom';

const HORARIOS = [
  { dias: 'Lunes - Martes', abierto: false, horario: 'Cerrado' },
  { dias: 'Miércoles - Jueves', abierto: true, horario: '09:00 AM - 10:00 PM' },
  { dias: 'Viernes', abierto: true, horario: '09:00 AM - 11:00 PM' },
  { dias: 'Sábado', abierto: true, horario: '10:00 AM - 11:30 PM' },
  { dias: 'Domingo', abierto: true, horario: '11:00 AM - 09:00 PM' }
];

const UBICACION = [
  { icono: 'fa-location-dot', titulo: 'Dirección', texto: 'Av. Papita Dulce,Santiago,Chile' },
  { icono: 'fa-phone', titulo: 'Teléfono', texto: '+56 9 1234 5678' },
  { icono: 'fa-envelope', titulo: 'Correo Electrónico', texto: 'papitadulce@gmail.com' }
];

export default function Horarios() {
  return (
    <section id="hours">
      <div className="hrsbg"></div>
      <div className="container pos-rel-z2">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl slbl-mint">Horario</span>
          <h2 className="stitle text-white">Estamos a <span>tu servicio</span></h2>
          <div className="sline"></div>
        </div>
        <div className="row g-4 align-items-start">
          <div className="col-lg-5" data-aos="fade-right">
            <div className="hrscard">
              {HORARIOS.map((h) => (
                <div className="hrsrow" key={h.dias}>
                  <span className="hrsday"><i className="fas fa-calendar-day me-2"></i>{h.dias}</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className={`hdot ${h.abierto ? 'on' : 'off'}`}></div>
                    <span className={`hrstime${h.abierto ? '' : ' text-red'}`}>{h.horario}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-3" data-aos="zoom-in">
            <div className="hrscta">
              <i className="fas fa-truck-fast fa-2x mb-3 text-icon-light"></i>
              <h4>Ordena Online</h4>
              <p>Recibe tus preparaciones favoritas en 25 minutos</p>
              <Link to="/productos" className="btnw">Ordenar Ahora</Link>
            </div>
          </div>
          <div className="col-lg-4" data-aos="fade-left">
            <div className="hrscard">
              <h5 className="text-white mb-0"><i className="fas fa-map-marker-alt me-2"></i>Encuéntranos</h5>
              {UBICACION.map((u) => (
                <div className="hrsrow" key={u.titulo}>
                  <span className="hrsday"><i className={`fas ${u.icono} me-2`}></i>{u.titulo}</span>
                  <span className="hrstime text-sm-alt">{u.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
