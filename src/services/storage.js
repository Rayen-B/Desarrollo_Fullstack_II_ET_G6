import { RECETAS_DEFAULT } from '../data/recetas';
import { ARTICULOS_DEFAULT } from '../data/blog';

export const PRODUCTOS_KEY = 'pasteleria_productos_db';
export const USERS_KEY = 'tienda_usuarios_db';
export const AUTH_KEY = 'tienda_usuario_sesion';
export const CART_KEY = 'papita_dulce_cart';
export const ORDERS_KEY = 'papita_dulce_orders';
export const BLOG_KEY = 'papita_dulce_blog';

const CATALOGO_BASE = [
  // TORTAS
  {
    id: "TC001",
    codigo: "TC001",
    nombre: "Torta Panqueque Naranja",
    categoria: "Tortas",
    precio: 16900,
    precioAnterior: 20000,
    stock: 12,
    stockCritico: 4,
    imagen: "menu/Torta_Panqueque_Naranja",
    descripcion: "Panqueques suaves, crema pastelera, mermelada naranja & frutas frescas."
  },
  {
    id: "TL004",
    codigo: "TL004",
    nombre: "Torta Trufa",
    categoria: "Tortas",
    precio: 18900,
    precioAnterior: 22000,
    stock: 8,
    stockCritico: 3,
    imagen: "menu/Torta_Trufa",
    descripcion: "Bizcocho de chocolate, crema trufa y cobertura intensa de chocolate."
  },
  {
    id: "TT003",
    codigo: "TT003",
    nombre: "Torta Tres Leches",
    categoria: "Tortas",
    precio: 17500,
    precioAnterior: 20500,
    stock: 15,
    stockCritico: 5,
    imagen: "menu/Torta_Tres_Leches",
    descripcion: "Bizcocho bañado en tres leches, crema batida y un toque de canela."
  },
  {
    id: "TC002",
    codigo: "TC002",
    nombre: "Torta Selva Negra",
    categoria: "Tortas",
    precio: 19900,
    precioAnterior: 23000,
    stock: 10,
    stockCritico: 4,
    imagen: "menu/Torta_Selva_Negra",
    descripcion: "Capas de chocolate, crema y cerezas en una combinación clásica."
  },
  {
    id: "TS005",
    codigo: "TS005",
    nombre: "Torta San Jorge",
    categoria: "Tortas",
    precio: 16500,
    precioAnterior: 19000,
    stock: 3,
    stockCritico: 3,
    imagen: "menu/Torta_San_Jorge.jpg",
    descripcion: "Torta casera de textura suave y sabor tradicional para compartir."
  },
  {
    id: "TP006",
    codigo: "TP006",
    nombre: "Torta Papita",
    categoria: "Tortas",
    precio: 17900,
    precioAnterior: 21000,
    stock: 14,
    stockCritico: 4,
    imagen: "menu/tortapapita",
    descripcion: "La torta insignia de la casa, con capas suaves, frutos frescos y un relleno cremoso irresistible."
  },

  // BEBESTIBLES & INFUSIONES
  {
    id: "BEB001",
    codigo: "BEB001",
    nombre: "Jugo de Frutilla",
    categoria: "Bebestibles",
    precio: 1500,
    precioAnterior: 2000,
    stock: 25,
    stockCritico: 5,
    imagen: "menu/Bebestible2",
    descripcion: "Jugo hecho con frutillas frescas de la huerta y un toque de hojas frescas de menta."
  },
  {
    id: "BEB002",
    codigo: "BEB002",
    nombre: "Café Helado",
    categoria: "Bebestibles",
    precio: 1800,
    precioAnterior: 2200,
    stock: 20,
    stockCritico: 5,
    imagen: "menu/Bebestibles",
    descripcion: "Refrescante preparación de la casa hecho con los mejores granos de café."
  },
  {
    id: "BEB003",
    codigo: "BEB003",
    nombre: "Jugo de Mango",
    categoria: "Bebestibles",
    precio: 1600,
    precioAnterior: 2000,
    stock: 18,
    stockCritico: 4,
    imagen: "menu/Bebestible10",
    descripcion: "Refrescante jugo preparado con mangos 100% frescos."
  },
  {
    id: "BEB004",
    codigo: "BEB004",
    nombre: "Limonada de Menta y Jengibre",
    categoria: "Bebestibles",
    precio: 1700,
    precioAnterior: 2100,
    stock: 22,
    stockCritico: 5,
    imagen: "menu/Bebestible3",
    descripcion: "Bebestible fresco y equilibrado para acompañar tu sándwich a elección."
  },
  {
    id: "BEB005",
    codigo: "BEB005",
    nombre: "Jugo de Naranja y Frutilla",
    categoria: "Bebestibles",
    precio: 1900,
    precioAnterior: 2300,
    stock: 16,
    stockCritico: 4,
    imagen: "menu/Bebestible4",
    descripcion: "Opción fresca y deliciosa para cualquier momento del día."
  },
  {
    id: "BEB006",
    codigo: "BEB006",
    nombre: "Jugo de Naranja",
    categoria: "Bebestibles",
    precio: 2000,
    precioAnterior: 2400,
    stock: 30,
    stockCritico: 6,
    imagen: "menu/Bebestible5",
    descripcion: "Preparación refrescante con la frescura natural de naranjas seleccionadas."
  },
  {
    id: "BEB007",
    codigo: "BEB007",
    nombre: "Limonada Tradicional",
    categoria: "Bebestibles",
    precio: 1800,
    precioAnterior: 2200,
    stock: 24,
    stockCritico: 5,
    imagen: "menu/Bebestible6",
    descripcion: "Bebestible ligero y fresco para acompañar tus momentos dulces."
  },
  {
    id: "INF001",
    codigo: "INF001",
    nombre: "Té de Limón",
    categoria: "Infusiones",
    precio: 2100,
    precioAnterior: 2500,
    stock: 15,
    stockCritico: 4,
    imagen: "menu/Bebestible7",
    descripcion: "Infusión preparada con hojas frescas de té y cáscaras de limón."
  },
  {
    id: "INF002",
    codigo: "INF002",
    nombre: "Té de la Casa",
    categoria: "Infusiones",
    precio: 2200,
    precioAnterior: 2600,
    stock: 18,
    stockCritico: 4,
    imagen: "menu/Bebestible8",
    descripcion: "Infusión concentrada totalmente de hojas de té frescas."
  },
  {
    id: "INF003",
    codigo: "INF003",
    nombre: "Chocolate Caliente",
    categoria: "Infusiones",
    precio: 2300,
    precioAnterior: 2700,
    stock: 12,
    stockCritico: 3,
    imagen: "menu/Bebestible9",
    descripcion: "Elaborado con leche, chocolate y malvaviscos para resaltar esa dulzura."
  },

  // SÁNDWICHES
  {
    id: "SAN001",
    codigo: "SAN001",
    nombre: "Sándwich de Pollo y Pepinillos",
    categoria: "Sándwiches",
    precio: 2500,
    precioAnterior: 3600,
    stock: 14,
    stockCritico: 4,
    imagen: "menu/sandwich4",
    descripcion: "Pan artesanal con pollo grillado, pepinillos frescos, encurtido de repollo casero."
  },
  {
    id: "SAN002",
    codigo: "SAN002",
    nombre: "La Cosecha de Papita",
    categoria: "Sándwiches",
    precio: 1800,
    precioAnterior: 2400,
    stock: 2,
    stockCritico: 3,
    imagen: "menu/Sandwich1",
    descripcion: "Pan ciabatta crujiente con vegetales asados, rúcula fresca y ricotta."
  },
  {
    id: "SAN003",
    codigo: "SAN003",
    nombre: "Sándwich de Jamón y Queso",
    categoria: "Sándwiches",
    precio: 2200,
    precioAnterior: 2800,
    stock: 20,
    stockCritico: 5,
    imagen: "menu/Sandwich2",
    descripcion: "Pan artesanal tostado, jamón, queso derretido y vegetales frescos."
  },
  {
    id: "SAN004",
    codigo: "SAN004",
    nombre: "Sándwich de Tofu y Verduras",
    categoria: "Sándwiches",
    precio: 2600,
    precioAnterior: 3200,
    stock: 2,
    stockCritico: 3,
    imagen: "menu/Sandwich5",
    descripcion: "Sándwich artesanal con tofu salteado con especias y ensalada abundante."
  },
  {
    id: "SAN005",
    codigo: "SAN005",
    nombre: "Sándwich de Tocino y Huevo",
    categoria: "Sándwiches",
    precio: 2900,
    precioAnterior: 3500,
    stock: 12,
    stockCritico: 4,
    imagen: "menu/Sandwitch6",
    descripcion: "Tocino en pan artesanal con vegetales frescos y tortilla de huevo."
  },

  // TARTALETAS
  {
    id: "TAR001",
    codigo: "TAR001",
    nombre: "Ronroneo Cítrico",
    categoria: "Tartaletas",
    precio: 3500,
    precioAnterior: 4200,
    stock: 11,
    stockCritico: 3,
    imagen: "menu/tartaleta1",
    descripcion: "Masa crocante artesanal rellenada con refrescante crema de limón y arándanos frescos."
  },
  {
    id: "TAR002",
    codigo: "TAR002",
    nombre: "Tartaleta Crema de Naranja",
    categoria: "Tartaletas",
    precio: 3700,
    precioAnterior: 4400,
    stock: 2,
    stockCritico: 3,
    imagen: "menu/tartaleta3",
    descripcion: "Tartaleta artesanal con crema suave de naranja y merengue italiano flameado."
  },
  {
    id: "TAR003",
    codigo: "TAR003",
    nombre: "Garritas de Frutilla",
    categoria: "Tartaletas",
    precio: 3900,
    precioAnterior: 4600,
    stock: 13,
    stockCritico: 4,
    imagen: "menu/Tartaleta_frutilla",
    descripcion: "Base crujiente rellena con crema pastelera y frutillas frescas de temporada."
  },

  // POSTRES
  {
    id: "POS001",
    codigo: "POS001",
    nombre: "Galletas Chips de Colores",
    categoria: "Postres",
    precio: 2300,
    precioAnterior: 2800,
    stock: 25,
    stockCritico: 5,
    imagen: "menu/galletas2",
    descripcion: "Galletas caseras de vainilla con chispas de colores."
  },
  {
    id: "POS002",
    codigo: "POS002",
    nombre: "Galletas Chocolate Doble",
    categoria: "Postres",
    precio: 2400,
    precioAnterior: 2900,
    stock: 22,
    stockCritico: 5,
    imagen: "menu/galletas3",
    descripcion: "Selección recién horneada con sabor casero y textura irresistible."
  },
  {
    id: "POS003",
    codigo: "POS003",
    nombre: "Papita Calico",
    categoria: "Postres",
    precio: 3200,
    precioAnterior: 3800,
    stock: 10,
    stockCritico: 3,
    imagen: "menu/postre1",
    descripcion: "Postre artesanal con crema de vainilla, mermelada de durazno y frambuesas."
  },
  {
    id: "POS004",
    codigo: "POS004",
    nombre: "Merengues Artesanales",
    categoria: "Postres",
    precio: 3400,
    precioAnterior: 4000,
    stock: 15,
    stockCritico: 4,
    imagen: "menu/Postre2",
    descripcion: "Textura delicada y sabor equilibrado en una preparación dulce artesanal."
  },
  {
    id: "POS005",
    codigo: "POS005",
    nombre: "Postre Especial Frutillas",
    categoria: "Postres",
    precio: 3600,
    precioAnterior: 4200,
    stock: 12,
    stockCritico: 3,
    imagen: "menu/postre3",
    descripcion: "Una opción dulce y especial para compartir o disfrutar en cualquier momento."
  },
  {
    id: "POS006",
    codigo: "POS006",
    nombre: "Brownie con Nueces",
    categoria: "Postres",
    precio: 3500,
    precioAnterior: 4100,
    stock: 0,
    stockCritico: 4,
    imagen: "menu/postre4",
    descripcion: "Postre de chocolate con nueces y una presentación delicada."
  },
  {
    id: "TF005",
    codigo: "TF005",
    nombre: "Empolvados",
    categoria: "Postres",
    precio: 2800,
    precioAnterior: 3300,
    stock: 18,
    stockCritico: 4,
    imagen: "menu/Empolvados",
    descripcion: "Suaves, caseros y rellenos con manjar casero para acompañar tu café favorito."
  },
  {
    id: "PI006",
    codigo: "PI006",
    nombre: "Arroz con Leche",
    categoria: "Postres",
    precio: 2600,
    precioAnterior: 3100,
    stock: 10,
    stockCritico: 3,
    imagen: "menu/Arroz_con_Leche",
    descripcion: "Postre a base de arroz, leche, azúcar y canela al estilo casero."
  },
  {
    id: "TAR004",
    codigo: "TAR004",
    nombre: "Tartaleta de Cereza",
    categoria: "Tartaletas",
    precio: 3600,
    precioAnterior: 4300,
    stock: 10,
    stockCritico: 3,
    imagen: "menu/tartaleta4",
    descripcion: "Tartaleta de masa quebrada con crema y cerezas."
  },
  {
    id: "TAR005",
    codigo: "TAR005",
    nombre: "Tartaleta de Manzana",
    categoria: "Tartaletas",
    precio: 3800,
    precioAnterior: 4500,
    stock: 10,
    stockCritico: 3,
    imagen: "menu/tartaleta5",
    descripcion: "Tartaleta de manzana caramelizada con toque de canela."
  },
  {
    id: "POS007",
    codigo: "POS007",
    nombre: "Galletas de Chispas de Chocolate",
    categoria: "Postres",
    precio: 2500,
    precioAnterior: 3000,
    stock: 20,
    stockCritico: 5,
    imagen: "menu/galletas1",
    descripcion: "Galletas crujientes con chispas de chocolate."
  }
];

// Cada producto lleva su receta (vacía si se vende solo desde la vitrina)
export const PRODUCTOS_DEFAULT = CATALOGO_BASE.map((p) => ({ ...p, receta: RECETAS_DEFAULT[p.codigo] || [] }));

// Al cambiar la versión se agregan al localStorage los productos nuevos del catálogo
export const CATALOGO_VERSION = '6';
const CATALOGO_VERSION_KEY = 'papita_catalogo_version';

// Stock que tenían antes estos productos: si no se ha editado, se actualiza al nuevo stock del catálogo
const STOCK_ANTERIOR = { SAN002: [10], TAR002: [8, 3], POS006: [14], TS005: [7], SAN004: [9] };

// "Infusiones & Bebestibles" se separó otra vez en Bebestibles e Infusiones
const CATEGORIA_COMBINADA = 'Infusiones & Bebestibles';

export const USUARIOS_DEFAULT = [
  {
    // Acceso rápido para la evaluación: usuario "admin" / contraseña "admin" → panel de administración
    run: "111111111",
    usuario: "admin",
    nombre: "Admin",
    apellidos: "Papita Dulce",
    correo: "admin@papitadulce.cl",
    password: "admin",
    rol: "Administrador",
    region: "Región Metropolitana de Santiago",
    comuna: "Santiago",
    direccion: "Av. Papita Dulce 100"
  },
  {
    run: "190110222",
    nombre: "Alan",
    apellidos: "Brito Delgado",
    correo: "alan.brito@duoc.cl",
    password: "Admin@2026",
    rol: "Administrador",
    region: "Región Metropolitana de Santiago",
    comuna: "Santiago",
    direccion: "Av. España 123"
  },
  {
    run: "184561239",
    nombre: "Lola",
    apellidos: "Mento Rojas",
    correo: "lola.mento@profesor.duoc.cl",
    password: "Ventas#2026",
    rol: "Vendedor",
    region: "Región Metropolitana de Santiago",
    comuna: "Providencia",
    direccion: "Av. Providencia 456"
  },
  {
    run: "201239877",
    nombre: "Armando",
    apellidos: "Esteban Quito",
    correo: "armando.quito@gmail.com",
    password: "Cliente!2026",
    rol: "Cliente",
    region: "Región del Biobío",
    comuna: "Concepción",
    direccion: "Calle Prat 789"
  }
];

export const ORDENES_DEFAULT = [
  {
    id: "ORD-1001",
    numero: "#ORD-1001",
    fecha: "2026-06-01",
    cliente: "Alan Brito Delgado",
    correo: "alan.brito@duoc.cl",
    estado: "Enviado",
    montoTotal: "$39.800",
    total: 39800,
    items: "2x Torta Selva Negra ($39.800)",
    hora: "11:24",
    telefono: "+56 9 8765 4321",
    tipoEntrega: "despacho",
    entrega: "Av. España 123, Santiago",
    metodoPago: "tarjeta",
    detalle: [{ codigo: "TC002", nombre: "Torta Selva Negra", cantidad: 2, precio: 19900 }]
  },
  {
    id: "ORD-1002",
    numero: "#ORD-1002",
    fecha: "2026-06-02",
    cliente: "Lola Mento Rojas",
    correo: "lola.mento@profesor.duoc.cl",
    estado: "Pendiente",
    montoTotal: "$16.900",
    total: 16900,
    items: "1x Torta Panqueque Naranja ($16.900)",
    hora: "16:05",
    telefono: "+56 9 7654 3210",
    tipoEntrega: "despacho",
    entrega: "Av. Providencia 456, Providencia",
    metodoPago: "transferencia",
    detalle: [{ codigo: "TC001", nombre: "Torta Panqueque Naranja", cantidad: 1, precio: 16900 }]
  },
  {
    id: "ORD-1003",
    numero: "#ORD-1003",
    fecha: "2026-06-02",
    cliente: "Armando Esteban Quito",
    correo: "armando.quito@gmail.com",
    estado: "Cancelado",
    montoTotal: "$16.800",
    total: 16800,
    items: "6x Empolvados ($16.800)",
    hora: "10:40",
    telefono: "+56 9 6543 2109",
    tipoEntrega: "retiro",
    entrega: "Retiro en tienda",
    metodoPago: "efectivo",
    detalle: [{ codigo: "TF005", nombre: "Empolvados", cantidad: 6, precio: 2800 }]
  },
  {
    id: "ORD-1004",
    numero: "#ORD-1004",
    fecha: "2026-06-03",
    cliente: "Esteban Dido Bravo",
    correo: "esteban.dido@duoc.cl",
    estado: "Procesando",
    montoTotal: "$37.800",
    total: 37800,
    items: "2x Torta Trufa ($37.800)",
    hora: "18:32",
    telefono: "+56 9 5432 1098",
    tipoEntrega: "retiro",
    entrega: "Retiro en tienda",
    metodoPago: "tarjeta",
    detalle: [{ codigo: "TL004", nombre: "Torta Trufa", cantidad: 2, precio: 18900 }]
  },
  {
    id: "ORD-1005",
    numero: "#ORD-1005",
    fecha: "2026-06-04",
    cliente: "Elba Surita Valdés",
    correo: "elba.surita@gmail.com",
    estado: "Enviado",
    montoTotal: "$17.500",
    total: 17500,
    items: "1x Torta Tres Leches ($17.500)",
    hora: "13:15",
    telefono: "+56 9 4321 0987",
    tipoEntrega: "despacho",
    entrega: "Los Aromos 789, Ñuñoa",
    metodoPago: "tarjeta",
    detalle: [{ codigo: "TT003", nombre: "Torta Tres Leches", cantidad: 1, precio: 17500 }]
  }
];

// Obtener o Inicializar Productos
export function obtenerProductos() {
  const data = localStorage.getItem(PRODUCTOS_KEY);
  if (!data) {
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(PRODUCTOS_DEFAULT));
    return PRODUCTOS_DEFAULT;
  }
  try {
    const list = JSON.parse(data);
    // Si la lista tiene menos de 10 productos, re-inicializar con el catálogo completo
    if (!Array.isArray(list) || list.length < 10) {
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(PRODUCTOS_DEFAULT));
      localStorage.setItem(CATALOGO_VERSION_KEY, CATALOGO_VERSION);
      return PRODUCTOS_DEFAULT;
    }
    if (localStorage.getItem(CATALOGO_VERSION_KEY) !== CATALOGO_VERSION) {
      const codigos = new Set(list.map(p => p.codigo));
      const nuevos = PRODUCTOS_DEFAULT.filter(p => !codigos.has(p.codigo));
      const merged = [...list, ...nuevos].map(p => {
        const base = PRODUCTOS_DEFAULT.find(d => d.codigo === p.codigo);
        const stock = base && (STOCK_ANTERIOR[p.codigo] || []).includes(p.stock) ? base.stock : p.stock;
        const receta = Array.isArray(p.receta) ? p.receta : (base ? base.receta : []);
        const categoria = p.categoria === CATEGORIA_COMBINADA ? (base ? base.categoria : 'Bebestibles') : p.categoria;
        return { ...p, stock, receta, categoria };
      });
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(merged));
      localStorage.setItem(CATALOGO_VERSION_KEY, CATALOGO_VERSION);
      return merged;
    }
    return list;
  } catch {
    return PRODUCTOS_DEFAULT;
  }
}

export function guardarProductos(productos) {
  localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
}

// RUN de los usuarios de ejemplo guardados antes con el dígito verificador equivocado
const RUN_CORREGIDOS = { "19011022K": "190110222", "184561234": "184561239", "201239875": "201239877" };

// Obtener o Inicializar Usuarios.
// Si el navegador ya tenía usuarios guardados de una versión anterior, se agrega el usuario "admin" si falta.
export function obtenerUsuarios() {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(USUARIOS_DEFAULT));
    return USUARIOS_DEFAULT;
  }
  try {
    const lista = JSON.parse(data);
    if (!Array.isArray(lista)) return USUARIOS_DEFAULT;
    const corregida = lista.map((u) => ({ ...u, run: RUN_CORREGIDOS[u.run] || u.run }));
    if (!corregida.some((u) => u.usuario === 'admin')) {
      const conAdmin = [USUARIOS_DEFAULT[0], ...corregida];
      localStorage.setItem(USERS_KEY, JSON.stringify(conAdmin));
      return conAdmin;
    }
    return corregida;
  } catch {
    return USUARIOS_DEFAULT;
  }
}

export function guardarUsuarios(usuarios) {
  localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
}

// Obtener y Guardar Sesión de Usuario
export function obtenerSesionActiva() {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    const usuario = JSON.parse(data);
    return usuario && RUN_CORREGIDOS[usuario.run] ? { ...usuario, run: RUN_CORREGIDOS[usuario.run] } : usuario;
  } catch {
    return null;
  }
}

export function guardarSesionActiva(usuario) {
  if (usuario) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

// Obtener y Guardar Carrito
export function obtenerCarrito() {
  const data = localStorage.getItem(CART_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function guardarCarrito(carrito) {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

// Obtener y Guardar Órdenes
export function obtenerOrdenes() {
  const data = localStorage.getItem(ORDERS_KEY);
  if (!data) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(ORDENES_DEFAULT));
    return ORDENES_DEFAULT;
  }
  try {
    // Completa los campos que faltan en las órdenes de ejemplo guardadas antes
    const porId = Object.fromEntries(ORDENES_DEFAULT.map((o) => [o.id, o]));
    return JSON.parse(data).map((o) => ({ ...(porId[o.id] || {}), ...o }));
  } catch {
    return ORDENES_DEFAULT;
  }
}

export function guardarOrdenes(ordenes) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(ordenes));
}

// Categorías: se guardan desde services/categorias.js (panel admin) y la tienda las lee desde aquí
export { CATEGORIAS_KEY, CATEGORIAS_DEFAULT, obtenerCategorias, guardarCategorias } from './categorias';

// Artículos del blog
export function obtenerArticulos() {
  const data = localStorage.getItem(BLOG_KEY);
  if (!data) {
    localStorage.setItem(BLOG_KEY, JSON.stringify(ARTICULOS_DEFAULT));
    return ARTICULOS_DEFAULT;
  }
  try {
    const lista = JSON.parse(data);
    return Array.isArray(lista) ? lista : ARTICULOS_DEFAULT;
  } catch {
    return ARTICULOS_DEFAULT;
  }
}

export function guardarArticulos(articulos) {
  localStorage.setItem(BLOG_KEY, JSON.stringify(articulos));
}
