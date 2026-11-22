import React from 'react';
import { Card } from 'react-bootstrap';
import { useNutricion } from '../../hooks/useNutricion';
import { NUTRIENTES, formatearNutriente, capitalizar } from '../../utils/nutricion';

// Tarjeta "Información nutricional" con alérgenos.
//  - Con `codigo`: la pide al servidor de nutrición. Si no hay datos o el servidor falla, no muestra nada
//    (la tienda sigue funcionando igual sin el backend).
//  - Con `datos`: muestra directamente ese resultado (lo usa el panel de administración).
// usarTrozo: muestra el valor de un trozo (1/4) en vez de la unidad completa.
export default function InfoNutricional({ codigo, datos: datosProp = null, usarTrozo = false }) {
  const remoto = useNutricion(datosProp ? null : codigo);
  const datos = datosProp || remoto.datos;

  if (!datosProp && remoto.cargando) {
    return (
      <p className="small text-muted mt-4 mb-0" role="status">
        <i className="fas fa-spinner fa-spin me-1"></i> Cargando información nutricional…
      </p>
    );
  }

  const nutrientes = datos && (usarTrozo ? datos.porTrozo : datos.total);
  if (!nutrientes) return null;

  const alergenos = datos.alergenos || [];
  const incompleta = (datos.ingredientesSinDatos || []).length > 0;

  return (
    <Card id="info-nutricional" className="border-0 rounded-4 p-4 mt-4" style={{ background: '#fff6ef', border: '1px solid #fae7da' }}>
      <h2 className="h6 fw-bold mb-1" style={{ color: '#894530' }}>
        <i className="fas fa-leaf me-2"></i>Información nutricional
      </h2>
      <p className="small text-muted mb-3">{usarTrozo ? 'Por trozo (1/4 de la torta)' : 'Por unidad completa'}</p>

      <table className="table table-sm mb-3" style={{ '--bs-table-bg': 'transparent' }}>
        <tbody>
          {NUTRIENTES.map((n) => (
            <tr key={n.clave}>
              <th scope="row" className="fw-normal">{n.etiqueta}</th>
              <td className="text-end fw-bold">{formatearNutriente(nutrientes[n.clave])} {n.unidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-2" id="alergenos-producto">
        <span className="small fw-bold me-2">Alérgenos:</span>
        {alergenos.length > 0
          ? alergenos.map((a) => (
            <span key={a} className="badge rounded-pill me-1" style={{ background: '#894530' }}>{capitalizar(a)}</span>
          ))
          : <span className="small text-muted">ninguno registrado</span>}
      </div>

      <p className="small text-muted mb-0">
        Valores aproximados, calculados a partir de la receta.{incompleta && ' La estimación puede estar incompleta: faltan datos de algunos ingredientes.'}
      </p>
    </Card>
  );
}
