import React from 'react';

const HITOS = [
  { anio: '2019', titulo: 'Nacimiento de Papita Dulce', texto: 'Nacemos como un concepto de cafetería y pastelería artesanal gatuna, fusionando la calidez de recetas tradicionales con una estética urbana. En poco tiempo logramos posicionarnos como el lugar favorito de la ciudad para disfrutar de ciabattas gourmet y postres de autor.' },
  { anio: '2021', titulo: 'Consolidación de la Carta', texto: 'Lanzamos nuestra icónica Torta Papita Amor y las tartaletas artesanales, creando una comunidad fiel alrededor del concepto artesanal dulce y salado.' },
  { anio: '2024', titulo: 'Transformación del Espacio', texto: 'Transformamos nuestro espacio para ofrecer una experiencia más moderna y acogedora, manteniendo la esencia de nuestra marca.' },
  { anio: '2025', titulo: 'Plataforma Web y E-Commerce', texto: 'Conectamos el local físico con nuestro sitio web, integrando pedidos personalizados, sistema de reservas y beneficios exclusivos a través del Club Papita.' },
  { anio: '2026', titulo: 'Expansión Nacional', texto: 'Actualmente operamos en 5 comunas a través de Chile  con una plataforma de entrega online que maneja más de 10,000 pedidos a la semana y sigue creciendo cada día.' }
];

// Línea de tiempo: los hitos se alternan a la izquierda y a la derecha
export default function Historia() {
  return (
    <section id="history">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl">Nuestra trayectoria</span>
          <h2 className="stitle">Una historia de <span>Pastelería</span></h2>
          <div className="sline"></div>
          <p className="sdesc mx-auto max-w-480">Desde la primera receta hasta ser el refugio dulce favorito de la ciudad: una historia escrita a puras huellitas y pasión.</p>
        </div>
        <div className="timeline" data-aos="fade-up">
          {HITOS.map((h, i) => {
            const contenido = <><div className="tlyear">{h.anio}</div><h5>{h.titulo}</h5><p>{h.texto}</p></>;
            const izquierda = i % 2 === 0;
            return (
              <div className="tli" key={h.anio}>
                <div className="tl-left">{izquierda && contenido}</div>
                <div className="tl-center"><div className="tldot"></div></div>
                <div className="tl-right">{!izquierda && contenido}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
