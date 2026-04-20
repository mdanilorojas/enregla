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
            console.log('[useAuth] SIGNED_IN event - fetching real profile');

            // Fetch real profile from database
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('[useAuth] Profile fetch error:', profileError);

                // User doesn't have a profile yet - needs onboarding
                if (profileError.code === 'PGRST116') {
                  console.log('[useAuth] No profile found - user needs onboarding');
                  // Set user without profile to allow redirect to /setup
                  setAuth(session.user, null);
                } else {
                  throw profileError;
                }
              } else {
                console.log('[useAuth] Profile loaded successfully');
                setAuth(session.user, profileData);
              }
            } catch (error) {
              console.error('[useAuth] Failed to load profile:', error);
              // On error, set user without profile (allows retry)
              setAuth(session.user, null);
            }
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
