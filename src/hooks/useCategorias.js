import { useState } from 'react';
import { obtenerCategorias } from '../services/categorias';

// Lee las categorías guardadas al montar el componente
export function useCategorias() {
  const [categorias] = useState(obtenerCategorias);
  return categorias;
}
