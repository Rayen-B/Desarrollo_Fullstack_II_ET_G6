// Utilidades de la información nutricional (puras, sin llamadas al servidor)

export const NUTRIENTES = [
  { clave: 'calorias', etiqueta: 'Calorías', unidad: 'kcal' },
  { clave: 'carbohidratos', etiqueta: 'Carbohidratos', unidad: 'g' },
  { clave: 'azucares', etiqueta: 'Azúcares', unidad: 'g' },
  { clave: 'grasas', etiqueta: 'Grasas', unidad: 'g' },
  { clave: 'proteinas', etiqueta: 'Proteínas', unidad: 'g' }
];

// Alérgenos que se pueden marcar en un insumo (el backend admite minúsculas, tildes y espacios)
export const ALERGENOS = ['gluten', 'lactosa', 'huevo', 'frutos secos', 'maní', 'soya', 'pescado', 'mariscos'];

// 1234.56 -> "1.234,6" ; sin dato -> "—"
export function formatearNutriente(valor) {
  if (valor === null || valor === undefined || valor === '' || isNaN(valor)) return '—';
  return Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 1 });
}

export const capitalizar = (texto) => {
  const t = String(texto || '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Nombre en inglés del insumo (opcional). Mismas reglas que el backend: letras sin tildes y espacios, 2 a 60.
export function validarNombreIngles(valor) {
  const limpio = String(valor || '').trim();
  if (!limpio) return { valido: true, mensaje: '' };
  if (!/^[A-Za-z ]{2,60}$/.test(limpio)) return { valido: false, mensaje: 'Solo letras sin tildes ni números, y espacios (2 a 60)' };
  return { valido: true, mensaje: 'Nombre válido' };
}

// Filas de receta del formulario -> formato del backend [{ insumoId, cantidad }]
export const recetaParaApi = (receta) => (receta || [])
  .filter((f) => f.insumoId && Number(f.cantidad) > 0)
  .map((f) => ({ insumoId: f.insumoId, cantidad: Number(f.cantidad) }));

// Texto claro para mostrar al administrador cuando falla una llamada de nutrición
export function describirErrorNutricion(error) {
  const status = error && error.status;
  const mensaje = (error && error.message) || 'Error desconocido';
  if (status === 0) return 'No se pudo conectar con el servidor de nutrición. Revisa que el backend esté levantado.';
  if (status === 401) return 'Esta función necesita una sesión del servidor. Inicia sesión con una cuenta del servidor (modo servidor: VITE_MODO_SERVIDOR=true).';
  if (status === 403) return 'Tu rol no tiene permiso para esta acción.';
  if (status === 400 && /nombre en inglés/i.test(mensaje)) return `${mensaje}. Complétalo en Insumos → editar insumo → Datos nutricionales.`;
  return mensaje;
}
