// Insumos (ingredientes) de la pastelería. unidad: 'g', 'ml' o 'u'
export const INSUMOS_KEY = 'papita_insumos';

export const UNIDADES = [
  { valor: 'g', texto: 'Gramos (g)' },
  { valor: 'ml', texto: 'Mililitros (ml)' },
  { valor: 'u', texto: 'Unidades (u)' }
];

export const INSUMOS_DEFAULT = [
  { id: 'harina', nombre: 'Harina', unidad: 'g', stock: 10000, minimo: 2000 },
  { id: 'azucar', nombre: 'Azúcar', unidad: 'g', stock: 8000, minimo: 1500 },
  { id: 'huevos', nombre: 'Huevos', unidad: 'u', stock: 60, minimo: 12 },
  { id: 'mantequilla', nombre: 'Mantequilla', unidad: 'g', stock: 3000, minimo: 500 },
  { id: 'leche', nombre: 'Leche', unidad: 'ml', stock: 6000, minimo: 1000 },
  { id: 'crema', nombre: 'Crema de leche', unidad: 'ml', stock: 900, minimo: 1000 },
  { id: 'chocolate', nombre: 'Chocolate', unidad: 'g', stock: 2000, minimo: 500 },
  { id: 'manjar', nombre: 'Manjar', unidad: 'g', stock: 3000, minimo: 500 },
  { id: 'frutillas', nombre: 'Frutillas', unidad: 'g', stock: 2000, minimo: 400 },
  { id: 'naranjas', nombre: 'Naranjas', unidad: 'u', stock: 2, minimo: 5 },
  { id: 'limones', nombre: 'Limones', unidad: 'u', stock: 20, minimo: 5 },
  { id: 'cerezas', nombre: 'Cerezas', unidad: 'g', stock: 1000, minimo: 200 },
  { id: 'manzanas', nombre: 'Manzanas', unidad: 'u', stock: 15, minimo: 4 },
  { id: 'arroz', nombre: 'Arroz', unidad: 'g', stock: 2000, minimo: 300 },
  { id: 'canela', nombre: 'Canela', unidad: 'g', stock: 200, minimo: 50 },
  { id: 'nueces', nombre: 'Nueces', unidad: 'g', stock: 100, minimo: 200 },
  { id: 'claras', nombre: 'Claras de huevo', unidad: 'u', stock: 40, minimo: 10 }
];

export function obtenerInsumos() {
  const data = localStorage.getItem(INSUMOS_KEY);
  if (!data) {
    localStorage.setItem(INSUMOS_KEY, JSON.stringify(INSUMOS_DEFAULT));
    return INSUMOS_DEFAULT;
  }
  try {
    const lista = JSON.parse(data);
    return Array.isArray(lista) ? lista : INSUMOS_DEFAULT;
  } catch {
    return INSUMOS_DEFAULT;
  }
}

export function guardarInsumos(insumos) {
  localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
}

export const esInsumoCritico = (insumo) => insumo.stock <= insumo.minimo;

// Muestra una cantidad con su unidad, sin decimales innecesarios: 1500 g, 0,5 u
export function textoCantidad(cantidad, unidad) {
  const valor = Math.round(Number(cantidad || 0) * 100) / 100;
  return `${valor.toLocaleString('es-CL')} ${unidad}`;
}

// Convierte un nombre en id: "Crema de leche" -> "crema-de-leche"
export function crearIdInsumo(nombre) {
  return String(nombre || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function validarNombreInsumo(nombre, insumos, idActual = null) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { valido: false, mensaje: 'El nombre es requerido' };
  if (limpio.length < 3) return { valido: false, mensaje: 'Mínimo 3 caracteres' };
  if (limpio.length > 40) return { valido: false, mensaje: 'Máximo 40 caracteres' };
  const id = crearIdInsumo(limpio);
  if (insumos.some((i) => i.id !== idActual && (i.id === id || i.nombre.toLowerCase() === limpio.toLowerCase()))) {
    return { valido: false, mensaje: 'Ya existe un insumo con ese nombre' };
  }
  return { valido: true, mensaje: 'Nombre válido' };
}

// Cantidad positiva (acepta decimales)
export function validarCantidad(valor, nombreCampo = 'la cantidad') {
  if (valor === '' || valor === null || isNaN(valor)) return { valido: false, mensaje: `Ingresa ${nombreCampo}` };
  if (Number(valor) < 0) return { valido: false, mensaje: 'No puede ser negativo' };
  return { valido: true, mensaje: 'Cantidad válida' };
}
