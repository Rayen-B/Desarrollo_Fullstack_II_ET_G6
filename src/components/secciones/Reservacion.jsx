import React, { useRef } from 'react';
import ErrorCampo from '../atoms/ErrorCampo';
import { useFormulario } from '../../hooks/useFormulario';
import { validarNombrePersona, validarTelefono, validarEmail, validarFecha } from '../../utils/validaciones';

const INFO = [
  { icono: 'fa-clock', titulo: 'Horario de atención', texto: 'Miér - Dom, 9 AM - 11 PM' },
  { icono: 'fa-phone-alt', titulo: 'Reservar', texto: '+56 9 1234 5678' },
  { icono: 'fa-users', titulo: 'Comidas Grupales', texto: 'Menús especiales para 10+ huéspedes' },
  { icono: 'fa-map-marker-alt', titulo: 'Ubicación', texto: 'Av. Papita Dulce, Santiago, Chile' }
];

const INVITADOS = ['1 Persona', '2 Personas', '3 - 4 Personas', '5 - 6 Personas', '7 -10 Personas', '+10 Personas'];
const HORAS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'];

export function validarReserva(v) {
  const errores = {};
  const nombre = validarNombrePersona(v.nombre, 'El nombre completo', 3, 60);
  if (!nombre.valido) errores.nombre = nombre.mensaje;
  const telefono = validarTelefono(v.telefono);
  if (!telefono.valido) errores.telefono = telefono.mensaje;
  const correo = validarEmail(v.correo);
  if (!correo.valido) errores.correo = correo.mensaje;
  const fecha = validarFecha(v.fecha);
  if (!fecha.valido) errores.fecha = fecha.mensaje;
  return errores;
}

export default function Reservacion() {
  const exitoRef = useRef(null);
  const { valores, errores, enviando, enviado, cambiar, alSalir, alEnviar } = useFormulario(
    { nombre: '', telefono: '', correo: '', invitados: INVITADOS[0], fecha: '', hora: HORAS[0], solicitudes: '' },
    validarReserva
  );

  const irAlMensaje = () => exitoRef.current && exitoRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const claseCampo = (campo) => `fctrl${errores[campo] ? ' is-invalid' : ''}`;

  return (
    <section id="reservation">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl">Reservar una Mesa</span>
          <h2 className="stitle">Haz una <span>Reserva</span></h2>
          <div className="sline"></div>
          <p className="sdesc mx-auto max-w-480">Reserva tu mesa para una junta especial. Recomendamos reservar con 24 horas de anticipación para un evento sensacional.</p>
        </div>
        <div className="row g-4 align-items-start">
          <div className="col-lg-4" data-aos="fade-right">
            <div className="dark-box">
              <h4 className="text-white mb-2 h4-large">Información de Contacto</h4>
              <p className="text-white-dim text-sm-alt3 mb-4">Estamos encantados de ayudarte a planificar la experiencia culinaria perfecta.</p>
              <div className="d-flex flex-column gap-3">
                {INFO.map((item) => (
                  <div className="d-flex align-items-center gap-3" key={item.titulo}>
                    <div className="icon-box"><i className={`fas ${item.icono}`}></i></div>
                    <div><strong className="info-label">{item.titulo}</strong><span className="info-value">{item.texto}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-8" data-aos="fade-left">
            <div className="fcard">
              <form noValidate onSubmit={alEnviar(irAlMensaje)}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="flbl">Nombre completo *</label>
                  <input type="text" name="nombre" className={claseCampo('nombre')} onBlur={alSalir} placeholder="Juan Perez" value={valores.nombre} onChange={cambiar} />
                  <ErrorCampo mensaje={errores.nombre} />
                </div>
                <div className="col-sm-6">
                  <label className="flbl">Número de teléfono *</label>
                  <input type="tel" name="telefono" className={claseCampo('telefono')} onBlur={alSalir} placeholder="+56 9 1234 5678" value={valores.telefono} onChange={cambiar} />
                  <ErrorCampo mensaje={errores.telefono} />
                </div>
                <div className="col-sm-6">
                  <label className="flbl">Dirección de correo electrónico *</label>
                  <input type="email" name="correo" className={claseCampo('correo')} onBlur={alSalir} placeholder="tu@email.com" value={valores.correo} onChange={cambiar} />
                  <ErrorCampo mensaje={errores.correo} />
                </div>
                <div className="col-sm-6">
                  <label className="flbl">Número de invitados *</label>
                  <select name="invitados" className="fctrl" value={valores.invitados} onChange={cambiar}>
                    {INVITADOS.map((op) => <option key={op}>{op}</option>)}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="flbl">Fecha *</label>
                  <input type="date" name="fecha" className={claseCampo('fecha')} onBlur={alSalir} value={valores.fecha} onChange={cambiar} />
                  <ErrorCampo mensaje={errores.fecha} />
                </div>
                <div className="col-sm-6">
                  <label className="flbl">Hora *</label>
                  <select name="hora" className="fctrl" value={valores.hora} onChange={cambiar}>
                    {HORAS.map((op) => <option key={op}>{op}</option>)}
                  </select>
                </div>
                <div className="col-12"><label className="flbl">Solicitudes especiales</label><textarea name="solicitudes" className="fctrl" rows="3" placeholder="Alergias, ocasiones especiales..." value={valores.solicitudes} onChange={cambiar}></textarea></div>
                <div className="col-12">
                  <button
                    className="btn-red w-100 justify-content-center"
                    id="resBtn"
                    type="submit"
                    disabled={enviando}
                  >
                    {enviando
                      ? <><i className="fas fa-spinner fa-spin"></i> Reservando...</>
                      : <><i className="fas fa-calendar-check"></i>Confirmar Reserva</>}
                  </button>
                </div>
              </div>
              </form>
              <div className="sucmsg" id="resOk" ref={exitoRef} style={enviado ? { display: 'block' } : undefined}>
                <i className="fas fa-check-circle"></i>
                <p>¡Mesa reservada! Te lo confirmaremos por correo electrónico en breve.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
