# 🍰 Papita Dulce

Tienda online de la pastelería y cafetería **Papita Dulce**, con su panel de administración. Desarrollada con **React 18 + Vite** y **Bootstrap 5**.

## 🛠️ Tecnologías

- React 18 + Vite, React Router DOM 6
- Bootstrap 5 y React-Bootstrap (diseño responsivo), Font Awesome y Tabler Icons
- Swiper (carruseles) y AOS (animaciones)
- **Vitest + Testing Library + jsdom** para las pruebas unitarias
- Los datos se guardan en `localStorage` (productos, insumos, categorías, usuarios, órdenes y carrito)

## 🚀 Cómo ejecutarlo

```bash
npm install
npm run dev          # tienda en http://localhost:5173
npm run test:run     # ejecuta todas las pruebas unitarias una vez
npm test             # pruebas en modo observador
npm run coverage     # pruebas + reporte de cobertura (carpeta coverage/)
npm run build        # versión de producción
```

## 🔑 Accesos de prueba

| Rol | Usuario / correo | Contraseña |
|---|---|---|
| **Administrador (acceso rápido)** | `admin` | `admin` |
| Administrador | alan.brito@duoc.cl | Admin@2026 |
| Vendedor | lola.mento@profesor.duoc.cl | Ventas#2026 |
| Cliente | armando.quito@gmail.com | Cliente!2026 |

Al iniciar sesión en **/login** como Administrador o Vendedor se entra al **panel de administración** (`/admin`). El Vendedor solo ve Dashboard, Órdenes, Inventario, Insumos y Reportes.

**Pagos:** en el checkout, el botón **"Simular error de pago"** (o la tarjeta `4000 0000 0000 0002`) muestra el caso de pago rechazado; cualquier otra tarjeta válida, como `4532 0151 1283 0366`, aprueba el pago.

## 🗺️ Vistas

**Tienda (pública)**: `/` (inicio) · `/productos` · `/producto/:id` · `/categorias` · `/categorias/:id` · `/ofertas` · `/nosotros` · `/blog` · `/blog/:id` · `/contacto` · `/login` · `/registro` · `/checkout` · `/compra/exitosa/:id` · `/compra/error/:id`

**Administración (protegida)**: `/admin` (dashboard) · `/admin/ordenes` (órdenes y boleta imprimible) · `/admin/productos` (inventario, críticos primero) · `/admin/producto-form` · `/admin/insumos` · `/admin/insumo-form` · `/admin/reportes` · `/admin/categorias` · `/admin/categoria-form` · `/admin/usuarios` · `/admin/usuario-form` · `/admin/perfil`

## 🧁 Stock: vitrina + insumos

Cada producto tiene un **stock en vitrina** (unidades ya preparadas) y, opcionalmente, una **receta** con los insumos que usa una unidad completa.

- **Disponible = vitrina + lo que se puede preparar con los insumos.** Un producto es **crítico** cuando lo disponible es igual o menor a su stock crítico.
- Al **confirmar el pago**, las unidades salen primero de la vitrina y lo que falte se prepara descontando los insumos de la receta. Si el pago se rechaza, no se descuenta nada.
- Un **trozo** equivale a 1/4 de torta: usa 1/4 de la receta y no toca la vitrina.
- Los productos sin receta (bebestibles, sándwiches) se venden solo desde la vitrina.
- La tienda muestra **"Agotado"** o **"Solo por trozo"** según lo disponible, y el carrito no deja pedir más de lo que hay.
- En el panel, **Insumos** muestra primero los que hay que reponer, y el **Inventario** muestra vitrina, preparables y disponible de cada producto.

## 📊 Panel de administración

- **Dashboard** con métricas y resumen de productos (los más críticos primero).
- **Órdenes**: quién compró, qué, cuándo y dónde, con **boleta imprimible**. Los pagos rechazados quedan registrados como "Pago rechazado".
- **Inventario** con filtro por categoría y orden por prioridad; crear, editar (con receta) y eliminar productos.
- **Insumos**: crear, editar y eliminar (no se elimina un insumo que usa alguna receta).
- **Reportes**: ventas por período, productos más vendidos, ventas por categoría, método de pago y tipo de entrega, y estado del inventario.
- **Categorías**: crear, editar y eliminar (no se elimina una categoría con productos). Lo que se crea aparece en la tienda.
- **Usuarios** y **Mi Perfil**.

## 📁 Estructura

```
src/
├── components/   # atoms · molecules · organisms · secciones (componentes reutilizables)
├── context/      # Estado global: Auth (sesión), Cart (carrito), Tienda (buscador, carrito y stock disponible)
├── data/         # Datos iniciales: recetas, blog y regiones de Chile
├── hooks/        # useFormulario, useSeo, useOverlay, useCategorias, useSoloAdmin...
├── pages/        # Vistas de la tienda y pages/admin (panel)
├── services/     # storage.js (localStorage), db.js (CRUD), categorias.js e insumos.js
├── tests/        # Pruebas unitarias (Vitest)
└── utils/        # Validaciones, formato, pago, stock, órdenes y reportes
```

## 🔎 SEO

Cada vista tiene su propio `<title>`, meta description y URL canónica (`useSeo`), además de `robots.txt` y `sitemap.xml`. El panel de administración y las páginas de compra se marcan como `noindex`.

## 🧪 Pruebas unitarias

- **453 pruebas** en `src/tests/` (20 archivos), con `describe` / `it` / `expect` de Vitest, `render` + `screen` + `fireEvent` de Testing Library y `MemoryRouter` para las rutas.
- Cubren renderizado, renderizado condicional, props, estado, eventos y flujos completos (compra con pago correcto y con error, panel admin), además de casos inválidos: RUN, correos, tarjetas, precios, stock insuficiente y datos dañados en `localStorage`.
- Archivos principales: `stock-vitrina-insumos` (vitrina, recetas y trozos), `carrito-stock-y-categorias` (límites del carrito y checkout), `admin-y-paginas` y `admin-insumos-y-rutas` (panel y rutas protegidas), `flujos` (compras completas), `datos-y-migraciones` (localStorage), `reportes-y-ordenes` y las de validaciones.
- `setup.js` agrega las APIs que jsdom no tiene (`scrollIntoView`, `scrollTo`, `matchMedia`...).

## 💳 Checkout paso 3 y pantallas de pago (mejoras)

- **Tarjeta flotante** (`TarjetaCredito.jsx`): se llena en vivo con número, titular y vencimiento; gira al escribir el CVV; cambia de color según la marca (Visa, Mastercard, American Express) y es solo decorativa (`aria-hidden`, no guarda datos).
- **Formato automático** (`utils/pago.js`): número `4532 0151 1283 0366` (Amex `3782 822463 10005`), vencimiento `MM/AA` con la `/` automática, CVV solo números.
- **Espera simulada "Procesando pago…"**: el resultado (aprobado o error) se muestra tras ~1,5 s, con el botón bloqueado para evitar pagos dobles. En las pruebas la espera es 0 (`configuracionPago.demoraMs`).
- **Crédito o débito**: al pagar con tarjeta se elige el tipo; con crédito aparece el selector de cuotas (1, 3 o 6 sin interés). La orden guarda tipo, cuotas y solo los últimos 4 dígitos.
- **Escritura del número sin trabarse**: el formato conserva la posición del cursor y permite borrar los espacios.
- **Simulador de errores aparte**: las tarjetas de prueba, el selector de motivo y el botón *Simular error de pago* solo aparecen al activar el interruptor "Simulador de errores (solo demostración)". Apagado, el checkout se ve como una compra normal.
- **Simulador de errores por motivo**: 5 tarjetas de prueba (rechazo del banco `4000 0000 0000 0002`, fondos insuficientes `...9995`, CVV incorrecto `...0127`, error del procesador `...0119`, tiempo agotado `...0259`) y un selector "Motivo del error simulado" junto al botón *Simular error de pago*. La orden guarda `codigoMotivo`.
- **Pantalla de error rediseñada** (`CompraError.jsx`): ícono por motivo, explicación, consejo, "No se realizó ningún cobro", reintentar / elegir otro método y detalle del pedido plegable.
- **Transferencia**: datos con botón *Copiar*, plazo de 24 horas y estado **Pendiente de pago** (no cuenta como ingreso hasta que el administrador la confirme con *Confirmar pago recibido* en el detalle de la orden).
- **Efectivo**: campo "¿Con cuánto pagarás?" con cálculo de vuelto y **código de pedido** para mostrar al retirar o al repartidor.
- Pruebas: `src/tests/pago-realista.test.jsx` (74 casos).
