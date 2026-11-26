# 🍰 Papita Dulce

Tienda online de la pastelería y cafetería **Papita Dulce**, con su panel de administración.

- **Frontend:** React 18 + Vite y Bootstrap 5 (esta carpeta).
- **Backend:** microservicios en Spring Boot 3.2 y Java 21 (carpeta `backend/`), con API Gateway, Eureka, JWT y MySQL.
- **Publicado en AWS:** el frontend en Amazon S3 y el backend en una instancia EC2.

## 🌐 Sistema publicado en AWS

| | URL |
|---|---|
| Tienda | http://papita-dulce-front-1795462752.s3-website-us-east-1.amazonaws.com |
| API (Gateway) | http://ec2-100-61-236-90.compute-1.amazonaws.com:8080/api/v1 |
| Swagger (las 4 APIs) | http://ec2-100-61-236-90.compute-1.amazonaws.com:8080/swagger-ui.html |

El servidor está en el AWS Academy Learner Lab: para usarlo hay que iniciar el lab y la instancia EC2 `papita-backend` (los servicios arrancan solos en unos 2 minutos). Más detalles en [`docs/AWS_LINUX.md`](docs/AWS_LINUX.md).

## 🛠️ Tecnologías

**Frontend**
- React 18 + Vite, React Router DOM 6
- Bootstrap 5 y React-Bootstrap (diseño responsivo), Font Awesome y Tabler Icons
- Swiper (carruseles), AOS (animaciones), Tiptap (editor de texto enriquecido) y DOMPurify
- **Vitest + Testing Library + jsdom** para las pruebas unitarias

**Backend**
- Spring Boot 3.2.5, Java 21, Spring Data JPA, Bean Validation
- Spring Cloud Gateway (único punto de entrada) y Netflix Eureka (registro de servicios)
- OpenFeign (llamadas entre microservicios)
- JWT (jjwt) + BCrypt; refresh token de un solo uso guardado como hash SHA-256
- MySQL 8 + Flyway (migraciones), springdoc-openapi (Swagger)
- JUnit 5, Mockito y JaCoCo para las pruebas

## 🧩 Arquitectura

```
Navegador (React) ──► API Gateway :8080 ──► usuario-service   :8081  ──► MySQL db_papita_usuarios
                      valida el JWT,         catalogo-service  :8082  ──► MySQL db_catalogo
                      permisos por rol,      orden-service     :8083  ──► MySQL db_papita_ordenes
                      CORS y Swagger         nutricion-service :8084  ──► MySQL db_nutricion ──► API Spoonacular
                                ▲
                      eureka-server :8761 (los servicios se registran y se encuentran por nombre)
```

- **Usuarios:** registro, login, emisión y renovación de JWT, perfil y mantenedor de usuarios.
- **Catálogo:** productos, categorías, insumos, recetas, fotos y stock (vitrina + preparables).
- **Órdenes:** compras, estados, cancelaciones y reportes. Pide precios y mueve el stock en Catálogo con OpenFeign.
- **Nutrición:** información nutricional y alérgenos con la API Spoonacular a partir de la receta del producto.

## 🚀 Cómo ejecutarlo en local

### 1. Backend

Requisitos: Java 21 y MySQL 8 en `localhost:3306` (por ejemplo, con Laragon). Las bases se crean solas y Flyway crea las tablas y los datos iniciales.

Variables de entorno (en IntelliJ: *Run Configuration → Environment variables*):

| Variable | Servicios | Valor |
|---|---|---|
| `JWT_SECRET` | usuario-service y api-gateway (la misma) | Texto base64 de al menos 32 bytes |
| `DB_USER` / `DB_PASSWORD` | los 4 microservicios | Usuario de MySQL (por defecto `root` sin contraseña) |
| `SPOONACULAR_API_KEY` | nutricion-service | Clave de https://spoonacular.com/food-api |

Levantar en este orden (en cada carpeta, `./mvnw spring-boot:run` o el botón Run de IntelliJ):

1. `backend/eureka-server`
2. `backend/usuario-service`, `backend/catalogo-service`, `backend/nutricion-service`
3. `backend/orden-service`
4. `backend/api-gateway`

Swagger local: http://localhost:8080/swagger-ui.html

### 2. Frontend

```bash
npm install
npm run dev          # tienda en http://localhost:5173
npm run test:run     # ejecuta todas las pruebas unitarias una vez
npm test             # pruebas en modo observador
npm run coverage     # pruebas + reporte de cobertura (carpeta coverage/)
npm run build        # versión de producción (carpeta dist/)
```

Para que la tienda use el backend, crea un archivo `.env.local` (copia de `.env.example`) con `VITE_MODO_SERVIDOR=true`. Sin backend, con `VITE_MODO_SERVIDOR=false`, la tienda funciona sola con `localStorage`. El build de producción (`.env.production`) ya apunta al Gateway en AWS.

### 3. Pruebas del backend

```bash
cd backend/<servicio>
./mvnw test          # el reporte de JaCoCo queda en target/site/jacoco/index.html
```

## 🔑 Accesos de prueba

| Rol | Usuario / correo | Contraseña |
|---|---|---|
| **Administrador (acceso rápido)** | `admin` | `admin` |
| Administrador | alan.brito@duoc.cl | Admin@2026 |
| Vendedor | lola.mento@profesor.duoc.cl | Ventas#2026 |
| Cliente | armando.quito@gmail.com | Cliente!2026 |

Al iniciar sesión como Administrador o Vendedor se entra al **panel de administración** (`/admin`). El Vendedor solo ve Dashboard, Órdenes, Inventario, Insumos y Reportes.

**Pagos (simulados):** en el checkout, el botón **"Simular error de pago"** (o la tarjeta `4000 0000 0000 0002`) muestra el caso de pago rechazado; cualquier otra tarjeta válida, como `4532 0151 1283 0366`, aprueba el pago. No se realiza ningún cobro real.

## 🔐 Seguridad

- **JWT** firmado con HMAC-SHA256 (15 minutos) y **refresh token** de 7 días que sirve una sola vez. Si se reutiliza uno ya usado, se cierran todas las sesiones del usuario.
- El **Gateway** valida el token y aplica los permisos por rol (Público, Cliente, Vendedor, Administrador) antes de reenviar la petición. Los endpoints internos de stock están bloqueados desde internet.
- En el **frontend**, la sesión se guarda en `localStorage` y se mantiene al recargar la página; el token se renueva solo. Las rutas del panel están protegidas por rol (`RutaProtegidaAdmin`) y el checkout exige sesión.
- Las claves (JWT, MySQL y Spoonacular) se entregan como variables de entorno y **no están en el repositorio**.

## 🗺️ Vistas

**Tienda (pública)**: `/` (inicio) · `/productos` · `/producto/:id` · `/categorias` · `/categorias/:id` · `/ofertas` · `/nosotros` · `/blog` · `/blog/:id` · `/contacto` · `/login` · `/registro` · `/checkout` · `/compra/exitosa/:id` · `/compra/error/:id`

**Administración (protegida)**: `/admin` (dashboard) · `/admin/ordenes` (órdenes y boleta imprimible) · `/admin/productos` (inventario, críticos primero) · `/admin/producto-form` · `/admin/insumos` · `/admin/insumo-form` · `/admin/reportes` · `/admin/categorias` · `/admin/categoria-form` · `/admin/usuarios` · `/admin/usuario-form` · `/admin/perfil`

## 🧁 Stock: vitrina + insumos

Cada producto tiene un **stock en vitrina** (unidades ya preparadas) y, opcionalmente, una **receta** con los insumos que usa una unidad completa.

- **Disponible = vitrina + lo que se puede preparar con los insumos.** Un producto es **crítico** cuando lo disponible es igual o menor a su stock crítico.
- Al **confirmar el pago**, el servidor descuenta primero de la vitrina y lo que falte se prepara descontando los insumos de la receta. Si el pago se rechaza, no se descuenta nada.
- Un **trozo** equivale a 1/4 de torta: usa 1/4 de la receta, cuesta el 25% y no toca la vitrina.
- Dos compras al mismo tiempo no pueden vender la misma unidad: Catálogo bloquea las filas mientras descuenta.
- Al **cancelar** una orden se devuelve exactamente lo que se descontó. Las transferencias no pagadas en 24 horas se cancelan solas.
- Un producto con precio $0 se muestra como **"Gratis"** en la tienda.

## 📊 Panel de administración

- **Dashboard** con métricas y resumen de productos (los más críticos primero).
- **Órdenes**: quién compró, qué, cuándo y dónde, con **boleta imprimible**; confirmar pagos, cambiar estado o cancelar.
- **Inventario**: crear, editar (con receta, foto y descripción con formato) y eliminar productos; calcular la información nutricional.
- **Insumos** y **Categorías**: crear, editar y eliminar (no se elimina un insumo usado en recetas ni una categoría con productos).
- **Reportes**: ventas por período, productos más vendidos, ventas por categoría, método de pago y tipo de entrega, y estado del inventario.
- **Usuarios** (solo Administrador) y **Mi Perfil**.

## 📁 Estructura

```
src/                  # Frontend
├── components/       # atoms · molecules · organisms · secciones (Atomic Design)
├── context/          # Estado global: Auth (sesión), Cart (carrito), Tienda (buscador y stock)
├── data/             # Datos iniciales: recetas, blog y regiones de Chile
├── hooks/            # useFormulario, useSeo, useOverlay, useCategorias, useSoloAdmin...
├── pages/            # Vistas de la tienda y pages/admin (panel)
├── services/         # api.js (cliente HTTP con JWT), sesion.js, auth.js, catalogo.js,
│                     # ordenesServidor.js, nutricion.js y storage.js (localStorage)
├── tests/            # Pruebas unitarias (Vitest)
└── utils/            # Validaciones, formato, pago, stock, órdenes y reportes

backend/
├── eureka-server/    # Registro de servicios
├── api-gateway/      # Punto de entrada, JWT, permisos por rol, CORS y Swagger unificado
├── usuario-service/  # Cada servicio: controller · service · repository · model · dto
├── catalogo-service/ #   y src/main/resources/db/migration (Flyway)
├── orden-service/
├── nutricion-service/
└── deploy/           # Instalación en EC2 (ec2-install.sh, systemd y papita.env.example)

deploy/subir-frontend.sh   # Compila el frontend y lo publica en S3
docs/AWS_LINUX.md          # Guía de uso del despliegue en AWS
```

## 🔎 SEO

Cada vista tiene su propio `<title>`, meta description y URL canónica (`useSeo`), además de `robots.txt` y `sitemap.xml`. El panel de administración y las páginas de compra se marcan como `noindex`.

## 🧪 Pruebas

- **Frontend: 653 pruebas** en `src/tests/` (26 archivos), con Vitest y Testing Library. Cobertura de líneas: 94,51%.
- **Backend: 117 pruebas** con JUnit 5 y Mockito (Usuarios 28, Catálogo 41, Órdenes 19, Nutrición 18, Gateway 10 y Eureka 1), con reporte de cobertura JaCoCo.
- Cubren renderizado, estado, eventos, rutas protegidas, flujos de compra con pago correcto y con error, validaciones (RUN, correos, tarjetas, precios), reglas de stock, seguridad del JWT y permisos por rol.

## 💳 Checkout y pagos simulados

- **Tarjeta flotante** que se llena en vivo y cambia de color según la marca (Visa, Mastercard, American Express); es decorativa y no guarda datos.
- **Formato automático** del número, vencimiento `MM/AA` y CVV; crédito con cuotas (1, 3 o 6 sin interés) o débito. La orden guarda solo los últimos 4 dígitos.
- **Simulador de errores** (solo demostración): rechazo del banco, fondos insuficientes, CVV incorrecto, error del procesador y tiempo agotado, cada uno con su pantalla de error.
- **Transferencia**: queda **Pendiente de pago** por 24 horas hasta que el personal la confirme en el panel.
- **Efectivo**: cálculo de vuelto y código de pedido para el retiro o el repartidor.
