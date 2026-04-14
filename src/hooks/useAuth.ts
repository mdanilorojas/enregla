import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser, logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

// Global flag to ensure auth check only happens once
let authInitialized = false;
let authSubscription: any = null;

export function useAuth() {
  const { user, profile, loading, setAuth, setLoading, clear } = useAuthStore();

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
            console.log('[useAuth] Getting profile for user:', session.user.email);
            console.log('[useAuth] Step 1: Starting profile fetch...');

            try {
              // Add timeout to profile fetch
              const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .limit(1);

              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
              );

              console.log('[useAuth] Step 2: Waiting for profile response...');
              const { data: profiles, error } = await Promise.race([
                profilePromise,
                timeoutPromise
              ]) as any;

              console.log('[useAuth] Step 3: Profile response received');

              if (error) {
                console.error('[useAuth] Profile fetch error:', error);
                setAuth(session.user, null as any);
                return;
              }

              if (profiles && profiles.length > 0) {
                console.log('[useAuth] Step 4: Profile found, setting auth');
                setAuth(session.user, profiles[0]);
              } else {
                console.warn('[useAuth] Step 4: No profile found for user');
                setAuth(session.user, null as any);
              }
            } catch (err) {
              console.error('[useAuth] Profile fetch failed:', err instanceof Error ? err.message : err);
              // Still set the user even without profile
              setAuth(session.user, null as any);
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
