# Despliegue en AWS (Learner Lab): EC2 + MySQL + S3 + CloudFront

```
Navegador ──https──► CloudFront ──── /*      ──► S3 (front React, privado)
                          │
                          └────────── /api/*  ──► EC2 Ubuntu 24.04 (Elastic IP), puerto 8080
                                                   ├─ api-gateway       :8080  único puerto abierto, valida el JWT
                                                   ├─ eureka-server     :8761  solo 127.0.0.1
                                                   ├─ usuario-service   :8081  solo 127.0.0.1
                                                   ├─ catalogo-service  :8082  solo 127.0.0.1  (fotos en /var/lib/papita/media)
                                                   ├─ orden-service     :8083  solo 127.0.0.1  (llama a Catálogo por Eureka)
                                                   ├─ nutricion-service :8084  solo 127.0.0.1  (llama a Spoonacular)
                                                   └─ MySQL             :3306  solo 127.0.0.1
Swagger de las 4 APIs:  http://<DNS-del-EC2>:8080/swagger-ui.html
```

- El front y el API comparten el dominio de CloudFront: no hay problemas de CORS ni de HTTPS mezclado.
- Los microservicios y MySQL solo escuchan dentro de la máquina: nadie puede saltarse el Gateway.
- Cada servicio es un `.jar` manejado por systemd: se reinicia solo si se cae y arranca al prender el EC2.

Archivos que se usan: `backend/deploy/` (scripts, systemd, variables) y `deploy/cloudfront-rutas-spa.js`.

---

## 0. En tu PC: compilar los .jar y el front

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File deploy\build-jars.ps1
```
Deja los 6 `.jar` en `backend\deploy\jars` (esa carpeta no se sube a GitHub).

```powershell
npm run build
```
Deja el front en `dist\`. Usa `.env.production`: modo servidor y el API en el mismo dominio.

## 1. Learner Lab

1. **Start Lab** y espera el punto verde. Entra con **AWS**.
2. En **AWS Details** → **Download PEM** (`labsuser.pem`). Guárdala fuera del proyecto.
3. Región: **us-east-1 (N. Virginia)**.

## 2. EC2

1. **EC2 → Launch instance**
   - Nombre: `papita-backend`
   - Imagen: **Ubuntu Server 24.04 LTS**
   - Tipo: **t3.medium** (6 procesos Java + MySQL necesitan ~3 GB)
   - Key pair: **vockey**
   - Disco: **20 GB** gp3
2. **Security group** (reglas de entrada):
   - `SSH 22`: **My IP**
   - `Custom TCP 8080`: **0.0.0.0/0** (CloudFront llega aquí; el Gateway valida el JWT en cada llamada)
   - Nada más: no abras 3306, 8761 ni 8081-8084.
3. **Elastic IP**: EC2 → Elastic IPs → Allocate → Associate a `papita-backend`.
   Sin ella la IP y el DNS cambian cada vez que se reinicia el laboratorio.
4. Anota el **Public IPv4 DNS** (`ec2-X-X-X-X.compute-1.amazonaws.com`).

## 3. Subir el backend al EC2 (desde tu PC)

```powershell
scp -i C:\ruta\labsuser.pem -r backend\deploy ubuntu@TU-DNS:~/deploy
```
Si dice "permissions too open", en PowerShell:
`icacls C:\ruta\labsuser.pem /inheritance:r /grant:r "$($env:USERNAME):R"`

## 4. Instalar en el EC2

```powershell
ssh -i C:\ruta\labsuser.pem ubuntu@TU-DNS
```
Dentro del EC2:
```bash
cd ~/deploy
sudo bash ec2-install.sh
```
Instala Java 21 y MySQL, crea las 4 bases, el usuario `papita` y genera solo el `JWT_SECRET` y la clave de MySQL.

Completa las dos variables que faltan:
```bash
sudo nano /etc/papita/papita.env
```
- `SPOONACULAR_API_KEY=` tu clave
- `FRONTEND_URL=` déjala así por ahora; la cambias en el paso 6 con el dominio de CloudFront

Guardar en nano: `Ctrl+O`, `Enter`, `Ctrl+X`. Arrancar todo en orden:
```bash
sudo bash ec2-install.sh --iniciar
```

## 5. Comprobar el backend

Dentro del EC2:
```bash
curl -s http://localhost:8080/api/v1/categorias | head -c 200
```
Desde tu PC, en el navegador: `http://TU-DNS:8080/swagger-ui.html` (arriba a la derecha se elige la API).

Si algo falla: `sudo journalctl -u papita-catalogo -n 80 --no-pager` (cambia `catalogo` por `usuario`, `orden`, `nutricion`, `gateway` o `eureka`).

## 6. Front: S3 + CloudFront

1. **S3 → Create bucket**: `papita-dulce-front-<algo-unico>`, región us-east-1, **Block all public access activado**.
2. **Upload** → arrastra **el contenido** de `dist\` (el `index.html` y la carpeta `assets`, no la carpeta `dist` misma).
3. **CloudFront → Functions → Create function**: nombre `rutas-spa`, pega `deploy/cloudfront-rutas-spa.js`, **Save** y **Publish**.
4. **CloudFront → Create distribution**:
   - Origin: el bucket S3 → **Origin access control** → Create new OAC.
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Default root object: `index.html`.
   - Web Application Firewall: **Do not enable**.
   - Al crear, copia la **política del bucket** que sugiere CloudFront y pégala en S3 → bucket → Permissions → Bucket policy.
5. En la distribución → **Origins → Create origin**: el DNS del EC2, **HTTP only**, puerto **8080**.
6. **Behaviors → Create behavior**:
   - Path pattern: `/api/*` → origen EC2
   - Viewer protocol: Redirect HTTP to HTTPS
   - Allowed methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache policy: **CachingDisabled**
   - Origin request policy: **AllViewerExceptHostHeader** (reenvía `Authorization`)
7. Edita el **Default (*) behavior** → Function associations → Viewer request → CloudFront Function `rutas-spa`.
   (No uses "Error pages" para el index.html: cambiarían también los 403/404 del API.)
8. Espera que la distribución quede **Deployed** y anota su dominio `dxxxxxxxx.cloudfront.net`.
9. En el EC2 pon ese dominio en `FRONTEND_URL` y reinicia el Gateway:
   ```bash
   sudo nano /etc/papita/papita.env
   sudo systemctl restart papita-gateway
   ```
10. Abre `https://dxxxxxxxx.cloudfront.net`.

## 7. Después de publicar

- Usuarios de prueba (Flyway): `admin/admin`, `alan.brito@duoc.cl`, `lola.mento@profesor.duoc.cl`, `armando.quito@gmail.com`.
  Como el sitio es público, **cambia la clave de admin** desde "Mi perfil" y dásela al profesor en el informe.
- Al volver a abrir el Learner Lab: Start Lab y prende el EC2 (EC2 → Instances → Start). Los servicios arrancan solos;
  espera ~2 minutos. CloudFront y S3 no se apagan.
- Actualizar el backend: `build-jars.ps1` → `scp` de `backend\deploy` → en el EC2 `sudo bash ec2-install.sh --iniciar`.
- Actualizar el front: `npm run build` → subir `dist\` a S3 → CloudFront → Invalidations → `/*`.

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| Un servicio se reinicia en bucle | `sudo journalctl -u papita-<servicio> -n 80 --no-pager` |
| 503 en el API | El servicio aún no se registra en Eureka: espera 1 minuto |
| 401 en todo | `JWT_SECRET` distinto o vacío en `/etc/papita/papita.env`; reinicia usuario y gateway |
| Out of memory | Usa t3.medium o crea swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Al recargar `/producto/TC001` sale error | Falta asociar la función `rutas-spa` al Default behavior |
| Las fotos subidas no se ven | Revisa el behavior `/api/*` hacia el EC2 |
| La IP cambió | Falta la Elastic IP; actualiza el origen de CloudFront |
