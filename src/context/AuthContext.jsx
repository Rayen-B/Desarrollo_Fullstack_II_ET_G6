import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerSesionActiva, guardarSesionActiva, obtenerUsuarios, guardarUsuarios } from '../services/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerSesionActiva());
  const [usuariosDB, setUsuariosDB] = useState(() => obtenerUsuarios());

  useEffect(() => {
    guardarSesionActiva(usuario);
  }, [usuario]);

  useEffect(() => {
    guardarUsuarios(usuariosDB);
  }, [usuariosDB]);

  // El identificador puede ser el correo o el nombre de usuario (ej: "admin")
  const iniciarSesion = (identificador, password) => {
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

  // "Mi Perfil": actualiza los datos del usuario conectado en la sesión y en la lista de usuarios
  const actualizarPerfil = (cambios) => {
    if (!usuario) return { exito: false, mensaje: 'No hay una sesión iniciada.' };
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
    setUsuario(null);
  };

  // "Probar Rol": cambia el rol del usuario con sesión iniciada

  const cambiarRolActivo = (nuevoRol) => {
    setUsuario((actual) => (actual ? { ...actual, rol: nuevoRol } : actual));
  };

  // Registra un cliente nuevo (no inicia sesión automáticamente)
  const registrarUsuario = (nuevoUsr) => {
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
        actualizarPerfil
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
