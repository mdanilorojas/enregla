import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLoader } from '@/components/ui/app-loader';
import { DEMO_MODE } from '@/lib/demo';

/** Guard staff-only. Redirige a la app de cliente a cualquier no-staff.
 *  En DEMO_MODE (entorno local de prueba) se permite el acceso para previsualizar. */
export function StaffRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!DEMO_MODE && !profile?.is_staff) return <Navigate to="/" replace />;

  return <>{children}</>;
}
