import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Shield, XCircle } from '@/lib/lucide-icons';

/**
 * AuthCallback minimal: solo espera el evento SIGNED_IN del cliente Supabase
 * (que dispara automaticamente el exchange PKCE via detectSessionInUrl=true)
 * y redirige a /auth-test. AuthTest se encarga de queries autenticados,
 * profile fetch, decisiones de routing al wizard/dashboard. Aislamos auth
 * de cualquier query a la DB para descartar deadlocks.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    const log = (msg: string, extra?: unknown) => {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      console.log(`[AuthCallback +${elapsed}s] ${msg}`, extra ?? '');
    };
    log('mount; url=', window.location.href);

    const handleSession = () => {
      if (cancelled) return;
      log('session detected; navigating to /auth-test');
      navigate('/auth-test', { replace: true });
    };

    // 1. Listener primero (puede haber un INITIAL_SESSION antes que cualquier check)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      log('event', { event, hasSession: !!session });
      if (cancelled) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handleSession();
      }
    });

    // 2. Check si ya hay sesión (caso de refresh o exchange muy rápido)
    void (async () => {
      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        log('getSession', { hasSession: !!data.session, err: sessionErr?.message });
        if (cancelled) return;
        if (data.session) handleSession();
      } catch (err) {
        log('getSession threw', { msg: (err as Error).message });
        if (cancelled) return;
        const msg = (err as Error).message ?? '';
        if (
          msg.includes('PKCE') ||
          msg.includes('code verifier') ||
          msg.includes('flow state')
        ) {
          // Storage corrupto: limpiar y volver a /login
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (!key) continue;
              if (key.startsWith('sb-') || key === 'enregla-auth-token' || key.includes('code-verifier')) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            /* noop */
          }
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }
        if (!cancelled) setError(msg || 'Error al procesar la autenticación');
      }
    })();

    // 3. Watchdog: si no llega evento en 10s, asumir falla
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
