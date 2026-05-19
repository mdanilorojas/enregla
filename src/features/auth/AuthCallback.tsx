import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Database } from '@/types/database';
import { Loader2, Shield, XCircle } from '@/lib/lucide-icons';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function AuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let errorRedirectTimer: ReturnType<typeof setTimeout> | null = null;
    const t0 = performance.now();
    const log = (msg: string, extra?: unknown) => {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      console.log(`[AuthCallback +${elapsed}s] ${msg}`, extra ?? '');
    };
    log('mount; url=', window.location.href);

    const proceedWithSession = async (userId: string) => {
      log('proceedWithSession start', { userId });

      // Timeout defensivo: si el query nunca resuelve seguimos sin profile.
      // useAuth.onAuthStateChange también dispara un fetch de profiles en paralelo;
      // el cliente Supabase a veces se queda colgado en el segundo request con
      // el mismo session. Mejor seguir y dejar que useAuth termine de hidratar.
      const profileFetch = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();

      const timeoutPromise = new Promise<{ data: null; error: { code: string; message: string } }>(
        (resolve) =>
          setTimeout(
            () =>
              resolve({
                data: null,
                error: { code: 'TIMEOUT', message: 'profile fetch took too long' },
              }),
            5000
          )
      );

      const result = await Promise.race([profileFetch, timeoutPromise]);
      const profile = result.data as ProfileRow | null;
      const profileError = result.error as { code?: string; message?: string } | null;

      log('profile fetch done', { hasProfile: !!profile, errCode: profileError?.code });
      if (cancelled) return;

      if (profileError && profileError.code !== 'PGRST116' && profileError.code !== 'TIMEOUT') {
        console.error('[AuthCallback] Profile fetch error:', profileError);
      }

      // Si el getUser cuelga también (mismo bug del cliente Supabase), seguimos
      // con session.user que ya tenemos.
      const userPromise = supabase.auth.getUser();
      const userTimeout = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 3000)
      );
      const { data: { user: fetchedUser } } = await Promise.race([userPromise, userTimeout]);
      log('getUser done', { hasUser: !!fetchedUser });
      const fallbackUser = fetchedUser ?? (await supabase.auth.getSession()).data.session?.user ?? null;

      if (cancelled || !fallbackUser) {
        log('proceedWithSession aborted', { cancelled, hasUser: !!fallbackUser });
        return;
      }

      setAuth(fallbackUser, profile ?? null);
      log('setAuth done; redirecting', { destination: profile?.company_id ? '/' : '/setup' });

      if (profile?.company_id) {
        navigate('/', { replace: true });
      } else {
        navigate('/setup', { replace: true, state: { fromOAuth: true } });
      }
    };

    const handleAuthError = async (rawErr: unknown, source: string) => {
      console.error(`[AuthCallback] Error from ${source}:`, rawErr);

      const rawMsg = rawErr instanceof Error ? rawErr.message : String(rawErr);
      const isPkceMissing =
        rawMsg.includes('PKCE') ||
        rawMsg.includes('code verifier') ||
        rawMsg.includes('flow state') ||
        (rawErr as { name?: string })?.name === 'AuthPKCECodeVerifierMissingError';

      if (isPkceMissing) {
        try {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('sb-') || key === 'enregla-auth-token' || key.includes('code-verifier')) {
              localStorage.removeItem(key);
            }
          }
        } catch (cleanupErr) {
          console.error('[AuthCallback] Cleanup failed:', cleanupErr);
        }
        if (!cancelled) navigate('/login', { replace: true, state: { reason: 'pkce-reset' } });
        return;
      }

      if (cancelled) return;
      setError(rawMsg || 'Error al procesar la autenticación');
      errorRedirectTimer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    };

    const checkExistingSession = async () => {
      try {
        log('getSession start');
        const { data, error: sessionError } = await supabase.auth.getSession();
        log('getSession done', { hasSession: !!data.session, err: sessionError?.message });
        if (sessionError) throw sessionError;
        if (data.session) {
          await proceedWithSession(data.session.user.id);
          return true;
        }
      } catch (err) {
        await handleAuthError(err, 'getSession');
        return true;
      }
      return false;
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      log('onAuthStateChange event', { event, hasSession: !!session });
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        if (watchdog) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        await proceedWithSession(session.user.id);
      }
    });

    void (async () => {
      const handled = await checkExistingSession();
      if (handled || cancelled) return;
      watchdog = setTimeout(async () => {
        if (cancelled) return;
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          await proceedWithSession(data.session.user.id);
        } else {
          await handleAuthError(
            new Error('No se pudo establecer la sesión (timeout). Intenta nuevamente.'),
            'watchdog'
          );
        }
      }, 8000);
    })();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      if (watchdog) clearTimeout(watchdog);
      if (errorRedirectTimer) clearTimeout(errorRedirectTimer);
    };
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
        <div className="flex flex-col items-center gap-[var(--ds-space-200)] max-w-md text-center px-[var(--ds-space-400)]">
          <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-danger)] flex items-center justify-center">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[var(--ds-font-size-400)] font-bold text-[var(--ds-text)]">
            Error de autenticación
          </h2>
          <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">{error}</p>
          <p className="text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)]">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--ds-blue-50)] to-[var(--ds-neutral-50)]">
      <div className="flex flex-col items-center gap-[var(--ds-space-200)]">
        <div className="w-16 h-16 rounded-[var(--ds-radius-300)] bg-[var(--ds-background-brand)] flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-background-brand)]" />
        <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">Autenticando...</p>
      </div>
    </div>
  );
}
