import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { useAuth } from '../context/AuthContext';
import FormLogin from '../components/organisms/FormLogin';

// Vista /login. Con sesión ya iniciada redirige: personal → /admin, clientes → inicio.
export default function Login() {
  useSeo({ titulo: 'Iniciar sesión', descripcion: 'Ingresa a tu cuenta de Papita Dulce.', noindex: true });
  const { usuario } = useAuth();
  if (usuario) return <Navigate to={usuario.rol === 'Cliente' ? '/' : '/admin'} replace />;
  return (
    <section>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="text-center mb-4"><span className="slbl">Bienvenido/a</span><h1 className="stitle">Iniciar sesión</h1><div className="sline"></div></div>
        <div className="p-4 bg-white rounded-4 shadow-sm"><FormLogin /></div>
      </div>
    </section>
  );
}
