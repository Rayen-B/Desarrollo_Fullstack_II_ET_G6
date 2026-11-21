CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run VARCHAR(9) NULL UNIQUE,
    usuario VARCHAR(30) NULL UNIQUE,
    nombre VARCHAR(60) NOT NULL,
    apellidos VARCHAR(100) NOT NULL DEFAULT '',
    correo VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NULL,
    region VARCHAR(80) NOT NULL DEFAULT '',
    comuna VARCHAR(80) NOT NULL DEFAULT '',
    direccion VARCHAR(300) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    expira_en DATETIME NOT NULL,
    revocado BIT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_refresh_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- Usuarios de prueba del front. Contraseñas guardadas con BCrypt: admin / Admin@2026 / Ventas#2026 / Cliente!2026
INSERT INTO usuarios (run, usuario, nombre, apellidos, correo, password_hash, rol, region, comuna, direccion) VALUES
    ('111111111', 'admin', 'Admin', 'Papita Dulce', 'admin@papitadulce.cl', '$2a$10$rgn3H.QgSVx2VEQkdvgdFeBlpLuMpA.PqtH9sX51YJ9d4wYRHDxaO', 'Administrador', 'Región Metropolitana de Santiago', 'Santiago', 'Av. Papita Dulce 100'),
    ('190110222', NULL, 'Alan', 'Brito Delgado', 'alan.brito@duoc.cl', '$2a$10$Skrhl8HpeMlYJ5DKfASesuDTP.RAbdQWzf7KOivSY.a1JI7.yVR1u', 'Administrador', 'Región Metropolitana de Santiago', 'Santiago', 'Av. España 123'),
    ('184561239', NULL, 'Lola', 'Mento Rojas', 'lola.mento@profesor.duoc.cl', '$2a$10$n.7QC2U9CPfZGvU0FsRC0On/J/5ABqiDoq0VYPeewM5tioUkkz5r6', 'Vendedor', 'Región Metropolitana de Santiago', 'Providencia', 'Av. Providencia 456'),
    ('201239877', NULL, 'Armando', 'Esteban Quito', 'armando.quito@gmail.com', '$2a$10$EeBfC29FVf0ek/NZtbSqdeNqXgD/wZS7K8eD6brPpszbEy/6cfq6y', 'Cliente', 'Región del Biobío', 'Concepción', 'Calle Prat 789');
