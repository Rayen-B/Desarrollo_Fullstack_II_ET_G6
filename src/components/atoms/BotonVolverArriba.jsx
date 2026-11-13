import React, { useEffect, useState } from 'react';

// Botón flotante volver arriba
export default function BotonVolverArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button id="btt" className={visible ? 'show' : ''} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <i className="fas fa-chevron-up"></i>
    </button>
  );
}
