# EnRegla — Pass 1: Build / Tests / Types / Lint Audit

**Date:** 2026-05-12
**Branch:** `feat/dominio-v2`
**Scope:** Actual execution of lint, typecheck, tests, build, audit, plus inventory of test coverage and CI gating.
**Environment:** Node via npm on Windows, `C:\dev\enregla\`.

---

## TL;DR — Top 5

1. **Build, typecheck, tests, lint all GREEN.** No P0 breakage on `feat/dominio-v2`. TS clean (exit 0). Vitest 19/19 passed. ESLint: 0 errors, 4 warnings. `npm run build` succeeds.
2. **Test coverage is effectively a smoke set.** 4 test files, 19 tests, all pure functions (dashboard risk calc, partner scoring, `withTimeout`, business-types dictionary). Zero tests for: auth flow, OAuth callback, RLS boundaries, any React component that touches Supabase, forms (7 files use `react-hook-form`), hooks (0/11 hooks tested), permits upload, renewals, onboarding wizard, settings, CRM mutations. No E2E at all (no Playwright / Cypress deps).
3. **No coverage thresholds configured.** `vitest.config.ts` has no `coverage` block; CI does not run coverage. There is no floor that a merge must clear. Coverage could be 1% and CI would still pass.
4. **Single 1.25 MB JS bundle (353 KB gzip) with no code-splitting.** Vite warns `chunks larger than 500 kB`; one `INEFFECTIVE_DYNAMIC_IMPORT` (mixed static+dynamic import of `src/lib/supabase.ts`) defeats a would-be split. Whole app ships in one chunk — bad TTI on first load.
5. **Supply-chain + schema-typing smells.** `npm audit`: 1 moderate (dompurify ≤3.3.3, multiple XSS bypass CVEs). `src/types/database.types.ts` is a 28-line hand-written placeholder ("Update these types based on your actual database schema") with only `Profile` and `Document` — not the output of `supabase gen types typescript`. Real types live in a 920-line hand-maintained `src/types/database.ts`. Drift risk is high.

---

## Severity summary

| Sev | Finding |
|-----|---------|
| **P0** | — none — build/tests/types/lint all pass on current branch. |
| **P1** | No tests for auth/RLS/forms/hooks/Supabase I/O. No E2E. No coverage threshold. `database.types.ts` is a stub, real schema types are hand-written (drift with prod schema likely). 1.25 MB single-chunk bundle. 1 moderate `npm audit` vuln (dompurify). |
| **P2** | 4 ESLint warnings (`react-hooks/exhaustive-deps` x3 + `react-hooks/incompatible-library` x1 on TanStack Table). CI has no coverage/audit/bundle-size step. ESLint config is minimal — no import-order, a11y, unused-imports, no-floating-promises, etc. `erasableSyntaxOnly` + `verbatimModuleSyntax` in tsconfig is fine but eslint doesn't enforce matching import style. |
| **P3** | Vite CSS optimizer warns on literal `--ds-status-*-text` Tailwind arbitrary value. `tests/features/network/` directory is empty. Hand-written `database.ts` at 920 lines without any generator pin. |

---

## Per-area breakdown

### 1) ESLint — `npm run lint`

**Result:** 0 errors, 4 warnings. Exit 0. CI gate: yes (`npm run lint`). Config: `config/eslint.config.js` (flat config, `js.configs.recommended` + `tseslint.configs.recommended` + `react-hooks` + `react-refresh` + `no-console` strict).

```
src/features/permits/PermitDetailView.tsx
  121:6  warning  React Hook useCallback has a missing dependency: 'validateFile'  react-hooks/exhaustive-deps
  137:6  warning  React Hook useCallback has a missing dependency: 'validateFile'  react-hooks/exhaustive-deps

src/features/permits/PermitTable.tsx
  91:17  warning  TanStack Table's `useReactTable()` API returns functions that cannot be memoized safely
                  react-hooks/incompatible-library

src/hooks/useDocuments.ts
  34:6   warning  React Hook useEffect has a missing dependency: 'fetchDocuments'  react-hooks/exhaustive-deps

4 problems (0 errors, 4 warnings)
```

Warnings by rule:
- `react-hooks/exhaustive-deps`: 3
- `react-hooks/incompatible-library`: 1

**Gaps:** No `@typescript-eslint/no-floating-promises`, no `@typescript-eslint/no-misused-promises`, no `no-restricted-imports` (e.g. forbid direct `supabase.from` outside `lib/api/`), no a11y plugin (`jsx-a11y`), no import ordering, no `unused-imports`. For an app that handles auth + storage uploads + async Supabase mutations everywhere, missing floating-promises is a real blind spot.

### 2) TypeScript — `npx tsc --noEmit -p config/tsconfig.json`

**Result:** 0 errors. Exit 0. Log file is empty (clean run).

Config highlights (`config/tsconfig.app.json`):
- `strict` is NOT explicitly set. Neither `tsconfig.app.json` nor `tsconfig.json` lists `"strict": true`. The base referenced config does not inherit one either — `strict` is effectively off unless TS defaults kick in for the specific rules enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`, `verbatimModuleSyntax`). **`noImplicitAny`, `strictNullChecks`, `noImplicitThis`, `alwaysStrict` are not explicitly enabled.** This is a silent P1.
- `skipLibCheck: true` — standard but hides `.d.ts` bugs in generated/third-party types.
- `ignoreDeprecations: "6.0"` — TS 6 deprecations are being silenced rather than fixed.

### 3) Vitest — `npm run test -- --run`

**Result:** Exit 0.

```
RUN  v4.1.4 C:/dev/enregla
Test Files  4 passed (4)
      Tests  19 passed (19)
   Duration  2.61s
```

**Config (`vitest.config.ts`):**
- `environment: 'jsdom'` ✓
- `globals: true` ✓
- Env fixtures injected (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=false`) ✓
- **No `setupFiles`** — no global `@testing-library/jest-dom` matcher import, no `cleanup` hook, no MSW.
- **No `coverage` block** — coverage is never measured.
- No `test.include`/`exclude` customization.

**Test files:**
```
src/lib/dashboard-metrics.test.ts                         (pure fn)
src/lib/__tests__/queryClient.test.ts                     (pure fn: withTimeout)
src/lib/__tests__/business-types.test.ts                  (pure dict)
src/features/internal-crm/__tests__/PartnerScorecard.test.tsx  (pure fn: qualifyPartner, label)
```

**What IS tested:** 4 pure functions. The `PartnerScorecard.test.tsx` file is misleadingly named — it tests `qualifyPartner`/`qualificationLabel` utilities, not the React component.

**What is NOT tested — by area:**
- **Auth flow:** `src/features/auth/LoginView.tsx`, `AuthCallback.tsx` — 0 tests. No assertion that PKCE callback succeeds, no test for `signInWithGoogle`, no test for demo-mode login branch.
- **Hooks:** 11 hook files in `src/hooks/` (`useAuth`, `useCompany`, `useDocuments`, `useLeads`, `useLocations`, `useNotificationPreferences`, `usePartners`, `usePermit`, `usePermitEvents`, `usePermits`, `use-mobile`) — 0 tests.
- **Forms (react-hook-form, 7 files):** `CompanyStep`, `LocationsStep`, `ProfileStep`, `IncrementalWizard`, `CreateLocationModal`, `LoginView`, `ui/form.tsx` — 0 tests. Zod schemas never validated against a rendered form.
- **Permits (10 files):** upload, table, filters, detail, timeline, CSV export, events — 0 tests.
- **Renewals, settings (4 tabs), dashboard, locations (10 files), legal, network, public-links, onboarding wizard (full flow):** 0 tests each.
- **RLS / Supabase integration:** 0 tests. No SQL test harness, no `supabase-js` mock, no integration test that hits a local/preview stack.
- **E2E:** 0 tests. No Playwright, no Cypress in deps.
- **Edge functions:** `supabase/functions/send-expiry-alerts` — 0 tests.

**`.skip`/`.only`/`xdescribe`/`xit`:** none in any test file (the two hits were `process.exit(1)` in a seed script).

**Ratio (rough):** 147 `.ts/.tsx` source files under `src/`, 4 test files — **~2.7% of modules have a colocated test**. Of the 147, 11 are hooks (0 tested), 64 are feature files (1 tested, and only a util from it).

### 4) Build — `npm run build`

**Result:** Exit 0. Build time 786 ms (Vite 8.0.7). `tsc -b` clean then `vite build` emits:

```
dist/index.html                     0.61 kB │ gzip:   0.37 kB
dist/assets/index-C1Lc1b5g.css    135.05 kB │ gzip:  22.18 kB
dist/assets/index-BthlnBED.js   1,246.02 kB │ gzip: 353.50 kB   <-- single chunk
```

**Warnings from the build:**

1. CSS optimizer: `Unexpected token Delim('*')` on `.text-[var(--ds-status-*-text)]` — looks like a Tailwind arbitrary-value using literal `*` in a CSS var; probably a stray class somewhere. Non-blocking but noisy.
2. `INEFFECTIVE_DYNAMIC_IMPORT`: `src/lib/supabase.ts` is `import(...)`'d dynamically by `PermitUploadForm.tsx` but statically imported by `AuthCallback.tsx`, `IncrementalWizard.tsx`, `AssigneePicker.tsx`, `CompanyTab.tsx`, `useAuth.ts`, and more → the dynamic import is a no-op. Someone tried to lazy-load Supabase once and everyone else defeated it.
3. `Some chunks are larger than 500 kB after minification` — single 1.25 MB JS bundle. No `rolldownOptions.output.codeSplitting`, no `manualChunks`, no route-level `lazy()` / `import()`. First-paint budget is whatever 353 KB gzip transfers + parse/compile of all of Recharts, `@xyflow/react`, `framer-motion`, `html2canvas`, `jspdf`, `d3-force`, etc.

### 5) Test-file inventory

```
src/lib/dashboard-metrics.test.ts
src/lib/__tests__/business-types.test.ts
src/lib/__tests__/queryClient.test.ts
src/features/internal-crm/__tests__/PartnerScorecard.test.tsx
```
(Plus an empty `tests/features/network/` directory at repo root — appears to be a scaffold with no tests yet.)

### 6) Skipped / exclusive tests

None. Grepped `\.(skip|only)\(|xdescribe\(|xit\(` across `**/*.{ts,tsx,js,jsx}`: only two hits, both `process.exit(1)` in `scripts/seed-demo.ts` — false positives.

### 7) CI — `.github/workflows/ci.yml`

```yaml
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
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit -p config/tsconfig.json
      - run: npm run build
        env:
          VITE_SUPABASE_URL: https://placeholder.supabase.co
          VITE_SUPABASE_ANON_KEY: placeholder-anon-key
          VITE_UI_VERSION: v2
          VITE_DEMO_MODE: 'false'
      - run: npm test -- --run
```

**Runs on PRs:** yes (`on: pull_request`).
**Gates merges:** depends on GitHub branch protection (**not verified here** — the workflow file exists, but whether `main` requires `validate` to pass is a repo setting outside this file). If branch protection is off, this is advisory-only.

**What CI runs:** lint, typecheck, build, test. That's it. No coverage, no audit, no bundle-size check, no migration smoke, no edge-function build, no deploy preview validation.

**What CI does NOT run:**
- `npm audit` (or `audit-ci`) — supply-chain drift goes unnoticed.
- Any coverage threshold or report.
- Bundle-size budget (`size-limit`, `bundlesize`) — 1.25 MB regressions go unnoticed.
- Supabase migrations dry-run (`supabase db lint` / `db push --dry-run`) — schema changes are un-gated by CI. Only local `mcp__supabase__apply_migration` has been the workflow.
- Edge-function typecheck/build (`supabase/functions/send-expiry-alerts/*`) — Deno code is not linted or type-checked.
- Playwright/Cypress E2E smoke on preview URL.
- Matrix across Node versions (only Node 20).
- Concurrency cancel-in-progress (re-running a branch queues parallel runs).
- CodeQL / dep review / Dependabot automerge on lockfile-only PRs.

### 8) `vitest.config.ts` review

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_DEMO_MODE: 'false',
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```
**Reasonable** for pure-function tests. **Missing for a real React test suite:**
- `setupFiles` → should import `@testing-library/jest-dom` + `afterEach(cleanup)`.
- `coverage` provider + thresholds (`v8` or `istanbul`, lines 70/80, excludes for `**/*.d.ts`, `**/types/**`).
- `pool: 'threads'` / `isolate: true` behavior for DB-touching tests.
- `testTimeout` (default 5s is fine for unit but RLS integration tests will need 15–30s).
- No MSW / Supabase mock (`@supabase/supabase-js` responses are not faked anywhere).

### 9) `npm audit --production`

```
dompurify  <=3.3.3   moderate
  - GHSA-39q2-94rc-95cp (ADD_TAGS function form bypasses FORBID_TAGS)
  - GHSA-h7mw-gpvr-xq4m (FORBID_TAGS bypassed by function-based ADD_TAGS)
  - GHSA-crv5-9vww-q3g8 (SAFE_FOR_TEMPLATES bypass in RETURN_DOM)
  - GHSA-v9jr-rg53-9pgp (Prototype Pollution to XSS via CUSTOM_ELEMENT_HANDLING)

1 moderate severity vulnerability
fix available via `npm audit fix`
```

dompurify is almost certainly coming in transitively via `jspdf` (PDF export) or `html2canvas`. Direct user input is not routed through it today, but all four CVEs are XSS-adjacent — worth patching.

### 10) `.d.ts` inventory (hand-written vs generated)

`find src -name "*.d.ts"` → **zero hits.** No hand-written ambient declarations, no generator output.

Instead:
- `src/types/database.types.ts` — 28 lines, **placeholder stub** with comment `// Update these types based on your actual database schema`. Contains only `Profile` and `Document`. This is where `supabase gen types typescript --project-id ...` output should go. It doesn't.
- `src/types/database.ts` — 920 lines of **hand-written** table/enum types. No `// Generated` header, no CI step to regenerate. Drift against the live schema is the default, not the exception — and the schema has been churning (see 20+ migrations this month, `20260511000008_hardening_v2.sql` being the latest big one).
- `src/types/crm.ts` — 129 lines hand-written.
- `src/types/index.ts` — 221 lines, re-exports + local types.

**P1 risk:** any migration that renames/drops a column will compile fine until runtime, because TS is checking against a snapshot that a human has to remember to update. There is no CI job that runs `supabase gen types typescript` and diffs.

---

## What a reasonable CI should check that isn't checked

1. **Coverage threshold.** Add `@vitest/coverage-v8`, fail CI below 60% lines on `src/lib/**` and `src/hooks/**` as a starting floor; raise over time.
2. **Supabase types drift.** CI step: `supabase gen types typescript --project-id $REF > /tmp/types.ts && diff /tmp/types.ts src/types/database.types.ts`. Fail on diff. Forces re-generation after migrations.
3. **Migration lint / dry-run.** `supabase db lint` or a `pg_dump --schema-only` diff against a Postgres container that replays `supabase/migrations/*.sql` — catches broken SQL before it hits the preview branch.
4. **`npm audit --omit=dev --audit-level=moderate`** (or `audit-ci`) as a non-blocking report or gate.
5. **Bundle-size budget.** `size-limit` or Vite's `--report` with a JSON compare against main — fail if gzip grows >20 KB. Currently 1.25 MB / 353 KB gzip with no upper bound.
6. **E2E smoke on preview URL.** Playwright spinning up against the Vercel preview (auto URL exposed via Vercel's GitHub deployment status). One test: login demo → load dashboard → click a permit. Catches 80% of regressions the unit suite can never see.
7. **Edge-function typecheck.** `deno check supabase/functions/**/*.ts` — today `send-expiry-alerts` has zero validation in CI.
8. **RLS contract tests.** Even a single SQL file per table run against a local stack under `SET ROLE anon` and `SET ROLE authenticated` (matches the `feedback_verify_behavior_not_shape` memory). Nothing mechanical enforces the "demo vs production" policy matrix today.
9. **`tsc --strict` migration plan.** Enable at least `strictNullChecks` + `noImplicitAny` — both are silently off. A migration could expose real bugs.
10. **ESLint expansion.** `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `jsx-a11y`, `unused-imports`, `import/order`, and a `no-restricted-imports` to force Supabase access through a wrapper.
11. **Branch protection verification.** Confirm `main` branch-protection rules require `validate` to pass and disallow force-pushes. (Outside the yml; has to be checked in repo settings.)
12. **Concurrency control.** `concurrency: { group: ${{ github.ref }}, cancel-in-progress: true }` to stop stacking runs on force-push.

---

## Raw command exit status

| Command | Exit | Notes |
|---|---|---|
| `npm run lint` | 0 | 4 warnings |
| `npx tsc --noEmit -p config/tsconfig.json` | 0 | No output |
| `npm run test -- --run` | 0 | 19/19 pass |
| `npm run build` | 0 | Warns: CSS `*` token, ineffective dynamic import, chunk>500KB |
| `npm audit --production` | non-zero (vuln present) | 1 moderate (dompurify) |

---

## Evidence files

- `/tmp/lint.log` (28 lines) — ESLint output captured.
- `/tmp/tsc.log` (0 lines) — clean run.
- `/tmp/test.log` — full vitest output.
- `/tmp/build.log` — full build output.

Relevant repo paths:
- `C:\dev\enregla\.github\workflows\ci.yml`
- `C:\dev\enregla\config\eslint.config.js`
- `C:\dev\enregla\config\tsconfig.app.json`
- `C:\dev\enregla\vitest.config.ts`
- `C:\dev\enregla\src\types\database.types.ts` (stub placeholder)
- `C:\dev\enregla\src\types\database.ts` (920-line hand-written)
- `C:\dev\enregla\tests\features\network\` (empty)
- `C:\dev\enregla\supabase\migrations\` (20+ migrations, none CI-validated)
- `C:\dev\enregla\supabase\functions\send-expiry-alerts\` (no CI validation)
