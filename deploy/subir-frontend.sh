#!/usr/bin/env bash
# Compila el frontend y lo publica en el bucket S3 configurado como sitio web estático.
# Hace lo mismo que subir a mano el contenido de dist/ desde la consola de S3, pero siempre igual:
# borra los archivos de la versión anterior y deja configurada la caché del navegador.
# Requiere Node 18+ y AWS CLI configurado (por ejemplo, desde CloudShell en el Learner Lab).
# Uso:   BUCKET=papita-dulce-front-1795462752 ./deploy/subir-frontend.sh      (desde la raíz del proyecto)
set -euo pipefail

: "${BUCKET:?Define BUCKET con el nombre del bucket S3, por ejemplo: BUCKET=papita-frontend ./deploy/subir-frontend.sh}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"

echo ">> Compilando el frontend (usa .env.production) ..."
npm ci
npm run build

echo ">> Subiendo los archivos con nombre único (assets/) con caché de 1 año ..."
aws s3 sync dist/assets "s3://$BUCKET/assets" --delete \
  --cache-control "public,max-age=31536000,immutable"

echo ">> Subiendo index.html y demás archivos sin caché (cambian en cada versión) ..."
aws s3 sync dist "s3://$BUCKET" --delete --exclude "assets/*" \
  --cache-control "no-cache"

echo "Listo: http://$BUCKET.s3-website-us-east-1.amazonaws.com"
