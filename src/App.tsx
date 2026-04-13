import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/Auth';
import { useAppStore } from '@/store';
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

function ProtectedOnboardingRoute() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  if (!isOnboarded) {
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
              <OnboardingWizard />
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
