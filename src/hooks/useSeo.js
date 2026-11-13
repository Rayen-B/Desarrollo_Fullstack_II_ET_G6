import { useEffect } from 'react';

const TITULO_BASE = 'Papita Dulce - Pastelería y Cafetería artesanal en Santiago';

function fijarMeta(nombre, contenido) {
  let meta = document.querySelector(`meta[name="${nombre}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', nombre);
    document.head.appendChild(meta);
  }
  const anterior = meta.getAttribute('content');
  meta.setAttribute('content', contenido);
  return anterior;
}

// SEO por página: cada ruta define su propio <title>, meta description, URL canónica y, si corresponde, noindex.
export function useSeo({ titulo, descripcion, noindex = false }) {
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = titulo ? `${titulo} | Papita Dulce` : TITULO_BASE;

    const descAnterior = descripcion ? fijarMeta('description', descripcion) : null;
    const robotsAnterior = noindex ? fijarMeta('robots', 'noindex, nofollow') : null;

    let canonical = document.querySelector('link[rel="canonical"]');
    const canonicalAnterior = canonical ? canonical.getAttribute('href') : null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);

    return () => {
      document.title = tituloAnterior;
      if (descripcion && descAnterior !== null) fijarMeta('description', descAnterior);
      if (noindex) {
        if (robotsAnterior !== null) fijarMeta('robots', robotsAnterior);
        else document.querySelector('meta[name="robots"]')?.remove();
      }
      if (canonicalAnterior !== null) canonical.setAttribute('href', canonicalAnterior);
    };
  }, [titulo, descripcion, noindex]);
}
