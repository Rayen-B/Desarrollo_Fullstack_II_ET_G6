#!/usr/bin/env bash
# Compila el frontend y lo publica en S3 (y, si indicas la distribución, invalida la caché de CloudFront).
# Requiere Node 18+ y AWS CLI configurado (en Learner Lab: copia las credenciales desde "AWS Details").
# Uso:   BUCKET=mi-bucket [DISTRIBUCION=E1ABCDEF123456] ./deploy/subir-frontend.sh      (desde la raíz del proyecto)
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

if [ -n "${DISTRIBUCION:-}" ]; then
  echo ">> Invalidando la caché de CloudFront ..."
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUCION" --paths "/index.html" "/" >/dev/null
fi
echo "Listo."
