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
import { LegalIndexView } from '@/features/legal/LegalIndexView';
import { LegalPermitDetailView } from '@/features/legal/LegalPermitDetailView';
import { NetworkMapPage } from '@/features/network/NetworkMapPage';
import { DesignSystemView } from '@/features/design-system/DesignSystemView';
import { DesignSystemShowcase } from '@/features/design-system/DesignSystemShowcase';
import { SettingsView } from '@/features/settings/SettingsView';
import { AppLoader } from '@/components/ui/app-loader';

function OnboardingRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
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
    return <AppLoader />;
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
                <AppLoader message="Modo Demo - Cargando..." />
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
          <Route path="/marco-legal" element={<LegalIndexView />} />
          <Route path="/marco-legal/:permitType" element={<LegalPermitDetailView />} />
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
