---
title: DB Reliability & Client Hardening — Design Spec
date: 2026-05-06
branch: feature/atlassian-ds-migration
status: approved
---

# DB Reliability & Client Hardening

Sprint spec to fix the recurring "skeleton eterno / app se muere" symptoms in EnRegla. This is a **hardening pass** over the existing Supabase stack — not a rewrite, not a migration. Target audience: 10-20 pilot companies over the next 2 months.

## Problem

The app feels broken. Users see:
- Loads slowly on first paint
- Sometimes hangs on the skeleton loader indefinitely
- Sometimes "dies" mid-use (queries stop responding, no error shown)
- Behavior is **intermittent and unpredictable**

## Root causes (from exploration)

- **~90% client-side**: hooks use raw `useState + useEffect + supabase.from()` with no cache, no retry, no hard timeout, no dedupe. A single network glitch = permanent skeleton. Every route navigation re-fetches data that was just fetched.
- **~10% schema**: missing indexes on `documents.permit_id` and `profiles.company_id`; `user_company_id()` / `user_role()` helper functions marked `VOLATILE` instead of `STABLE` so Postgres can't cache them within a query.
- **Auth layer** has accumulated 3 patches (global `authInitialized` flag, shared `initializationPromise`, 5s safety timeout) — all band-aids on top of a fragile single-useEffect init. Removing TanStack layer below would eliminate most of the need.

## Objectives

After this sprint is merged to main, with 10 pilot companies using the app:

- **Never** a permanent skeleton. If a query fails, UI shows a `DataErrorBanner` with a retry button.
- **Never** a query hangs > 10s without visible feedback. Hard timeout enforced client-side.
- Navigating between routes feels instantaneous (data served from cache).
- Every production error visible in a Sentry dashboard — no more "send me your console log".
- Every PR validates typecheck + lint + build + tests before merge (GitHub Actions).

## Non-goals (explicitly out of scope)

- Schema redesign or migration to a different backend (Neon, PlanetScale, etc.)
- Complete RLS policy rewrite (scope-to-pain ratio is wrong for 10 tenants)
- Edge Functions / server-side code (SPA stays client-only)
- Realtime subscriptions (permits don't change live)
- Comprehensive unit test coverage (tracked separately; current ~5%)
- Supabase region migration (flagged as follow-up pending user verification)

## User flow

The flow diagram lives in the HTML companion. At a high level:

1. User opens app → `main.tsx` boots QueryClient provider + ErrorBoundary + Sentry (if DSN present)
2. Router renders route → component invokes `useQuery(key, fetcher)` hook
3. **Cache hit (fresh)**: data returned immediately, no network request
4. **Cache hit (stale)**: data returned immediately; background revalidation fires
5. **Cache miss**: loading state → fetcher executes with 10s hard timeout
6. **Success**: data populates cache, UI renders
7. **Failure paths**:
   - Network offline → banner "Sin conexión", queued retry when online
   - Timeout → banner + Retry button; logs to Sentry
   - 401/403 auth → redirect to `/login`; clear store + cache
   - 500 server → retry 2x with exponential backoff; banner on final failure
   - RLS 403 with permission body → banner "No tienes permisos"; no retry
8. **Mutation** (updatePermit, renewPermit): on success, invalidate related queries by key → affected UI components re-render with fresh data

## Architecture

### Before

```
Component → useLocations() → useState + useEffect → supabase.from()
                                  ↓ no cache
                                  ↓ no retry
                                  ↓ no timeout
                                  ↓ re-fetch per mount
```

### After

```
Component → useLocations() → useQuery(['locations', companyId], fetcher)
                                  ↓
                     ┌────────────────────────┐
                     │   QueryClient (global) │
                     │   - Shared cache       │
                     │   - Auto dedupe        │
                     │   - Retry w/ backoff   │
                     │   - Stale-while-       │
                     │     revalidate         │
                     │   - 10s hard timeout   │
                     └────────────────────────┘
                                  ↓
                          supabase.from()
```

### QueryClient defaults

File: `src/lib/queryClient.ts` (new)

- `staleTime: 5 * 60 * 1000` — 5 min fresh
- `gcTime: 30 * 60 * 1000` — 30 min retained
- `retry: 2` with exponential backoff (1s, 2s)
- `networkMode: 'online'` — don't attempt queries when offline
- `refetchOnWindowFocus: true` — revalidate on tab re-focus
- `refetchOnReconnect: true` — revalidate when coming back online
- Custom fetcher wrapper that enforces a 10s hard timeout via `AbortController` + `Promise.race`

### Hook migration (big-bang)

All 8 hooks migrate in a single commit via parallel subagents:

| Hook | New query key | Notes |
|---|---|---|
| `useAuth` | (not a query — auth listener + `useQuery(['profile', userId])` for profile) | Removes `authInitialized` global, `initializationPromise`, 5s safety timeout |
| `useLocations` | `['locations', companyId]` | Decouples from `usePermits` (was implicit N+1) |
| `usePermits` | `['permits', { companyId, locationId }]` | |
| `usePermit` | `['permit', permitId]` | |
| `useDocuments` | `['documents', permitId]` | |
| `useLocation` | `['location', locationId]` | |
| `useNotificationPreferences` | `['notification-prefs', userId]` | |
| `usePermitHistory` (inside usePermit) | `['permit-history', permitId]` | |

Mutations (`updatePermit`, `renewPermit`, `uploadPermitDocument`, etc.) use `useMutation` and invalidate related keys in `onSuccess`.

### Error UX

New component: `src/components/ui/DataErrorBanner.tsx`

Props: `{ error: Error, onRetry: () => void, variant?: 'error' | 'warning' }`

Shown **instead of skeletons** when `isError` is true in the query state. Banner includes:
- Friendly message (localized per error type)
- Collapsible technical details (for debug)
- Retry button wired to `refetch()`

Global `src/components/ErrorBoundary.tsx` wraps `<App>`:
- Catches unhandled render errors
- Shows generic "Algo salió mal" screen with reload button
- Reports to Sentry automatically

### Error classification

| Error shape | User sees | Client behavior |
|---|---|---|
| Network (navigator.onLine = false) | Orange banner: "Sin conexión" | No retry until online event |
| `TimeoutError` from fetcher wrapper | Red banner + Retry | Sentry log |
| Auth 401/403 (no permission body) | Redirect to /login | Clear Zustand store, clear cache |
| Server 500 | Red banner + Retry | 2x auto-retry with backoff; Sentry on final |
| RLS 403 (permission denied body) | Banner: "No tienes permisos" | Sentry log; no retry |

### Sentry

- Package: `@sentry/react` (latest)
- Plan: free (5K errors/mo)
- Config: `src/lib/sentry.ts` — guarded behind `VITE_SENTRY_DSN` presence (no-op if missing)
- Captures: unhandled render errors, rejected promises, TanStack Query errors (via `queryClient.setMutationDefaults` and `setQueryDefaults`)
- Excludes: session replay (paid feature, not needed yet)
- Event context: `user.id`, `company_id`, `pathname`, last query key

## Database changes

All via migrations. Keep demo-mode support intact. No destructive changes.

### Migration `015_add_missing_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_documents_permit
  ON documents(permit_id);

CREATE INDEX IF NOT EXISTS idx_profiles_company
  ON profiles(company_id)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_permits_superseded_by
  ON permits(superseded_by)
  WHERE superseded_by IS NOT NULL;
```

### Migration `016_mark_rls_helpers_stable.sql`

```sql
ALTER FUNCTION user_company_id() STABLE;
ALTER FUNCTION user_role() STABLE;
```

`STABLE` tells Postgres the function result is deterministic within a single query, enabling result caching across RLS checks on the same query. Can only improve performance — never worsen.

### Types regeneration

`src/types/database.ts` currently missing `notification_logs` and `notification_preferences`. Regenerate:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

### Artifact cleanup

- Delete `reset-demo-user.sql` (contains bcrypt hash hardcoded; security risk)
- Delete `scripts/create-demo-data.sql` (obsolete; references dropped table `user_profiles`)
- Keep `supabase/seed.sql` (official CLI seed)

## Pipeline changes

### CI/CD (new file `.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit -p config/tsconfig.json
      - run: npm run build
      - run: npm test -- --run
```

Runs on every PR and every push to `main`. Red check blocks merge.

### `vercel.json` (extended)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Adds basic security headers + immutable caching for hashed asset bundles. Region defaults (iad1) stay.

### Code-splitting

`src/App.tsx` migrates all route components to `React.lazy()`:

```tsx
const DashboardView = lazy(() => import('@/features/dashboard/DashboardView'));
// ...etc for all ~12 routes
```

`<Suspense fallback={<AppLoader />}>` wraps `<Routes>`. Expected result:
- Initial bundle: ~300 KB (shell + Dashboard + Layout)
- Per-route chunks: ~50-100 KB, loaded on demand

### Env var cleanup

Remove from `.env.example`:
- `VITE_ENABLE_PUBLIC_LINKS`
- `VITE_ENABLE_GOOGLE_AUTH`
- `VITE_ENABLE_NETWORK_MAP`

Delete `.env.local.template` (redundant with `.env.example`).

Add to `.env.example`:
- `VITE_SENTRY_DSN` (optional; comment explains behavior if unset)

New doc: `docs/deployment/environment-variables.md` listing every variable, where read, default behavior if missing.

### Vercel dashboard checklist (user action)

For each environment (Production, Preview, Development), ensure set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_UI_VERSION=v2`
- `VITE_DEMO_MODE=false` (Production, Preview)
- `VITE_SENTRY_DSN` (after creating project at sentry.io)

## Execution plan (high-level)

### Phase 1 — Foundation (parallelizable, low risk)
- Apply migrations 015, 016
- Regenerate `src/types/database.ts`
- Delete artifact SQL files and dead env flags
- Write CI workflow
- Extend `vercel.json`

### Phase 2 — TanStack Query core
- Install `@tanstack/react-query` + devtools
- Create `src/lib/queryClient.ts` with defaults + timeout wrapper
- Add `QueryClientProvider` in `main.tsx`
- Migrate 8 hooks in parallel (subagents, one hook per agent)
- Adapt consuming components for new return shape

### Phase 3 — Error UX + Sentry
- `<DataErrorBanner>` component
- Global `<ErrorBoundary>`
- Wire Sentry init (guarded by DSN)
- Replace skeleton-on-error paths with `<DataErrorBanner>`

### Phase 4 — Code-splitting
- `React.lazy()` for all routes in `App.tsx`
- `<Suspense>` wrapper
- Verify `npm run build` produces ≥ 5 chunks; initial < 400 KB

### Phase 5 — Validation
- Dev server clean boot
- `npm run build` passes without new warnings
- `npx tsc --noEmit` clean
- Manual smoke test on Vercel preview:
  1. Dashboard loads in < 2s
  2. Inter-route nav is instant
  3. Kill network mid-query → see error banner with retry
  4. Tab idle 10min → return → revalidates, shows fresh data
  5. Open TanStack devtools → confirm cache working

## Success criteria (binary)

- ✅ 30 minutes of real use on Vercel preview with zero permanent skeletons
- ✅ `npm run build` produces ≥ 5 chunks, initial bundle < 400 KB
- ✅ PR to `main` has green CI (typecheck + lint + build + tests)
- ✅ Sentry is live and either empty or correctly captures errors observed during QA

## Effort estimate

1.5 - 2 days of implementation work (with parallel subagents) + user validation time.

## Follow-ups (deferred, tracked separately)

- Verify Supabase region; evaluate migration to `sa-east-1`/`us-east-1` if currently distant
- Playwright E2E smoke suite
- Realtime subscriptions for notifications
- RLS redesign (only if scaling past ~100 tenants)
- Bundle budget enforcement in CI (fail build if initial chunk > 500 KB)
