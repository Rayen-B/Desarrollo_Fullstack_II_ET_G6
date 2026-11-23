// CloudFront Function (evento "viewer request") para el comportamiento por defecto (el front en S3).
// React Router maneja las rutas en el navegador: si alguien recarga /producto/TC001, S3 no tiene ese archivo.
// Esta función responde index.html para cualquier ruta sin extensión.
// No se usan "páginas de error" de CloudFront porque también cambiarían los 403/404 del API por index.html.
function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
