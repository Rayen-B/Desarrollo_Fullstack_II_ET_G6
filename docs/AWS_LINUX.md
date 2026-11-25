# Despliegue en AWS (Learner Lab): EC2 + MySQL + S3

```
Navegador ──http──► S3 (sitio web estático: el front React)
    │                 http://papita-dulce-front-1795462752.s3-website-us-east-1.amazonaws.com
    │
    └──── http ─────► EC2 Ubuntu 24.04, Elastic IP, puerto 8080
                      ec2-100-61-236-90.compute-1.amazonaws.com
                       ├─ api-gateway       :8080  único puerto abierto, valida el JWT, CORS solo para el bucket
                       ├─ eureka-server     :8761  solo 127.0.0.1
                       ├─ usuario-service   :8081  solo 127.0.0.1
                       ├─ catalogo-service  :8082  solo 127.0.0.1  (fotos en /var/lib/papita/media)
                       ├─ orden-service     :8083  solo 127.0.0.1  (llama a Catálogo por Eureka)
                       ├─ nutricion-service :8084  solo 127.0.0.1  (llama a Spoonacular)
                       └─ MySQL             :3306  solo 127.0.0.1
Swagger de las 4 APIs:  http://ec2-100-61-236-90.compute-1.amazonaws.com:8080/swagger-ui.html
```

- El Learner Lab **no permite CloudFront**, por eso el front está en S3 como sitio web (HTTP) y llama al Gateway del EC2.
- Los microservicios y MySQL solo escuchan dentro de la máquina: nadie puede saltarse el Gateway.
- Cada servicio es un `.jar` manejado por systemd: se reinicia solo si se cae y arranca al prender el EC2.
- Todo se hizo desde **CloudShell** (terminal de la consola de AWS): no se manejan claves de AWS ni la llave `.pem`.

Archivos que se usan: `backend/deploy/` (instalador, systemd y variables).

---

## Uso diario

- **Abrir:** Learner Lab → Start Lab → (si el EC2 quedó apagado) EC2 → Instances → `papita-backend` → Start.
  Los servicios arrancan solos; espera ~2 minutos. La Elastic IP mantiene la misma dirección.
- **Tienda:** http://papita-dulce-front-1795462752.s3-website-us-east-1.amazonaws.com
- **Swagger:** http://ec2-100-61-236-90.compute-1.amazonaws.com:8080/swagger-ui.html
- **Estado y logs** (dentro del EC2): `systemctl status papita-gateway --no-pager`, `sudo journalctl -u papita-catalogo -n 80 --no-pager`.
- **Actualizar después de un cambio en GitHub** (dentro del EC2):
  ```bash
  cd ~/papita && git pull
  # backend: recompilar el servicio cambiado (cd backend/<servicio> && ./mvnw -q -B -DskipTests clean package) y luego
  cd backend/deploy && sudo bash ec2-install.sh --iniciar
  # front:
  cd ~/papita && npm ci && npm run build && aws s3 sync dist s3://papita-dulce-front-1795462752 --delete
  ```
- Usuarios de prueba (Flyway): `admin/admin`, `alan.brito@duoc.cl`, `lola.mento@profesor.duoc.cl`, `armando.quito@gmail.com`.
  Como el sitio es público, conviene cambiar la clave de admin desde "Mi perfil" y entregársela al profesor en el informe.

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| La tienda no carga productos | El EC2 está apagado o los servicios aún no arrancan (espera 2 min) |
| Un servicio se reinicia en bucle | `sudo journalctl -u papita-<servicio> -n 80 --no-pager` |
| 503 en el API | El servicio aún no se registra en Eureka: espera 1 minuto |
| 401 en todo | `JWT_SECRET` distinto o vacío en `/etc/papita/papita.env`; reinicia usuario y gateway |
| Error de CORS en el navegador | `FRONTEND_URL` debe ser exactamente la URL del bucket (sin barra final); reinicia el gateway |
| Al entrar directo a `/productos` la consola muestra un 404 | Es normal en S3 como sitio web: entrega `index.html` como página de error y la tienda funciona igual |
