import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_MODE } from '@/lib/demo';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const isDemoMode = DEMO_MODE;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">
            {isDemoMode ? 'Modo Demo - Cargando...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  // In demo mode, auth is handled automatically
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
