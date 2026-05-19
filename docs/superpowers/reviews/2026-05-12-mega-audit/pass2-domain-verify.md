# Pass 2 — Domain Verification (`.ec` vs `.se`)

**Date:** 2026-05-12
**Scope:** Independent verification of claimed P0 from `pass1-auth-security.md` which asserted that production runs on `app.enregla.se` while code is hardcoded to `app.enregla.ec`.

---

## TL;DR (answer the single question first)

**Production RIGHT NOW is `app.enregla.ec`.** Not `.se`.

The `.se` claim in prior audit notes and the user's MEMORY was **stale/incorrect**. Commit `c493222` (2026-05-11, "fix(auth): OAuth callback con PKCE + corregir dominio a .ec") explicitly corrects the drift *in source*, stating in the body:

> "Edge function defaults `ALLOWED_ORIGIN` y `APP_URL` corregidos a `app.enregla.ec` (el dominio real; `.se` era memoria vieja equivocada)."

The newer MEMORY doc `reference_deploy_flow.md` confirms this:

> "Dominio real de producción: `app.enregla.ec` (confirmado 2026-05-11). (Confusión previa en memoria decía `.se` — estaba mal. No existe `.se`.)"

The outdated line the user quoted ("Supabase whitelist solo app.enregla.se (preview OAuth roto)") is from an **older MEMORY entry that was superseded** by the 2026-05-11 update. So the user's premise was inverted.

**BUT — there is still a real, concrete break on production:** the **deployed edge function** `send-expiry-alerts` (version 8, status ACTIVE) still embeds the old `.se` defaults. The corrected source in commit `c493222` has **not been redeployed**. Details in Section 4 below.

---

## 1. Grep matrix — every `.ec` / `.se` / `ALLOWED_ORIGIN` hit that controls runtime behavior

Dominant finding: in **source code** everything now points at `.ec`. In **docs & superpowers plans**, `.ec` is used pervasively as the canonical domain. There is **no** `.se` reference anywhere except in stale audit artifacts and the outdated `2026-05-10-pre-production-audit.html` and the deployed edge function.

### 1a. Runtime-affecting code references

| # | File:Line | Domain | What it controls | Breaks prod? |
|---|-----------|--------|------------------|--------------|
| 1 | `src/lib/api/publicLinks.ts:93` | `https://enregla.ec` | Hardcoded prod base for public verification share URLs (`getPublicUrl`). No env override. | **No**, matches prod. But no fallback if domain ever changes → fragile (see pass1-features). |
| 2 | `src/lib/demo.ts:28` | `app.enregla.ec` OR `app.enregla.se` | Boot-time guard: throws if `VITE_DEMO_MODE=true` on either prod host. Defensive; .se present only as paranoid fallback. | **No**, protective-only. |
| 3 | `src/hooks/useAuth.ts:63` | `demo@enregla.ec` | Mock demo user email when `VITE_DEMO_MODE=true`. | **No** (demo only). |
| 4 | `src/features/public-links/PublicVerificationPage.tsx:281` | `https://enregla.ec` | Footer href on public verification page → points to marketing root. Circular-ish (see pass1-features). | **No**, matches prod. |
| 5 | `src/lib/auth.ts:85` | `${window.location.origin}/auth/callback` | OAuth redirect target. **Dynamic** — works on any host; not hardcoded. | **No**, correct by construction. |
| 6 | `src/lib/auth.ts:61` | `${window.location.origin}/reset-password` | Password reset redirect. **Dynamic**. | No. |
| 7 | `src/lib/supabase.ts:37` | `storageKey: 'enregla-auth-token'` | Not a domain, just the client-side token storage key. | No. |
| 8 | `supabase/functions/send-expiry-alerts/index.ts:15` (source) | `https://app.enregla.ec` | CORS `ALLOWED_ORIGIN` default when env var unset. | **No** *in source*. But see Section 4: deployed version has `.se`. |
| 9 | `supabase/functions/send-expiry-alerts/email-service.ts:8` (source) | `https://app.enregla.ec` | `APP_URL` default → links inside expiry-alert emails (`{appUrl}/dashboard`, `{appUrl}/settings/notifications`). | **No** *in source*. But deployed version has `.se` (Section 4). |
| 10 | `reset-demo-password.mjs:19` | `demo@enregla.ec` | Script for resetting demo user password. | No (util script). |

### 1b. Doc / copy references (non-runtime)

| # | File:Line | Domain | Context |
|---|-----------|--------|---------|
| 11 | `README.md:315` | `security@enregla.ec` | Security contact mailto. |
| 12 | `OAUTH-SETUP.md` (11 hits) | `app.enregla.ec` | OAuth config guide; prescribes `https://app.enregla.ec/auth/callback` as the redirect to add in Supabase dashboard. Consistent with actual prod domain. |
| 13 | `CUSTOM-DOMAIN-SETUP.md` (15 hits) | `auth.enregla.ec` + `enregla.ec` + `app.enregla.ec` | Aspirational doc (requires Pro plan) about adding `auth.enregla.ec` as Supabase custom domain CNAME. |
| 14 | `docs/deployment/email-notifications-verification.md` | `enregla.ec`, `alertas@enregla.ec` | Resend sender-verification doc. Flags that `enregla.ec` is *not yet verified* in Resend (emails only reach mariodanilorojas@gmail.com). |
| 15 | `docs/superpowers/specs/*` and `plans/*` | `enregla.ec`, `app.enregla.ec`, `hola@enregla.ec`, `qa+*@enregla.ec` | All superpowers specs consistently use `.ec`. |
| 16 | `docs/superpowers/reviews/2026-05-10-pre-production-audit.html:410` | `https://app.enregla.se` | **Stale** — this HTML was produced before the 2026-05-11 correction. It describes CORS default as `.se`. Source of the misinformation that propagated into `pass1-auth-security.md`. |

### 1c. `ALLOWED_ORIGIN` hits

| # | File:Line | Literal | Notes |
|---|-----------|---------|-------|
| A1 | `supabase/functions/send-expiry-alerts/index.ts:15` | `Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.enregla.ec'` | Source (post-`c493222`). |
| A2 | `supabase/functions/send-expiry-alerts/index.ts:18` | `origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN` | Echo-back logic. Only a single origin is accepted; no array / comma-split. |
| A3 | **DEPLOYED** edge function v8 (fetched via MCP `get_edge_function`) | `Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.enregla.se'` | **Drift** — still the pre-fix version. See Section 4. |

---

## 2. Direct reads of the three named suspect files

### `src/lib/api/publicLinks.ts:88-96`

```ts
/**
 * Generate the full public URL for a token
 */
export function getPublicUrl(token: string): string {
  const baseUrl = import.meta.env.PROD
    ? 'https://enregla.ec'
    : window.location.origin;
  return `${baseUrl}/p/${token}`;
}
```

Hardcoded `https://enregla.ec` for prod. Correct today. Fragility: no env var — if the apex ever moves, a code change + redeploy is required. (Already flagged in pass1-features.md.)

### `src/lib/demo.ts:22-34`

```ts
export function assertDemoModeNotInProduction(): void {
  if (!DEMO_MODE) return;
  if (typeof window === 'undefined') return;
  if (!import.meta.env.PROD) return;

  const host = window.location.hostname;
  if (host === 'app.enregla.ec' || host === 'app.enregla.se') {
    throw new Error(
      `Refusing to boot: VITE_DEMO_MODE=true on production host ${host}. ` +
      `Demo mode must run on a separate subdomain.`
    );
  }
}
```

Both hosts checked. `.se` here is protective (covers the old domain in the unlikely case someone re-enables it). Not a breakage.

### `supabase/functions/send-expiry-alerts/index.ts:15-25`

```ts
const CRON_SECRET = Deno.env.get('CRON_SECRET');
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.enregla.ec';

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-cron-secret',
    'Vary': 'Origin',
  };
}
```

Source default is `.ec`. Correct.

### `supabase/functions/send-expiry-alerts/email-service.ts:7-9`

```ts
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const appUrl = Deno.env.get('APP_URL') || 'https://app.enregla.ec';
const fromAddress = Deno.env.get('RESEND_FROM') || 'EnRegla <onboarding@resend.dev>';
```

Source default is `.ec`. Correct. Note `fromAddress` still falls back to `onboarding@resend.dev` when `RESEND_FROM` is unset (orthogonal P1 — see `docs/deployment/email-notifications-verification.md`).

---

## 3. `OAUTH-SETUP.md` / `CUSTOM-DOMAIN-SETUP.md` / `vercel.json` / env files

- **`OAUTH-SETUP.md`** — prescribes `https://app.enregla.ec/auth/callback` as the production redirect URL. Consistent with prod.
- **`CUSTOM-DOMAIN-SETUP.md`** — aspirational; describes adding `auth.enregla.ec` as a Supabase custom domain CNAME (requires Pro plan). States redirect URLs "NO cambian (siguen siendo `https://app.enregla.ec/auth/callback`)". No `.se` anywhere.
- **`vercel.json`** — **no domain configured** in the file. Only rewrites + security headers. Vercel project configuration (which domain the deployment is served from) is set in the Vercel dashboard, not in the repo. The CSP `connect-src` only whitelists `https://*.supabase.co wss://*.supabase.co` — no hardcoded app domain.
- **`.env.example`** — no `VITE_*` domain-related vars. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_UI_VERSION`, `VITE_SENTRY_DSN`.
- **`.env.development`** — only `VITE_UI_VERSION=v2`. No domain config.
- **`.env.local`** — `VITE_SUPABASE_URL=https://zqaqhapxqwkvninnyqiu.supabase.co`, anon key, `VITE_UI_VERSION=v2`, `VITE_DEMO_MODE=false`. No app-URL var. (Safe to share here — the key is the **publishable** anon key, not the service key.)

**Conclusion:** the repo has **no `VITE_PUBLIC_APP_URL`** or equivalent — the canonical app domain is hardcoded in source (`publicLinks.ts`, `demo.ts`). Edge-function app URL is controlled by `APP_URL` / `ALLOWED_ORIGIN` envs on the Supabase side.

---

## 4. THE REAL FINDING — source vs deployed drift on the edge function

Fetched via `mcp__supabase__get_edge_function('send-expiry-alerts')`:

| Attribute | Value |
|-----------|-------|
| Function id | `74d76def-4a3c-47d6-a7c0-41c57404b026` |
| Slug | `send-expiry-alerts` |
| **Version** | **8** |
| Status | `ACTIVE` |
| Last updated (unix ms) | `1778455433807` → roughly early May 2026 |

**Deployed `index.ts` line 14:**
```ts
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.enregla.se';
```

**Deployed `email-service.ts` line 7:**
```ts
const appUrl = Deno.env.get('APP_URL') || 'https://app.enregla.se';
```

Commit `c493222` (2026-05-11) corrected **source** to `.ec`, but the edge function was **not redeployed**. So:

### What actually breaks on production (RIGHT NOW):

**Assuming the runtime envs `ALLOWED_ORIGIN` and `APP_URL` are NOT set on the edge function** (check on Supabase Dashboard → Edge Functions → send-expiry-alerts → Secrets — not queryable from MCP):

1. **CORS is broken for any browser call.** `Access-Control-Allow-Origin` response header is `https://app.enregla.se` regardless of the caller's origin. A browser on `app.enregla.ec` gets blocked. *Mitigant:* this function is invoked by Supabase Cron (`pg_cron` → `http` extension) with a server-side `x-cron-secret`, not by browsers. Cron doesn't care about CORS. So in practice this is probably a cosmetic bug unless someone tries to trigger it from the dashboard or a browser tool.
2. **Email body links point to `app.enregla.se/dashboard` and `app.enregla.se/settings/notifications`.** Customers receiving expiry alerts get links to a domain that **does not resolve**. They will see DNS-not-found / connection-refused. This is the **concrete P0 breakage** on production today, assuming emails are actually sent (note: `enregla.ec` is not yet verified in Resend per `docs/deployment/email-notifications-verification.md`, so few emails are going out to real customers — but the moment the domain is verified, every link in every alert email will be dead).

### What breaks on `.se` (the inverted scenario the user asked about):

Nothing. `.se` does not exist. There is no Vercel project at `app.enregla.se`. The only places `.se` appears in source are:
- `src/lib/demo.ts:28` (defensive check; never triggered on a non-`.se` host)
- Stale pre-audit docs

---

## 5. Supabase Auth redirect URLs — not queryable via MCP

Confirmed: allowed redirect URLs (Supabase → Auth → URL Configuration) are not exposed through `execute_sql` or any MCP tool in the surface available. They live in the GoTrue config that the dashboard edits via the management API. `mcp__supabase__search_docs` confirms this config is dashboard-only for the MCP surface.

**Manual verification required:** visit Supabase Dashboard → Project `zqaqhapxqwkvninnyqiu` → Authentication → URL Configuration, and confirm:
- **Site URL** = `https://app.enregla.ec`
- **Redirect URLs** contain `https://app.enregla.ec/auth/callback` (plus `http://localhost:3000/auth/callback`, `http://localhost:5173/auth/callback` for dev)
- No `.se` entries

`mcp__supabase__get_project_url` returns the **Supabase API URL** (`https://zqaqhapxqwkvninnyqiu.supabase.co`), not the app frontend URL — confirming there is no `.se` project reference at the Supabase side either.

---

## 6. Decision matrix — what breaks on each domain

| Scenario | Domain users hit | Result |
|----------|------------------|--------|
| **Reality today (2026-05-12)** | `app.enregla.ec` | **App loads**, OAuth works (dynamic `window.location.origin` → Supabase whitelist has `.ec`), public share links `https://enregla.ec/p/...` work. **But**: expiry-alert emails (when they go out) contain links to `app.enregla.se/...` which DO NOT RESOLVE. |
| Hypothetical: user types `app.enregla.se` | `app.enregla.se` | DNS-not-found. No Vercel project, no certificate. Nothing loads. |

---

## 7. Actions required

| # | Priority | Action | Evidence |
|---|----------|--------|----------|
| 1 | **P0** | **Redeploy `send-expiry-alerts` edge function** from current source (`supabase/functions/send-expiry-alerts/`). `supabase functions deploy send-expiry-alerts` will publish v9 with `.ec` defaults. | Section 4 — deployed v8 has `.se`, source has `.ec`. |
| 2 | **P0** | Set `ALLOWED_ORIGIN=https://app.enregla.ec` and `APP_URL=https://app.enregla.ec` as edge function secrets so the defaults become irrelevant. Command: `supabase secrets set ALLOWED_ORIGIN=https://app.enregla.ec APP_URL=https://app.enregla.ec`. | Section 4. |
| 3 | **P1** | Introduce `VITE_PUBLIC_APP_URL` env var and replace hardcoded `https://enregla.ec` in `src/lib/api/publicLinks.ts:93` with `import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin`. Remove the fragile hardcode. | Section 1a row 1. |
| 4 | **P1** | Supersede/delete the stale `docs/superpowers/reviews/2026-05-10-pre-production-audit.html` (or add a banner) — its `.se` references are the root of the confusion that made `pass1-auth-security.md` raise a false P0. | Section 1b row 16. |
| 5 | **P2** | Update `pass1-auth-security.md` (this audit pass) — its item #3 is incorrect given the 2026-05-11 correction. Replace with the actual finding above: "deployed edge function is stale, not source." | `pass1-auth-security.md:16` references `.se` as production. |
| 6 | **P3** | Support multi-origin CORS: change edge function to read comma-separated `ALLOWED_ORIGINS` and echo back matching origin. Useful for preview deployments. | Section 1a A2. |

---

## 8. The single question, answered

> **Which domain is production RIGHT NOW, and what concretely breaks on the other one?**

- **Production is `app.enregla.ec`.** Confirmed by: commit `c493222` (explicit fix message), the updated `reference_deploy_flow.md` MEMORY note dated 2026-05-11, every config file in the repo, and the absence of any `.se` entry in current source (only defensive/stale references remain).
- **Nothing breaks on `.se`** because `.se` does not exist as a deployed domain — it's a phantom from an outdated memory entry.
- **What IS broken on `.ec` production today:** the deployed Supabase edge function `send-expiry-alerts` (version 8) still has `.se` defaults baked in. Expiry-alert emails' CTA buttons point to `https://app.enregla.se/dashboard` (dead link). Must be redeployed. The audit's P0 was pointing at the right *symptom* but misidentified the *direction* of the drift.
