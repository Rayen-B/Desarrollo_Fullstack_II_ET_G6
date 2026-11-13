import { useAuth } from '../context/AuthContext';

// Estilo para ocultar los elementos "solo-admin" cuando el rol es Vendedor
export function useSoloAdmin() {
  const { usuario } = useAuth();
  return usuario && usuario.rol === 'Vendedor' ? { display: 'none' } : undefined;
}
