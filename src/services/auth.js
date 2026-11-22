// Usuarios y sesión contra usuario-service (a través del gateway)
import { http } from './api';
import { obtenerRefresh } from './sesion';

const BASE = '/api/v1';
const vacioANull = (valor) => (valor === '' || valor === undefined ? null : valor);

// Devuelve { accessToken, refreshToken, tipo, expiraEn, usuario }
export const iniciarSesionServidor = (identificador, password) =>
  http(`${BASE}/auth/login`, { method: 'POST', body: { identificador, password } });

export const registrarServidor = (datos) =>
  http(`${BASE}/auth/registro`, {
    method: 'POST',
    body: {
      nombre: datos.nombre,
      correo: datos.correo,
      password: datos.password,
      region: datos.region,
      comuna: datos.comuna,
      apellidos: datos.apellidos || '',
      run: vacioANull(datos.run),
      direccion: datos.direccion || '',
      fechaNacimiento: vacioANull(datos.fechaNacimiento)
    }
  });

// Anula el refreshToken en el servidor; si falla igual se cierra la sesión en el navegador
export function cerrarSesionServidor(refreshToken = obtenerRefresh()) {
  if (!refreshToken) return Promise.resolve();
  return http(`${BASE}/auth/logout`, { method: 'POST', body: { refreshToken } }).catch(() => null);
}

// ---- Mi perfil (cualquier usuario con sesión) ----
export const obtenerPerfilServidor = () => http(`${BASE}/usuarios/perfil`);

export const actualizarPerfilServidor = (datos) =>
  http(`${BASE}/usuarios/perfil`, {
    method: 'PUT',
    body: {
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      correo: datos.correo,
      region: datos.region,
      comuna: datos.comuna,
      direccion: datos.direccion,
      fechaNacimiento: vacioANull(datos.fechaNacimiento)
    }
  });

export const cambiarPasswordServidor = (actual, nueva) =>
  http(`${BASE}/usuarios/perfil/password`, { method: 'PUT', body: { actual, nueva } });

// ---- Solo Administrador (los usuarios se identifican por id) ----
export const listarUsuariosServidor = () => http(`${BASE}/usuarios`);
export const crearUsuarioServidor = (usuario) => http(`${BASE}/usuarios`, { method: 'POST', body: cuerpoUsuario(usuario) });
export const actualizarUsuarioServidor = (id, usuario) =>
  http(`${BASE}/usuarios/${encodeURIComponent(id)}`, { method: 'PUT', body: cuerpoUsuario(usuario) });
export const eliminarUsuarioServidor = (id) => http(`${BASE}/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' });

function cuerpoUsuario(u) {
  return {
    run: String(u.run || '').trim().toUpperCase(),
    rol: u.rol || 'Cliente',
    nombre: u.nombre || '',
    apellidos: u.apellidos || '',
    correo: u.correo || '',
    password: u.password || '',
    fechaNacimiento: vacioANull(u.fechaNacimiento),
    region: u.region || '',
    comuna: u.comuna || '',
    direccion: u.direccion || ''
  };
}
