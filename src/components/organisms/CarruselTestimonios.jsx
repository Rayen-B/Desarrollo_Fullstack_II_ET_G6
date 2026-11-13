import React, { useEffect, useRef } from 'react';
import Swiper from 'swiper';
import { A11y, Autoplay, Pagination } from 'swiper/modules';
import images from '../../assets/images';

export const TESTIMONIOS = [
  {
    nombre: 'Aitor Tilla',
    rol: 'Cliente frecuente',
    avatar: images['testimonial/testimonio4'],
    texto: 'Sinceramente, son las mejores tartaletas de frutilla que he probado nunca. La "Garritas de frutilla" es increíble: los bordes están perfectamente crujientes, el interior es un abrazo reconfortante directo a tu corazon… ¡y esas frutillas tan frescas! Ahora venimos todos los viernes.'
  },
  {
    nombre: 'Peter Parker',
    rol: 'Bloguero',
    avatar: images['testimonial/testimonio5'],
    texto: 'Pedí a domicilio y mi sándwich junto a mi café llegó caliente y recién hecho en 20 minutos. Totalmente increíble. Papita Dulce se ha convertido, sin lugar a dudas, en mi sitio favorito para comer comida casera.'
  },
  {
    nombre: 'Marcia Ana',
    rol: 'Apasionados de los postres',
    avatar: images['testimonial/testimonio1'],
    texto: 'El arroz con leche fue un abrazo directo a mi corazon me dejó alucinado. No esperaba esa calidad en un local . El ambiente es estupendo y el personal, muy amable. ¡Lo recomiendo encarecidamente!'
  },
  {
    nombre: 'Elvis Cocho',
    rol: 'Cliente empresarial',
    avatar: images['testimonial/testimonio3'],
    texto: 'Se encargaron del catering de nuestra fiesta de oficina para 50 personas y todo salió a la perfección. La comida estaba fresca, deliciosa, llegó a tiempo y tenía una presentación impecable. ¡La torta papita dulce fue toda una estrella para este evento!'
  }
];

export default function CarruselTestimonios({ testimonios = TESTIMONIOS }) {
  const swiperRef = useRef(null);
  const paginacionRef = useRef(null);

  useEffect(() => {
    const swiper = new Swiper(swiperRef.current, {
      modules: [A11y, Autoplay, Pagination],
      slidesPerView: 1,
      spaceBetween: 22,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: paginacionRef.current, clickable: true },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
    return () => swiper.destroy(true, true);
  }, []);

  return (
    <section id="testimonials">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="slbl">Lo que dicen las personas</span>
          <h2 className="stitle">Nuestros clientes <span>Opinión</span></h2>
          <div className="sline"></div>
        </div>
        <div className="swiper tesSwiper" data-aos="fade-up" ref={swiperRef}>
          <div className="swiper-wrapper">
            {testimonios.map((t) => (
              <div className="swiper-slide" key={t.nombre}>
                <div className="tescard">
                  <div className="tesq">"</div>
                  <div className="tess"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                  <p className="testxt">{t.texto}</p>
                  <div className="tesauth">
                    <img src={t.avatar} alt="" />
                    <div>
                      <div className="tesnm">{t.nombre}</div>
                      <div className="tesrl">{t.rol}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-pagination mt-4 swiper-pagination-static" ref={paginacionRef}></div>
        </div>
      </div>
    </section>
  );
}
