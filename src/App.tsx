import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { LoginView } from '@/features/auth/LoginView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { LocationListView } from '@/features/locations/LocationListView';
import { LocationDetailView } from '@/features/locations/LocationDetailView';
import { PermitListView } from '@/features/permits/PermitListView';
import { PermitDetailView } from '@/features/permits/PermitDetailView';
import { RenewalTimelineView } from '@/features/renewals/RenewalTimelineView';
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { LegalReferenceView } from '@/features/legal/LegalReferenceView';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';

function OnboardingRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // If user already has company, redirect to dashboard
  if (profile?.company_id) {
    return <Navigate to="/" replace />;
  }

  return <OnboardingWizard />;
}

function ProtectedOnboardingRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a company, redirect to onboarding
  if (!profile?.company_id) {
    return <Navigate to="/setup" replace />;
  }

  return <AppShell />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />} />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <OnboardingRoute />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <ProtectedOnboardingRoute />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardView />} />
          <Route path="/sedes" element={<LocationListView />} />
          <Route path="/sedes/:id" element={<LocationDetailView />} />
          <Route path="/permisos" element={<PermitListView />} />
          <Route path="/permisos/:id" element={<PermitDetailView />} />
          <Route path="/renovaciones" element={<RenewalTimelineView />} />
          <Route path="/tareas" element={<TaskBoardView />} />
          <Route path="/marco-legal" element={<LegalReferenceView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
