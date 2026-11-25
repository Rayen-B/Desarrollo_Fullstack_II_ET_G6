-- Los productos admiten nombres de hasta 100 caracteres y el detalle de la orden guarda ese nombre
ALTER TABLE orden_detalle MODIFY nombre VARCHAR(100) NOT NULL;
