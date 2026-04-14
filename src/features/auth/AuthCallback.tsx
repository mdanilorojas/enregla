import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

/**
 * OAuth callback handler
 * Handles the redirect from Google OAuth
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          navigate('/login', { replace: true });
          return;
        }

        if (!session) {
          console.error('No session found');
          navigate('/login', { replace: true });
          return;
        }

        // Fetch or create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, redirect to onboarding
          if (profileError.code === 'PGRST116') {
            // Store user temporarily and redirect to onboarding
            setAuth(session.user, null);
            navigate('/onboarding', { replace: true });
            return;
          }
          throw profileError;
        }

        // Set auth state and redirect to dashboard
        setAuth(session.user, profile);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[14px] text-gray-600 font-medium">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}
