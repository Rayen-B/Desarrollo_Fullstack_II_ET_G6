// Servicio de nutrición: habla con nutricion-service a través del API Gateway.
import { http } from './api';

const BASE = '/api/v1/nutricion';
// Calcular consulta a Spoonacular, que puede tardar más que una lectura normal
const TIMEOUT_CALCULO_MS = 40000;

// Último cálculo guardado de un producto. Lanza ApiError 404 si aún no se calculó.
export const obtenerNutricion = (codigo) =>
  http(`${BASE}/productos/${encodeURIComponent(codigo)}`);

// Calcula (o recalcula con forzar=true) la nutrición de UNA unidad completa del producto.
// receta: [{ insumoId, cantidad }]
export const calcularNutricion = (codigo, receta, forzar = false) =>
  http(`${BASE}/productos/${encodeURIComponent(codigo)}?forzar=${forzar ? 'true' : 'false'}`, {
    method: 'POST',
    body: { items: receta },
    timeoutMs: TIMEOUT_CALCULO_MS
  });

// Ingredientes registrados en el backend: [{ insumoId, nombre, nombreIngles, unidad, alergenos }]
export const listarIngredientes = () => http(`${BASE}/ingredientes`);

// Crea o actualiza los datos nutricionales de un insumo
export const guardarIngrediente = (insumoId, datos) =>
  http(`${BASE}/ingredientes/${encodeURIComponent(insumoId)}`, { method: 'PUT', body: datos });
