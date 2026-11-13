import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CampoTexto from '../components/molecules/CampoTexto';
import EncabezadoSeccion from '../components/molecules/EncabezadoSeccion';
import { validarCheckout } from '../utils/validaciones';
import {
  formatearVencimiento, formatearNumeroTarjeta, formatearCvv, detectarMarca, NOMBRES_MARCA, simularPago, MOTIVOS_RECHAZO,
  DATOS_TRANSFERENCIA, HORAS_PLAZO_TRANSFERENCIA, calcularVuelto, configuracionPago, dividirEnCuotas
} from '../utils/pago';
import TarjetaCredito from '../components/molecules/TarjetaCredito';
import { formatearPrecio } from '../utils/formato';
import { regionesYComunas } from '../utils/regiones';
import { crearOrden, descontarStock } from '../services/db';
import { useTienda } from '../context/TiendaContext';
import { factorDeItem } from '../utils/stock';

const textoEntrega = (d) => (d.metodoEntrega === 'despacho' ? `Despacho: ${d.direccion.trim()}, ${d.comuna}, ${d.region}` : 'Retiro en tienda');

// Vista /checkout (paso de pago): datos del cliente, entrega y pago.
// Si hay sesión iniciada, los datos se completan automáticamente.
export default function Checkout() {
  useSeo({ titulo: 'Finalizar compra', descripcion: 'Completa tus datos para pagar tu pedido en Papita Dulce.', noindex: true });
  const { carrito, totalPrecio, vaciarCarrito } = useCart();
  const { usuario } = useAuth();
  const { recargarCatalogo } = useTienda();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(() => ({
    nombre: usuario ? [usuario.nombre, usuario.apellidos].filter(Boolean).join(' ') : '',
    run: usuario?.run || '',
    correo: usuario?.correo || '',
    telefono: '',
    metodoEntrega: 'retiro',
    region: usuario?.region || 'Región Metropolitana de Santiago',
    comuna: usuario?.comuna || 'Santiago',
    direccion: usuario?.direccion || '',
    metodoPago: 'tarjeta',
    numTarjeta: '',
    vencimiento: '',
    cvv: '',
    pagaCon: '',
    tipoTarjeta: 'credito', // 'credito' | 'debito'
    cuotas: '1'
  }));
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [cvvEnfocado, setCvvEnfocado] = useState(false); // la tarjeta flotante gira al escribir el CVV
  const [motivoSimulado, setMotivoSimulado] = useState('rechazo'); // motivo del botón "Simular error de pago"
  const [procesando, setProcesando] = useState(false); // espera simulada de la pasarela ("Procesando pago…")
  const timerPago = useRef(null);
  const [modoSimulador, setModoSimulador] = useState(false); // muestra las tarjetas/códigos de error solo cuando se activa
  const [copiado, setCopiado] = useState('');
  const caretNumero = useRef(null); // dígitos antes del cursor (para no perder la posición al dar formato)
  const timerCopiado = useRef(null);

  const marca = detectarMarca(datos.numTarjeta);
  const vuelto = calcularVuelto(totalPrecio, datos.pagaCon);

  // Si se sale de la página mientras se procesa, se cancela la espera
  useEffect(() => () => clearTimeout(timerPago.current), []);

  // Cuotas disponibles (solo crédito): sin interés
  const OPCIONES_CUOTAS = [1, 3, 6];
  const textoCuotas = (n) => {
    const { primera, resto } = dividirEnCuotas(totalPrecio, n);
    if (n === 1) return `1 cuota de ${formatearPrecio(primera)}`;
    if (primera === resto) return `${n} cuotas sin interés de ${formatearPrecio(resto)}`;
    return `${n} cuotas sin interés: 1 de ${formatearPrecio(primera)} y ${n - 1} de ${formatearPrecio(resto)}`;
  };

  // Número de tarjeta: da formato (4532 0151 ...) SIN perder la posición del cursor y permite borrar un espacio
  const cambiarNumero = (e) => {
    const el = e.target;
    const crudo = el.value;
    const pos = el.selectionStart ?? crudo.length;
    let digitos = crudo.replace(/\D/g, '');
    let antes = crudo.slice(0, pos).replace(/\D/g, '').length;
    const borrando = e.nativeEvent?.inputType?.startsWith('delete');
    // Si solo se borró un espacio, el formato lo volvía a poner y el cursor quedaba atrapado: se borra el dígito anterior
    if (borrando && digitos === datos.numTarjeta.replace(/\D/g, '') && antes > 0) {
      digitos = digitos.slice(0, antes - 1) + digitos.slice(antes);
      antes -= 1;
    }
    caretNumero.current = antes;
    setDatos((d) => ({ ...d, numTarjeta: formatearNumeroTarjeta(digitos) }));
    if (errores.numTarjeta) setErrores((errs) => ({ ...errs, numTarjeta: undefined }));
  };

  // Después de dar formato, el cursor vuelve a quedar justo después del dígito que se estaba escribiendo
  useLayoutEffect(() => {
    if (caretNumero.current === null) return;
    const input = document.getElementById('coTarjeta');
    if (input && document.activeElement === input) {
      let vistos = 0;
      let posicion = 0;
      for (let i = 0; i < input.value.length && vistos < caretNumero.current; i += 1) {
        if (/\d/.test(input.value[i])) vistos += 1;
        posicion = i + 1;
      }
      input.setSelectionRange(posicion, posicion);
    }
    caretNumero.current = null;
  }, [datos.numTarjeta]);

  // Copia un dato de la transferencia al portapapeles (con aviso "¡Copiado!")
  const copiar = async (clave, valor) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(valor);
    } catch (err) { /* sin permiso: igual se muestra el aviso */ }
    setCopiado(clave);
    clearTimeout(timerCopiado.current);
    timerCopiado.current = setTimeout(() => setCopiado(''), 1800);
  };

  const comunas = regionesYComunas.find((r) => r.region === datos.region)?.comunas || [];

  const cambiar = (e) => {
    const { name, value } = e.target;
    // Formato automático mientras se escribe: número de tarjeta, vencimiento, CVV y monto en efectivo
    let valorFormateado = value;
    if (name === 'vencimiento') valorFormateado = formatearVencimiento(value, e.nativeEvent?.inputType?.startsWith('delete'));
    else if (name === 'cvv') valorFormateado = formatearCvv(value, detectarMarca(datos.numTarjeta));
    else if (name === 'pagaCon') valorFormateado = value.replace(/\D/g, '').slice(0, 9);
    setDatos((d) => {
      const nuevos = { ...d, [name]: valorFormateado };
      if (name === 'region') nuevos.comuna = (regionesYComunas.find((r) => r.region === value)?.comunas || [])[0] || '';
      return nuevos;
    });
    if (errores[name]) setErrores((errs) => ({ ...errs, [name]: undefined }));
  };

  // Validación del checkout + monto con el que se pagará en efectivo (opcional, pero no puede ser menor al total)
  const validarTodo = () => {
    const errs = validarCheckout(datos);
    if (datos.metodoPago === 'efectivo' && vuelto.indicado && !vuelto.suficiente) {
      errs.pagaCon = `El monto debe ser al menos ${formatearPrecio(totalPrecio)}`;
    }
    return errs;
  };

  const alSalir = (e) => {
    const { name } = e.target;
    setErrores((errs) => ({ ...errs, [name]: validarTodo()[name] }));
  };

  if (carrito.length === 0) {
    return (
      <section className="container text-center">
        <h1 className="stitle">Tu carrito está vacío</h1>
        <p className="sdesc">Agrega productos para continuar con el pago.</p>
        <Link to="/productos" className="btn-red"><i className="fas fa-utensils"></i>Ver productos</Link>
      </section>
    );
  }

  const pagar = (e) => {
    e.preventDefault();
    if (procesando) return; // evita pagar dos veces con doble clic
    if (!usuario) {
      navigate('/login', { state: { from: { pathname: '/checkout' } }, replace: true });
      return;
    }
    const nuevos = validarTodo();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setAviso('Corrige los campos marcados en rojo para continuar.');
      return;
    }
    setAviso('');
    // El botón "Simular error de pago" fuerza el rechazo con el motivo elegido; los demás pagos los decide la tarjeta
    const resultadoSolicitado = e.nativeEvent?.submitter?.value;
    const pago = simularPago({
      metodoPago: datos.metodoPago,
      numTarjeta: datos.numTarjeta,
      motivo: resultadoSolicitado === 'rechazado' ? motivoSimulado : null
    });
    // El resultado se entrega tras una breve espera, como en una pasarela real
    const finalizarPago = () => {
    const items = carrito.map((i) => ({ codigo: i.codigo || i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, variante: i.variante, factor: factorDeItem(i) }));
    // Con el pago aprobado se descuenta el stock (vitrina primero, luego insumos); si ya no alcanza, no se crea la orden
    let movimientoStock = null;
    if (pago.aprobado) {
      const stock = descontarStock(items);
      recargarCatalogo();
      if (!stock.exito) {
        setProcesando(false);
        setAviso(stock.mensaje + ' Vuelve al carrito para ajustar tu pedido.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      movimientoStock = stock.movimientos;
    }
    const { orden } = crearOrden({
      cliente: datos.nombre.trim(), correo: datos.correo.trim(), telefono: datos.telefono.trim(), run: datos.run.trim(),
      entrega: textoEntrega(datos), tipoEntrega: datos.metodoEntrega, metodoPago: datos.metodoPago, items,
      // Transferencia: queda "Pendiente de pago" hasta que la tienda confirme el depósito
      estado: !pago.aprobado ? 'Pago rechazado' : datos.metodoPago === 'transferencia' ? 'Pendiente de pago' : 'Pendiente',
      datosPago: pago.aprobado
        ? (datos.metodoPago === 'efectivo' && vuelto.indicado ? { pagaCon: Number(datos.pagaCon), vuelto: vuelto.vuelto }
          : datos.metodoPago === 'tarjeta' ? { tipoTarjeta: datos.tipoTarjeta, cuotas: datos.tipoTarjeta === 'credito' ? Number(datos.cuotas) : 1, ultimos4: datos.numTarjeta.replace(/\D/g, '').slice(-4) }
          : {})
        : { motivoRechazo: pago.titulo || pago.motivo, codigoMotivo: pago.codigoMotivo },
      movimientoStock
    });
    if (pago.aprobado) {
      vaciarCarrito();
      navigate(`/compra/exitosa/${orden.id}`);
    } else {
      navigate(`/compra/error/${orden.id}`, { state: { motivo: pago.motivo, codigoMotivo: pago.codigoMotivo } });
    }
    };

    if (configuracionPago.demoraMs > 0) {
      setProcesando(true);
      timerPago.current = setTimeout(finalizarPago, configuracionPago.demoraMs);
    } else {
      finalizarPago();
    }
  };

  return (
    <section>
      <div className="container">
        <Link to="/productos" className="checkout-back">
          <i className="fas fa-arrow-left" aria-hidden="true"></i>
          <span>Volver a la tienda</span>
        </Link>
        <EncabezadoSeccion etiqueta="Proceso de pago" titulo={<>Finalizar <span>compra</span></>} />
        {aviso && <div className="alert alert-danger" role="alert">{aviso}</div>}
        <form noValidate onSubmit={pagar} aria-label="Formulario de pago">
          <div className="row gy-4">
            <div className="col-lg-7">
              <fieldset className="checkout-section p-4 bg-white rounded-4 mb-4">
                <legend className="h5 fw-bold">1. Datos de contacto</legend>
                <div className="row">
                  <div className="col-md-6"><CampoTexto id="coNombre" name="nombre" label="Nombre completo" requerido autoComplete="name" value={datos.nombre} onChange={cambiar} onBlur={alSalir} error={errores.nombre} /></div>
                  <div className="col-md-6"><CampoTexto id="coRun" name="run" label="RUN (sin puntos ni guión)" requerido placeholder="123456785" value={datos.run} onChange={cambiar} onBlur={alSalir} error={errores.run} /></div>
                  <div className="col-md-6"><CampoTexto id="coCorreo" name="correo" type="email" label="Correo electrónico" requerido autoComplete="email" value={datos.correo} onChange={cambiar} onBlur={alSalir} error={errores.correo} /></div>
                  <div className="col-md-6"><CampoTexto id="coTelefono" name="telefono" type="tel" label="Teléfono" requerido placeholder="+56 9 1234 5678" autoComplete="tel" value={datos.telefono} onChange={cambiar} onBlur={alSalir} error={errores.telefono} /></div>
                </div>
              </fieldset>

              <fieldset className="checkout-section p-4 bg-white rounded-4 mb-4">
                <legend className="h5 fw-bold">2. Entrega</legend>
                <div className="d-flex gap-4 mb-3">
                  <label><input type="radio" name="metodoEntrega" value="retiro" checked={datos.metodoEntrega === 'retiro'} onChange={cambiar} /> Retiro en tienda (gratis)</label>
                  <label><input type="radio" name="metodoEntrega" value="despacho" checked={datos.metodoEntrega === 'despacho'} onChange={cambiar} /> Despacho a domicilio</label>
                </div>
                {datos.metodoEntrega === 'despacho' && (
                  <div className="row">
                    <div className="col-md-6">
                      <CampoTexto as="select" id="coRegion" name="region" label="Región" requerido value={datos.region} onChange={cambiar} error={errores.region}>
                        {regionesYComunas.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                      </CampoTexto>
                    </div>
                    <div className="col-md-6">
                      <CampoTexto as="select" id="coComuna" name="comuna" label="Comuna" requerido value={datos.comuna} onChange={cambiar} error={errores.comuna}>
                        {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
                      </CampoTexto>
                    </div>
                    <div className="col-12"><CampoTexto id="coDireccion" name="direccion" label="Dirección de entrega" requerido placeholder="Calle, número, depto / casa" value={datos.direccion} onChange={cambiar} onBlur={alSalir} error={errores.direccion} /></div>
                  </div>
                )}
              </fieldset>

              <fieldset className="checkout-section p-4 bg-white rounded-4">
                <legend className="h5 fw-bold">3. Método de pago</legend>
                <div className="payment-method-cards" role="radiogroup" aria-label="Forma de pago">
                  <label className={`payment-method-card${datos.metodoPago === 'tarjeta' ? ' active' : ''}`}>
                    <input type="radio" name="metodoPago" value="tarjeta" checked={datos.metodoPago === 'tarjeta'} onChange={cambiar} />
                    <i className="fas fa-credit-card" aria-hidden="true"></i>
                    <div><strong>Tarjeta de crédito o débito</strong><span>Visa, Mastercard, Redcompra.</span></div>
                    <i className="fas fa-check-circle payment-method-check" aria-hidden="true"></i>
                  </label>
                  <label className={`payment-method-card${datos.metodoPago === 'transferencia' ? ' active' : ''}`}>
                    <input type="radio" name="metodoPago" value="transferencia" checked={datos.metodoPago === 'transferencia'} onChange={cambiar} />
                    <i className="fas fa-university" aria-hidden="true"></i>
                    <div><strong>Transferencia bancaria</strong><span>Paga desde tu banco.</span></div>
                    <i className="fas fa-check-circle payment-method-check" aria-hidden="true"></i>
                  </label>
                  <label className={`payment-method-card${datos.metodoPago === 'efectivo' ? ' active' : ''}`}>
                    <input type="radio" name="metodoPago" value="efectivo" checked={datos.metodoPago === 'efectivo'} onChange={cambiar} />
                    <i className="fas fa-money-bill-wave" aria-hidden="true"></i>
                    <div><strong>Efectivo contra entrega</strong><span>El total se paga al recibir o retirar el pedido.</span></div>
                    <i className="fas fa-check-circle payment-method-check" aria-hidden="true"></i>
                  </label>
                </div>
                {datos.metodoPago === 'tarjeta' && (
                  <div className="row">
                    <div className="col-12">
                      <div className="tipo-tarjeta" role="radiogroup" aria-label="Tipo de tarjeta">
                        <label className={`tipo-tarjeta-opcion${datos.tipoTarjeta === 'credito' ? ' active' : ''}`}>
                          <input type="radio" name="tipoTarjeta" value="credito" checked={datos.tipoTarjeta === 'credito'} onChange={cambiar} />
                          <i className="fas fa-credit-card" aria-hidden="true"></i> Crédito
                        </label>
                        <label className={`tipo-tarjeta-opcion${datos.tipoTarjeta === 'debito' ? ' active' : ''}`}>
                          <input type="radio" name="tipoTarjeta" value="debito" checked={datos.tipoTarjeta === 'debito'} onChange={cambiar} />
                          <i className="fas fa-money-check-alt" aria-hidden="true"></i> Débito
                        </label>
                      </div>
                      <TarjetaCredito numero={datos.numTarjeta} nombre={datos.nombre} vencimiento={datos.vencimiento} cvv={datos.cvv} marca={marca} tipo={datos.tipoTarjeta} girada={cvvEnfocado} />
                    </div>
                    <div className="col-12"><CampoTexto id="coTarjeta" name="numTarjeta" label={marca ? `Número de tarjeta (${NOMBRES_MARCA[marca]})` : 'Número de tarjeta'} requerido inputMode="numeric" autoComplete="cc-number" placeholder="4532 0151 1283 0366" maxLength={marca === 'amex' ? 17 : 23} value={datos.numTarjeta} onChange={cambiarNumero} onBlur={alSalir} error={errores.numTarjeta} />
                      {modoSimulador && <details className="tarjetas-prueba">
                        <summary>Tarjetas de prueba para simular errores</summary>
                        <ul className="list-unstyled mb-0">
                          {Object.values(MOTIVOS_RECHAZO).map((m) => (
                            <li key={m.tarjeta}><code>{formatearNumeroTarjeta(m.tarjeta)}</code> <span className="text-muted">→ {m.etiqueta}</span></li>
                          ))}
                          <li><code>{formatearNumeroTarjeta('4532015112830366')}</code> <span className="text-muted">→ Pago aprobado</span></li>
                        </ul>
                      </details>}
                    </div>
                    {datos.tipoTarjeta === 'credito' ? (
                      <div className="col-12">
                        <CampoTexto as="select" id="coCuotas" name="cuotas" label="Cuotas" value={datos.cuotas} onChange={cambiar}>
                          {OPCIONES_CUOTAS.map((n) => <option key={n} value={String(n)}>{textoCuotas(n)}</option>)}
                        </CampoTexto>
                      </div>
                    ) : (
                      <div className="col-12"><p className="payment-nota mt-0"><i className="fas fa-bolt me-2" aria-hidden="true"></i>Con tarjeta de débito el monto se descuenta de tu cuenta al instante, en un solo pago.</p></div>
                    )}
                    <div className="col-md-6"><CampoTexto id="coVence" name="vencimiento" label="Vencimiento (MM/AA o MM/AAAA)" requerido placeholder="MM/AAAA" inputMode="numeric" maxLength={7} autoComplete="cc-exp" value={datos.vencimiento} onChange={cambiar} onBlur={alSalir} error={errores.vencimiento} /></div>
                    <div className="col-md-6"><CampoTexto id="coCvv" name="cvv" type="password" label="CVV" requerido inputMode="numeric" placeholder={marca === 'amex' ? '1234' : '123'} autoComplete="cc-csc" value={datos.cvv} onChange={cambiar} onFocus={() => setCvvEnfocado(true)} onBlur={(e) => { setCvvEnfocado(false); alSalir(e); }} error={errores.cvv} /></div>
                  </div>
                )}
                {datos.metodoPago === 'transferencia' && (
                  <div className="payment-info payment-transfer" role="status">
                    <strong><i className="fas fa-info-circle me-2" aria-hidden="true"></i>Datos para transferencia</strong>
                    <ul className="list-unstyled mb-0 mt-2 transfer-datos">
                      {DATOS_TRANSFERENCIA.map((d) => (
                        <li key={d.etiqueta}>
                          <span><span className="text-muted">{d.etiqueta}:</span> {d.valor}</span>
                          <button type="button" className="btn-copiar" onClick={() => copiar(d.etiqueta, d.valor)} aria-label={`Copiar ${d.etiqueta}`}>
                            <i className={`fas ${copiado === d.etiqueta ? 'fa-check' : 'fa-copy'}`} aria-hidden="true"></i> {copiado === d.etiqueta ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="payment-nota mb-0"><i className="fas fa-clock me-2" aria-hidden="true"></i>Tienes {HORAS_PLAZO_TRANSFERENCIA} horas para transferir. Usa tu número de orden como referencia: te lo entregamos al confirmar. Tu pedido quedará <b>pendiente de pago</b> hasta que recibamos el depósito.</p>
                  </div>
                )}
                {datos.metodoPago === 'efectivo' && (
                  <div className="payment-info" role="status">
                    <strong><i className="fas fa-hand-holding-usd me-2" aria-hidden="true"></i>Pago en efectivo</strong>
                    <p>El monto indicado en el resumen se paga al recibir o retirar el pedido. Te recomendamos tener el monto exacto.</p>
                    <CampoTexto id="coPagaCon" name="pagaCon" label="¿Con cuánto pagarás? (opcional)" inputMode="numeric" placeholder={String(totalPrecio)} value={datos.pagaCon} onChange={cambiar} onBlur={alSalir} error={errores.pagaCon} />
                    {vuelto.indicado && vuelto.suficiente && <p className="payment-nota mb-0" data-testid="vuelto"><i className="fas fa-coins me-2" aria-hidden="true"></i>Tu vuelto será de <b>{formatearPrecio(vuelto.vuelto)}</b>.</p>}
                    <p className="payment-nota mb-0 mt-2"><i className="fas fa-ticket-alt me-2" aria-hidden="true"></i>Al confirmar te daremos un código de pedido para mostrar al retirar o al repartidor.</p>
                  </div>
                )}
              </fieldset>
            </div>

            <div className="col-lg-5">
              <aside className="checkout-summary p-4 rounded-4 sticky-top" aria-label="Resumen del pedido">
                <h2 className="h5 fw-bold">Resumen de tu pedido</h2>
                <ul className="list-unstyled">
                  {carrito.map((item) => (
                    <li key={`${item.id}-${item.variante}`} className="d-flex justify-content-between border-bottom py-2">
                      <span>{item.nombre} × {item.cantidad}{item.variante === 'trozo' && <small className="text-muted"> (trozo)</small>}</span>
                      <strong>{formatearPrecio(item.precio * item.cantidad)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="d-flex justify-content-between fs-5 fw-bold my-3"><span>Total a pagar</span><span data-testid="total-checkout">{formatearPrecio(totalPrecio)}</span></div>
                <div className="checkout-pay-actions">
                  <button type="submit" name="resultadoPago" value="aprobado" className="btn-red w-100 justify-content-center" disabled={procesando} aria-busy={procesando}>
                    {procesando ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="fas fa-lock" aria-hidden="true"></i>}
                    {procesando ? 'Procesando pago…' : datos.metodoPago === 'tarjeta' ? `Pagar ${formatearPrecio(totalPrecio)}` : datos.metodoPago === 'transferencia' ? 'Confirmar transferencia' : 'Confirmar pedido en efectivo'}
                  </button>
                  {procesando && <p className="payment-nota mb-0 mt-2" role="status">Estamos procesando tu pago, no cierres esta ventana…</p>}
                  <div className="form-check form-switch checkout-simulador-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="modo-simulador" checked={modoSimulador} onChange={(e) => setModoSimulador(e.target.checked)} />
                    <label className="form-check-label" htmlFor="modo-simulador">Simulador de errores (solo demostración)</label>
                  </div>
                  {modoSimulador && (
                    <div className="checkout-simulador" data-testid="panel-simulador">
                  <label htmlFor="motivo-simulado" className="checkout-motivo-label">Motivo del error simulado</label>
                    <select id="motivo-simulado" className="form-select form-select-sm checkout-motivo" value={motivoSimulado} onChange={(e) => setMotivoSimulado(e.target.value)}>
                      {Object.entries(MOTIVOS_RECHAZO).map(([clave, m]) => <option key={clave} value={clave}>{m.etiqueta}</option>)}
                    </select>
                    <button id="simular-error-pago" type="submit" name="resultadoPago" value="rechazado" className="btn checkout-decline w-100" disabled={procesando}>
                      <i className="fas fa-exclamation-circle me-2" aria-hidden="true"></i>Simular error de pago
                    </button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
