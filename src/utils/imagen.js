// Reduce y convierte a WebP la foto de un producto ANTES de subirla (una foto de celular pesa varios MB).
// Si el navegador no puede hacerlo, o el resultado no es más liviano, se sube el archivo original.
export async function comprimirImagen(archivo, { maxLado = 1200, calidad = 0.8 } = {}) {
  try {
    if (!archivo || !/^image\/(jpeg|png|webp)$/.test(archivo.type)) return archivo; // GIF se deja intacto (animaciones)
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return archivo;

    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height)); // solo reduce, nunca agranda
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return archivo;
    contexto.drawImage(bitmap, 0, 0, ancho, alto);
    if (typeof bitmap.close === 'function') bitmap.close();

    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/webp', calidad));
    if (!blob || blob.size >= archivo.size) return archivo;
    const nombre = String(archivo.name || 'imagen').replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], nombre, { type: 'image/webp' });
  } catch {
    return archivo;
  }
}
