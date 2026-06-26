import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Shield, XCircle } from '@/lib/lucide-icons';

/**
 * AuthCallback: con detectSessionInUrl=true + supabase-js >= 2.105.2,
 * el cliente hace el exchange PKCE automaticamente al detectar el ?code=
 * en la URL. Solo escuchamos SIGNED_IN para navegar al destino apropiado.
 *
 * useAuth (que tambien escucha SIGNED_IN) hidrata el authStore en paralelo;
 * AuthCallback solo decide WHERE navegar.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    const log = (msg: string, extra?: unknown) => {
      if (!import.meta.env.DEV) return;
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      // eslint-disable-next-line no-console
      console.log(`[AuthCallback +${elapsed}s] ${msg}`, extra ?? '');
    };
    log('mount; url=', window.location.href);

    const navigateNext = async (userId: string) => {
      if (cancelled) return;
      // Decidir destino segun company_id del profile.
      // Si profile no existe o no tiene company_id, ir a /setup (wizard).
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userId)
          .maybeSingle();
        if (cancelled) return;
        if (profile?.company_id) {
          log('profile has company_id; navigating to /');
          navigate('/', { replace: true });
        } else {
          log('profile sin company_id; navigating to /bienvenida');
          navigate('/bienvenida', { replace: true, state: { fromOAuth: true } });
        }
      } catch (err) {
        console.error('[AuthCallback] profile fetch error:', err);
        // Fallback: ir a /setup; el wizard maneja el caso edge.
        navigate('/setup', { replace: true, state: { fromOAuth: true } });
      }
    };

    const handleAuthError = async (rawErr: unknown) => {
      const rawMsg = rawErr instanceof Error ? rawErr.message : String(rawErr);
      log('auth error', { msg: rawMsg });
      const isPkceMissing =
        rawMsg.includes('PKCE') ||
        rawMsg.includes('code verifier') ||
        rawMsg.includes('flow state');

      if (isPkceMissing) {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (
              key.startsWith('sb-') ||
              key === 'enregla-auth-token' ||
              key.includes('code-verifier')
            ) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          /* noop */
        }
        if (!cancelled) navigate('/login', { replace: true });
        return;
      }
      if (!cancelled) {
        setError(rawMsg || 'Error al procesar la autenticación');
      }
    };

    // Listener para SIGNED_IN/INITIAL_SESSION
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      log('event', { event, hasSession: !!session });
      if (cancelled) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        void navigateNext(session.user.id);
      }
    });

    // Check si ya hay sesion (caso de exchange muy rapido o reload)
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        log('getUser', { hasUser: !!user });
        if (user && !cancelled) {
          void navigateNext(user.id);
        }
      } catch (err) {
        if (!cancelled) await handleAuthError(err);
      }
    })();

    // Watchdog 10s
    const watchdog = setTimeout(() => {
      if (cancelled) return;
      log('watchdog; no session after 10s');
      setError('No se pudo establecer la sesión. Intenta nuevamente.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }, 10_000);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, [navigate]);

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
