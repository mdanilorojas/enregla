import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_MODE } from '@/lib/demo';
import { AppLoader } from '@/components/ui/app-loader';
import { useCompany, getEffectiveStatus } from '@/hooks/useCompany';

const LoginView = lazy(() => import('@/features/auth/LoginView').then((m) => ({ default: m.LoginView })));
const AuthCallback = lazy(() => import('@/features/auth/AuthCallback').then((m) => ({ default: m.AuthCallback })));
const AuthTest = lazy(() => import('@/features/auth/AuthTest').then((m) => ({ default: m.AuthTest })));
const ForgotPasswordView = lazy(() => import('@/features/auth/ForgotPasswordView').then((m) => ({ default: m.ForgotPasswordView })));
const ResetPasswordView = lazy(() => import('@/features/auth/ResetPasswordView').then((m) => ({ default: m.ResetPasswordView })));
const AcceptInvitationView = lazy(() => import('@/features/auth/AcceptInvitationView').then((m) => ({ default: m.AcceptInvitationView })));
const IncrementalWizard = lazy(() => import('@/features/onboarding-incremental/IncrementalWizard').then((m) => ({ default: m.IncrementalWizard })));
const PublicVerificationPage = lazy(() => import('@/features/public-links/PublicVerificationPage').then((m) => ({ default: m.PublicVerificationPage })));
const DashboardView = lazy(() => import('@/features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })));
const LocationsListViewV2 = lazy(() => import('@/features/locations/LocationsListViewV2').then((m) => ({ default: m.LocationsListViewV2 })));
const LocationDetailView = lazy(() => import('@/features/locations/LocationDetailView').then((m) => ({ default: m.LocationDetailView })));
const PermitListView = lazy(() => import('@/features/permits/PermitListView').then((m) => ({ default: m.PermitListView })));
const PermitDetailView = lazy(() => import('@/features/permits/PermitDetailView').then((m) => ({ default: m.PermitDetailView })));
const PermitCreateView = lazy(() => import('@/features/permits/PermitCreateView').then((m) => ({ default: m.PermitCreateView })));
const RenewalGridView = lazy(() => import('@/features/renewals/RenewalGridView').then((m) => ({ default: m.RenewalGridView })));
const LegalIndexView = lazy(() => import('@/features/legal/LegalIndexView').then((m) => ({ default: m.LegalIndexView })));
const LegalMatrixView = lazy(() => import('@/features/legal/LegalMatrixView').then((m) => ({ default: m.LegalMatrixView })));
const LegalPermitDetailView = lazy(() => import('@/features/legal/LegalPermitDetailView').then((m) => ({ default: m.LegalPermitDetailView })));
const NetworkMapPage = lazy(() => import('@/features/network/NetworkMapPage').then((m) => ({ default: m.NetworkMapPage })));
const DesignSystemView = lazy(() => import('@/features/design-system/DesignSystemView').then((m) => ({ default: m.DesignSystemView })));
const DesignSystemShowcase = lazy(() => import('@/features/design-system/DesignSystemShowcase').then((m) => ({ default: m.DesignSystemShowcase })));
const SettingsView = lazy(() => import('@/features/settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const PaywallView = lazy(() => import('@/features/billing/PaywallView').then((m) => ({ default: m.PaywallView })));
const PrivacyPolicyView = lazy(() => import('@/features/legal-pages/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView })));
const TermsView = lazy(() => import('@/features/legal-pages/TermsView').then((m) => ({ default: m.TermsView })));

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
  const { data: company, isLoading: companyLoading } = useCompany(profile?.company_id);
  const isDemoMode = DEMO_MODE;

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

  // Mientras carga company, mostrar loader (evita flash de bloqueo)
  if (companyLoading || !company) {
    return <AppLoader />;
  }

  // Bloqueo total cuando trial expirado o suspendido
  const status = getEffectiveStatus(company);
  if (status === 'expired' || status === 'suspended') {
    return <Navigate to="/pago" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const isDemoMode = DEMO_MODE;

  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
        <Routes>
          {/* Public verification page - no auth required */}
          <Route path="/p/:token" element={<PublicVerificationPage />} />
          <Route path="/privacidad" element={<PrivacyPolicyView />} />
          <Route path="/terminos" element={<TermsView />} />
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
          <Route path="/auth-test" element={<AuthTest />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route path="/pago" element={<PaywallView />} />
          <Route path="/aceptar-invitacion" element={<AcceptInvitationView />} />
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
            <Route path="/permisos/nuevo" element={<PermitCreateView />} />
            <Route path="/permisos/:id" element={<PermitDetailView />} />
            <Route path="/renovaciones" element={<RenewalGridView />} />
            <Route path="/marco-legal" element={<LegalIndexView />} />
            <Route path="/marco-legal/matriz" element={<LegalMatrixView />} />
            <Route path="/marco-legal/:permitType" element={<LegalPermitDetailView />} />
            <Route path="/design-system" element={<DesignSystemView />} />
            <Route path="/design-system-showcase" element={<DesignSystemShowcase />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/notifications" element={<SettingsView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
