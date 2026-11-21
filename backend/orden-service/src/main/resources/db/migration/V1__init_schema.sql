CREATE TABLE IF NOT EXISTS ordenes (
    id VARCHAR(20) PRIMARY KEY,
    usuario_id BIGINT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    creada_en DATETIME NOT NULL,
    cliente VARCHAR(120) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL DEFAULT '',
    run VARCHAR(9) NOT NULL DEFAULT '',
    entrega VARCHAR(300) NOT NULL,
    tipo_entrega VARCHAR(10) NOT NULL,
    metodo_pago VARCHAR(15) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    total INT NOT NULL,
    tipo_tarjeta VARCHAR(10) NULL,
    cuotas INT NULL,
    ultimos4 VARCHAR(4) NULL,
    paga_con INT NULL,
    vuelto INT NULL,
    motivo_rechazo VARCHAR(200) NULL,
    codigo_motivo VARCHAR(40) NULL,
    referencia_pago VARCHAR(20) NULL,
    plazo_pago DATETIME NULL,
    codigo_pedido VARCHAR(10) NULL,
    motivo_cancelacion VARCHAR(200) NULL,
    fecha_cancelacion DATETIME NULL,
    movimientos_stock TEXT NULL,
    INDEX idx_orden_usuario (usuario_id),
    INDEX idx_orden_estado (estado)
);

CREATE TABLE IF NOT EXISTS orden_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    orden_id VARCHAR(20) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    precio INT NOT NULL,
    cantidad INT NOT NULL,
    variante VARCHAR(10) NOT NULL DEFAULT 'completa',
    CONSTRAINT fk_detalle_orden FOREIGN KEY (orden_id) REFERENCES ordenes (id) ON DELETE CASCADE
);

-- Órdenes de ejemplo del front (ORDENES_DEFAULT)
INSERT INTO ordenes (id, usuario_id, fecha, hora, creada_en, cliente, correo, telefono, run, entrega, tipo_entrega, metodo_pago, estado, total, motivo_cancelacion, fecha_cancelacion) VALUES
    ('ORD-1001', 2, '2026-06-01', '11:24:00', '2026-06-01 11:24:00', 'Alan Brito Delgado', 'alan.brito@duoc.cl', '+56 9 8765 4321', '', 'Av. España 123, Santiago', 'despacho', 'tarjeta', 'Enviado', 39800, NULL, NULL),
    ('ORD-1002', 3, '2026-06-02', '16:05:00', '2026-06-02 16:05:00', 'Lola Mento Rojas', 'lola.mento@profesor.duoc.cl', '+56 9 7654 3210', '', 'Av. Providencia 456, Providencia', 'despacho', 'transferencia', 'Pendiente', 16900, NULL, NULL),
    ('ORD-1003', 4, '2026-06-02', '10:40:00', '2026-06-02 10:40:00', 'Armando Esteban Quito', 'armando.quito@gmail.com', '+56 9 6543 2109', '', 'Retiro en tienda', 'retiro', 'efectivo', 'Cancelado', 16800, 'Cancelada por la tienda', '2026-06-02 10:40:00'),
    ('ORD-1004', NULL, '2026-06-03', '18:32:00', '2026-06-03 18:32:00', 'Esteban Dido Bravo', 'esteban.dido@duoc.cl', '+56 9 5432 1098', '', 'Retiro en tienda', 'retiro', 'tarjeta', 'Procesando', 37800, NULL, NULL),
    ('ORD-1005', NULL, '2026-06-04', '13:15:00', '2026-06-04 13:15:00', 'Elba Surita Valdés', 'elba.surita@gmail.com', '+56 9 4321 0987', '', 'Los Aromos 789, Ñuñoa', 'despacho', 'tarjeta', 'Enviado', 17500, NULL, NULL);

INSERT INTO orden_detalle (orden_id, codigo, nombre, precio, cantidad, variante) VALUES
    ('ORD-1001', 'TC002', 'Torta Selva Negra', 19900, 2, 'completa'),
    ('ORD-1002', 'TC001', 'Torta Panqueque Naranja', 16900, 1, 'completa'),
    ('ORD-1003', 'TF005', 'Empolvados', 2800, 6, 'completa'),
    ('ORD-1004', 'TL004', 'Torta Trufa', 18900, 2, 'completa'),
    ('ORD-1005', 'TT003', 'Torta Tres Leches', 17500, 1, 'completa');
