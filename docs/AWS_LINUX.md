# Despliegue en AWS con Linux (jar + systemd)

Guía paso a paso para publicar Papita Dulce en AWS usando **una instancia EC2 con Ubuntu Linux**,
cada microservicio como un **.jar** controlado por **systemd**, el frontend en **S3 + CloudFront**
y MySQL en la misma máquina o en RDS.

> Esta guía fue escrita sin poder ejecutar el despliegue real. Los comandos son estándar, pero en tu
> primera prueba revisa con `journalctl` (sección 9) y ajusta lo que tu cuenta de estudiante restrinja.

---

## 1. Qué se instala y dónde

```
Navegador ──https──► CloudFront ──── /*      ──► S3 (frontend estático)
                          │
                          └────────── /api/*  ──► EC2 Ubuntu 24.04  :8080
                                                   ├─ api-gateway      :8080  único puerto público; valida el JWT
                                                   ├─ eureka-server    :8761  solo 127.0.0.1
                                                   ├─ usuario-service  :8081  solo 127.0.0.1  (login, usuarios)
                                                   ├─ catalogo-service :8082  solo 127.0.0.1  (productos, imágenes)
                                                   ├─ nutricion-service:8084  solo 127.0.0.1  (Spoonacular)
                                                   └─ MySQL :3306 (local o RDS)
```

Por qué así:
- El navegador solo conoce **un dominio** (CloudFront). Como `/api/*` va al mismo dominio, no hay problemas de CORS.
- Solo el **gateway** escucha hacia internet. Los microservicios escuchan en `127.0.0.1`: nadie puede saltarse
  la validación del JWT llamándolos directo.
- Los jar se ejecutan como un usuario sin privilegios (`papita`), se reinician solos si se caen y arrancan con la máquina.

## 2. Dimensionamiento

| Recurso | Recomendado | Notas |
|---|---|---|
| EC2 | **t3.medium** (4 GB RAM) | 5 procesos Java + MySQL. Una t3.small (2 GB) puede funcionar **con swap** (sección 3). Una micro (1 GB) no alcanza |
| Disco | 20 GB gp3 | Incluye imágenes subidas si usas la carpeta `media` |
| SO | Ubuntu Server 24.04 LTS | Los scripts usan `apt`. En Amazon Linux 2023 cambia `apt-get install openjdk-21-jre-headless` por `dnf install java-21-amazon-corretto-headless` |

## 3. La instancia EC2

1. **EC2 → Launch instance** → Ubuntu Server 24.04 LTS, tipo t3.medium, tu *key pair* (`.pem`), 20 GB.
2. **Security group** (reglas de entrada):
   - `22` (SSH): solo **tu IP**.
   - `8080` (gateway): lo ideal es el *prefix list* de CloudFront (`com.amazonaws.global.cloudfront.origin-facing`).
     Si tu cuenta no lo permite, `0.0.0.0/0`: el gateway valida el JWT igual, pero queda expuesto.
   - **No** abras 8761, 8081, 8082, 8084 ni 3306.
3. **Elastic IP**: asóciala a la instancia. Sin ella, la IP pública (y el DNS) cambia cada vez que la detienes.
4. Conéctate: `ssh -i clave.pem ubuntu@TU-DNS-PUBLICO`
5. (Solo si usas 2 GB de RAM) crea 2 GB de swap:
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

## 4. Base de datos (elige una)

### Opción A: MySQL en la misma EC2 (más simple)
```bash
sudo apt-get update && sudo apt-get install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql <<'SQL'
CREATE DATABASE db_usuarios  CHARACTER SET utf8mb4;
CREATE DATABASE db_catalogo  CHARACTER SET utf8mb4;
CREATE DATABASE db_nutricion CHARACTER SET utf8mb4;
CREATE USER 'papita'@'localhost' IDENTIFIED BY 'UNA_CLAVE_FUERTE';
GRANT ALL PRIVILEGES ON db_usuarios.*  TO 'papita'@'localhost';
GRANT ALL PRIVILEGES ON db_catalogo.*  TO 'papita'@'localhost';
GRANT ALL PRIVILEGES ON db_nutricion.* TO 'papita'@'localhost';
FLUSH PRIVILEGES;
SQL
```
MySQL queda escuchando solo en localhost (valor por defecto en Ubuntu). Las tablas las crea **Flyway** al arrancar cada servicio.

### Opción B: RDS MySQL
RDS → MySQL 8, `db.t3.micro`, **sin acceso público**, security group que acepte `3306` **solo desde el security group de la EC2**.
Crea las tres bases con un cliente MySQL y usa el *endpoint* de RDS en las URLs de `papita.env` (sección 6).
En Learner Lab, comprueba que RDS esté habilitado; si no, usa la opción A.

## 5. Compilar y subir los .jar

En **tu equipo** (necesitas Java 21; en Windows usa WSL o Git Bash):
```bash
cd backend
./deploy/build-jars.sh                 # deja los 5 .jar en backend/deploy/jars/
scp -i clave.pem -r deploy ubuntu@TU-DNS-PUBLICO:~/deploy
```

## 6. Instalar y configurar en la EC2

```bash
cd ~/deploy
sudo ./ec2-install.sh                  # instala Java 21, crea el usuario 'papita', copia los jar y las unidades systemd
sudo nano /etc/papita/papita.env       # completa los valores (abajo)
```

Valores obligatorios en `/etc/papita/papita.env`:

| Variable | Qué poner |
|---|---|
| `DB_USER`, `DB_PASSWORD` | El usuario/clave de MySQL de la sección 4 |
| `*_DB_URL` | Déjalas con `localhost` (opción A) o usa el endpoint de RDS |
| `JWT_SECRET` | **Mínimo 32 caracteres.** Genera uno: `openssl rand -base64 48`. Si falta, los servicios no arrancan |
| `ADMIN_PASSWORD` | Clave del primer administrador (usuario `admin`). Elige una fuerte |
| `SEED_USUARIOS_DEMO` | `false` (con `true` se crean usuarios con claves públicas como `admin/admin`) |
| `FRONTEND_URL` | `https://dxxxx.cloudfront.net` (tu dominio de CloudFront) |
| `SPOONACULAR_API_KEY` | Tu clave de Spoonacular |
| `SWAGGER_ENABLED` | `false` en producción |

Arrancar todo (Eureka primero, luego el resto):
```bash
sudo ./ec2-install.sh --iniciar
```

## 7. Comprobar que el backend funciona (antes de tocar CloudFront)

Dentro de la EC2:
```bash
systemctl status papita-gateway papita-usuario papita-catalogo papita-nutricion --no-pager
curl -s http://localhost:8080/actuator/health                 # {"status":"UP"}
curl -s http://localhost:8080/api/v1/productos                # [] (catálogo vacío al inicio)
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"identificador":"admin","password":"TU_ADMIN_PASSWORD"}'
```
El login debe devolver un `token`. Comprueba también que lo protegido rechaza sin token:
```bash
curl -i http://localhost:8080/api/v1/usuarios                 # debe responder 401
curl -i http://localhost:8761                                  # solo funciona desde la propia EC2
```
Las primeras veces espera ~1 minuto: cada servicio tarda en registrarse en Eureka.

## 8. Frontend: S3 + CloudFront

1. **S3**: crea un bucket (por ejemplo `papita-frontend-TUNOMBRE`) con **Block all public access activado**.
2. **CloudFront → Create distribution**:
   - Origen 1: el bucket S3, con **Origin Access Control (OAC)**. Copia la política de bucket que sugiere la consola.
   - *Default root object*: `index.html`.
   - *Viewer protocol policy*: Redirect HTTP to HTTPS.
   - *Compress objects automatically*: **Sí** (comprime JS/CSS con gzip y brotli).
   - **Páginas de error personalizadas**: códigos `403` y `404` → ruta `/index.html`, código de respuesta `200`.
     Sin esto, al recargar `/producto/TC001` aparece un error (React Router vive en el navegador).
3. **Segundo origen** (la API): origen personalizado con el DNS público de la EC2, protocolo **HTTP**, puerto **8080**.
   - Crea un *behavior* con patrón `/api/*` → ese origen.
   - Métodos permitidos: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**.
   - Cache policy: **CachingDisabled**. Origin request policy: **AllViewer** (reenvía la cabecera `Authorization`).
   - Tiempo de espera de respuesta del origen: sube a 60 s si el cálculo con Spoonacular se corta.
4. Publicar el frontend (en tu equipo, con el AWS CLI configurado):
   ```bash
   BUCKET=papita-frontend-TUNOMBRE DISTRIBUCION=E1ABCDEF123456 ./deploy/subir-frontend.sh
   ```
   El script compila con `.env.production` (modo servidor, API en el mismo dominio) y sube los archivos con caché larga
   para `assets/` y sin caché para `index.html`.
5. Abre `https://dxxxx.cloudfront.net`, inicia sesión como `admin` y crea un producto con imagen y descripción.

> El tramo CloudFront → EC2 va por HTTP (el navegador → CloudFront sí va por HTTPS). Para cifrarlo también,
> pon Nginx con un certificado delante del gateway; para un proyecto de curso suele bastar con restringir el
> security group al *prefix list* de CloudFront.

## 9. Operación diaria

| Qué | Comando |
|---|---|
| Ver estado | `systemctl status papita-gateway --no-pager` |
| Logs en vivo | `sudo journalctl -u papita-gateway -f` (cambia `gateway` por `usuario`, `catalogo`, `nutricion`, `eureka`) |
| Reiniciar uno | `sudo systemctl restart papita-catalogo` |
| Actualizar el backend | `./deploy/build-jars.sh` → `scp` de `deploy/jars` → en la EC2: `sudo ./ec2-install.sh --iniciar` |
| Memoria | `free -m` y `ps aux --sort=-%mem \| head` |
| Respaldo de la BD | `mysqldump -u papita -p db_usuarios > usuarios.sql` (igual con `db_catalogo`, `db_nutricion`) |
| Respaldo de imágenes | `sudo tar czf media.tgz /var/lib/papita/media` |

Al detener y encender la instancia, los servicios arrancan solos (quedaron `enabled`).

## 10. Imágenes: carpeta `media` o S3

- **Carpeta `media` (por defecto)**: las imágenes se guardan en `/var/lib/papita/media` y se entregan por `/api/v1/media/...`.
  Es lo más simple, pero **se pierden si reemplazas la instancia** (haz respaldo con `tar`).
- **S3**: en `papita.env` pon `MEDIA_ALMACEN=s3` y `MEDIA_S3_BUCKET=tu-bucket-de-imagenes`.
  El servicio usa el rol de la instancia (en Learner Lab, `LabInstanceProfile`: asócialo al lanzar la EC2), sin claves en el código.
  El bucket de imágenes debe poder leerse públicamente o estar detrás de CloudFront (`MEDIA_S3_URL_PUBLICA`).
  Esta opción **no pude probarla**: valídala con una subida real.

## 11. Seguridad: lista de comprobación

- [ ] `JWT_SECRET` largo y aleatorio, solo en `/etc/papita/papita.env` (permisos 640, nunca en git).
- [ ] `SEED_USUARIOS_DEMO=false` y una `ADMIN_PASSWORD` fuerte.
- [ ] `SWAGGER_ENABLED=false` en producción (Swagger solo se alcanza dentro de la EC2: `curl localhost:8081/swagger-ui.html` o un túnel SSH).
- [ ] Security group: solo 22 (tu IP) y 8080 (CloudFront). MySQL y los microservicios cerrados.
- [ ] Llave `.pem` guardada con `chmod 400` y fuera del repositorio.
- [ ] Alarma de facturación creada y recursos detenidos cuando no los uses.

Límites conocidos (no están resueltos): el JWT vive en `localStorage` (dura 2 horas); el freno de fuerza bruta del login vive en
memoria (se reinicia con el servicio); no hay envío real de correos, así que "recuperar contraseña" es solo un aviso.

## 12. Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El servicio se reinicia en bucle | Falta `JWT_SECRET` o es corto, o la BD no responde | `sudo journalctl -u papita-usuario -n 50` |
| `502` / `503` desde el gateway | El microservicio aún no se registra en Eureka | Espera ~1 min; revisa `journalctl` del servicio |
| `401` en todo el panel | Token vencido o `JWT_SECRET` distinto en gateway y usuario-service | Es el mismo archivo `papita.env`; reinicia ambos |
| `403` al calcular nutrición | La cuenta es Cliente | Usa un Administrador o Vendedor |
| `Access denied for user` | Clave/usuario de MySQL incorrectos | Revisa `DB_USER`, `DB_PASSWORD` y los `GRANT` |
| Error de memoria / el proceso muere | RAM insuficiente | Crea swap o sube a t3.medium |
| `/producto/TC001` da error al recargar | Falta la página de error 403/404 → `index.html` | Ver sección 8, paso 2 |
| Las imágenes subidas no se ven | `/api/v1/media/*` no llega al backend | Revisa el *behavior* `/api/*` y que `MEDIA_ALMACEN` sea `local` |
| Learner Lab: la IP cambió | Se detuvo el laboratorio sin Elastic IP | Asocia una Elastic IP y actualiza el origen de CloudFront |
