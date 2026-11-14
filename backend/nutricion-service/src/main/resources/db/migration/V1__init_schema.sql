CREATE TABLE IF NOT EXISTS ingredientes (
    insumo_id VARCHAR(40) PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    nombre_ingles VARCHAR(60) NOT NULL,
    unidad VARCHAR(5) NOT NULL,
    alergenos VARCHAR(200) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS nutricion_producto (
    id_nutricion INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(20) NOT NULL UNIQUE,
    huella_receta VARCHAR(64) NOT NULL,
    calorias DECIMAL(10,1) NOT NULL,
    azucares DECIMAL(10,1) NOT NULL,
    grasas DECIMAL(10,1) NOT NULL,
    proteinas DECIMAL(10,1) NOT NULL,
    carbohidratos DECIMAL(10,1) NOT NULL,
    alergenos VARCHAR(200) NOT NULL DEFAULT '',
    ingredientes_sin_datos VARCHAR(500) NOT NULL DEFAULT '',
    calculado_en DATETIME NOT NULL
);

INSERT INTO ingredientes (insumo_id, nombre, nombre_ingles, unidad, alergenos) VALUES
    ('harina', 'Harina', 'flour', 'g', 'gluten'),
    ('azucar', 'Azúcar', 'sugar', 'g', ''),
    ('huevos', 'Huevos', 'eggs', 'u', 'huevo'),
    ('mantequilla', 'Mantequilla', 'butter', 'g', 'lactosa'),
    ('leche', 'Leche', 'milk', 'ml', 'lactosa'),
    ('crema', 'Crema de leche', 'heavy cream', 'ml', 'lactosa'),
    ('chocolate', 'Chocolate', 'dark chocolate', 'g', ''),
    ('manjar', 'Manjar', 'dulce de leche', 'g', 'lactosa'),
    ('frutillas', 'Frutillas', 'strawberries', 'g', ''),
    ('naranjas', 'Naranjas', 'oranges', 'u', ''),
    ('limones', 'Limones', 'lemons', 'u', ''),
    ('cerezas', 'Cerezas', 'cherries', 'g', ''),
    ('manzanas', 'Manzanas', 'apples', 'u', ''),
    ('arroz', 'Arroz', 'rice', 'g', ''),
    ('canela', 'Canela', 'cinnamon', 'g', ''),
    ('nueces', 'Nueces', 'walnuts', 'g', 'frutos secos'),
    ('claras', 'Claras de huevo', 'egg whites', 'u', 'huevo');
