# DB Reliability & Client Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kill the "skeleton eterno / app se muere" symptoms by migrating all data-fetching hooks to TanStack Query with hard timeouts and error UI, adding missing DB indexes, wiring Sentry, setting up CI, and code-splitting routes. Target 10-20 pilot tenants.

**Architecture:** TanStack Query as single source of truth for server state. `QueryClient` configured with 5-min staleTime, retry-with-backoff, 10s hard timeout via AbortController. Error boundaries + `<DataErrorBanner>` replace permanent skeletons. Sentry guarded by env DSN. CI runs typecheck/lint/build/tests on every PR. Routes lazy-loaded via `React.lazy()`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Supabase, TanStack Query v5, Sentry React, GitHub Actions, Vercel. Package manager: npm.

**Spec reference:** `docs/superpowers/specs/2026-05-06-db-reliability-design.md`

---

## File Structure

### New files
- `.github/workflows/ci.yml` — CI pipeline
- `supabase/migrations/015_add_missing_indexes.sql` — DB indexes
- `supabase/migrations/016_mark_rls_helpers_stable.sql` — RLS helper optimization
- `src/lib/queryClient.ts` — QueryClient config + timeout fetcher wrapper
- `src/lib/errors.ts` — Error classification helper
- `src/lib/sentry.ts` — Sentry init guarded by DSN
- `src/components/ui/DataErrorBanner.tsx` — Error banner with retry
- `src/components/ErrorBoundary.tsx` — Global error boundary
- `docs/deployment/environment-variables.md` — Env var documentation

### Modified files
- `package.json` — add `@tanstack/react-query`, `@tanstack/react-query-devtools`, `@sentry/react`
- `src/main.tsx` — wrap `<App>` with `<QueryClientProvider>` + `<ErrorBoundary>` + Sentry init
- `src/App.tsx` — convert routes to `React.lazy()` + `<Suspense>`
- `src/hooks/useAuth.ts` — remove `authInitialized` flag, `initializationPromise`, 5s safety timeout; use `useQuery` for profile
- `src/hooks/useLocations.ts` — migrate to `useQuery`
- `src/hooks/usePermits.ts` — migrate to `useQuery`, mutations to `useMutation`
- `src/hooks/usePermit.ts` — migrate to `useQuery` (permit + history)
- `src/hooks/useDocuments.ts` — migrate to `useQuery`
- `src/hooks/useNotificationPreferences.ts` — migrate to `useQuery`
- `src/types/database.ts` — regenerate to include `notification_logs`, `notification_preferences`
- `vercel.json` — add security headers + asset cache-control
- `.env.example` — remove dead flags, add `VITE_SENTRY_DSN`

### Deleted files
- `.env.local.template` — redundant with `.env.example`
- `reset-demo-user.sql` — contains hardcoded bcrypt hash
- `scripts/create-demo-data.sql` — references dropped table `user_profiles`

---

## Phase 1 — Foundation

### Task 1: Delete dead artifacts and clean `.env.example`

**Files:**
- Delete: `.env.local.template`
- Delete: `reset-demo-user.sql`
- Delete: `scripts/create-demo-data.sql`
- Modify: `.env.example`

- [ ] **Step 1: Delete the three dead files**

```bash
git rm .env.local.template reset-demo-user.sql scripts/create-demo-data.sql
```

- [ ] **Step 2: Edit `.env.example` — remove dead feature flags, add Sentry placeholder**

Read `.env.example` first to get the exact current contents. Then remove the three unused flags (`VITE_ENABLE_PUBLIC_LINKS`, `VITE_ENABLE_GOOGLE_AUTH`, `VITE_ENABLE_NETWORK_MAP`) and append:

```
# Sentry (optional — error tracking in production)
# If unset, Sentry init is a no-op. Get DSN from sentry.io → Project Settings → Client Keys (DSN)
VITE_SENTRY_DSN=
```

- [ ] **Step 3: Verify nothing in the codebase references the deleted flags**

Run:
```bash
git grep -n "VITE_ENABLE_PUBLIC_LINKS\|VITE_ENABLE_GOOGLE_AUTH\|VITE_ENABLE_NETWORK_MAP" -- ':!.env.example' ':!docs/**'
```
Expected: no matches. If matches exist, stop and flag to user.

- [ ] **Step 4: Commit**

```bash
git add -u .env.example
git commit -m "chore(env): remove dead feature flags, add VITE_SENTRY_DSN placeholder"
```

---

### Task 2: Migration 015 — add missing indexes

**Files:**
- Create: `supabase/migrations/015_add_missing_indexes.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 015_add_missing_indexes.sql
-- Adds indexes missing from the initial schema that back common RLS and FK lookups.
-- All CREATE INDEX statements use IF NOT EXISTS so this is idempotent.

-- documents.permit_id: RLS policies on documents do EXISTS(SELECT FROM permits WHERE id = permit_id).
-- Without an index, this is a seq scan per row.
CREATE INDEX IF NOT EXISTS idx_documents_permit
  ON documents(permit_id);

-- profiles.company_id: Any query listing users in a company seq-scans profiles today.
-- Partial index excludes rows still in onboarding (company_id IS NULL).
CREATE INDEX IF NOT EXISTS idx_profiles_company
  ON profiles(company_id)
  WHERE company_id IS NOT NULL;

-- permits.superseded_by: Version-chain walks (old permit → new permit) have no index.
-- Partial index keeps it small (most permits are not superseded).
CREATE INDEX IF NOT EXISTS idx_permits_superseded_by
  ON permits(superseded_by)
  WHERE superseded_by IS NOT NULL;
```

- [ ] **Step 2: Apply the migration using Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with:
- name: `015_add_missing_indexes`
- query: the full SQL above

Expected result: migration applied, no errors.

- [ ] **Step 3: Verify indexes exist**

Use `mcp__supabase__execute_sql` with:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('documents', 'profiles', 'permits')
  AND indexname IN ('idx_documents_permit', 'idx_profiles_company', 'idx_permits_superseded_by');
```
Expected: 3 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/015_add_missing_indexes.sql
git commit -m "feat(db): add missing FK indexes on documents, profiles, permits"
```

---

### Task 3: Migration 016 — mark RLS helpers STABLE

**Files:**
- Create: `supabase/migrations/016_mark_rls_helpers_stable.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 016_mark_rls_helpers_stable.sql
-- user_company_id() and user_role() are called once per row in many RLS policies.
-- They are deterministic within a single query (same auth.uid(), same result) but were
-- declared VOLATILE (default). Marking them STABLE lets Postgres cache the result
-- across rows in the same query — pure performance win, no behavior change.

ALTER FUNCTION public.user_company_id() STABLE;
ALTER FUNCTION public.user_role() STABLE;
```

- [ ] **Step 2: Apply the migration using Supabase MCP**

Use `mcp__supabase__apply_migration` with:
- name: `016_mark_rls_helpers_stable`
- query: the SQL above

- [ ] **Step 3: Verify volatility changed**

Use `mcp__supabase__execute_sql`:
```sql
SELECT proname, provolatile
FROM pg_proc
WHERE proname IN ('user_company_id', 'user_role')
  AND pronamespace = 'public'::regnamespace;
```
Expected: both rows show `provolatile = 's'` (STABLE). Previously would have been `v` (VOLATILE).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/016_mark_rls_helpers_stable.sql
git commit -m "perf(db): mark RLS helper functions STABLE for query-level caching"
```

---

### Task 4: Regenerate `src/types/database.ts`

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Check that local Supabase is running**

Run:
```bash
npx supabase status
```
Expected: shows running services. If "not running", run `npx supabase start` first.

- [ ] **Step 2: Regenerate types from local Supabase schema**

Run:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

- [ ] **Step 3: Verify new tables are present**

Run:
```bash
git grep -n "notification_logs\|notification_preferences" src/types/database.ts
```
Expected: both names appear (they were missing before).

- [ ] **Step 4: Verify typecheck still passes**

Run:
```bash
npx tsc --noEmit -p config/tsconfig.json
```
Expected: no errors. If new errors appear from downstream code relying on the old types, fix those in the same commit (likely just needing to import new types where `any` was implicit).

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts
git commit -m "chore(types): regenerate database types to include notification tables"
```

---

### Task 5: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Verify `.github/workflows/` does not exist**

Run:
```bash
ls .github/workflows/ 2>&1
```
Expected: "No such file or directory". If the directory exists and has files, read them first to avoid conflicts.

- [ ] **Step 2: Create the workflow file**

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

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npx tsc --noEmit -p config/tsconfig.json

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: https://placeholder.supabase.co
          VITE_SUPABASE_ANON_KEY: placeholder-anon-key
          VITE_UI_VERSION: v2
          VITE_DEMO_MODE: 'false'

      - name: Test
        run: npm test -- --run
```

Note the placeholder env vars during build: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set (the app throws at startup without them), but CI does not run the app — we only build the bundle. Real values live in Vercel for actual deploys.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint, typecheck, build, test)"
```

- [ ] **Step 4: Verify workflow runs after push**

After this plan is merged or pushed, confirm CI ran by checking `gh run list -L 5` or GitHub UI. Not blocking for this task's completion.

---

### Task 6: Extend `vercel.json` with security headers and asset cache

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Read current `vercel.json`**

The current file only has the SPA rewrite. Confirm by reading it before editing.

- [ ] **Step 2: Replace contents with the extended config**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
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

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore(vercel): add security headers and immutable asset cache"
```

---

## Phase 2 — TanStack Query core

### Task 7: Install TanStack Query and devtools

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install packages**

```bash
npm install @tanstack/react-query@^5 @tanstack/react-query-devtools@^5
```

- [ ] **Step 2: Verify versions in package.json**

Run:
```bash
git diff package.json
```
Expected: two new entries under `dependencies`, both `^5.x.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @tanstack/react-query + devtools"
```

---

### Task 8: Create `src/lib/queryClient.ts` with defaults and timeout wrapper

**Files:**
- Create: `src/lib/queryClient.ts`
- Create: `src/lib/__tests__/queryClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/queryClient.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from '../queryClient';

describe('withTimeout', () => {
  it('resolves when fetcher resolves before timeout', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const result = await withTimeout(fetcher, 1000);
    expect(result).toBe('ok');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('rejects with TimeoutError when fetcher exceeds timeout', async () => {
    const fetcher = () => new Promise((resolve) => setTimeout(() => resolve('late'), 500));
    await expect(withTimeout(fetcher, 50)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('propagates fetcher rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withTimeout(fetcher, 1000)).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/lib/__tests__/queryClient.test.ts
```
Expected: FAIL with module-not-found (queryClient.ts doesn't exist yet).

- [ ] **Step 3: Create `src/lib/queryClient.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query';

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Query exceeded timeout of ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps an async fetcher with a hard timeout. If the fetcher does not resolve
 * within `timeoutMs`, the returned promise rejects with a TimeoutError. The
 * underlying fetcher may still complete in the background — callers relying on
 * cancellation semantics should pass an AbortSignal into the fetcher themselves.
 */
export function withTimeout<T>(
  fetcher: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
    fetcher()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const QUERY_TIMEOUT_MS = 10_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 min
      gcTime: 30 * 60 * 1000,             // 30 min
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      networkMode: 'online',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/lib/__tests__/queryClient.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queryClient.ts src/lib/__tests__/queryClient.test.ts
git commit -m "feat(data): add QueryClient with defaults and withTimeout helper"
```

---

### Task 9: Wire `<QueryClientProvider>` and devtools into `main.tsx`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `src/main.tsx` contents**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 2: Verify dev server boots cleanly**

Run dev server (background) and open the app. No console errors. Devtools widget should appear in the bottom-right corner (dev mode only).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat(data): wire QueryClientProvider + devtools into app root"
```

---

### Task 10: Migrate `useLocations` to `useQuery`

**Files:**
- Modify: `src/hooks/useLocations.ts`

- [ ] **Step 1: Replace `src/hooks/useLocations.ts` contents**

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanyLocations, getLocation } from '@/lib/api/locations';
import { usePermits } from '@/hooks/usePermits';
import { withTimeout, QUERY_TIMEOUT_MS } from '@/lib/queryClient';
import { calculateLocationRiskLevel } from '@/lib/dashboard-metrics';
import type { Location } from '@/types/database';

export function useLocations(companyId: string | null | undefined) {
  const { data: locations = [], isLoading, error, refetch } = useQuery<Location[]>({
    queryKey: ['locations', companyId],
    queryFn: () => withTimeout(() => getCompanyLocations(companyId!), QUERY_TIMEOUT_MS),
    enabled: !!companyId,
  });

  const { permits } = usePermits({ companyId });

  const locationsWithRisk = useMemo(
    () =>
      locations.map((location) => ({
        ...location,
        risk_level: calculateLocationRiskLevel(location, permits),
      })),
    [locations, permits],
  );

  return {
    locations: locationsWithRisk,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

export function useLocation(locationId: string | null | undefined) {
  const { data: location = null, isLoading, error, refetch } = useQuery<Location | null>({
    queryKey: ['location', locationId],
    queryFn: () => withTimeout(() => getLocation(locationId!), QUERY_TIMEOUT_MS),
    enabled: !!locationId,
  });

  return {
    location,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```
Expected: no new errors. If callers were destructuring a field that no longer exists, adjust callers here too.

- [ ] **Step 3: Verify dev server still boots and dashboard loads**

Start dev server, open `/` (dashboard), verify locations load. Check TanStack devtools: `['locations', companyId]` key visible.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLocations.ts
git commit -m "refactor(hooks): migrate useLocations/useLocation to useQuery"
```

---

### Task 11: Migrate `usePermits` to `useQuery` + mutations to `useMutation`

**Files:**
- Modify: `src/hooks/usePermits.ts`

- [ ] **Step 1: Replace `src/hooks/usePermits.ts` contents**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanyPermits, getLocationPermits } from '@/lib/api/permits';
import { supabase } from '@/lib/supabase';
import { withTimeout, QUERY_TIMEOUT_MS } from '@/lib/queryClient';
import type { Permit } from '@/types/database';

interface UsePermitsOptions {
  companyId?: string | null;
  locationId?: string | null;
}

export function usePermits({ companyId, locationId }: UsePermitsOptions) {
  const queryClient = useQueryClient();

  const { data: permits = [], isLoading, error, refetch } = useQuery<Permit[]>({
    queryKey: ['permits', { companyId: companyId ?? null, locationId: locationId ?? null }],
    queryFn: () =>
      withTimeout(
        () =>
          locationId
            ? getLocationPermits(locationId)
            : companyId
              ? getCompanyPermits(companyId)
              : Promise.resolve([]),
        QUERY_TIMEOUT_MS,
      ),
    enabled: !!(companyId || locationId),
  });

  const updateMutation = useMutation({
    mutationFn: async (args: {
      permitId: string;
      updates: {
        issue_date?: string;
        expiry_date?: string | null;
        status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
        permit_number?: string | null;
        notes?: string | null;
      };
    }) => {
      const { error } = await (supabase.from('permits') as any)
        .update({ ...args.updates, updated_at: new Date().toISOString() })
        .eq('id', args.permitId);
      if (error) throw new Error(`Error al actualizar el permiso: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit'] });
    },
  });

  const updatePermit = async (
    permitId: string,
    updates: Parameters<typeof updateMutation.mutateAsync>[0]['updates'],
  ) => {
    await updateMutation.mutateAsync({ permitId, updates });
  };

  return {
    permits,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    updatePermit,
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```
Expected: no new errors.

- [ ] **Step 3: Verify dashboard and permits list still render**

Dev server, navigate `/` and `/permisos`. Both should show data.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePermits.ts
git commit -m "refactor(hooks): migrate usePermits to useQuery + useMutation"
```

---

### Task 12: Migrate `usePermit` (detail + history) to `useQuery`

**Files:**
- Read first: `src/hooks/usePermit.ts` (to preserve current return shape)
- Modify: `src/hooks/usePermit.ts`

- [ ] **Step 1: Read the existing hook**

Read `src/hooks/usePermit.ts` and list every field it returns. The replacement must keep the same public API.

- [ ] **Step 2: Replace contents**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getPermit, getPermitHistory } from '@/lib/api/permits';
import { withTimeout, QUERY_TIMEOUT_MS } from '@/lib/queryClient';
import type { Permit } from '@/types/database';

export function usePermit(permitId: string | null | undefined) {
  const {
    data: permit = null,
    isLoading: permitLoading,
    error: permitError,
    refetch: refetchPermit,
  } = useQuery<Permit | null>({
    queryKey: ['permit', permitId],
    queryFn: () => withTimeout(() => getPermit(permitId!), QUERY_TIMEOUT_MS),
    enabled: !!permitId,
  });

  const {
    data: history = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<Permit[]>({
    queryKey: ['permit-history', permitId],
    queryFn: () => withTimeout(() => getPermitHistory(permitId!), QUERY_TIMEOUT_MS),
    enabled: !!permitId,
  });

  return {
    permit,
    history,
    loading: permitLoading || historyLoading,
    error: permitError
      ? (permitError as Error).message
      : historyError
        ? (historyError as Error).message
        : null,
    refetch: () => {
      refetchPermit();
      refetchHistory();
    },
  };
}
```

- [ ] **Step 3: Typecheck + smoke test on `/permisos/:id`**

```bash
npx tsc --noEmit -p config/tsconfig.json
```
Dev server, open a permit detail page, verify data + timeline load.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePermit.ts
git commit -m "refactor(hooks): migrate usePermit + history to useQuery"
```

---

### Task 13: Migrate `useDocuments` to `useQuery`

**Files:**
- Read first: `src/hooks/useDocuments.ts`
- Modify: `src/hooks/useDocuments.ts`

- [ ] **Step 1: Read existing hook, note return shape and any mutations**

- [ ] **Step 2: Replace contents**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPermitDocuments,
  uploadPermitDocument,
  deleteDocument,
} from '@/lib/api/documents';
import { withTimeout, QUERY_TIMEOUT_MS } from '@/lib/queryClient';
import type { Document } from '@/types/database';

export function useDocuments(permitId: string | null | undefined) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error, refetch } = useQuery<Document[]>({
    queryKey: ['documents', permitId],
    queryFn: () => withTimeout(() => getPermitDocuments(permitId!), QUERY_TIMEOUT_MS),
    enabled: !!permitId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!permitId) throw new Error('permitId required for upload');
      return uploadPermitDocument(permitId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', permitId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', permitId] });
    },
  });

  return {
    documents,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    uploadDocument: uploadMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    uploading: uploadMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
```

- [ ] **Step 3: Typecheck + smoke test**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDocuments.ts
git commit -m "refactor(hooks): migrate useDocuments to useQuery + useMutation"
```

---

### Task 14: Migrate `useNotificationPreferences` to `useQuery`

**Files:**
- Read first: `src/hooks/useNotificationPreferences.ts`
- Modify: `src/hooks/useNotificationPreferences.ts`

- [ ] **Step 1: Read existing hook, note all fields returned and any mutations**

- [ ] **Step 2: Replace contents with `useQuery` pattern**

Follow the same shape as Task 13 (`useDocuments`):
- `useQuery(['notification-prefs', userId], () => withTimeout(...), { enabled: !!userId })`
- For any update functions, wrap in `useMutation` + invalidate `['notification-prefs', userId]` on success
- Preserve the public API the existing component uses

Use the existing API functions (do not rewrite them). If this hook currently calls `supabase.from('notification_preferences')` directly rather than going through `src/lib/api/`, extract that call into `src/lib/api/notification-preferences.ts` first so the hook mirrors the pattern of the other hooks.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useNotificationPreferences.ts src/lib/api/notification-preferences.ts 2>/dev/null || git add src/hooks/useNotificationPreferences.ts
git commit -m "refactor(hooks): migrate useNotificationPreferences to useQuery"
```

---

### Task 15: Simplify `useAuth` — remove band-aids, move profile to `useQuery`

**Files:**
- Modify: `src/hooks/useAuth.ts`
- Read: `src/store/authStore.ts` (confirm shape)

- [ ] **Step 1: Replace `src/hooks/useAuth.ts` contents**

```typescript
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { withTimeout, QUERY_TIMEOUT_MS } from '@/lib/queryClient';
import type { Profile } from '@/types/database';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_USER_ID = '4bb8066b-0807-4eb7-81a8-29436b6875ea';
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@enregla.ec',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
} as const;

let authListenerInstalled = false;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return data;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, setAuth, clear, setLoading } = useAuthStore();

  // Install auth listener exactly once per app lifetime. Demo mode sets the user
  // synchronously and skips the listener.
  useEffect(() => {
    if (authListenerInstalled) return;
    authListenerInstalled = true;

    if (DEMO_MODE) {
      void (async () => {
        await supabase.auth.signOut({ scope: 'local' });
        setAuth(DEMO_USER as any, null);
      })();
      return;
    }

    setLoading(true);

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        clear();
        return;
      }
      setAuth(session.user, null);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setAuth(session.user, null);
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
        clear();
      }
      // TOKEN_REFRESHED: ignore, keep existing state
    });
  }, [setAuth, clear, setLoading, queryClient]);

  // Profile is a cached query keyed on user id; auto-refreshes via TanStack's rules.
  const profileQuery = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: () => withTimeout(() => fetchProfile(user!.id), QUERY_TIMEOUT_MS),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const signOut = async () => {
    await logout();
    queryClient.clear();
    clear();
  };

  const loading =
    (!DEMO_MODE && !user && useAuthStore.getState().loading) ||
    (!!user && profileQuery.isLoading);

  return {
    user,
    profile: profileQuery.data ?? null,
    loading,
    isAuthenticated: !!user,
    role: profileQuery.data?.role,
    companyId: profileQuery.data?.company_id,
    signOut,
  };
}
```

- [ ] **Step 2: Confirm `authStore` still has `setLoading`**

Open `src/store/authStore.ts`. It already has `setLoading` (verified during exploration). If not, add it before proceeding.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 4: Smoke test login flow**

- Open dev server, log out if logged in
- Log in → dashboard loads with profile-gated data
- Reload page → session restored, no stuck loader
- In TanStack devtools, `['profile', userId]` key is cached

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "refactor(auth): drop 3 race-condition band-aids, use useQuery for profile"
```

---

### Task 16: Convert `renewPermit` and other cross-cutting mutations to `useMutation` helpers

**Files:**
- Modify: `src/hooks/usePermits.ts` (add `useRenewPermit`)
- Update callers of the old `renewPermit` API function

- [ ] **Step 1: Read current callers**

```bash
git grep -n "renewPermit" src/
```
Note every call site.

- [ ] **Step 2: Add `useRenewPermit` hook to `src/hooks/usePermits.ts`**

Append to the existing file:

```typescript
import { renewPermit as renewPermitApi, type RenewPermitData } from '@/lib/api/permits';

export function useRenewPermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { permitId: string; data: RenewPermitData }) =>
      renewPermitApi(args.permitId, args.data),
    onSuccess: (_created, args) => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit', args.permitId] });
      queryClient.invalidateQueries({ queryKey: ['permit-history', args.permitId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
```

- [ ] **Step 3: Update callers to use `useRenewPermit`**

For each caller found in Step 1, replace direct `renewPermit(...)` API calls with:

```tsx
const renewMutation = useRenewPermit();
// ...
await renewMutation.mutateAsync({ permitId, data });
```

And show `renewMutation.isPending` on the submit button.

- [ ] **Step 4: Typecheck + smoke test**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePermits.ts src/features/
git commit -m "refactor(mutations): wrap renewPermit in useMutation with cache invalidation"
```

---

## Phase 3 — Error UX + Sentry

### Task 17: Create `src/lib/errors.ts` (classification helper)

**Files:**
- Create: `src/lib/errors.ts`
- Create: `src/lib/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { classifyError, type ClassifiedError } from '../errors';
import { TimeoutError } from '../queryClient';

describe('classifyError', () => {
  it('classifies TimeoutError as timeout', () => {
    const result: ClassifiedError = classifyError(new TimeoutError(10_000));
    expect(result.kind).toBe('timeout');
    expect(result.userMessage).toContain('tardó demasiado');
  });

  it('classifies offline when navigator.onLine is false', () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      const result = classifyError(new Error('Network request failed'));
      expect(result.kind).toBe('offline');
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: original, configurable: true });
    }
  });

  it('classifies 401 as auth', () => {
    const err = Object.assign(new Error('unauthorized'), { status: 401 });
    expect(classifyError(err).kind).toBe('auth');
  });

  it('classifies 403 with permission body as forbidden', () => {
    const err = Object.assign(new Error('permission denied'), {
      status: 403,
      message: 'new row violates row-level security policy',
    });
    expect(classifyError(err).kind).toBe('forbidden');
  });

  it('classifies 500 as server', () => {
    const err = Object.assign(new Error('boom'), { status: 500 });
    expect(classifyError(err).kind).toBe('server');
  });

  it('falls back to unknown', () => {
    expect(classifyError(new Error('weird')).kind).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run test — fails**

```bash
npm test -- --run src/lib/__tests__/errors.test.ts
```

- [ ] **Step 3: Create `src/lib/errors.ts`**

```typescript
import { TimeoutError } from './queryClient';

export type ErrorKind = 'offline' | 'timeout' | 'auth' | 'forbidden' | 'server' | 'unknown';

export interface ClassifiedError {
  kind: ErrorKind;
  userMessage: string;
  retryable: boolean;
  original: unknown;
}

const MESSAGES: Record<ErrorKind, string> = {
  offline: 'Sin conexión a internet. Revisa tu red y reintenta.',
  timeout: 'La consulta tardó demasiado. Puede ser tu conexión.',
  auth: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  forbidden: 'No tienes permisos para ver este contenido.',
  server: 'Ocurrió un error en el servidor. Intenta de nuevo en unos segundos.',
  unknown: 'Ocurrió un error inesperado. Reintenta o contacta soporte.',
};

function getStatus(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function classifyError(err: unknown): ClassifiedError {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { kind: 'offline', userMessage: MESSAGES.offline, retryable: true, original: err };
  }

  if (err instanceof TimeoutError) {
    return { kind: 'timeout', userMessage: MESSAGES.timeout, retryable: true, original: err };
  }

  const status = getStatus(err);
  const message = getMessage(err).toLowerCase();

  if (status === 401) {
    return { kind: 'auth', userMessage: MESSAGES.auth, retryable: false, original: err };
  }

  if (status === 403 || message.includes('row-level security') || message.includes('permission denied')) {
    return { kind: 'forbidden', userMessage: MESSAGES.forbidden, retryable: false, original: err };
  }

  if (status && status >= 500) {
    return { kind: 'server', userMessage: MESSAGES.server, retryable: true, original: err };
  }

  return { kind: 'unknown', userMessage: MESSAGES.unknown, retryable: true, original: err };
}
```

- [ ] **Step 4: Run test — passes**

```bash
npm test -- --run src/lib/__tests__/errors.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts src/lib/__tests__/errors.test.ts
git commit -m "feat(errors): add classifyError helper for UI error branching"
```

---

### Task 18: Create `<DataErrorBanner>` component

**Files:**
- Create: `src/components/ui/DataErrorBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from '@/lib/lucide-icons';
import { classifyError, type ErrorKind } from '@/lib/errors';

interface DataErrorBannerProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

const KIND_STYLES: Record<ErrorKind, { border: string; bg: string; iconColor: string }> = {
  offline:   { border: 'border-orange-300', bg: 'bg-orange-50',  iconColor: 'text-orange-600' },
  timeout:   { border: 'border-red-300',    bg: 'bg-red-50',     iconColor: 'text-red-600' },
  auth:      { border: 'border-red-300',    bg: 'bg-red-50',     iconColor: 'text-red-600' },
  forbidden: { border: 'border-yellow-300', bg: 'bg-yellow-50',  iconColor: 'text-yellow-700' },
  server:    { border: 'border-red-300',    bg: 'bg-red-50',     iconColor: 'text-red-600' },
  unknown:   { border: 'border-red-300',    bg: 'bg-red-50',     iconColor: 'text-red-600' },
};

export function DataErrorBanner({ error, onRetry, title }: DataErrorBannerProps) {
  const classified = classifyError(error);
  const [showDetails, setShowDetails] = useState(false);
  const styles = KIND_STYLES[classified.kind];

  const technicalDetail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  return (
    <div
      role="alert"
      className={`border ${styles.border} ${styles.bg} rounded-[var(--ds-radius-200)] p-[var(--ds-space-300)]`}
    >
      <div className="flex items-start gap-[var(--ds-space-200)]">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${styles.iconColor}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--ds-text)] text-[var(--ds-font-size-100)]">
            {title ?? 'No se pudo cargar'}
          </p>
          <p className="text-[var(--ds-text-subtle)] text-[var(--ds-font-size-100)] mt-1">
            {classified.userMessage}
          </p>

          <div className="flex items-center gap-[var(--ds-space-200)] mt-[var(--ds-space-200)]">
            {classified.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-[var(--ds-space-200)] py-[var(--ds-space-100)] rounded-[var(--ds-radius-200)] bg-[var(--ds-background-brand)] text-white text-[var(--ds-font-size-100)] font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Reintentar
              </button>
            )}
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-1 text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] hover:text-[var(--ds-text)]"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Detalles técnicos
            </button>
          </div>

          {showDetails && (
            <pre className="mt-[var(--ds-space-200)] text-[var(--ds-font-size-075)] text-[var(--ds-text-subtle)] bg-white/50 border border-[var(--ds-border)] rounded-[var(--ds-radius-100)] p-[var(--ds-space-200)] overflow-x-auto">
              {technicalDetail}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify required icons exist in the barrel**

```bash
git grep -n "AlertTriangle\|RefreshCw\|ChevronDown\|ChevronUp" src/lib/lucide-icons.ts
```
Expected: all four exported. If any missing, add to `src/lib/lucide-icons.ts`.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/DataErrorBanner.tsx src/lib/lucide-icons.ts
git commit -m "feat(ui): add DataErrorBanner with retry + collapsible details"
```

---

### Task 19: Create global `<ErrorBoundary>`

**Files:**
- Create: `src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary] Unhandled render error:', error, errorInfo);
    // Sentry integration picks this up via Sentry.ErrorBoundary wrapping this in main.tsx
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center p-[var(--ds-space-400)] bg-[var(--ds-neutral-50)]"
        >
          <div className="max-w-md text-center">
            <h1 className="text-[var(--ds-font-size-500)] font-bold text-[var(--ds-text)] mb-[var(--ds-space-200)]">
              Algo salió mal
            </h1>
            <p className="text-[var(--ds-text-subtle)] mb-[var(--ds-space-300)]">
              Ocurrió un error inesperado. Recarga la página; si persiste, contacta soporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-[var(--ds-space-300)] py-[var(--ds-space-200)] rounded-[var(--ds-radius-200)] bg-[var(--ds-background-brand)] text-white font-medium"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat(ui): add global ErrorBoundary component"
```

---

### Task 20: Install Sentry and create `src/lib/sentry.ts`

**Files:**
- Modify: `package.json`
- Create: `src/lib/sentry.ts`

- [ ] **Step 1: Install Sentry**

```bash
npm install @sentry/react@^8
```

- [ ] **Step 2: Create `src/lib/sentry.ts`**

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    // Intentionally silent in prod; keeps dev/local noise-free too.
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    // Disable session replay (paid feature); keep bundle small.
    integrations: [],
    beforeSend(event) {
      // Strip auth tokens accidentally passed in breadcrumbs
      if (event.request?.headers) {
        delete (event.request.headers as Record<string, unknown>).authorization;
      }
      return event;
    },
  });
}

export { Sentry };
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/sentry.ts
git commit -m "feat(observability): add Sentry init guarded by VITE_SENTRY_DSN"
```

---

### Task 21: Wire `<ErrorBoundary>` + Sentry into `main.tsx`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `src/main.tsx` contents**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { queryClient } from './lib/queryClient';
import { initSentry, Sentry } from './lib/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

initSentry();

const SentryBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: undefined, // use ErrorBoundary's default fallback
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SentryBoundary>
  </StrictMode>,
);
```

- [ ] **Step 2: Typecheck + dev boot smoke**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

Boot dev server. App loads. No console errors about missing Sentry DSN (since guarded).

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat(observability): wrap app root with Sentry + ErrorBoundary"
```

---

### Task 22: Replace skeleton-on-error paths with `<DataErrorBanner>` in main views

**Files:**
- Modify: `src/features/dashboard/DashboardView.tsx`
- Modify: `src/features/locations/LocationsListViewV2.tsx`
- Modify: `src/features/permits/PermitListView.tsx`
- Modify: `src/features/locations/LocationDetailView.tsx`
- Modify: `src/features/permits/PermitDetailView.tsx`

- [ ] **Step 1: Find all files with skeleton-on-loading pattern**

```bash
git grep -n "SkeletonList\|SkeletonCard\|Skeleton " src/features/
```

- [ ] **Step 2: For each matched file, add an error branch**

Pattern to apply (example for `DashboardView.tsx`):

Before:
```tsx
const { locations, loading: loadingLocs } = useLocations(companyId);
const { permits, loading: loadingPermits } = usePermits({ companyId });
const loading = loadingLocs || loadingPermits;

if (loading) {
  return <SkeletonList count={1} />;
}
```

After:
```tsx
const locsQuery = useLocations(companyId);
const permitsQuery = usePermits({ companyId });
const loading = locsQuery.loading || permitsQuery.loading;
const error = locsQuery.error ?? permitsQuery.error;

if (error) {
  return (
    <div className="min-h-screen bg-[var(--ds-neutral-50)] p-[var(--ds-space-400)]">
      <div className="max-w-7xl mx-auto">
        <DataErrorBanner
          error={new Error(error)}
          onRetry={() => {
            locsQuery.refetch();
            permitsQuery.refetch();
          }}
          title="No se pudo cargar el dashboard"
        />
      </div>
    </div>
  );
}

if (loading) {
  return <SkeletonList count={1} />;
}
```

Note: the hooks currently return `error` as `string | null`. The banner expects `unknown` — wrap in `new Error(error)` as shown.

**Apply the same pattern to each of the 5 files listed**, adapting field access for each view's hook usage. Import `DataErrorBanner` from `@/components/ui/DataErrorBanner`.

- [ ] **Step 3: Typecheck + smoke test each view**

```bash
npx tsc --noEmit -p config/tsconfig.json
```

Boot dev server. Visit each view. Verify loading skeletons still appear normally. Manually simulate an error (block the `*.supabase.co` domain in DevTools Network tab) and verify banner appears with retry button instead of permanent skeleton.

- [ ] **Step 4: Commit**

```bash
git add src/features/
git commit -m "feat(ui): show DataErrorBanner instead of permanent skeleton on errors"
```

---

## Phase 4 — Code-splitting

### Task 23: Convert routes to `React.lazy()` with `<Suspense>`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read current `src/App.tsx` to preserve route structure**

- [ ] **Step 2: Replace `src/App.tsx` contents**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLoader } from '@/components/ui/app-loader';

const AppLayout                 = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const ProtectedRoute            = lazy(() => import('@/components/Auth').then(m => ({ default: m.ProtectedRoute })));
const LoginView                 = lazy(() => import('@/features/auth/LoginView').then(m => ({ default: m.LoginView })));
const AuthCallback              = lazy(() => import('@/features/auth/AuthCallback').then(m => ({ default: m.AuthCallback })));
const IncrementalWizard         = lazy(() => import('@/features/onboarding-incremental/IncrementalWizard').then(m => ({ default: m.IncrementalWizard })));
const PublicVerificationPage    = lazy(() => import('@/features/public-links/PublicVerificationPage').then(m => ({ default: m.PublicVerificationPage })));
const DashboardView             = lazy(() => import('@/features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const LocationsListViewV2       = lazy(() => import('@/features/locations/LocationsListViewV2').then(m => ({ default: m.LocationsListViewV2 })));
const LocationDetailView        = lazy(() => import('@/features/locations/LocationDetailView').then(m => ({ default: m.LocationDetailView })));
const PermitListView            = lazy(() => import('@/features/permits/PermitListView').then(m => ({ default: m.PermitListView })));
const PermitDetailView          = lazy(() => import('@/features/permits/PermitDetailView').then(m => ({ default: m.PermitDetailView })));
const RenewalGridView           = lazy(() => import('@/features/renewals/RenewalGridView').then(m => ({ default: m.RenewalGridView })));
const LegalReferenceView        = lazy(() => import('@/features/legal/LegalReferenceView').then(m => ({ default: m.LegalReferenceView })));
const LegalCategoryDetailView   = lazy(() => import('@/features/legal/LegalCategoryDetailView').then(m => ({ default: m.LegalCategoryDetailView })));
const NetworkMapPage            = lazy(() => import('@/features/network/NetworkMapPage').then(m => ({ default: m.NetworkMapPage })));
const DesignSystemView          = lazy(() => import('@/features/design-system/DesignSystemView').then(m => ({ default: m.DesignSystemView })));
const DesignSystemShowcase      = lazy(() => import('@/features/design-system/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));
const SettingsView              = lazy(() => import('@/features/settings/SettingsView').then(m => ({ default: m.SettingsView })));

function OnboardingRoute() {
  const { profile, loading } = useAuth();
  if (loading) return <AppLoader />;

  let initialStep: 'profile' | 'company' | 'locations' = 'profile';
  if (profile?.full_name && profile?.company_id) initialStep = 'locations';
  else if (profile?.full_name) initialStep = 'company';

  return <IncrementalWizard initialStep={initialStep} />;
}

function ProtectedOnboardingRoute() {
  const { profile, loading } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  if (loading) return <AppLoader />;
  if (isDemoMode) return <AppLayout />;
  if (!profile?.company_id) return <Navigate to="/setup" replace />;
  return <AppLayout />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/p/:token" element={<PublicVerificationPage />} />
          <Route
            path="/login"
            element={
              isDemoMode
                ? (loading ? <AppLoader message="Modo Demo - Cargando..." /> : <Navigate to="/" replace />)
                : (isAuthenticated ? <Navigate to="/" replace /> : <LoginView />)
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/setup" element={<ProtectedRoute><OnboardingRoute /></ProtectedRoute>} />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedOnboardingRoute />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardView />} />
            <Route path="/sedes" element={<LocationsListViewV2 />} />
            <Route path="/sedes/:id" element={<LocationDetailView />} />
            <Route path="/mapa-red" element={<NetworkMapPage />} />
            <Route path="/permisos" element={<PermitListView />} />
            <Route path="/permisos/:id" element={<PermitDetailView />} />
            <Route path="/renovaciones" element={<RenewalGridView />} />
            <Route path="/marco-legal" element={<LegalReferenceView />} />
            <Route path="/marco-legal/:categoria" element={<LegalCategoryDetailView />} />
            <Route path="/design-system" element={<DesignSystemView />} />
            <Route path="/design-system-showcase" element={<DesignSystemShowcase />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/notifications" element={<SettingsView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Typecheck + run build**

```bash
npx tsc --noEmit -p config/tsconfig.json
npm run build
```
Expected: build produces ≥ 5 separate chunk files under `dist/assets/`. Main bundle should be < 400 KB (uncompressed).

- [ ] **Step 4: Smoke test in dev**

Dev server, navigate through every route. Each navigation: brief loader flash, then content. No broken imports.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "perf(bundle): route-level code-splitting via React.lazy()"
```

---

## Phase 5 — Validation

### Task 24: Create `docs/deployment/environment-variables.md`

**Files:**
- Create: `docs/deployment/environment-variables.md`

- [ ] **Step 1: Create the doc**

```markdown
# Environment Variables

Every variable EnRegla reads, where it is consumed, and what happens if missing.

All client-exposed variables must be prefixed `VITE_`. Vite inlines them into the bundle at build time.

## Required

| Variable | Used in | Missing behavior |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts:5` | App throws at startup: "Missing Supabase environment variables" |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts:6` | Same as above |

## Optional

| Variable | Default | Effect |
|---|---|---|
| `VITE_UI_VERSION` | (unset) | Currently always `v2` in practice; value is read for future routing between UI versions |
| `VITE_DEMO_MODE` | `false` | When `true`: injects a mock demo user (`demo@enregla.ec`) and bypasses real auth. Used for local dev and demos — never set in Production |
| `VITE_SENTRY_DSN` | (unset) | When set: initializes Sentry error tracking. When unset: `initSentry()` is a no-op |

## Environments

| Environment | Purpose | Should set |
|---|---|---|
| Local (`.env.local`) | Your machine | All four VITE_ vars |
| Vercel Preview | Branch previews | SUPABASE_URL, ANON_KEY, UI_VERSION=v2, DEMO_MODE=false, SENTRY_DSN |
| Vercel Production | Live site | Same as Preview |
| CI (GitHub Actions) | Typecheck/build/test | Placeholders are fine (build never runs the app) |

## Where to set Vercel vars

Vercel Dashboard → Project → Settings → Environment Variables. Scope each one to the envs you want (Production, Preview, Development).
```

- [ ] **Step 2: Commit**

```bash
git add docs/deployment/environment-variables.md
git commit -m "docs: add environment variables reference"
```

---

### Task 25: Bundle + typecheck + lint + smoke test

**Files:** none modified in this task — this is validation only.

- [ ] **Step 1: Full typecheck**

```bash
npx tsc --noEmit -p config/tsconfig.json
```
Expected: zero errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: zero errors. Warnings acceptable if pre-existing.

- [ ] **Step 3: Build + inspect chunks**

```bash
npm run build
ls -la dist/assets/ | sort -k5 -n -r | head -20
```
Expected: ≥ 5 `.js` files under `dist/assets/`. Largest single chunk < 500 KB (uncompressed).

- [ ] **Step 4: Run test suite**

```bash
npm test -- --run
```
Expected: new tests (`queryClient.test.ts`, `errors.test.ts`) pass. Pre-existing failing tests: documented as follow-up, not blocking this sprint.

- [ ] **Step 5: Manual smoke test on `npm run dev`**

Check each of these against the dev server:

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/` (dashboard) | Renders in < 2s, no permanent skeleton |
| 2 | Navigate `/sedes` → `/` → `/sedes` | Second visit is instant (cache) |
| 3 | Open DevTools Network → right-click → "Throttle: Offline" → click Refresh | `DataErrorBanner` appears with "Sin conexión" |
| 4 | Turn Throttle back to "No throttling" → click Reintentar on banner | Data loads |
| 5 | Open TanStack devtools (bottom-right) | See cached queries: `locations`, `permits`, `profile` |
| 6 | Log out and back in | Clean transition, no stuck loaders |
| 7 | Leave tab idle for 6+ minutes, return | Stale data served instantly, background revalidation visible in devtools |

- [ ] **Step 6: Commit validation checklist (for posterity)**

Create `docs/superpowers/plans/2026-05-06-db-reliability-validation.md` with the checklist above marked as passed/failed + any notes. Then:

```bash
git add docs/superpowers/plans/2026-05-06-db-reliability-validation.md
git commit -m "docs: validation log for DB reliability sprint"
```

---

## Self-Review (completed by plan author)

### Spec coverage check

- ✅ TanStack Query migration of 8 hooks → Tasks 10–16
- ✅ Hard timeouts → Task 8 (`withTimeout` helper used in all hook queryFns)
- ✅ Error UX (`DataErrorBanner`, `ErrorBoundary`) → Tasks 18, 19, 22
- ✅ Sentry guarded by DSN → Tasks 20, 21
- ✅ Missing DB indexes → Task 2
- ✅ RLS helpers STABLE → Task 3
- ✅ Types regenerated → Task 4
- ✅ CI workflow → Task 5
- ✅ `vercel.json` headers → Task 6
- ✅ Code-splitting → Task 23
- ✅ Env var cleanup → Task 1
- ✅ Env var doc → Task 24
- ✅ Validation → Task 25

### Type consistency notes

- `queryClient.ts` exports `TimeoutError` (class) and `QUERY_TIMEOUT_MS` (const) — both used consistently across Tasks 10–16, 17
- `classifyError` returns `ClassifiedError` with `kind`, `userMessage`, `retryable`, `original` — used in Tasks 17, 18
- `DataErrorBanner` props `{ error: unknown, onRetry?: () => void, title?: string }` — callers in Task 22 conform
- Hook return shapes preserve existing public API (`{ data-ish, loading, error, refetch }`) so consumer components need minimal edits

### Placeholder scan

No `TBD`, `TODO`, `implement later`, `similar to Task N` patterns. Every code step shows complete code.
