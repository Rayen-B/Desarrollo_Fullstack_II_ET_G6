import { useLayoutEffect } from 'react';

// Aplica una hoja de estilos solo mientras el componente está montado (se inserta antes de pintar)
export function useEstilos(css, nombre) {
  useLayoutEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-estilos', nombre);
    style.textContent = css;
    document.head.appendChild(style);
    return () => style.remove();
  }, [css, nombre]);
}
