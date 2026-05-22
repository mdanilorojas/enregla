import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

export function AuthTest() {
  const { user, profile, loading } = useAuth();
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);

  const addCheck = (c: CheckResult) =>
    setChecks((prev) => [...prev, c]);

  const runChecks = async () => {
    setChecks([]);
    setRunning(true);
    const t0 = performance.now();
    const elapsed = () => `${((performance.now() - t0) / 1000).toFixed(2)}s`;

    // Leer access_token directo de localStorage para bypassear cualquier lock
    // interno del cliente Supabase. Si el cliente está colgado en gotrue, los
    // calls a supabase.auth.* nunca resuelven; pero el token está persistido.
    const storageKey = 'enregla-auth-token';
    let cachedToken: string | null = null;
    let cachedUserId: string | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        cachedToken = parsed?.access_token ?? parsed?.currentSession?.access_token ?? null;
        cachedUserId = parsed?.user?.id ?? parsed?.currentSession?.user?.id ?? null;
      }
    } catch (e) {
      console.error('storage parse', e);
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    addCheck({
      label: `[${elapsed()}] localStorage token`,
      ok: !!cachedToken,
      detail: cachedToken
        ? `token=${cachedToken.slice(0, 30)}... userId=${cachedUserId}`
        : 'no token en storage',
    });

    if (!cachedToken) {
      setRunning(false);
      return;
    }

    // Query directo via fetch (sin supabase-js)
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${cachedUserId}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${cachedToken}`,
          },
        }
      );
      const text = await res.text();
      addCheck({
        label: `[${elapsed()}] fetch /rest/v1/profiles direct`,
        ok: res.ok,
        detail: `status=${res.status} body=${text.slice(0, 200)}`,
      });
    } catch (err) {
      addCheck({
        label: `[${elapsed()}] fetch /rest/v1/profiles direct EXCEPTION`,
        ok: false,
        detail: (err as Error).message,
      });
    }

    // Query getUser via fetch
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${cachedToken}`,
        },
      });
      const text = await res.text();
      addCheck({
        label: `[${elapsed()}] fetch /auth/v1/user direct`,
        ok: res.ok,
        detail: `status=${res.status} body=${text.slice(0, 200)}`,
      });
    } catch (err) {
      addCheck({
        label: `[${elapsed()}] fetch /auth/v1/user direct EXCEPTION`,
        ok: false,
        detail: (err as Error).message,
      });
    }

    try {
      // 1. getSession (via supabase-js, puede colgar)
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<{ data: { session: null }; error: Error }>(
        (resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { session: null },
                error: new Error('TIMEOUT supabase.auth.getSession 3s'),
              }),
            3000
          )
      );
      const { data: sessionData, error: sessionErr } = (await Promise.race([
        sessionPromise,
        sessionTimeout,
      ])) as {
        data: { session: { user: { id: string }; access_token: string } | null };
        error: { message: string } | null;
      };
      addCheck({
        label: `[${elapsed()}] supabase.auth.getSession() (3s timeout)`,
        ok: !!sessionData.session && !sessionErr,
        detail: sessionErr
          ? `error: ${sessionErr.message}`
          : sessionData.session
            ? `user.id=${sessionData.session.user.id} access_token=${sessionData.session.access_token.slice(0, 20)}...`
            : 'no session',
      });

      // 2. getUser
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      addCheck({
        label: `[${elapsed()}] supabase.auth.getUser()`,
        ok: !!userData.user && !userErr,
        detail: userErr ? `error: ${userErr.message}` : `user.id=${userData.user?.id ?? 'null'}`,
      });

      // 3. SELECT profiles donde id = me (RLS profiles_select)
      const userId = userData.user?.id;
      if (userId) {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, company_id, role')
          .eq('id', userId)
          .maybeSingle();
        addCheck({
          label: `[${elapsed()}] SELECT profiles WHERE id=me`,
          ok: !profileErr,
          detail: profileErr
            ? `error: ${profileErr.message} (code ${profileErr.code})`
            : profileData
              ? `profile=${JSON.stringify(profileData)}`
              : 'no profile row',
        });

        // 4. RPC para verificar auth.uid() server-side via funcion ya existente
        // Usamos user_company_id que retorna profiles.company_id WHERE id = auth.uid()
        const { data: rpcData, error: rpcErr } = await supabase.rpc('user_company_id');
        addCheck({
          label: `[${elapsed()}] RPC user_company_id() (lee auth.uid())`,
          ok: !rpcErr,
          detail: rpcErr
            ? `error: ${rpcErr.message} (code ${rpcErr.code})`
            : `result=${JSON.stringify(rpcData)} (null = company_id null pero auth.uid OK)`,
        });

        // 5. Test INSERT a companies (DRY: lo intenta pero rollbeamos via DELETE)
        //    En vez de INSERT real, hacemos SELECT 1 con condicion del policy
        const { data: policyTest, error: policyErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .is('company_id', null)
          .maybeSingle();
        addCheck({
          label: `[${elapsed()}] policy precheck (profile sin company_id)`,
          ok: !policyErr,
          detail: policyErr
            ? `error: ${policyErr.message}`
            : policyTest
              ? 'profile sin company_id ✓ INSERT a companies debería pasar'
              : 'profile YA TIENE company_id; INSERT a companies fallaría con razón',
        });
      }
    } catch (err) {
      addCheck({
        label: `[${elapsed()}] EXCEPTION`,
        ok: false,
        detail: (err as Error).message,
      });
    }

    setRunning(false);
  };

  useEffect(() => {
    if (loading || !user) return;
    // runChecks invoca setState; lo aplazamos un tick para evitar cascading
    // renders detectados por react-hooks/set-state-in-effect.
    const handle = setTimeout(() => {
      void runChecks();
    }, 0);
    return () => clearTimeout(handle);
  }, [loading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div style={{ padding: 32 }}>useAuth loading...</div>;

  if (!user) {
    return (
      <div style={{ padding: 32, fontFamily: 'monospace' }}>
        <h1>AuthTest</h1>
        <p>No hay user. <a href="/login">Login</a></p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, fontFamily: 'monospace', maxWidth: 900 }}>
      <h1>AuthTest — diagnóstico aislado</h1>
      <section style={{ background: '#f4f5f7', padding: 16, marginBottom: 16 }}>
        <strong>useAuth state:</strong>
        <pre>
          {JSON.stringify(
            {
              userId: user.id,
              email: user.email,
              profile: profile
                ? { id: profile.id, full_name: profile.full_name, company_id: profile.company_id, role: profile.role }
                : null,
            },
            null,
            2
          )}
        </pre>
      </section>

      <button onClick={runChecks} disabled={running} style={{ padding: '8px 16px', marginBottom: 16 }}>
        {running ? 'Ejecutando...' : 'Re-run checks'}
      </button>

      <ol>
        {checks.map((c, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            <span style={{ color: c.ok ? 'green' : 'red', fontWeight: 600 }}>
              {c.ok ? '✓' : '✗'}
            </span>{' '}
            {c.label}
            <div style={{ paddingLeft: 16, color: '#555' }}>{c.detail}</div>
          </li>
        ))}
      </ol>

      <hr style={{ margin: '24px 0' }} />
      <p>
        <a href="/setup">→ /setup (wizard)</a> · <a href="/">→ / (dashboard)</a> ·{' '}
        <a href="/login">→ /login</a>
      </p>
    </div>
  );
}
