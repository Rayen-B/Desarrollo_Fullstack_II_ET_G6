import { useEffect } from 'react';

// Mientras el panel está abierto bloquea el scroll del body y lo cierra con Escape
export function useOverlay(abierto, cerrar) {
  useEffect(() => {
    if (!abierto) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [abierto, cerrar]);
}
