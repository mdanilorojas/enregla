# Pass 1 — Auth & Security Audit

**Date:** 2026-05-12
**Branch:** `feat/dominio-v2`
**Auditor:** Claude (sub-agent)
**Scope:** OAuth/PKCE, ProtectedRoute, session, demo mode, secrets, Supabase client, public routes, input validation, headers, onboarding.

---

## TL;DR — Top 5 Findings

| # | Severity | Title |
|---|----------|-------|
| 1 | **P0** | `documents_select_anon` RLS + `permit_docs_select_public_link` storage policy leak **all permit documents of any company with any active public link**, without verifying the token on the request |
| 2 | **P0** | `leads` INSERT policy is `WITH CHECK (true)` for `public` role → any anon on the internet can flood the leads table with unbounded garbage (no rate limit, no captcha, no size cap) |
| 3 | **P0** | Production domain is inconsistent across the codebase: Vercel deploys under `app.enregla.se` (per MEMORY.md / edge-function audit), but code, edge functions, OAuth docs, and `assertDemoModeNotInProduction` all have hardcoded `app.enregla.ec` as the canonical host. OAuth on `.se` preview is broken and CORS `ALLOWED_ORIGIN` on the edge function defaults to `.ec`. Any GO live on one domain silently breaks alerts/OAuth on the other |
| 4 | **P1** | `ProtectedRoute` uses only the Zustand `loading` flag; on a slow/failed `getSession` call the 5 s safety timeout fires and silently transitions the user from "loading" to "unauthenticated" — a legitimate slow-network user is kicked to `/login` even with a valid session cookie. Combined with `authInitialized` module-level flag and `initializationPromise` dance, the state machine is brittle and hard to reason about |
| 5 | **P1** | `AuthCallback` does **not** check the OAuth `error`/`error_description` query params (Google sends `?error=access_denied` when the user clicks "Cancel"). Instead the code goes straight to `exchangeCodeForSession` → throws a generic "invalid request" → shows an unhelpful error → auto-redirects to `/login` after 3 s. Also: no CSRF `state` validation visible (supabase-js handles the PKCE code_verifier internally, but the absence of explicit state handling is worth flagging) |

The rest of this document enumerates all findings.

---

## Severity Scheme

- **P0** — Authentication bypass, cross-company data leak, production-broken deploy, secret leak. Fix before next deploy.
- **P1** — Latent bug or hardening gap. Fix in current sprint.
- **P2** — Hygiene / defense-in-depth.
- **P3** — Nit / stylistic.

---

## Findings

### [P0-1] Public-link storage & document RLS leak every active-link company's docs to unauthenticated visitors
**Severity:** P0
**Evidence:**
- `pg_policies` dump (MCP) — policy `documents_select_anon` on `public.documents`:
  ```sql
  EXISTS (
    SELECT 1 FROM permits p
    JOIN public_links pl ON pl.company_id = p.company_id
    WHERE p.id = documents.permit_id
      AND p.is_active
      AND pl.is_active
      AND (pl.expires_at IS NULL OR pl.expires_at > now())
      AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
  )
  ```
- Storage policy `permit_docs_select_public_link` on `storage.objects` uses the same pattern.
- `src/lib/api/publicLinks.ts:158-189` — client queries `documents` table by `permit.location_id` and then calls `createSignedUrl` for each `file_path`.

**Impact:**
The RLS check does not bind to the token the visitor actually presented. It only checks that SOME active public_link row exists for the permit's company/location. This means:
- An attacker who guesses (or scrapes from an admin's URL share) any *one* active token for Company A can enumerate and download **every location and every document** of Company A whose permit belongs to a company-wide link, or all docs for the specific location if the link is location-scoped.
- More critically, an anon caller can query `documents` directly (e.g. via the REST API) without knowing any token at all, as long as `company_id` has ANY active public_link somewhere. The token never enters the policy predicate. Only the client voluntarily filters by token; the server happily returns anything.
- `createSignedUrl` on storage will succeed for these documents because the storage policy has the same flaw.
- This is a live data-exfiltration primitive for any customer who has ever shared a link.

**Fix recommendation:**
1. Rewrite the policies so the predicate requires the SPECIFIC token from the request. Easiest path: route all anon reads through a single `SECURITY DEFINER` RPC (like the existing `get_public_permits(link_token)`) that takes the token as an argument, validates it, and returns only rows for that token's scope. Then revoke direct anon SELECT on `permits`, `locations`, `documents`, and storage objects.
2. Deprecate `documents_select_anon` and `permit_docs_select_public_link` entirely.
3. For signed URLs of docs: generate them server-side inside the RPC and return the signed URL, OR have the RPC return the file_path and gate `createSignedUrl` on a second server-validated call that also checks the token.
4. Write a SQL-level behavioral test: `SET ROLE anon; SELECT * FROM documents WHERE permit_id IN (<someone else's>);` → must return 0 rows regardless of whether any public_link exists.

---

### [P0-2] `leads` INSERT policy is `WITH CHECK (true)` — public abuse sink
**Severity:** P0
**Evidence:**
- Advisor lint `rls_policy_always_true` flags `public.leads` policy `Anyone can insert leads` for `INSERT` with `WITH CHECK (true)` on role `public` (i.e. both anon and authenticated).
- `pg_policies` dump confirms: `{"policyname":"Anyone can insert leads","cmd":"INSERT","roles":"{public}","with_check":"true"}`.

**Impact:**
Anyone on the internet, unauthenticated, with no rate limit, can `POST /rest/v1/leads` arbitrary JSON. An attacker can:
- Flood the leads table with millions of fake rows (DB disk bloat, cost escalation).
- Inject attacker-controlled strings into every column (name, email, notes, UTMs, etc.). If staff reads these rows in the internal CRM UI and any column is rendered without escaping, that becomes stored XSS against staff. (Current UI has no `dangerouslySetInnerHTML`, but future admin views are a landmine.)
- Spam campaigns / mass-enum emails by iterating the lead submit endpoint.

**Fix recommendation:**
1. Add server-side throttling: move lead creation behind an Edge Function that implements IP-based rate limiting (e.g. 5 submissions per IP per hour) and captcha/Turnstile verification. Revoke anon INSERT on the table and GRANT only to the service_role used by the Edge Function.
2. If staying on direct RLS: replace the policy with `WITH CHECK` that enforces shape (length limits, valid email regex, mandatory fields), and add a per-IP insert counter (stored in a `lead_submissions` table) with a CHECK that rejects if the IP exceeded N/hour. Still strictly inferior to the Edge Function approach.
3. Add a `created_at` + index + cron to purge obvious junk (e.g. non-matching email pattern).

---

### [P0-3] Canonical production domain is inconsistent — OAuth, CORS, and hardcoded URLs mismatch
**Severity:** P0
**Evidence:**
- `src/lib/demo.ts:28` — boot guard checks both `app.enregla.ec` and `app.enregla.se` as production, suggesting both exist.
- `src/lib/api/publicLinks.ts:93` — hardcodes `https://enregla.ec` as PROD base for public URLs.
- `supabase/functions/send-expiry-alerts/index.ts:15` — `ALLOWED_ORIGIN` defaults to `https://app.enregla.ec`.
- `supabase/functions/send-expiry-alerts/email-service.ts:8` — `appUrl` defaults to `https://app.enregla.ec`.
- `OAUTH-SETUP.md` and `CUSTOM-DOMAIN-SETUP.md` document `.ec` as the Supabase Site URL and redirect target.
- Recent commit `c493222` says "corregir dominio a .ec".
- `reset-demo-password.mjs:19` — demo user email `demo@enregla.ec`.
- But per `MEMORY.md` (`reference_deploy_flow`): "Vercel auto-deploy main→prod, ramas→preview URL; Supabase whitelist solo app.enregla.se (preview OAuth roto)".
- Nothing in the codebase indicates which domain Vercel actually serves. `vercel.json` has no `alias` field.

**Impact:**
- If Vercel production serves `.se` but code/OAuth redirect to `.ec`, user clicks Google → Google callbacks back to `.ec` → browser hits a different Vercel project or 404 → session is never established. Callbacks silently fail.
- CORS for the edge function allows `.ec` only; a frontend on `.se` calling the function gets blocked. Email alert admin UI from `.se` is broken.
- Public verification links generated in `.se` prod always point to `https://enregla.ec/p/<token>` (hardcoded). A customer opens their own generated link and gets a 404 or a different marketing site.
- `assertDemoModeNotInProduction` will only block demo mode on those two hosts — if Vercel serves a third domain (`enregla.vercel.app`, a preview alias, etc.) demo mode will silently run in "prod" and show the demo company to real visitors.

**Fix recommendation:**
1. Pick ONE canonical production host and commit to it in a single place (e.g. `VITE_PUBLIC_APP_URL` env var, read everywhere). Remove hardcoded `enregla.ec` / `enregla.se` strings from TS and edge function defaults.
2. For the second host (if legacy), set up a permanent 301 at Vercel/DNS level, and remove it from the code entirely.
3. Validate `assertDemoModeNotInProduction` against `VITE_PUBLIC_APP_URL` origin, not a hardcoded list.
4. Add a boot-time assert: if `window.location.origin !== VITE_PUBLIC_APP_URL` and `import.meta.env.PROD`, log a loud warning. Prevents silent domain drift.
5. Update `OAUTH-SETUP.md` / `CUSTOM-DOMAIN-SETUP.md` once the canonical host is chosen.

---

### [P1-4] ProtectedRoute doesn't flash, but `useAuth` has a 5 s safety timeout that silently "authenticates as null"
**Severity:** P1
**Evidence:**
- `src/components/Auth/ProtectedRoute.tsx:13-24` — renders spinner while `loading === true`, then Navigate or children.
- `src/hooks/useAuth.ts:84-88`:
  ```ts
  safetyTimeout = setTimeout(() => {
    setAuth(null, null);
    initializationPromise = null;
  }, 5000);
  ```
- Module-level globals (`authInitialized`, `authSubscription`, `initializationPromise`) make the hook's state machine very hard to reason about; React StrictMode and HMR can trigger re-runs whose handling is non-obvious.
- `useAuth.ts:19-33` — if a second `useAuth()` call happens while `initializationPromise` is pending, that caller returns immediately with `loading=true` and no subscription of its own (by design, but it depends on the first caller finishing; if the first caller's component unmounts the promise is NOT cancelled and the caller never sees the state update reflected in its own closure).

**Impact:**
- On a slow network (say 6 s to load profile), the safety timeout fires with `setAuth(null, null)` → `loading` becomes false, `isAuthenticated` is false → `ProtectedRoute` kicks the user to `/login`. When the real getSession resolves later, the code path is already exited (`initializationPromise = null` was set, but the real request has no finally to reset state). User has a valid cookie but got redirected; on `/login` the session listener may or may not pick up.
- `INITIAL_SESSION` fires once on listener setup. If the timeout beat it, the SIGNED_IN flow will recover, but not predictably — user sees a flash of login page.
- The `authSubscription` is intentionally never unsubscribed ("keep it alive for app lifetime") — fine for a single-instance SPA, but it means the listener reaches into the current Zustand store via closure. If `clear()` or `setAuth` references change (they shouldn't in Zustand but if the store is ever re-created during HMR), stale callbacks will call a dead store.

**Fix recommendation:**
1. Extend the safety timeout to 15–20 s OR, better, remove it and rely on the user to retry. If `getSession` truly hangs, the network is dead; pretending the user is logged out is a worse outcome than a spinner.
2. If keeping the timeout, differentiate: on timeout, set a third state `'timeout'` and show "Network lento, reintenta" — don't silently transition to unauthenticated.
3. Remove the module-level `authInitialized` / `initializationPromise` pattern. Use a single top-level `AuthProvider` context that owns the initialization once, not a singleton scattered across every `useAuth()` caller.
4. Add a behavioral test: Vitest+MSW, mock a `getSession` that resolves after 6 s, assert ProtectedRoute still eventually renders children (not a redirect).

---

### [P1-5] AuthCallback doesn't handle OAuth error params, user-denial, or missing code
**Severity:** P1
**Evidence:**
- `src/features/auth/AuthCallback.tsx:27-44`:
  ```ts
  const url = new URL(window.location.href);
  const hasCode = url.searchParams.has('code');
  if (hasCode) {
    // exchangeCodeForSession
  } else {
    // getSession fallback
  }
  ```
- No check for `url.searchParams.get('error')` or `error_description` (Google's standard: `?error=access_denied&error_description=...`).
- No check for `state` param validation (supabase-js internally handles PKCE `code_verifier`, but the `state` parameter — if Google sends one — is not inspected; this is not strictly a bug with supabase-js's PKCE, but surfacing it explicitly is a defense-in-depth).

**Impact:**
- User clicks "Cancel" on the Google consent screen → redirect to `/auth/callback?error=access_denied&error_description=...` → no `code` → takes the `getSession` fallback → `session` is null → throws generic "No se pudo establecer la sesión" → user sees confusing error message instead of "Cancelaste el inicio de sesión".
- If Google/Supabase ever return an error query param with a code (rare but documented), the handler blindly tries `exchangeCodeForSession` with a polluted URL.

**Fix recommendation:**
1. At the top of `handleCallback`, check `url.searchParams.get('error')` first. If present, render a friendly message ("Inicio cancelado o denegado") and redirect to `/login` with no auto-dismiss (or with `error_description` displayed).
2. Keep the existing `hasCode` branch but also strip the `code` from the address bar after successful exchange (history.replaceState to avoid accidental re-shares of the URL with a consumed code).
3. Add telemetry: log OAuth callback errors to Sentry (already wired per `.env.example`).

---

### [P1-6] `companies_insert` policy allows ANY authenticated user with a null `company_id` to create a company — no rate limiting, no uniqueness enforcement, no abuse check
**Severity:** P1
**Evidence:**
- Policy `companies_insert` on `public.companies`:
  ```sql
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id IS NULL)
  )
  ```
- `src/features/onboarding-incremental/IncrementalWizard.tsx:83` calls `saveCompany` → inserts into `companies`.
- `saveCompany` (`src/lib/api/onboarding.ts:138-178`) validates RUC format (13 digits) client-side, but the only server-side check is the RLS predicate.
- No uniqueness constraint on `ruc` visible in the schema dump (would need to query `pg_constraint` to confirm; not done here).

**Impact:**
- An attacker signs up (Google OAuth is open — no invitation gating), gets a profile with `company_id = NULL`, then calls `POST /rest/v1/companies` with arbitrary payload. They can register an unlimited number of companies (create account, create company, sign out, re-invite self with a new Google, repeat) — data pollution.
- If two users race with the same RUC, both succeed (no unique constraint in policies; schema may or may not enforce it — needs verification).
- An attacker can create a company with a well-known real RUC (e.g. a competitor's) and become its "admin" via the `companies_auto_assign_to_profile` trigger. They can't actually read other users' data (profile's company_id is set to the NEW company they created), but they CAN squat on a RUC that a legitimate business might later try to register.

**Fix recommendation:**
1. Add a unique constraint on `companies.ruc` at the DB level. Onboarding should surface a "RUC ya registrado, contacta al admin" error.
2. Gate company creation behind an invitation / allow-list system for production. Or at least gate it behind email verification (Google OAuth users are verified, but email-password signups currently have no email confirmation step visible).
3. Consider moving company creation into a SECURITY DEFINER RPC that performs additional validation (e.g. RUC checksum — in Ecuador RUCs have a mod-11 check digit that the client doesn't validate).
4. Audit-log every company creation with the creating user_id for forensic review.

---

### [P1-7] `profiles_select` leaks every user's profile row to any authenticated company member
**Severity:** P1
**Evidence:**
- Policy `profiles_select`:
  ```sql
  USING (
    id = auth.uid()
    OR company_id = '<demo uuid>'
    OR (auth.uid() IS NOT NULL AND company_id IS NOT NULL AND company_id = user_company_id())
  )
  ```

**Impact:**
- For multi-user companies this is intended (a manager can see their team's profiles). But `profiles` may include PII: full name, role, business_role, potentially notification_preferences. A rogue employee can read co-workers' profiles.
- For the **demo company**: any anon/authenticated visitor can read **the entire demo profiles table**, including the demo user's `email`, `full_name`, etc. This may include personal emails if someone seeded demo data with real identities.

**Fix recommendation:**
1. Review what columns are actually in `profiles`. If it includes anything sensitive (phone, email, preferences), scope the SELECT to only return non-sensitive columns for co-company reads (create a `profiles_public_view` and point authenticated SELECT at it).
2. For the demo case: consider serving demo profile data from a materialized/scrubbed view rather than the real `profiles` table.

---

### [P1-8] Public link token is a UUIDv4 — 122 bits of entropy is fine, but there's NO rate limiting on `/p/:token` and NO token format validation in the route
**Severity:** P1
**Evidence:**
- `src/App.tsx:75` — `<Route path="/p/:token" element={<PublicVerificationPage />} />` accepts any string.
- `src/features/public-links/PublicVerificationPage.tsx:11-40` — passes raw `token` straight to `getPublicLinkData(token)`.
- `src/lib/api/publicLinks.ts:123-156` — queries `public_links` with `.eq('token', token)` and calls the `increment_public_link_view` RPC.

**Impact:**
- UUIDv4 has enough entropy that brute-force is not a practical issue (2^122 search space, not exploitable).
- But: an attacker can hammer the endpoint with random token guesses to enumerate valid ones. Each guess: (a) queries `public_links`, (b) fires the fire-and-forget view-count increment RPC which still executes a query regardless of token validity. At high volume this is a trivial denial-of-wallet (Supabase egress/query cost) and fills up logs.
- `token` is not validated as UUID format; a token of `'; DROP TABLE` gets quoted properly by supabase-js, but misshaped tokens incur needless DB round-trips.
- No captcha / WAF on the public path.

**Fix recommendation:**
1. Validate token shape client-side with `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` before calling the API. Return 404 for malformed tokens without hitting the DB.
2. Put Cloudflare/Vercel WAF rules in front of `/p/*`, e.g. rate-limit to 30 req / IP / min.
3. `increment_public_link_view` currently runs UPDATE even if the token doesn't exist (no-op, but still a DB write attempt). Wrap the body in a `WHERE token = ...` which already does this — but also skip the RPC entirely client-side if the lookup in step 1 of `getPublicLinkData` returned null.

---

### [P1-9] Signed URL leaked via `window.open(url, '_blank')` without `noopener,noreferrer` in two places
**Severity:** P1
**Evidence:**
- `src/components/documents/DocumentList.tsx:35` — `window.open(url, '_blank');` (no options).
- `src/features/permits/PermitDetailView.tsx:557` — `window.open(signedUrl, '_blank')` (no options).
- `src/features/public-links/ShareLocationModal.tsx:123` — correctly uses `'noopener,noreferrer'`.

**Impact:**
- Opening a Supabase signed URL in a new tab without `noopener` gives the opened document access to `window.opener` (for HTML/SVG docs). PDFs generally can't do this, but PNG/JPG/SVG (if the bucket allows SVG) could. More importantly, the `Referer` header leaks the app's URL (including query params / route) to Supabase storage.
- Minor information disclosure, but fixable with a one-line change.

**Fix recommendation:**
Change to `window.open(url, '_blank', 'noopener,noreferrer')` everywhere. Add an ESLint rule or grep CI check.

---

### [P1-10] `AuthCallback` redirects on OAuth error happen after a 3-second setTimeout — if user navigates back during those 3 s, the still-pending timer fires on the next route
**Severity:** P1
**Evidence:**
- `src/features/auth/AuthCallback.tsx:72-85` — stores the timer in a local `let redirectTimer` and clears it in cleanup. Looks correct.
- But `navigate('/login')` is called from inside the timeout; if the user already navigated elsewhere after seeing the error (or if the error re-renders and restarts the effect), you get multiple pending redirects. Cleanup handles single-instance; multi-instance (React StrictMode double-effect) is the concern.

**Impact:**
- Low. StrictMode re-renders the effect once at mount, which re-executes `handleCallback` → immediately hits "no code" on the second run because the URL still has a `code` param → tries exchangeCodeForSession a second time → Supabase returns "code already used" error → sets error → second `redirectTimer`. The cleanup from the first run clears only the first timer. The second timer is captured in the second closure. Net effect: user sees error screen, two consecutive navigations happen to `/login`.
- More confusing behavior than a hard bug.

**Fix recommendation:**
Use a ref, not a closure variable: `const redirectTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)`; inside the effect, clear `redirectTimerRef.current` at the start and at cleanup. Or guard `handleCallback` with a `ran` ref.

---

### [P2-11] `useAuth` initialization errors are only `console.error`'d, not surfaced to the user
**Severity:** P2
**Evidence:** Multiple `console.error` in `src/hooks/useAuth.ts` with no UI.

**Impact:** If the `profiles` query fails (RLS denial, network), the user is left in an inconsistent state (`user` set, `profile` null) and may see a broken dashboard. No toast / error boundary catches it.

**Fix:** Wire initialization errors to the existing `react-hot-toast` with a "reintenta" action, or to Sentry.

---

### [P2-12] Three SECURITY DEFINER functions are exposed to `anon` and `authenticated` roles
**Severity:** P2
**Evidence:** Advisor lints `0028`/`0029` flag `get_public_permits`, `increment_public_link_view`, `user_company_id`.

**Impact:**
- `get_public_permits(link_token)` — correctly gated by token, but being callable by authenticated users is pointless (authenticated users have direct table access). Net effect is low but the advisor flags it because function bypasses RLS.
- `increment_public_link_view(link_token)` — writes to `public_links.view_count` and `last_viewed_at`. Anon can call it. Already no-ops for invalid tokens, but an authenticated attacker can call it for any token they know and pollute view-count metrics.
- `user_company_id()` — SECURITY DEFINER helper reading `profiles.company_id` for the current auth.uid(). Harmless in effect (returns the caller's own company), but exposing the function to anon is dead weight; anon calling it always gets NULL.

**Fix:**
- `REVOKE EXECUTE ON FUNCTION get_public_permits(text) FROM authenticated;` — keep anon only.
- `REVOKE EXECUTE ON FUNCTION increment_public_link_view(text) FROM authenticated;` — keep anon only.
- `REVOKE EXECUTE ON FUNCTION user_company_id() FROM anon;` — keep authenticated only.
- Confirm by re-running advisors.

---

### [P2-13] Leaked-password protection is disabled in Auth settings
**Severity:** P2
**Evidence:** Advisor `auth_leaked_password_protection` — "Leaked password protection is currently disabled."

**Impact:** Users can set passwords that appear in HaveIBeenPwned. Credential stuffing risk.

**Fix:** In Supabase Dashboard → Authentication → Policies, enable "Leaked Password Protection". Free. Add MFA enrollment (enforced for `admin` role) in a follow-up.

---

### [P2-14] `ALLOWED_ORIGIN` on edge function is a single static string; no support for multiple origins (dev + prod + preview)
**Severity:** P2
**Evidence:** `supabase/functions/send-expiry-alerts/index.ts:15`.

**Impact:** Any internal admin UI that triggers this function from a dev/preview URL gets CORS-blocked. Currently the function is cron-driven so not breaking live, but any future "trigger now" button from prod/preview will need `.se` or localhost allowed.

**Fix:** Accept a comma-separated `ALLOWED_ORIGINS` env var, echo back the matching origin. Or use the same hard rule as the rest of the app once the canonical domain is chosen (P0-3).

---

### [P2-15] No Content-Security-Policy `report-uri` / `report-to` directive
**Severity:** P2
**Evidence:** `vercel.json:14` — CSP header is set but has no reporting endpoint.

**Impact:** Violations fail silently; first indication of a CSP regression will be "buttons don't work in prod". No visibility.

**Fix:** Add `report-uri /csp-report` (or a Sentry endpoint via `report-to`). Low effort.

---

### [P2-16] CSP allows `'unsafe-inline'` for styles
**Severity:** P2
**Evidence:** `vercel.json:14` — `style-src 'self' 'unsafe-inline'`.

**Impact:** Tailwind generates inline styles for arbitrary utilities; practical to allow. But combined with any future stored-XSS sink this becomes exploitable. Acceptable for now, worth tracking.

**Fix:** Long-term, Tailwind + CSS modules doesn't actually need unsafe-inline if you pre-compile. Short-term: accept.

---

### [P2-17] `.env.development` is committed to git with `VITE_UI_VERSION=v2` — contains no secrets today but is a footgun
**Severity:** P2
**Evidence:** `git ls-files` shows `.env.development` and `.env.example` both tracked; `.env.local` and `.env*.local` correctly gitignored.

**Impact:** Low. Today the file has only `VITE_UI_VERSION=v2`. But `.env.development` is loaded by Vite in dev — a well-meaning dev who adds `VITE_SUPABASE_URL` or any value to it will commit it. Other envs (`production`, `local`) are correctly gitignored. The naming is inconsistent.

**Fix:** Either (a) delete `.env.development` and move `VITE_UI_VERSION=v2` into `.env.example` as a commented default, or (b) explicitly document in `.env.development` that it should NEVER contain secrets.

---

### [P2-18] `supabase.ts` uses `noopLock` — kills cross-tab session refresh synchronization
**Severity:** P2
**Evidence:** `src/lib/supabase.ts:27-38`.

**Impact:**
- Documented trade-off (React StrictMode NavigatorLockAcquireTimeoutError); acceptable for a single-tab admin app.
- But: if a user opens two tabs and one refreshes the token, the second tab has a stale access_token. Next request in the second tab gets a 401, supabase-js will refresh independently — mostly self-healing. The edge case is concurrent writes with the stale token: very low risk.
- Loud warning is warranted in a comment (already present), but worth re-evaluating after supabase-js bumps past the bug fix (https://github.com/supabase/auth-js/issues/762).

**Fix:** Add a TODO to reassess after the next supabase-js upgrade. Test cross-tab login/logout manually.

---

### [P2-19] `useAuth` demo-mode branch calls `supabase.auth.signOut({ scope: 'local' })` unconditionally on every fresh mount
**Severity:** P2
**Evidence:** `src/hooks/useAuth.ts:44`.

**Impact:**
- Correct intent: "clear any existing real session if DEMO_MODE is on, so a previously-logged-in user isn't still authed behind the demo". But this wipes localStorage state every page load even if no session exists. Harmless in demo mode, just extra work.
- More serious: if `DEMO_MODE` is ever toggled from `true` to `false` without a full browser reload, the stale `authInitialized` global prevents the real auth flow from running. (Unrealistic in practice — you'd need a hot env-var swap — but brittle.)

**Fix:** Only call signOut if there's an existing session (`supabase.auth.getSession()` first, then signOut only if non-null). Or accept the current behavior and document it.

---

### [P3-20] `LoginView` has dead "¿Olvidaste tu contraseña?" and "Solicita acceso" links pointing to `href="#"`
**Severity:** P3
**Evidence:** `src/features/auth/LoginView.tsx:189`, `252`.

**Impact:** Clicking them scrolls to top. Not a security bug, but a UX/trust wart on the first screen users see.

**Fix:** Either implement the flows or remove the links. `resetPasswordForEmail` already exists in `src/lib/auth.ts:59`.

---

### [P3-21] Extensive `// console.log` commented-out debugging code in `useAuth.ts`
**Severity:** P3
**Evidence:** `src/hooks/useAuth.ts` — ~20+ commented-out logs.

**Impact:** Noise, makes code hard to read, signals that the file was hard to debug (which is true — the module-level singletons are a smell).

**Fix:** Delete or replace with a conditional `debug('useAuth', ...)` helper behind an env flag.

---

### [P3-22] `logout` in `src/lib/auth.ts` and `src/lib/api/auth.ts` are duplicated
**Severity:** P3
**Evidence:** `src/lib/auth.ts:33` and `src/lib/api/auth.ts:77` both wrap `supabase.auth.signOut()`.

**Impact:** Minor duplication; `useAuth.signOut` calls `logout` from `api/auth`, but `LoginView` imports from `lib/auth`. Not a bug, just code smell.

**Fix:** Pick one path.

---

### [P3-23] `getCurrentUser` in `src/lib/api/auth.ts` has extensive commented-out `console.log`s AND uses `limit(1)` instead of `single()` as a workaround for "duplicates"
**Severity:** P3
**Evidence:** `src/lib/api/auth.ts:104-109`.

**Impact:** Comment says "Use limit(1) instead of maybeSingle() to handle duplicates" — suggests `profiles` could have two rows for the same `id`. But `profiles.id = auth.users.id` is the PK, so duplicates should be impossible. Either the comment is stale or there's a real multi-tenant-profile model being worked around. Worth confirming.

**Fix:** Verify `profiles` PK is `id` (seems to be per schema). Simplify to `.maybeSingle()`. Delete stale comments.

---

### [P3-24] `AuthCallback` writes `state: { fromOAuth: true }` to the setup page, but nothing appears to consume it
**Severity:** P3
**Evidence:** `src/features/auth/AuthCallback.tsx:66` — `navigate('/setup', { replace: true, state: { fromOAuth: true } });`.

**Impact:** Dead router state. If used later for "Google prefill hint", fine; otherwise delete.

**Fix:** Grep for `location.state?.fromOAuth` — not found in any view; delete.

---

## Non-findings (things that looked suspicious but are actually fine)

- **No `dangerouslySetInnerHTML` anywhere in `src/`.** Confirmed via grep.
- **No `localStorage` / `sessionStorage` direct use.** Supabase handles auth storage internally with `storageKey: 'enregla-auth-token'`. Good.
- **No hardcoded anon keys / service role keys in `src/`.** Confirmed via regex scan for `eyJhbGc`.
- **Only one `createClient` call.** No multi-client footgun.
- **`vercel.json` headers** are strong: HSTS preload, DENY frame, no-referrer, camera/mic/geo denied. CSP is present and reasonable (main gap is the reporting endpoint — P2-15).
- **`uploadPermitDocument`** sanitizes filenames and extensions before storing (P3 would be to extend sanitization to the `file_name` DB column; current regex does strip control chars and path separators).
- **Signed URLs TTL is 5 min** — short enough to be reasonable.
- **Demo-mode runtime guard** (`assertDemoModeNotInProduction`) exists. Good. Weakness is the hardcoded host list (see P0-3).
- **RUC validation is present** (13 digits) both client-side and within `saveCompany`. Missing: Ecuador-specific mod-11 checksum; not strictly a security bug.
- **Query cache is cleared on signout** (`queryClient.clear()` in `useAuth.signOut`) — prevents user A's data bleeding into user B's session on the same browser.

---

## Suggested fix order

1. **Now / before next deploy:** P0-1 (public link doc leak), P0-2 (leads DoS), P0-3 (domain consolidation).
2. **This sprint:** P1-4 (auth state machine), P1-5 (OAuth error handling), P1-6 (company creation abuse), P1-7 (profile disclosure), P1-8 (public-link rate limiting), P1-9 (window.open hardening), P1-10 (timer cleanup).
3. **Before GA:** all P2s.
4. **Whenever:** P3s.

## Verification recommendations

Per the `verify-behavior-not-shape` discipline: after fixing any P0, do NOT just re-read `pg_policies`. Actually run:

```sql
SET ROLE anon;
-- P0-1 test: should return 0
SELECT count(*) FROM documents WHERE permit_id IN (
  SELECT id FROM permits WHERE company_id != '<demo-uuid>'
);

-- P0-2 test: should fail
INSERT INTO leads (email) VALUES ('abuse@attacker.com');
-- (must fail with insufficient privilege after fix)

RESET ROLE;
```

Also run the dev server and click through: Google login → cancel mid-flow → should show friendly message. Login → open two tabs → log out in one → other tab should eventually bounce to `/login`.
