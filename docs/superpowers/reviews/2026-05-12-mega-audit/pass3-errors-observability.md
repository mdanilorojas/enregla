# Pass 3 — Errors, Observability, Telemetry, Logs, Crash Handling

**Scope:** `C:\dev\enregla\src\` + `C:\dev\enregla\supabase\functions\`
**Date:** 2026-05-12
**Branch:** `feat/dominio-v2`

---

## TL;DR — Top 5

1. **No telemetry, period.** No Sentry, Datadog, LogRocket, PostHog, Mixpanel — nothing. The `VITE_SENTRY_DSN` env var exists in `.env.example`, the implementation plan (`docs/superpowers/plans/2026-05-06-db-reliability.md` Phase 3, T20–T21) calls for it, but `src/lib/sentry.ts` was never created and `main.tsx` does not initialize anything. Every production error is invisible. (P0)
2. **No `window.onerror` / `unhandledrejection` handlers anywhere.** Global async rejections (e.g. a background `supabase.rpc` in `publicLinks.ts:150` that only logs in DEV) die silently in prod. (P1)
3. **Sourcemaps not emitted.** `config/vite.config.ts` has zero `build` config, so Vite's default `build.sourcemap: false` applies. `dist/assets/` contains only `.js`/`.css`, no `.map`. Even if Sentry were wired, stack traces would be unreadable. (P1)
4. **Hook error states are silently dropped by pages.** `usePermits`, `useLocations`, `usePermit`, `usePartners`, `useLeads` all return an `error` string, but `DashboardView`, `PermitListView`, `PermitDetailView` destructure only `permits`/`loading` and never render the error. On fetch failure the user sees an empty list (not a skeleton, not a banner) — same pathology the reliability plan was supposed to kill. (P0)
5. **`console.log` not stripped in prod.** No `esbuild.drop`, no Terser `drop_console`, no `define` replacement. 103 `console.*` calls across `src/` (including raw Supabase error objects, user ids, profile company_ids) ship to end-user browsers. Many are commented out in `useAuth.ts` but 14 live `console.error` calls in that file alone still leak on auth failure. (P1)

---

## 1. Error Boundaries

**File:** `C:\dev\enregla\src\components\ErrorBoundary.tsx`
**Wired in:** `C:\dev\enregla\src\main.tsx:15-19`

- Yes, a class `ErrorBoundary` using `getDerivedStateFromError` + `componentDidCatch` exists and wraps `<App>` (outside `QueryClientProvider`).
- It is **NOT** a React 19 `onCaughtError` / `onUncaughtError` handler on `createRoot` — those are unused.
- On render crash: shows "Algo salió mal" fallback with Reintentar + Recargar página buttons. Stack trace visible in DEV only. No white screen.
- `componentDidCatch` only logs in DEV (`import.meta.env.DEV`). **In prod, the crash is fully silent** — no Sentry hook, no network beacon, no persistent log.
  - Evidence: `src\components\ErrorBoundary.tsx:19-23`
- No nested/per-route boundaries. A crash inside `<PublicVerificationPage>` or `<SettingsView>` tears down the whole router.

**Severity:** P1 — the global boundary works, but nothing is logged in prod and there's no granular recovery.
**Fix:** Add a prod-side error sink inside `componentDidCatch` (Sentry when wired, or a minimal `fetch('/api/log', { keepalive: true })` beacon). Wrap each top-level route with its own boundary.

---

## 2. Global Unhandled Errors & Telemetry SDKs

**Evidence:**
- `grep -rn 'window\.(onerror|onunhandledrejection|addEventListener.*(error|unhandledrejection))' src/` → **zero matches.** Only scroll/resize/keydown listeners exist (`AppLayout.tsx:98,113`, `sidebar.tsx:115`, `ComplianceWeatherCard.tsx:47,97`).
- `grep -i 'Sentry|datadog|logrocket|mixpanel|posthog|bugsnag' src/` → **zero matches in `src/`**. Mentions live only in docs/plans.
- `package.json` dependencies: no `@sentry/*`, no `@datadog/*`, no analytics SDK. Confirmed.
- `.env.example:34` defines `VITE_SENTRY_DSN=` (empty placeholder). No code reads it.

**Gap vs. plan:** `docs/superpowers/plans/2026-05-06-db-reliability.md` Phase 3 Tasks 20–21 specify creating `src/lib/sentry.ts` and wrapping `main.tsx` with `Sentry.withErrorBoundary`. Neither exists in code. This is Phase 3 work that was skipped.

**Severity:** P0 (combined with sections 1, 3, 11 — zero production error visibility).
**Fix:** Execute plan Tasks 20–21.

---

## 3. `console.*` Usage & Prod Gating

**Counts (Grep, `src/**/*.ts{,x}`):**
- Total `console\.(log|warn|error|debug)` matches: **103 across 26 files**.
- In `.ts` files alone: 60+ matches from the partial list (mostly `useAuth.ts` which has 14 active `console.error` plus dozens of commented-out `console.log`).

**Hot spots:**
- `src\hooks\useAuth.ts:54,74,94,119,128,133,140,146,176,184` — `console.error` with full error objects (profile ids, PostgREST codes).
- `src\lib\api\documents.ts` — 9 `console.*` calls, many include file paths.
- `src\hooks\usePartners.ts` — 5 `console.error` calls with raw Supabase errors on partner CRUD.
- `src\hooks\useLeads.ts` — 4 `console.error` with lead error objects.

**Prod stripping:** `C:\dev\enregla\config\vite.config.ts` is 17 lines total, has `plugins: [react(), tailwindcss()]`, `resolve.alias`, and nothing else. **No `esbuild.drop`, no `build.minify` override, no `define` to gate `console`.** Vite's default `esbuild.drop` is empty — so all `console.*` calls ship to prod as-is.

A weak form of gating exists only in three places:
- `src\components\ErrorBoundary.tsx:20` — `if (import.meta.env.DEV) console.error(...)`
- `src\lib\api\publicLinks.ts:152,184` — same pattern around `createSignedUrl`.

Everywhere else, `console.error` runs in prod.

**Severity:** P1.
**Fix:** Add `esbuild: { drop: ['console', 'debugger'] }` to `vite.config.ts` for prod builds (or wrap in `command === 'build'` conditional). Alternatively, keep `console.error` and strip `log`/`debug` only if Sentry captures errors.

---

## 4. Supabase `.from(...)` — Error Handling (Sample 5 Hooks)

| Hook | File | `error` handled? | UI surfaces it? | Notes |
|---|---|---|---|---|
| `usePermits` | `src\hooks\usePermits.ts:33-42, 79-93` | Yes — `.catch` sets state; mutation throws. | **No** — `PermitListView.tsx:20` only reads `loading`/`permits`, ignores `error`. | On read failure user sees empty table + "0 permisos". `updatePermit` throws but caller swallows (see `PermitDetailView`). |
| `usePermit` | `src\hooks\usePermit.ts:22-41` | Yes — `.catch` sets `error` string. | **No** — `PermitDetailView` reads error state locally but never renders a banner for fetch failure. | |
| `useLocations` | `src\hooks\useLocations.ts:26-38, 81-93` | Yes. | **Partial** — `LocationsGrid.tsx:65-77` DOES render an error banner + Retry. This is the only hook with full UX. | |
| `useLeads` | `src\hooks\useLeads.ts:19-30, 32-47` | Yes — `.then(({data, error})=>...)` then logs. | **Yes** — `LeadsTable.tsx:41` → `if (error) return <div>Error: {error}</div>`. Internal CRM only. | Plain text, not a toast; no retry. |
| `usePartners` | `src\hooks\usePartners.ts:15-29` | Yes. | **Not verified** — `partners` consumers not checked. Create/update mutations `return null/false` on error, which many call sites interpret as "ignore". | |
| `useNotificationPreferences` | `src\hooks\useNotificationPreferences.ts:22-47` | Yes. | `NotificationPreferences.tsx:19` fires a generic `toast.error('Error al actualizar preferencias')` swallowing the real message. | Update throws — toast catches but drops `err.message`. |

**Additional swallowing:**
- `src\lib\api\permits.ts:200` — `renewPermit` catches doc upload error, only `console.error`. User never learns the document didn't upload.
- `src\lib\api\publicLinks.ts:150-155` — fire-and-forget `increment_public_link_view` RPC error is logged in DEV only.
- `src\features\permits\PermitDetailView.tsx:67` — `.catch(console.error)` on a promise chain.
- `src\features\public-links\PermitCard.tsx:90,128,141` — three bare `} catch {}` blocks that return fallback UI; errors lost.
- `src\features\settings\NotificationPreferences.tsx:18` — `} catch {}` blocks the error object entirely.

**Severity:** P0 for read failures in core views (DashboardView, PermitListView, PermitDetailView) — silent empty state masks an outage.

---

## 5. Toast Fidelity (`react-hot-toast`)

`react-hot-toast@^2.6.0` wired in `main.tsx:20-45`. `sonner@^2.0.7` also installed but not used.

Examples of error toasts:

| Location | Pattern | Fidelity |
|---|---|---|
| `NotificationPreferences.tsx:19` | `toast.error('Error al actualizar preferencias')` | Generic — real error lost. |
| `PermitDetailView.tsx:575` | `toast.error('Error al eliminar')` | Generic. |
| `PermitDetailView.tsx:116,130` | `toast.error(validationError)` | Good — shows actual validation message. |
| `CreateLocationModal.tsx:105` | `` toast.error(`Error al crear sede: ${errorMessage}`) `` | Good — includes raw message. |
| `RenewPermitModal.tsx:49` | `toast.error(message)` | Good. |

Only ~5 places total use error toasts in the UI. Most code paths either rely on inline `<Banner>` / red text or drop the error entirely. Mix of patterns.

**Severity:** P2.
**Fix:** Standardize: use toast.error(`${contextualPrefix}: ${errorMessage}`) with the real message. For generic validation, keep terse.

---

## 6. Network Failure UX (Offline / Retry)

**Evidence:**
- `grep -n 'navigator\.onLine\|online\|offline' src/` returns only:
  - `src\lib\auth.ts:87` — `access_type: 'offline'` (Google OAuth param, unrelated).
  - `src\lib\queryClient.ts:43,49` — `networkMode: 'online'`.
- **No `navigator.onLine` check, no `window.addEventListener('online'|'offline')`, no "you are offline" banner.**

TanStack Query's `retry: 2` with exp backoff (`queryClient.ts:41-42`) helps a bit for transient 5xx. `networkMode: 'online'` means queries stay paused when offline — but the user has no UI indication.

Mutations have `retry: 0` (`queryClient.ts:48`) — single failure is final.

**Severity:** P2. Target users are desk-based (per `CLAUDE.md`), so offline is rare, but a spotty Wi-Fi fails silently today.
**Fix:** Small `<OfflineBanner>` listening to `online`/`offline` events.

---

## 7. Loading Skeletons vs Spinners — Consistency

- Skeleton pattern (`src/components/ui/skeleton.tsx`, `animate-pulse`): used in **10 files** — Dashboard, LocationsGrid, LocationDetailView, PermitListView, PermitDetailView, DesignSystemShowcase, sidebar, skeleton.tsx.
- Spinner / `<Loader2>` pattern: used in **5 files** — `app-loader.tsx`, `button.tsx`, `CreateLocationModal.tsx`, `AuthCallback.tsx`, `IncrementalWizard.tsx`.
- `NotificationPreferences.tsx:34` hand-rolls its own spinner (`border-4 border-primary/30 border-t-primary rounded-full animate-spin`).
- `PublicVerificationPage.tsx:91` uses text-only "Verificando permiso…".

**Mixed but mostly skeletons for data loads and spinners for buttons / OAuth / wizard.** The inconsistency is the custom hand-rolled one in `NotificationPreferences`.

**Severity:** P3.
**Fix:** Replace `NotificationPreferences.tsx:33-35` with `<Loader2 className="animate-spin" />`. Keep skeletons for content shells.

---

## 8. Optimistic Updates Rollback

**`grep 'useMutation' src/`** → **zero matches.** TanStack Query is installed (`@tanstack/react-query@^5.100.9`) and `useQuery` is used in exactly one hook (`useCompany.ts`), but no `useMutation` anywhere, so **no optimistic updates and no `onError` rollback concerns exist**.

Every mutation goes through hand-rolled `async` functions (`usePermits.updatePermit`, `usePartners.createPartner`, `useLeads.updateLead`, etc.) that mutate, then `refetch()` to re-read. No optimistic UI.

**Severity:** P3 — not a bug, just a missed feature. If rollback-on-error is desired, migration to `useMutation` is needed.

---

## 9. Edge Function Logging

**File:** `C:\dev\enregla\supabase\functions\send-expiry-alerts\index.ts` (and `email-service.ts`, `queries.ts`).

- Consistent `[send-expiry-alerts]`, `[email-service]`, `[queries]` tag prefixes on every log line.
- `console.log` for happy-path progress, `console.error` for failures.
- Start marker, per-company processing line, final "done: N sent, M failed, K skipped" line.
- Error path at `index.ts:148` logs `error.message` (not the whole object → no stack on prod).
- Email addresses are **masked** via `maskEmail` before logging (`email-service.ts:14-19`) — good PII hygiene.

**No correlation id.** Each invocation has no request id; when multiple cron triggers overlap, logs are indistinguishable. Supabase Edge Runtime adds its own execution id in `get_logs`, which mitigates this somewhat.

**No structured JSON logs** — all are plain-string interpolations. `get_logs` can filter by substring but not by field.

**Error rethrow:** returns a 500 with `{error: message}` — Resend ratelimit errors would show up here but are swallowed per-user (`email-service.ts:73-80`) so the overall run succeeds while individual users silently failed.

**Severity:** P2.
**Fix:** Emit `const runId = crypto.randomUUID()` at boot, prefix every log with `[run=${runId}]`. Emit JSON lines with keys `{run_id, company_id, user_id, event, error}` so filter-by-user becomes trivial in the Supabase log viewer.

---

## 10. Dev vs Prod Gating — Leaked Debug Logs

**`import.meta.env.DEV` / `PROD` usage (`grep -n 'import\.meta\.env\.(DEV|PROD|MODE)' src/`):**

- `src\config.ts:9` — `export const IS_DEV: boolean = import.meta.env.DEV;` (exported, not widely consumed).
- `src\components\ErrorBoundary.tsx:20,63` — log + stack-trace display only in DEV. Good.
- `src\lib\demo.ts:25` — demo mode assertion in PROD. Good.
- `src\lib\api\publicLinks.ts:92` — switches between `https://enregla.ec` and `window.location.origin`. Unrelated but correct.
- `src\lib\api\publicLinks.ts:152,184` — `if (import.meta.env.DEV) console.error(...)`. Good.

**What is NOT gated:**
- All 14 `console.error` in `useAuth.ts` (sessionError, profile fetch errors) ship to prod.
- All `console.error` in hooks (`usePermits`, `useLocations`, `useLeads`, `usePartners`, `useDocuments`, `useNotificationPreferences`) ship to prod.
- All `console.error` in `lib/api/*` ship to prod — includes `[uploadPermitDocument] Storage upload error:` with full paths.

**Sensitive data in prod console:**
- `useAuth.ts:54,119,176` — logs Supabase `profileError` objects which include `code`, `details`, `hint`, `message` + sometimes column names.
- `useAuth.ts:74,128,133,140` — logs full `error` objects from session flow.

**Severity:** P1 — information leak + noisy devtools.
**Fix:** Either gate all non-error console calls behind `IS_DEV`, or add `esbuild: { drop: ['console', 'debugger'] }` in `vite.config.ts` (preserving `console.error` by listing `['console.log', 'console.debug']`).

---

## 11. Browser Error Reporting & Sourcemaps

- **`window.onerror`:** none.
- **`window.addEventListener('error'|'unhandledrejection')`:** none.
- **Sourcemaps:** `config/vite.config.ts` has NO `build` block. Vite's default is `build.sourcemap: false`. `dist/assets/` contains only `index-DGkT-n1M.js` and `index-MvIBCW8A.css` — no `.map` files. Confirmed.
- **`vercel.json`:** no sourcemap handling, no Sentry webhook. Just SPA rewrites + security headers.
- **CSP `script-src 'self'`** (`vercel.json:14`) — blocks inline Sentry bootstrap scripts. Any Sentry integration must use a first-party bundle (fine, but worth noting).

**Severity:** P1 — even if Sentry were added, stack traces would point at minified `index-DGkT-n1M.js:1:12345` with no symbolication.
**Fix:** Set `build: { sourcemap: 'hidden' }` in `vite.config.ts` (sourcemaps emitted but not referenced from the bundle), then upload via `@sentry/vite-plugin` at build time.

---

## Severity Summary

| # | Area | Severity | One-line fix |
|---|---|---|---|
| 2 | No Sentry / telemetry SDK | **P0** | Execute Phase 3 T20–T21 of db-reliability plan. |
| 4 | Page-level views ignore hook `error` state | **P0** | Render `<DataErrorBanner>` (from plan) in Dashboard, PermitListView, PermitDetailView. |
| 1 | ErrorBoundary silent in prod | **P1** | Sink to Sentry (after #2); add per-route boundaries. |
| 3 | `console.*` ships to prod (103 calls) | **P1** | `esbuild.drop: ['console.log', 'console.debug']` in `vite.config.ts`. |
| 10 | PII / error objects logged in prod | **P1** | Same as #3, or gate with `IS_DEV`. |
| 11 | No sourcemaps emitted | **P1** | `build.sourcemap: 'hidden'` + upload step. |
| 2 | No `unhandledrejection` handler | **P1** | Add once in `main.tsx` to forward to Sentry. |
| 5 | Toast fidelity inconsistent | **P2** | Helper `toastError(prefix, err)` appending `err.message`. |
| 6 | No offline detection | **P2** | Small `<OfflineBanner>` in `AppLayout`. |
| 9 | Edge function logs lack correlation id / JSON | **P2** | `runId = crypto.randomUUID()` prefix + JSON lines. |
| 7 | Mixed skeleton / spinner patterns | **P3** | Replace hand-rolled spinner in NotificationPreferences. |
| 8 | No optimistic updates | **P3** | Migrate mutations to `useMutation`. |

---

## Evidence Index (file:line)

- `src\main.tsx:13-47` — root render, no global error handlers, Toaster config.
- `src\components\ErrorBoundary.tsx:19-23` — dev-only console.error, no prod sink.
- `src\hooks\useAuth.ts:54,74,94,119,128,133,140,146,176,184` — 10 prod console.error leaks.
- `src\hooks\usePermits.ts:39,87` — error only logged; `updatePermit` throws but pages don't catch.
- `src\hooks\useLeads.ts:21,40,63,86` — logs fetchError objects directly.
- `src\hooks\usePartners.ts:21,40,61,84,100` — 5 prod leaks.
- `src\hooks\useLocations.ts:32,87` — LocationsGrid recovers, but `useLocation` (detail) doesn't.
- `src\hooks\useNotificationPreferences.ts:40,67` — logs; UI shows generic toast.
- `src\lib\api\documents.ts` — 9 `console.*` (file paths leaked).
- `src\lib\api\publicLinks.ts:150-155,180-186` — only DEV-gated log sites.
- `src\lib\api\permits.ts:200` — document upload error silently logged during renewPermit.
- `src\features\public-links\PermitCard.tsx:90,128,141` — 3 empty `} catch {}` blocks.
- `src\features\settings\NotificationPreferences.tsx:18-19` — empty catch + generic toast.
- `src\features\permits\PermitDetailView.tsx:67` — `.catch(console.error)` discards error from UI.
- `src\features\permits\PermitDetailView.tsx:575` — generic `toast.error('Error al eliminar')`.
- `src\features\dashboard\DashboardView.tsx:64-68` — destructures `{permits, loading}`, drops `error`.
- `src\features\permits\PermitListView.tsx:19-29` — same pattern.
- `src\features\locations\LocationsGrid.tsx:65-77` — the only hook consumer that renders the error + Retry correctly.
- `supabase\functions\send-expiry-alerts\index.ts:49,64,105,140,148` — happy-path + fatal logs, no correlation id.
- `supabase\functions\send-expiry-alerts\email-service.ts:47,67,71,74` — masked email logs, good.
- `supabase\functions\send-expiry-alerts\queries.ts:16,26,40,63,77,103,123` — per-query error logs (no IDs).
- `config\vite.config.ts` (full 17-line file) — no build config, no sourcemap, no esbuild.drop.
- `vercel.json` — no sourcemap / Sentry integration; CSP blocks inline scripts.
- `package.json:15-74` — zero telemetry SDKs.
- `.env.example:30-34` — `VITE_SENTRY_DSN` placeholder present; nothing reads it.
- `dist\assets\` — only `.js` + `.css`, no `.map` confirmed.
