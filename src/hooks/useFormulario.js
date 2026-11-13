import { useCallback, useEffect, useRef, useState } from 'react';

// Estado, validación y envío de los formularios de reserva y contacto. validar() devuelve { campo: mensaje }
export function useFormulario(valoresIniciales, validar) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const tocados = useRef({});
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const cambiar = useCallback((e) => {
    const { name, value } = e.target;
    setEnviado(false);
    setValores((prev) => {
      const nuevos = { ...prev, [name]: value };
      if (tocados.current[name]) {
        const mensaje = validar(nuevos)[name];
        setErrores((errs) => ({ ...errs, [name]: mensaje }));
      }
      return nuevos;
    });
  }, [validar]);

  const alSalir = useCallback((e) => {
    const { name } = e.target;
    tocados.current[name] = true;
    setErrores((errs) => ({ ...errs, [name]: validar(valoresRef.current)[name] }));
  }, [validar]);

  // copia siempre actualizada de los valores (para validar dentro de onBlur)
  const valoresRef = useRef(valores);
  valoresRef.current = valores;

  const enviar = useCallback((alTerminar) => {
    const nuevosErrores = validar(valoresRef.current);
    setErrores(nuevosErrores);
    Object.keys(valoresRef.current).forEach((campo) => { tocados.current[campo] = true; });
    if (Object.values(nuevosErrores).some(Boolean)) return false;
    setEnviando(true);
    timer.current = setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setValores(valoresIniciales);
      tocados.current = {};
      if (alTerminar) alTerminar();
    }, 1500);
    return true;
  }, [validar, valoresIniciales]);

  const alEnviar = useCallback((alTerminar) => (e) => {
    if (e && e.preventDefault) e.preventDefault();
    enviar(alTerminar);
  }, [enviar]);

  return { valores, errores, enviando, enviado, cambiar, alSalir, enviar, alEnviar };
}
