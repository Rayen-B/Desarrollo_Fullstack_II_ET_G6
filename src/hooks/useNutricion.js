import { useEffect, useState } from 'react';
import { obtenerNutricion } from '../services/nutricion';

// Carga la información nutricional guardada de un producto.
// Devuelve { cargando, datos, error }. Si codigo es null/vacío no consulta nada.
// Un error (incluido 404 "aún sin calcular") nunca rompe la tienda: la vista simplemente no muestra el bloque.
export function useNutricion(codigo) {
  const [estado, setEstado] = useState({ cargando: Boolean(codigo), datos: null, error: null });

  useEffect(() => {
    if (!codigo) {
      setEstado({ cargando: false, datos: null, error: null });
      return undefined;
    }
    let activo = true;
    setEstado({ cargando: true, datos: null, error: null });
    obtenerNutricion(codigo)
      .then((datos) => { if (activo) setEstado({ cargando: false, datos, error: null }); })
      .catch((error) => { if (activo) setEstado({ cargando: false, datos: null, error }); });
    return () => { activo = false; };
  }, [codigo]);

  return estado;
}
