import React, { useEffect, useState } from 'react';
import { useOverlay } from '../../hooks/useOverlay';

// Lightbox para ver una imagen en grande (usa los estilos de magnific-popup.css)
export default function LightboxImagen({ src, abierto, onCerrar }) {
  const [listo, setListo] = useState(false);
  useOverlay(abierto, onCerrar);

  // mfp-ready se agrega un instante después para que se vea la animación de entrada
  useEffect(() => {
    if (!abierto) {
      setListo(false);
      return undefined;
    }
    const t = setTimeout(() => setListo(true), 16);
    return () => clearTimeout(t);
  }, [abierto]);

  if (!abierto) return null;
  const estado = listo ? ' mfp-ready' : '';

  return (
    <>
      <div className={`mfp-bg mfp-fade${estado}`}></div>
      <div className={`mfp-wrap mfp-close-btn-in mfp-auto-cursor mfp-fade${estado}`} tabIndex={-1} style={{ overflow: 'hidden auto' }} onClick={onCerrar}>
        <div className="mfp-container mfp-s-ready mfp-image-holder">
          <div className="mfp-content">
            <div className="mfp-figure">
              <button title="Close (Esc)" type="button" className="mfp-close" onClick={onCerrar}>×</button>
              <figure>
                <img className="mfp-img" alt="" src={src} style={{ maxHeight: 'calc(100vh - 80px)' }} />
                <figcaption>
                  <div className="mfp-bottom-bar">
                    <div className="mfp-title"></div>
                    <div className="mfp-counter"></div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
          <div className="mfp-preloader">Loading...</div>
        </div>
      </div>
    </>
  );
}
