import React from 'react';
import { Badge } from 'react-bootstrap';

export default function InsigniaEstado({ estado, stock, stockCritico }) {
  if (stock !== undefined) {
    if (stock <= 0) return <Badge bg="danger">Agotado</Badge>;
    if (stockCritico !== undefined && stock <= stockCritico) return <Badge bg="warning" text="dark">Stock Crítico ({stock})</Badge>;
    return <Badge bg="success">En Stock ({stock})</Badge>;
  }

  switch (estado) {
    case 'Administrador':
      return <Badge bg="danger">Administrador</Badge>;
    case 'Vendedor':
      return <Badge bg="primary">Vendedor</Badge>;
    case 'Cliente':
      return <Badge bg="info">Cliente</Badge>;
    case 'Completado':
      return <Badge bg="success">Completado</Badge>;
    case 'Pendiente':
      return <Badge bg="warning" text="dark">Pendiente</Badge>;
    case 'Pendiente de pago':
      return <Badge bg="warning" text="dark">Pendiente de pago</Badge>;
    case 'Cancelado':
      return <Badge bg="secondary">Cancelado</Badge>;
    default:
      return <Badge bg="secondary">{estado}</Badge>;
  }
}
