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

## Cómo se instaló (2026-11-23)

### 1. Recursos (en CloudShell)
```bash
AMI=$(aws ec2 describe-images --owners 099720109477 --filters 'Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*' --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text)
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 create-security-group --group-name papita-backend-sg --description 'Papita Dulce backend: SSH y API Gateway 8080' --vpc-id $VPC --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 8080 --cidr 0.0.0.0/0
ID=$(aws ec2 run-instances --image-id $AMI --instance-type t3.medium --key-name vockey --security-group-ids $SG \
  --iam-instance-profile Name=LabInstanceProfile \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=papita-backend}]' --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-running --instance-ids $ID
ALLOC=$(aws ec2 allocate-address --domain vpc --query AllocationId --output text)
aws ec2 associate-address --instance-id $ID --allocation-id $ALLOC
```
Bucket del front (sitio web público de solo lectura):
```bash
B=papita-dulce-front-1795462752
aws s3api create-bucket --bucket $B --region us-east-1
aws s3api put-public-access-block --bucket $B --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3api put-bucket-policy --bucket $B --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::papita-dulce-front-1795462752/*"}]}'
aws s3 website s3://$B --index-document index.html --error-document index.html
```

### 2. Entrar al EC2 (desde CloudShell, sin `.pem`)
```bash
aws ec2-instance-connect ssh --instance-id <ID> --os-user ubuntu
```

### 3. Compilar e instalar (dentro del EC2)
```bash
sudo apt-get update && sudo apt-get install -y openjdk-21-jdk-headless git nodejs npm
git clone -b main https://github.com/Rayen-B/Desarrollo_Fullstack_II_ET_G6.git ~/papita
cd ~/papita/backend && mkdir -p deploy/jars
for s in eureka-server api-gateway usuario-service catalogo-service orden-service nutricion-service; do
  (cd $s && chmod +x mvnw && ./mvnw -q -B -DskipTests clean package)
  cp $(ls $s/target/*.jar | grep -v original | head -1) deploy/jars/$s.jar
done
cd deploy && sudo bash ec2-install.sh          # Java, MySQL, 4 bases, usuario, JWT_SECRET y clave de MySQL
sudo nano /etc/papita/papita.env               # SPOONACULAR_API_KEY y FRONTEND_URL (URL del bucket)
sudo bash ec2-install.sh --iniciar             # arranca los 6 servicios en orden
```

### 4. Front (dentro del EC2; el EC2 tiene permiso para S3 con LabInstanceProfile)
```bash
sudo snap install aws-cli --classic
cd ~/papita && npm ci && npm run build          # usa .env.production (API = Gateway del EC2)
aws s3 sync dist s3://papita-dulce-front-1795462752 --delete
```

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
  # backend: recompilar el servicio cambiado (paso 3) y luego
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
