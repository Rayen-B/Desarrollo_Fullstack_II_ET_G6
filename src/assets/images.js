// Importa todas las imágenes de assets/images. La clave es la ruta sin extensión: images['menu/Torta_Trufa']
const modulos = import.meta.glob('./images/**/*.{png,jpg,jpeg,webp,jfif,svg}', {
  eager: true,
  import: 'default'
});

const images = {};
for (const ruta in modulos) {
  const clave = ruta
    .replace('./images/', '')    // quitar la carpeta base
    .replace(/\.[^/.]+$/, '');   // quitar la extensión
  images[clave] = modulos[ruta];
}

export default images;

// Devuelve la URL de una imagen a partir de su clave o de una ruta guardada
export function obtenerImagen(ruta) {
  if (!ruta) return images.imgc1;
  if (/^(data:|https?:|blob:)/.test(ruta)) return ruta;
  const clave = ruta
    .replace(/^(\.\.\/|\/)+/, '')
    .replace(/^(papitadulce\/img\/|assets\/images\/|img\/)/, '')
    .replace(/\.[^/.]+$/, '');
  const directa = images[clave] || images[ruta];
  if (directa) return directa;

  const claveMinuscula = clave.toLowerCase();
  const claveCompatible = Object.keys(images).find((nombre) =>
    nombre.toLowerCase() === claveMinuscula || nombre.toLowerCase().startsWith(`${claveMinuscula}.`)
  );
  return (claveCompatible && images[claveCompatible]) || images.imgc1;
}
