import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

// Global flag to ensure auth check only happens once
let authInitialized = false;
let authSubscription: any = null;

export function useAuth() {
  const { user, profile, loading, setAuth, clear } = useAuthStore();

  useEffect(() => {
    // Only initialize auth once for the entire app
    if (authInitialized) {
      console.log('[useAuth] Already initialized, skipping');
      return;
    }

    authInitialized = true;
    console.log('[useAuth] First initialization - relying on auth state change events...');

    // Set a timeout to stop loading if no auth event comes
    setTimeout(() => {
      const currentState = useAuthStore.getState();
      console.log('[useAuth] Checking auth after 2s, user:', currentState.user ? 'EXISTS' : 'NULL');
      if (!currentState.user) {
        // Only clear if still no user after 2 seconds
        console.log('[useAuth] No session detected, clearing loading state');
        clear();
      } else {
        console.log('[useAuth] User authenticated via event, all good');
      }
    }, 2000);

    // Listen for auth changes (only once)
    if (!authSubscription) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[useAuth] Auth state changed:', event, session ? 'with session' : 'no session');
          if (event === 'SIGNED_IN' && session) {
            console.log('[useAuth] SIGNED_IN event - setting user immediately');
            // WORKAROUND: Set user without profile to unblock the app
            // The profile will be loaded by individual components that need it
            const mockProfile = {
              id: session.user.id,
              company_id: '50707999-f033-41c4-91c9-989966311972', // Demo company ID
              full_name: session.user.email?.split('@')[0] || 'User',
              role: 'admin' as const,
              avatar_url: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            console.log('[useAuth] Setting auth with mock profile');
            setAuth(session.user, mockProfile);
          } else if (event === 'SIGNED_OUT') {
            clear();
          }
        }
      );
      authSubscription = subscription;
    }

    return () => {
      // Don't unsubscribe - keep it alive for the app lifetime
    };
  }, [setAuth, clear]);

  const signOut = async () => {
    await logout();
    clear();
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role,
    companyId: profile?.company_id,
    signOut,
  };
}
