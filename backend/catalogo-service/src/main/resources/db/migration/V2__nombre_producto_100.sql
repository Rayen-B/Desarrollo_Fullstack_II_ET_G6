-- La pauta permite nombres de producto de hasta 100 caracteres
ALTER TABLE productos MODIFY nombre VARCHAR(100) NOT NULL;
