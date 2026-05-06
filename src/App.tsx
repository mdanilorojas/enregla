import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { LoginView } from '@/features/auth/LoginView';
import { AuthCallback } from '@/features/auth/AuthCallback';
import { IncrementalWizard } from '@/features/onboarding-incremental/IncrementalWizard';
import { PublicVerificationPage } from '@/features/public-links/PublicVerificationPage';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { LocationsListViewV2 } from '@/features/locations/LocationsListViewV2';
import { LocationDetailView } from '@/features/locations/LocationDetailView';
import { PermitListView } from '@/features/permits/PermitListView';
import { PermitDetailView } from '@/features/permits/PermitDetailView';
import { RenewalGridView } from '@/features/renewals/RenewalGridView';
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { DocumentVaultView } from '@/features/documents/DocumentVaultView';
import { LegalReferenceView } from '@/features/legal/LegalReferenceView';
import { NetworkMapPage } from '@/features/network/NetworkMapPage';
import { DesignSystemView } from '@/features/design-system/DesignSystemView';
import { DesignSystemShowcase } from '@/features/design-system/DesignSystemShowcase';
import { SettingsView } from '@/features/settings/SettingsView';

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

  // Determine initial step based on profile state
  let initialStep: 'profile' | 'company' | 'locations' = 'profile';

  if (profile?.full_name && profile?.company_id) {
    initialStep = 'locations';
  } else if (profile?.full_name) {
    initialStep = 'company';
  } else {
    initialStep = 'profile';
  }

  return <IncrementalWizard initialStep={initialStep} />;
}

function ProtectedOnboardingRoute() {
  const { profile, loading } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

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

  // In demo mode, skip onboarding check and go straight to app
  if (isDemoMode) {
    return <AppLayout />;
  }

  // If user doesn't have a company, redirect to onboarding
  if (!profile?.company_id) {
    return <Navigate to="/setup" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public verification page - no auth required */}
        <Route path="/p/:token" element={<PublicVerificationPage />} />
        <Route
          path="/login"
          element={
            isDemoMode ? (
              loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-600 font-medium">Modo Demo - Cargando...</p>
                  </div>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
            )
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
          <Route path="/sedes" element={<LocationsListViewV2 />} />
          <Route path="/sedes/:id" element={<LocationDetailView />} />
          <Route path="/mapa-red" element={<NetworkMapPage />} />
          <Route path="/permisos" element={<PermitListView />} />
          <Route path="/permisos/:id" element={<PermitDetailView />} />
          <Route path="/renovaciones" element={<RenewalGridView />} />
          <Route path="/tareas" element={<TaskBoardView />} />
          <Route path="/documentos" element={<DocumentVaultView />} />
          <Route path="/marco-legal" element={<LegalReferenceView />} />
          <Route path="/design-system" element={<DesignSystemView />} />
          <Route path="/design-system-showcase" element={<DesignSystemShowcase />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/settings/notifications" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
