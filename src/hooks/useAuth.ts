import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser, signOut as apiSignOut } from '@/lib/api/auth';
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
    console.log('[useAuth] First initialization - checking auth...');

    // Check current session
    getCurrentUser()
      .then((data) => {
        console.log('[useAuth] getCurrentUser result:', data);
        if (data) {
          console.log('[useAuth] User authenticated');
          setAuth(data.user, data.profile);
        } else {
          console.log('[useAuth] No user found');
          clear();
        }
      })
      .catch((error) => {
        console.error('[useAuth] getCurrentUser error:', error);
        clear();
      });

    // Listen for auth changes (only once)
    if (!authSubscription) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[useAuth] Auth state changed:', event);
          if (event === 'SIGNED_IN' && session) {
            const userData = await getCurrentUser();
            if (userData) {
              setAuth(userData.user, userData.profile);
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
    await apiSignOut();
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
