#!/usr/bin/env bash
# Prepara un EC2 con Ubuntu 24.04 para correr el backend de Papita Dulce con systemd.
# Copia antes la carpeta backend/deploy (con jars/ ya compilada) al EC2 y ejecuta:
#     sudo bash ec2-install.sh             # instala Java, MySQL, crea las bases y deja los servicios listos
#     sudo bash ec2-install.sh --iniciar   # además los arranca en orden (cuando papita.env esté completo)
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Ejecuta con sudo:  sudo bash ec2-install.sh"; exit 1; }
AQUI="$(cd "$(dirname "$0")" && pwd)"
ENV=/etc/papita/papita.env
SERVICIOS="papita-eureka papita-usuario papita-catalogo papita-nutricion papita-orden papita-gateway"

echo ">> Instalando Java 21 y MySQL ..."
apt-get update -y
apt-get install -y openjdk-21-jre-headless mysql-server curl openssl
systemctl enable --now mysql

echo ">> Creando el usuario de servicio 'papita' y las carpetas ..."
id papita >/dev/null 2>&1 || useradd --system --home-dir /opt/papita --shell /usr/sbin/nologin papita
install -d -o papita -g papita /opt/papita /var/lib/papita /var/lib/papita/media
install -d -m 750 -o root -g papita /etc/papita

if [ ! -f "$ENV" ]; then
  echo ">> Creando $ENV con un JWT_SECRET y una clave de MySQL nuevos ..."
  install -m 640 -o root -g papita "$AQUI/papita.env.example" "$ENV"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')|" "$ENV"
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 20)|" "$ENV"
fi

echo ">> Creando las bases y el usuario de MySQL ..."
DB_PASSWORD="$(grep '^DB_PASSWORD=' "$ENV" | cut -d= -f2-)"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS db_papita_usuarios CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS db_catalogo CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS db_papita_ordenes CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS db_nutricion CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'papita'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER 'papita'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON db_papita_usuarios.* TO 'papita'@'localhost';
GRANT ALL PRIVILEGES ON db_catalogo.* TO 'papita'@'localhost';
GRANT ALL PRIVILEGES ON db_papita_ordenes.* TO 'papita'@'localhost';
GRANT ALL PRIVILEGES ON db_nutricion.* TO 'papita'@'localhost';
FLUSH PRIVILEGES;
SQL

if ls "$AQUI"/jars/*.jar >/dev/null 2>&1; then
  echo ">> Copiando los .jar a /opt/papita ..."
  install -m 640 -o papita -g papita "$AQUI"/jars/*.jar /opt/papita/
else
  echo "   (No hay jars en $AQUI/jars: compílalos con build-jars.ps1 y vuelve a copiar la carpeta)"
fi

echo ">> Instalando los servicios de systemd ..."
install -m 644 "$AQUI"/systemd/papita-*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable $SERVICIOS

esperar() { # esperar <url> <segundos>
  for _ in $(seq 1 "$2"); do curl -fs "$1" >/dev/null 2>&1 && return 0; sleep 2; done
  echo "   (aviso: $1 no respondió a tiempo, revisa los logs)"
}

if [ "${1:-}" = "--iniciar" ]; then
  grep -q '^SPOONACULAR_API_KEY=.\+' "$ENV" || echo "   (aviso: SPOONACULAR_API_KEY está vacía: Nutrición no podrá calcular)"
  echo ">> Iniciando Eureka ..."
  systemctl restart papita-eureka
  esperar http://127.0.0.1:8761/ 60
  echo ">> Iniciando Usuarios, Catálogo y Nutrición ..."
  systemctl restart papita-usuario papita-catalogo papita-nutricion
  esperar http://127.0.0.1:8082/api/v1/categorias 90
  echo ">> Iniciando Órdenes y el Gateway ..."
  systemctl restart papita-orden papita-gateway
  esperar http://127.0.0.1:8080/api/v1/categorias 90
  echo
  systemctl --no-pager --lines=0 status $SERVICIOS | grep -E "papita-|Active:"
  echo "   Logs en vivo:  sudo journalctl -u papita-gateway -f"
else
  echo
  echo "Instalado. Completa SPOONACULAR_API_KEY y FRONTEND_URL con:  sudo nano $ENV"
  echo "Después arranca todo con:  sudo bash ec2-install.sh --iniciar"
fi
