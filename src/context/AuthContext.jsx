import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerSesionActiva, guardarSesionActiva, obtenerUsuarios, guardarUsuarios } from '../services/storage';
import { modoServidor } from '../config';
import { obtenerRefresh, guardarTokens, borrarToken, sesionRecuperable } from '../services/sesion';
import { EVENTO_SESION_EXPIRADA } from '../services/api';
import {
  iniciarSesionServidor, registrarServidor, actualizarPerfilServidor, listarUsuariosServidor, cerrarSesionServidor
} from '../services/auth';
import { cargarOrdenesServidor, limpiarOrdenesLocales } from '../services/ordenesServidor';

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
export const mensajeDeError = (e) => (e && e.status === 0 ? MENSAJE_SIN_CONEXION : (e && e.message) || 'Ocurrió un error inesperado.');

// En modo servidor la sesión sigue al recargar mientras el JWT esté vigente o haya un refreshToken para renovarlo
const leerSesionInicial = () => {
  const sesion = obtenerSesionActiva();
  if (modoServidor() && sesion && !sesionRecuperable()) {
    borrarToken();
    return null;
  }
  return sesion;
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesionInicial);
  const [usuariosDB, setUsuariosDB] = useState(() => obtenerUsuarios());

  useEffect(() => {
    guardarSesionActiva(usuario);
  }, [usuario]);

  useEffect(() => {
    guardarUsuarios(usuariosDB);
  }, [usuariosDB]);

  // El servidor rechazó el token (venció o no es válido): se cierra la sesión
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // En modo servidor, el Administrador ve la lista real de usuarios del servidor (sin contraseñas)
  const recargarUsuariosServidor = async () => {
    const lista = await listarUsuariosServidor();
    if (Array.isArray(lista)) setUsuariosDB(lista);
    return lista;
  };

  useEffect(() => {
    if (!modoServidor() || !usuario || usuario.rol !== 'Administrador' || !sesionRecuperable()) return undefined;
    let activo = true;
    listarUsuariosServidor()
      .then((lista) => { if (activo && Array.isArray(lista)) setUsuariosDB(lista); })
      .catch(() => { /* sin servidor se conserva la lista local */ });
    return () => { activo = false; };
  }, [usuario?.id, usuario?.rol]); // eslint-disable-line react-hooks/exhaustive-deps

  // En modo servidor las órdenes del usuario (o todas, si es Vendedor/Administrador) vienen del servidor
  useEffect(() => {
    if (!modoServidor() || !usuario || !sesionRecuperable()) return;
    cargarOrdenesServidor(usuario.rol).catch(() => { /* sin servidor se conserva la copia local */ });
  }, [usuario?.id, usuario?.rol]); // eslint-disable-line react-hooks/exhaustive-deps

  // Modo servidor: el servidor valida la contraseña y entrega el JWT y el refreshToken
  const iniciarSesionConServidor = async (identificador, password) => {
    try {
      const respuesta = await iniciarSesionServidor(String(identificador || '').trim(), password);
      guardarTokens(respuesta);
      setUsuario(respuesta.usuario);
      return { exito: true, usuario: respuesta.usuario };
    } catch (e) {
      return { exito: false, mensaje: mensajeDeError(e) };
    }
  };

  const registrarEnServidor = async (nuevoUsr) => {
    if (!nuevoUsr.correo || !nuevoUsr.password || !nuevoUsr.nombre) {
      return { exito: false, mensaje: 'Completa todos los campos obligatorios.' };
    }
    try {
      const creado = await registrarServidor({
        ...nuevoUsr,
        nombre: String(nuevoUsr.nombre).trim(),
        correo: String(nuevoUsr.correo).trim()
      });
      return { exito: true, usuario: creado, mensaje: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' };
    } catch (e) {
      return { exito: false, mensaje: mensajeDeError(e) };
    }
  };

  // El identificador puede ser el correo o el nombre de usuario (ej: "admin")
  // En modo local devuelve el resultado al instante; en modo servidor devuelve una promesa con el mismo formato.
  const iniciarSesion = (identificador, password) => {
    if (modoServidor()) return iniciarSesionConServidor(identificador, password);
    const id = String(identificador || '').trim().toLowerCase();
    const usr = usuariosDB.find(
      (u) => (u.correo.toLowerCase() === id || (u.usuario && u.usuario.toLowerCase() === id)) && u.password === password
    );
    if (usr) {
      setUsuario(usr);
      return { exito: true, usuario: usr };
    }
    return { exito: false, mensaje: "Usuario o contraseña incorrectos." };
  };

  // Recuperación de contraseña: verifica que el correo esté registrado
  const solicitarRecuperacion = (correo) => {
    if (modoServidor()) {
      // No se revela si el correo existe (evita descubrir qué cuentas están registradas)
      return { exito: true, mensaje: 'Si el correo está registrado, te enviaremos instrucciones de recuperación.' };
    }
    const correoNormalizado = String(correo || '').trim().toLowerCase();
    const usr = usuariosDB.find((u) => u.correo.toLowerCase() === correoNormalizado);
    if (!usr) {
      return { exito: false, mensaje: 'No encontramos una cuenta con ese correo.' };
    }
    return {
      exito: true,
      mensaje: 'Te enviamos instrucciones de recuperación a ' + usr.correo 
    };
  };

  // Modo servidor: se espera la respuesta; si el servidor rechaza el cambio, no se modifica nada en el navegador
  const actualizarPerfilEnServidor = async (cambios) => {
    try {
      const actualizado = await actualizarPerfilServidor({ ...usuario, ...cambios });
      setUsuario((actual) => ({ ...actual, ...actualizado }));
      return { exito: true, usuario: actualizado };
    } catch (e) {
      return { exito: false, mensaje: mensajeDeError(e) };
    }
  };

  // "Mi Perfil": actualiza los datos del usuario conectado en la sesión y en la lista de usuarios
  // En modo local devuelve el resultado al instante; en modo servidor devuelve una promesa con el mismo formato.
  const actualizarPerfil = (cambiosCompletos) => {
    if (!usuario) return { exito: false, mensaje: 'No hay una sesión iniciada.' };
    // En modo servidor la contraseña nunca se guarda en el navegador (se cambia con /perfil/password)
    const { passwordActual, ...conPassword } = cambiosCompletos;
    const { password: passwordNueva, ...sinPassword } = conPassword;
    if (modoServidor()) return actualizarPerfilEnServidor(sinPassword);
    const cambios = conPassword;
    const correoNuevo = String(cambios.correo || usuario.correo).trim().toLowerCase();
    const esElMismo = (u) => (usuario.run && u.run ? u.run === usuario.run : u.correo.toLowerCase() === usuario.correo.toLowerCase());
    if (usuariosDB.some((u) => !esElMismo(u) && u.correo.toLowerCase() === correoNuevo)) {
      return { exito: false, mensaje: 'Ese correo ya está registrado por otro usuario.' };
    }
    const actualizado = { ...usuario, ...cambios, correo: correoNuevo };
    setUsuariosDB(usuariosDB.map((u) => (esElMismo(u) ? { ...u, ...cambios, correo: correoNuevo } : u)));
    setUsuario(actualizado);
    return { exito: true, usuario: actualizado };
  };

  const cerrarSesion = () => {
    const refreshToken = obtenerRefresh();
    borrarToken();
    if (modoServidor()) {
      cerrarSesionServidor(refreshToken);
      limpiarOrdenesLocales();
    }
    setUsuario(null);
  };

  // "Probar Rol": cambia el rol del usuario con sesión iniciada

  const cambiarRolActivo = (nuevoRol) => {
    setUsuario((actual) => (actual ? { ...actual, rol: nuevoRol } : actual));
  };

  // Registra un cliente nuevo (no inicia sesión automáticamente)
  const registrarUsuario = (nuevoUsr) => {
    if (modoServidor()) return registrarEnServidor(nuevoUsr);
    const correo = String(nuevoUsr.correo || '').trim().toLowerCase();
    if (!correo || !nuevoUsr.password || !nuevoUsr.nombre) {
      return { exito: false, mensaje: 'Completa todos los campos obligatorios.' };
    }
    if (usuariosDB.some((u) => u.correo.toLowerCase() === correo)) {
      return { exito: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }
    if (nuevoUsr.run && usuariosDB.some((u) => u.run && u.run.toUpperCase() === nuevoUsr.run.toUpperCase())) {
      return { exito: false, mensaje: 'El RUN ingresado ya se encuentra registrado.' };
    }
    const usuarioCompleto = { ...nuevoUsr, correo, nombre: nuevoUsr.nombre.trim(), rol: nuevoUsr.rol || 'Cliente' };
    setUsuariosDB([...usuariosDB, usuarioCompleto]);
    return { exito: true, usuario: usuarioCompleto, mensaje: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' };
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuariosDB,
        setUsuariosDB,
        iniciarSesion,
        cerrarSesion,
        cambiarRolActivo,
        registrarUsuario,
        solicitarRecuperacion,
        actualizarPerfil,
        recargarUsuariosServidor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
