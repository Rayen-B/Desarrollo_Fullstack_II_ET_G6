// Categorías de productos (tienda y panel admin). id: se usa en las URLs de la tienda (/categorias/tortas)
export const CATEGORIAS_KEY = 'papita_dulce_categorias';

export const CATEGORIAS_DEFAULT = [
  { id: 'tortas', nombre: 'Tortas', descripcion: 'Tortas caseras para celebrar, completas o por trozo.', imagen: 'menu/Torta_Panqueque_Naranja' },
  { id: 'bebestibles', nombre: 'Bebestibles', descripcion: 'Jugos naturales, limonadas y café helado.', imagen: 'menu/Bebestibles' },
  { id: 'infusiones', nombre: 'Infusiones', descripcion: 'Tés e infusiones calientes para acompañar tu postre.', imagen: 'menu/Bebestible8' },
  { id: 'sandwiches', nombre: 'Sándwiches', descripcion: 'Pan artesanal con ingredientes frescos.', imagen: 'menu/Sandwich1' },
  { id: 'tartaletas', nombre: 'Tartaletas', descripcion: 'Masa quebrada con cremas y frutas de temporada.', imagen: 'menu/tartaleta1' },
  { id: 'postres', nombre: 'Postres', descripcion: 'Postres y galletas hechos al estilo casero.', imagen: 'menu/postre1' }
];

export function obtenerCategorias() {
  const data = localStorage.getItem(CATEGORIAS_KEY);
  if (!data) {
    localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(CATEGORIAS_DEFAULT));
    return CATEGORIAS_DEFAULT;
  }
  try {
    const lista = JSON.parse(data);
    return Array.isArray(lista) && lista.length ? lista : CATEGORIAS_DEFAULT;
  } catch {
    return CATEGORIAS_DEFAULT;
  }
}

export function guardarCategorias(categorias) {
  localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(categorias));
}

// Convierte un nombre en un id sin tildes ni espacios: "Sin Azúcar" -> "sin-azucar"
export function crearIdCategoria(nombre) {
  return String(nombre || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Busca la categoría de un producto a partir del nombre guardado en el producto
export function categoriaDeProducto(nombreCategoria, categorias) {
  const buscado = String(nombreCategoria || '').trim().toLowerCase();
  return categorias.find((c) => c.nombre.toLowerCase() === buscado || c.id === crearIdCategoria(nombreCategoria)) || null;
}

// Validación del nombre de una categoría (requerido, 3 a 30 caracteres y sin repetir)
export function validarNombreCategoria(nombre, categorias, idActual = null) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { valido: false, mensaje: 'El nombre es requerido' };
  if (limpio.length < 3) return { valido: false, mensaje: 'Mínimo 3 caracteres' };
  if (limpio.length > 30) return { valido: false, mensaje: 'Máximo 30 caracteres' };
  const id = crearIdCategoria(limpio);
  const repetida = categorias.some((c) => c.id !== idActual && (c.id === id || c.nombre.toLowerCase() === limpio.toLowerCase()));
  if (repetida) return { valido: false, mensaje: 'Ya existe una categoría con ese nombre' };
  return { valido: true, mensaje: 'Nombre válido' };
}
