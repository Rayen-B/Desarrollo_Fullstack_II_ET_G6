import React from 'react';

export default function Entregas() {
  return (
    <section id="entregas" className="delivery-section" aria-labelledby="tituloEntregas">
      <div className="container">
        <div className="text-center mb-5">
          <span className="slbl">Recibe tu pedido</span>
          <h2 className="stitle" id="tituloEntregas">Opciones de <span>entrega</span></h2>
          <div className="sline"></div>
          <p className="sdesc mx-auto max-w-480">Elige la alternativa que mejor te acomode al finalizar tu pedido.</p>
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-md-6 col-lg-5">
            <article className="delivery-card h-100">
              <span className="delivery-icon"><i className="fas fa-store" aria-hidden="true"></i></span>
              <h3>Retiro en tienda</h3>
              <p>Selecciona “Retiro en tienda” en el checkout para coordinar la entrega de tu pedido con nuestro equipo.</p>
            </article>
          </div>
          <div className="col-md-6 col-lg-5">
            <article className="delivery-card h-100">
              <span className="delivery-icon"><i className="fas fa-truck" aria-hidden="true"></i></span>
              <h3>Despacho a domicilio</h3>
              <p>Elige “Despacho a domicilio” e ingresa tu región, comuna y dirección. La cobertura y el costo del despacho se confirman con la pastelería.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
