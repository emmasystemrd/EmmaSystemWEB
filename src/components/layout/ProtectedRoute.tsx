import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // No tiene token → mandar al login
    return <Navigate to="/login" replace />;
  }

  // Tiene token → mostrar la página solicitada
  return <Outlet />;
}