import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AppLayout } from '@/components/layout-v2/AppLayout';
import { ProtectedRoute } from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { UI_VERSION } from '@/config';
import { LoginView } from '@/features/auth/LoginView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { DashboardView as DashboardViewV2 } from '@/features-v2/dashboard/DashboardView';
import { LocationListView } from '@/features/locations/LocationListView';
import { LocationDetailView } from '@/features/locations/LocationDetailView';
import { LocationDetailView as LocationDetailViewV2 } from '@/features-v2/locations/LocationDetailView';
import { LocationsListViewV2 } from '@/features-v2/locations/LocationsListViewV2';
import { PermitListView } from '@/features/permits/PermitListView';
import { PermitDetailView } from '@/features/permits/PermitDetailView';
import { RenewalTimelineView } from '@/features/renewals/RenewalTimelineView';
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { LegalReferenceView } from '@/features/legal/LegalReferenceView';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { IncrementalWizard } from '@/features-v2/onboarding-incremental/IncrementalWizard';
import { PublicVerificationPage } from '@/features-v2/public-links/PublicVerificationPage';
import { NetworkMapPage } from '@/features/network/NetworkMapPage';
import { DesignSystemView } from '@/features-v2/design-system/DesignSystemView';

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
    // Has profile and company, check if has locations
    // If has locations, redirect to dashboard (handled by ProtectedOnboardingRoute)
    initialStep = 'locations';
  } else if (profile?.full_name) {
    // Has profile but no company
    initialStep = 'company';
  } else {
    // No profile yet
    initialStep = 'profile';
  }

  return UI_VERSION === 'v2' ? (
    <IncrementalWizard initialStep={initialStep} />
  ) : (
    <OnboardingWizard />
  );
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

  // Use v2 layout with new sidebar, or v1 layout with old sidebar
  return UI_VERSION === 'v2' ? <AppLayout /> : <AppShell />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public verification page - no auth required */}
        <Route path="/p/:token" element={<PublicVerificationPage />} />
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
          <Route path="/" element={UI_VERSION === 'v2' ? <DashboardViewV2 /> : <DashboardView />} />
          <Route path="/sedes" element={UI_VERSION === 'v2' ? <LocationsListViewV2 /> : <LocationListView />} />
          <Route path="/sedes/:id" element={UI_VERSION === 'v2' ? <LocationDetailViewV2 /> : <LocationDetailView />} />
          <Route path="/mapa-red" element={<NetworkMapPage />} />
          <Route path="/permisos" element={<PermitListView />} />
          <Route path="/permisos/:id" element={<PermitDetailView />} />
          <Route path="/renovaciones" element={<RenewalTimelineView />} />
          <Route path="/tareas" element={<TaskBoardView />} />
          <Route path="/marco-legal" element={<LegalReferenceView />} />
          <Route path="/design-system" element={<DesignSystemView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
