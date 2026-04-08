import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/store';
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
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<OnboardingWizard />} />
        {!isOnboarded ? (
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
