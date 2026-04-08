import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/store';
import { LoginView } from '@/features/auth/LoginView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { LocationListView } from '@/features/locations/LocationListView';
import { LocationDetailView } from '@/features/locations/LocationDetailView';
import { PermitListView } from '@/features/permits/PermitListView';
import { RenewalTimelineView } from '@/features/renewals/RenewalTimelineView';
import { DocumentVaultView } from '@/features/documents/DocumentVaultView';
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { LegalReferenceView } from '@/features/legal/LegalReferenceView';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';

export default function App() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />} />
        <Route path="/setup" element={<OnboardingWizard />} />
        {!isAuthenticated ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : !isOnboarded ? (
          <Route path="*" element={<Navigate to="/setup" replace />} />
        ) : (
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/sedes" element={<LocationListView />} />
            <Route path="/sedes/:id" element={<LocationDetailView />} />
            <Route path="/permisos" element={<PermitListView />} />
            <Route path="/renovaciones" element={<RenewalTimelineView />} />
            <Route path="/documentos" element={<DocumentVaultView />} />
            <Route path="/tareas" element={<TaskBoardView />} />
            <Route path="/marco-legal" element={<LegalReferenceView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
