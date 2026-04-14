import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { user, profile, loading, setAuth, setLoading, clear } = useAuthStore();

  useEffect(() => {
    console.log('[useAuth] Starting auth check...');

    // Check current session
    console.log('[useAuth] Fetching current user...');
    getCurrentUser()
      .then((data) => {
        console.log('[useAuth] getCurrentUser result:', data);
        if (data) {
          console.log('[useAuth] User authenticated, setting auth');
          setAuth(data.user, data.profile);
        } else {
          console.log('[useAuth] No user found, clearing auth');
          clear();
        }
      })
      .catch((error) => {
        console.error('[useAuth] getCurrentUser error:', error);
        clear();
      });

    // Listen for auth changes
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

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role,
    companyId: profile?.company_id,
  };
}
