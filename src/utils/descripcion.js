// La descripción del producto se escribe con el editor Tiptap, así que es HTML. Como se muestra con
// dangerouslySetInnerHTML, SIEMPRE se sanitiza antes (DOMPurify). El servidor también la sanitiza al guardar.
import DOMPurify from 'dompurify';

// Mismas etiquetas que permite el servidor (SanitizadorHtml). Sin atributos: ni onclick, ni style, ni href.
const ETIQUETAS_PERMITIDAS = ['p', 'br', 'strong', 'b', 'em', 'i', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr'];

export const sanitizarHtml = (html) =>
  DOMPurify.sanitize(String(html || ''), { ALLOWED_TAGS: ETIQUETAS_PERMITIDAS, ALLOWED_ATTR: [] });

const tieneEtiquetas = (texto) => /<\/?[a-z][^>]*>/i.test(String(texto || ''));

const escaparHtml = (texto) => String(texto)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// HTML seguro para mostrar. Las descripciones antiguas (texto plano) se convierten en párrafos.
export function descripcionAHtml(descripcion) {
  const d = String(descripcion || '');
  if (!d.trim()) return '';
  if (tieneEtiquetas(d)) return sanitizarHtml(d);
  return `<p>${escaparHtml(d.trim()).replace(/\n/g, '<br>')}</p>`;
}

// Texto sin formato: para las tarjetas, el buscador y la descripción SEO
export function textoPlano(descripcion) {
  const d = String(descripcion || '');
  if (!tieneEtiquetas(d)) return d.replace(/\s+/g, ' ').trim();
  const conEspacios = sanitizarHtml(d).replace(/<\/(p|li|h2|h3|blockquote)>|<br\s*\/?>|<hr\s*\/?>/gi, ' $&');
  const texto = new DOMParser().parseFromString(conEspacios, 'text/html').body.textContent || '';
  return texto.replace(/\s+/g, ' ').trim();
}
