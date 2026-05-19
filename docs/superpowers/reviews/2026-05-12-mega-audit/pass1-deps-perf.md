# Mega Audit – Pass 1: Dependencies, Bundle Size, Runtime Performance

**Date:** 2026-05-12
**Branch:** `feat/dominio-v2`
**Scope:** `C:\dev\enregla`
**Author:** Audit agent (Opus 4.7)
**Methodology:** Static analysis + `npm run build` + `npm audit` + source grep. No fixes applied.

---

## TL;DR – Top 5 findings

1. **Zero code-splitting.** The production build emits **one 1.25 MB JS chunk** (`dist/assets/index-BthlnBED.js` = 1,246,024 bytes / 353.5 kB gzip) plus one 135 kB CSS file. No `React.lazy()`, no dynamic route imports. Vite itself warns. Every user downloads the public-verification page, the legal matrix, the xyflow network map, and the design-system playground on first paint. **P0.**
2. **Massive dead dependencies shipped as `dependencies`** (not devDeps): `recharts` (8.3 MB on disk), `html2canvas` (4.1 MB), `jspdf` (29 MB), `d3-force` (124 kB), `@tanstack/react-virtual` (40 kB), `framer-motion` (5.4 MB), `sonner` (188 kB), plus `zod`, `@hookform/resolvers`, and effectively `react-hook-form` (only imported by an unused `components/ui/form.tsx`). **Zero imports in `src/`.** Tree-shaking should drop most of them from the final bundle, but they are still installed, locked, auditable, and raise the CVE surface (see #3). **P0.**
3. **Double toast library.** Both `sonner@2.0.7` and `react-hot-toast@2.6.0` are in `dependencies`. Only `react-hot-toast` is actually used (6 imports, `<Toaster/>` mounted in `src/main.tsx`). `sonner` has zero references in `src/`. **P2 — remove.**
4. **Known moderate CVE ships to prod via `jspdf → dompurify@3.3.3`** (4 advisories: GHSA-39q2-94rc-95cp, GHSA-h7mw-gpvr-xq4m, GHSA-crv5-9vww-q3g8, GHSA-v9jr-rg53-9pgp). Because **`jspdf` itself is never imported**, the vulnerable code is dead — but it still gets bundled if any transitive path reaches it and it shows up in every `npm audit` run. Removing `jspdf` eliminates the advisory. **P2.**
5. **TanStack Query wired with `refetchOnWindowFocus: true` and 5 min staleTime.** Acceptable for compliance data, but combined with `retry: 2` and the 10 s timeout it can burst 3 requests per tab-focus on a flaky connection per query. Auth listener in `useAuth.ts` deliberately never unsubscribes (comment on line 207: *"Don't unsubscribe - keep it alive for the app lifetime"*) — fine in production, but in React 19 StrictMode + dev this causes a double-registered `onAuthStateChange` callback because the module-level `authSubscription` guard is set **after** the subscription is created, not before. **P2 runtime risk in dev, low-risk in prod.**

---

## Severity Legend

| | Meaning |
|---|---|
| **P0** | Blocks or severely degrades production UX. Fix before next release. |
| **P1** | Measurable user-visible issue or significant tech-debt. Fix this cycle. |
| **P2** | Correctness/hygiene issue. Schedule in the next maintenance window. |
| **P3** | Nit / observability. Address opportunistically. |

---

## 1. Bundle Weight

### 1.1 Build output

```
dist/index.html                     0.61 kB │ gzip:   0.37 kB
dist/assets/index-C1Lc1b5g.css    135.05 kB │ gzip:  22.18 kB
dist/assets/index-BthlnBED.js   1,246.02 kB │ gzip: 353.50 kB
```

Build is 3,139 modules, 667 ms (rolldown-based Vite 8 — build is fast, output is huge).

Vite emitted two warnings:
- **`INEFFECTIVE_DYNAMIC_IMPORT`** — `src/lib/supabase.ts` is dynamically imported from `PermitUploadForm.tsx:185` but statically imported by 5+ other modules (`AuthCallback`, `IncrementalWizard`, `AssigneePicker`, `CompanyTab`, `useAuth`, ...). Result: the dynamic import does **nothing** — supabase-js is in the main chunk anyway.
- **Chunk > 500 kB** — the default Vite warning. Unaddressed.

### 1.2 Chunk table

| File | Raw | Gzip | Notes |
|---|---:|---:|---|
| `index-BthlnBED.js` | 1,246 kB | 353.5 kB | **Everything.** React, react-router, supabase-js, tanstack-query, tanstack-table, @xyflow/react + d3, lucide icons used in the app, react-day-picker, qrcode.react, react-hot-toast, date-fns (+ es locale), zustand, radix-ui set, the app itself. |
| `index-C1Lc1b5g.css` | 135 kB | 22.2 kB | Tailwind v4 output + `@xyflow/react/dist/style.css`. Has a CSS warning: `var(--ds-status-*-text)` literal `*` token in generated CSS — malformed property (see `src/index.css` design-tokens). |
| `index.html` | 0.6 kB | — | — |

### 1.3 Heaviest installed deps (`node_modules/`, disk)

| Dep | On-disk | In-bundle usage | Notes |
|---|---:|---|---|
| `lucide-react` | **37 MB** | Tree-shakes per-icon. ~60 icons used (see `lib/lucide-icons.ts` + direct imports). Real bundle cost ≈ 5-8 kB. | OK in-bundle; node_modules cost is tolerable. |
| `date-fns` | **32 MB** | Per-function imports (`format`, `parseISO`, etc.) — tree-shakes correctly. `date-fns/locale/es` is imported once. | OK. |
| `jspdf` | **29 MB** | **Not imported anywhere in `src/`.** | **Dead. Remove.** |
| `@tanstack` (all) | 12 MB | query + table used, `react-virtual` unused. | Remove virtual. |
| `recharts` | **8.3 MB** | **Not imported anywhere in `src/`.** | **Dead. Remove.** |
| `@supabase` | 7.4 MB | supabase-js used extensively. | OK. |
| `framer-motion` | **5.4 MB** | **Not imported anywhere in `src/`.** | **Dead. Remove.** |
| `html2canvas` | **4.1 MB** | **Not imported anywhere in `src/`.** | **Dead. Remove.** |
| `@xyflow` | 3.8 MB | Used in `DashboardMap.tsx` + nodes/edges (5 files). | OK but heavy for a single screen. See #4. |
| `react-day-picker` | 3.5 MB | Used in `components/ui/calendar.tsx` only. | OK. |
| `@radix-ui` | 3.0 MB | 10 primitives used. | OK. |
| `d3-force` | 124 kB | **Not imported anywhere in `src/`.** | **Dead (unless consumed transitively by @xyflow — which uses its own @xyflow/dagre; verify).** |
| `sonner` | 188 kB | **Not imported anywhere.** Dead — react-hot-toast is the one actually used. | **Dead. Remove.** |
| Total `node_modules/` | **423 MB** | | |

---

## 2. Duplicate / Overlapping Deps

| Purpose | Installed | Actually used | Verdict |
|---|---|---|---|
| Toasts | `sonner` + `react-hot-toast` | **react-hot-toast only** (6 files + `<Toaster/>` in `main.tsx`). `sonner` has zero `from 'sonner'` imports. | **Remove `sonner`.** P2. |
| Charts | `recharts` | none | **Remove `recharts`.** P2. |
| PDF export | `jspdf` + `html2canvas` (always paired) | none | **Remove both.** P2. Also kills the `dompurify` CVE chain. |
| Animation | `framer-motion` | none | **Remove.** P2. |
| Graph layout | `d3-force` | none (not imported directly; @xyflow uses its own layout) | **Remove** (verify no transitive requirement). P2. |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | `react-hook-form` imported **only** by `src/components/ui/form.tsx`, which is **never imported anywhere** (grep `from "@/components/ui/form"` → 0). `zod` and `@hookform/resolvers` zero imports. | **Remove all three** (or use them if forms are planned). P1. |
| Virtualization | `@tanstack/react-virtual` | none | **Remove.** P2. |

**No other duplicate overlap detected.** `clsx`, `tailwind-merge`, `class-variance-authority` are the standard shadcn/Radix toolkit. Both `@types/node` and runtime code fine.

---

## 3. Suspect Versions

| Package | Installed | Latest (npm registry as of 2026-05-12) | Verdict |
|---|---|---|---|
| `lucide-react` | `^1.14.0` | **`1.14.0` (yes, 1.x is real)** | **OK.** I initially flagged this but verified: npm shows `latest: 1.14.0`, with the old `0.x` line still carried under `next: 1.3.0` / `beta: 0.266.0-beta.0`. lucide-react did cut a 1.0 in the 2025/2026 stretch. Not a typo. |
| `typescript` | `~6.0.2` | `6.0.3` | **OK.** TS 6.0 is the current `latest`. Slight upgrade available (6.0.2 → 6.0.3 patch). |
| `vite` | `^8.0.4` (installed: 8.0.7) | `8.0.12` | Minor behind. P3. |
| `@tanstack/react-query` | `^5.100.9` | `5.100.10` | Up to date. |
| `@xyflow/react` | `^12.10.2` | `12.10.2` | Up to date. |
| `react-router-dom` | `^7.14.0` | `7.15.0` | One minor behind. P3. |
| `react` | `^19.2.4` | (current) | Up to date. |
| `sonner` | `^2.0.7` | `2.0.7` | **Will be removed.** |

**No version is weirdly old.** Registry checked live via `npm view`.

---

## 4. Tree-shaking Risk

### 4.1 lucide-react

- **Good:** every import is named per-icon (`import { X, Y } from 'lucide-react'`). No `import * as Icons from 'lucide-react'`. Tree-shaking should keep bundle cost ≈ 5-8 kB.
- **Inconsistency (P3):** `src/lib/lucide-icons.ts` is a centralized re-export wrapper listing ~60 icons. Only `PermitTable.tsx` imports from `@/lib/lucide-icons`. **58 other files bypass the wrapper and import directly from `lucide-react`.** The wrapper's JSDoc comment says it exists "to maintain consistency and enable tree-shaking" — the second claim is false (named imports tree-shake identically regardless of wrapper). Either delete the wrapper (recommended — it's a maintenance trap: every new icon requires editing `lucide-icons.ts` first, and most of the codebase already ignores it) or enforce it via ESLint `no-restricted-imports`.

### 4.2 date-fns

- **Good:** per-function imports (`format`, `parseISO`, `differenceInDays`, `addDays`, `isAfter`, `isBefore`) and per-locale (`date-fns/locale`). date-fns v4 ESM tree-shakes.
- **Note:** `date-fns/locale` import pulls a bigger barrel than necessary. Ideal: `import { es } from 'date-fns/locale/es'` — verify current form doesn't pull all locales. Currently uses `import { es } from 'date-fns/locale';` which in date-fns v4 should still tree-shake via `sideEffects: false` but is worth a sanity check. P3.

### 4.3 recharts / framer-motion / html2canvas / jspdf / sonner

Not imported → not in bundle. Safe.

### 4.4 react-router-dom

All named imports — fine.

### 4.5 @radix-ui/*

Separate subpackages per primitive. Tree-shakes at the package boundary.

---

## 5. Dead Dependencies (depcheck-equivalent grep of `src/`)

Verified via `grep -r "from ['\"]X['\"]" src/` for each:

| Dep | `src/` imports | Status |
|---|---:|---|
| `recharts` | 0 | **DEAD** |
| `html2canvas` | 0 | **DEAD** |
| `jspdf` | 0 | **DEAD** (+ ships dompurify CVE) |
| `d3-force` | 0 | **DEAD** (@xyflow brings its own layout) |
| `framer-motion` | 0 | **DEAD** |
| `@tanstack/react-virtual` | 0 | **DEAD** |
| `sonner` | 0 | **DEAD** (react-hot-toast is the live one) |
| `zod` | 0 | **DEAD** |
| `@hookform/resolvers` | 0 | **DEAD** |
| `react-hook-form` | 1 (`src/components/ui/form.tsx`) | **Effectively dead** — the consuming file `components/ui/form.tsx` is never imported anywhere in src. |

`@types/d3-force` is also dead (devDep, matches `d3-force`).

Total disk-space liberation from removing the truly-dead set: ~47 MB on disk. In-bundle savings: probably already tree-shaken to near zero, **but** removes:
- CVE surface (`dompurify`)
- Transitive dep fan-out (install time, lockfile churn)
- Dependabot noise
- Cognitive overhead for future engineers ("is `recharts` used here?")

---

## 6. Heavy Libs – Loaded for Everyone

### Current state: no splitting at all

| Lib | Used in | Loaded by | Should be dynamic? |
|---|---|---|---|
| `@xyflow/react` + `@xyflow/react/dist/style.css` | `DashboardMap.tsx`, 4 node/edge files | Every user on every page | **Yes.** Network-map screen is opt-in (`/mapa-red`). Should be `React.lazy()`. P0. |
| `@tanstack/react-table` | `PermitTable.tsx` only | Every user | Could split per route. P1. |
| `react-day-picker` | `components/ui/calendar.tsx` | Every user | Opt-in to form flows. P1. |
| `qrcode.react` | `ShareLocationModal.tsx` only | Every user | Lazy-load modal. P2. |
| Supabase admin/auth flows | `AuthCallback`, `useAuth` | Every user | Unavoidable. OK. |

### Public verification page `/p/:token`

`PublicVerificationPage` is a **public, unauthenticated** route. With zero code-splitting, unauthenticated visitors downloading a verification link receive the **entire** authenticated app: `@xyflow/react`, `@tanstack/react-table`, `@tanstack/react-query`, `react-day-picker`, the full design-system showcase, settings pages, onboarding wizard. This is the highest-ROI split target.

### Recommended split (not implemented — report only)

- `/p/:token` → public bundle (supabase-js + date-fns + qrcode.react only)
- `/mapa-red` → lazy chunk (@xyflow/react + its CSS)
- `/design-system*` → dev-only or lazy chunk
- `/marco-legal/*` → lazy chunk
- `/renovaciones` → lazy chunk
- Onboarding (`/setup`) → lazy chunk
- `/settings/*` → lazy chunk

**P0** for first split (public route), **P1** for the rest.

---

## 7. TanStack Query Config

File: `src/lib/queryClient.ts`

```ts
staleTime: 5 * 60 * 1000,       // 5 min  ✓ sensible for compliance data
gcTime: 30 * 60 * 1000,          // 30 min ✓
retry: 2,                        // ⚠ doubles a failed request
retryDelay: exponential, cap 10s // ✓
networkMode: 'online',           // ✓
refetchOnWindowFocus: true,      // ⚠ see below
refetchOnReconnect: true,        // ✓
mutations: { retry: 0 }          // ✓
```

### Observations

- **`refetchOnWindowFocus: true` (P2):** acceptable for a dashboard tool, but combined with Chrome's aggressive tab discarding + `retry: 2` × exponential backoff, a user with 10 queries in flight who alt-tabs can queue 30 extra HTTP requests on re-focus. Consider `refetchOnWindowFocus: 'always'` → `false` for stable reference data (e.g. `issuers`, `legal-references-db`, `permit-requirements` — already have 30-60 min staleTime, so in practice they won't refetch, but explicit is better).
- **Per-query override pattern:** `usePermitEvents` uses `staleTime: 30s`, `useCompany` uses 10 min, `issuers` 1 h, `permit-requirements` 30 min, `legal-references-db` 30 min. Reasonable hierarchy.
- **`retry: 2` on queries (P3):** means failed reads hit Supabase 3× total. With RLS denials this bursts 3 identical errors. Consider `retry: (n, err) => err.status !== 403 && n < 2`.
- **No `queryClient.setQueryDefaults` per feature.** All queries inherit globals.
- **Timeout wrapper `withTimeout` (P3):** wraps individual fetches but the 10 s timer **does not abort** the underlying Supabase HTTP request (no `AbortSignal` is threaded to `supabase-js`). Comment on lines 12-14 acknowledges this. In practice: slow queries reject in the UI but keep consuming a browser connection slot until the server responds.

---

## 8. Virtualization

`@tanstack/react-virtual` is installed but **never used**. `grep -r "virtualizer\|useVirtualizer" src/` returns zero.

### Large-list candidates

- **`PermitTable.tsx`**: uses `@tanstack/react-table` with `getPaginationRowModel` → paginated, not virtualized. If a company has 1000+ permits, pagination protects render cost but forces a page click. OK for now.
- **`LocationsGrid` / `LocationsListViewV2`**: no pagination, no virtualization. Renders all locations at once. A company with 500+ sedes will feel this. Currently risk is theoretical (seed data has < 20 locations).
- **`RenewalGridView`**: monthly grid, bounded by 12 months × avg rows. OK.

### Verdict

**Not a blocker today** (small customer base, pagination on the biggest list). **Revisit when customer data volumes > 500 rows per list.** P3. Remove `@tanstack/react-virtual` in the meantime.

---

## 9. React 19 Pitfalls

- **`StrictMode` double-render:** `main.tsx` wraps `<App/>` in `<StrictMode>`. Effects run twice in dev. Two places have latent risk:
  1. **`useAuth.ts:149-209`**: gated by a **module-level** `authSubscription` variable. Since the guard check and the assignment happen across a promise boundary, StrictMode can fire the effect twice **before** the first subscription completes → two `onAuthStateChange` listeners registered. Visible only in dev. Prod impact: zero (StrictMode has no double-mount in prod). **P2 in dev, P3 overall.**
  2. **`useAuth.ts:206-208`:** explicit no-op cleanup: `return () => { /* Don't unsubscribe - keep it alive */ }`. If the `App` component ever unmounts (HMR, tests), the listener + its closure over `setAuth`/`queryClient` leaks. In the current single-route SPA this never happens. **Acceptable but document.**
- **`useOptimistic`** — not used anywhere. No issue.
- **`use(promise)` / `use(context)` API** — not used. No issue.
- **`forwardRef`:** React 19 made `ref` a prop. The shadcn/radix `components/ui/*.tsx` files were generated pre-React-19 and still use `React.forwardRef`. Not broken (still supported), but future-noise. P3.

---

## 10. Image Assets

`public/` contains only `favicon.svg`. **No large images.** No optimization work needed.

No `<img src="…large-image.png">` found in the build output (single bundle, CSS is 135 kB gzip 22 kB — no embedded images).

---

## 11. Supabase Realtime / Listeners

- **`.channel()` usage:** **zero** matches in `src/`. Realtime is not used.
- **`.subscribe()` usage:** zero matches.
- **`onAuthStateChange`:** 1 registration in `src/hooks/useAuth.ts` + 1 wrapper in `src/lib/auth.ts`. The wrapper (`lib/auth.ts:100-110`) is never called (grep-verified: no imports of `onAuthStateChange` from `@/lib/auth`). The `useAuth.ts` registration intentionally never unsubscribes (see §9 above).

**No realtime-channel memory-leak risk.** P3 for the never-called wrapper in `lib/auth.ts` (dead code).

---

## 12. `npm audit --production`

```json
{
  "moderate": 1, "high": 0, "critical": 0, "total": 1,
  "dependencies": { "prod": 174 }
}
```

Single advisory:

| Pkg | Severity | CVEs | Path |
|---|---|---|---|
| `dompurify` <= 3.3.3 | moderate | GHSA-39q2-94rc-95cp, GHSA-h7mw-gpvr-xq4m, GHSA-crv5-9vww-q3g8, GHSA-v9jr-rg53-9pgp | `jspdf@4.2.1 → dompurify@3.3.3` |

Because `jspdf` is **dead code (never imported)**, tree-shaking removes `dompurify` from the client bundle. However:
1. The advisory still appears in every `npm audit` run → CI noise / compliance flag.
2. `npm install` still fetches and resolves it.
3. If some future dev ever does `import jsPDF from 'jspdf'`, the vulnerable DOMPurify ships.

**Removing `jspdf` + `html2canvas` eliminates the audit finding.** P2.

---

## 13. Other Findings

- **`INEFFECTIVE_DYNAMIC_IMPORT` warning (P1):** `PermitUploadForm.tsx:185` does `const { supabase } = await import('@/lib/supabase')`. Because supabase is also statically imported by `useAuth`, `AssigneePicker`, `AuthCallback`, `IncrementalWizard`, `CompanyTab` → Rollup merges it into the main chunk and the dynamic import achieves nothing. Either remove the `await import` (revert to static) or convert all consumers. Currently: extra complexity, zero benefit.
- **CSS warning in build (P2):** `text-[var(--ds-status-*-text)]` — literal `*` delim in a CSS token; esbuild/lightningcss-equivalent complains. Search `src/index.css` or any Tailwind arbitrary value using `--ds-status-*-text`. Likely intended as a variable group placeholder that was accidentally emitted. Leaves malformed CSS in production (silently skipped by browsers).
- **103 `console.log`/`error`/`warn` in prod source (P3):** 38 of them in `useAuth.ts` alone (mostly commented out already — good). Current Vite config has no `drop_console` — console lines ship to prod. Not a perf issue but leaks internal logs / IDs.
- **Extraneous packages in `npm ls`:** `playwright@1.60.0`, `playwright-core@1.60.0`, `@emnapi/*`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util` — flagged `extraneous`. Left over from a previous install or a not-in-package.json devDep. `npm prune` cleans these. P3.
- **Scripts use path-juggling:** `vite --config config/vite.config.ts` / `tsc -b config/tsconfig.json`. Not a bug; unusual. Devs joining the project will need to know configs live under `config/`.
- **`seed` script references `tsx` + `scripts/seed-demo.ts`** — not audited here.

---

## 14. Runtime Risks Section

| # | Risk | Severity | Evidence |
|---|---|---|---|
| R1 | 1.25 MB single-chunk first-paint for every user incl. public verification page | **P0** | `dist/assets/index-BthlnBED.js` |
| R2 | `@xyflow/react` + its CSS loaded on every route including `/p/:token` | **P0** | 5 static imports in dashboard features; no lazy |
| R3 | `jspdf → dompurify@3.3.3` ships moderate CVEs even though unused | P2 | `npm audit` + grep |
| R4 | Auth listener registered twice in dev StrictMode (race in module-level guard) | P2 (dev) | `useAuth.ts:149-200` |
| R5 | TanStack Query retries (2×) + refetchOnWindowFocus burst on tab-focus | P2 | `queryClient.ts` |
| R6 | `withTimeout` rejects in UI but doesn't abort the underlying fetch | P3 | `queryClient.ts:14` comment |
| R7 | `@/lib/lucide-icons.ts` wrapper bypassed by 58/59 files — inconsistent pattern | P3 | grep results |
| R8 | `console.log`/`.error` not stripped in prod | P3 | 103 hits, no terser drop_console |
| R9 | Locations list / grid has no virtualization, no pagination | P3 (latent) | `LocationsGrid.tsx` |
| R10 | Malformed CSS var `var(--ds-status-*-text)` in prod | P2 | build warning |
| R11 | Ineffective dynamic import in `PermitUploadForm` | P1 | vite build warning |
| R12 | `onAuthStateChange` wrapper in `lib/auth.ts` is dead code | P3 | 0 imports |

---

## 15. Summary scoreboard

| Area | Grade | Notes |
|---|---|---|
| Code-splitting | **F** | None at all. Biggest single improvement available. |
| Dead deps | **D** | ≥7 dependencies with zero imports, one dragging a CVE chain. |
| Version currency | **A-** | Everything near-latest; a couple of patch bumps available. |
| Tree-shaking discipline | **B+** | Named imports everywhere; no wildcard ticking bombs. |
| Query hygiene | **B** | Sensible defaults, minor refetch-storm surface. |
| Realtime hygiene | **A** | Not used. No leaks. |
| Memory leaks | **B** | One deliberate-lifetime auth listener; fine in prod, noisy in dev. |
| Bundle CSS | **B** | 22 kB gzip OK for Tailwind v4; one malformed var. |
| `npm audit` | **B** | 1 moderate, removable by deleting dead dep. |
| Asset optimization | **A** | No heavy public images. |

---

## Appendix A – Commands run

```
npm run build                     # single 1.25 MB chunk, 667 ms
npm ls --depth=0                  # 174 prod, 322 dev, ~7 dead
npm audit --production --json     # 1 moderate (dompurify via jspdf)
npm view lucide-react … dist-tags # confirmed 1.14.0 is real latest
npm view typescript   … dist-tags # confirmed 6.0.3 is latest
grep -r "from 'X'" src/           # per-dep usage check
du -sh node_modules/*             # disk footprint
```

## Appendix B – Files referenced

- `C:\dev\enregla\package.json`
- `C:\dev\enregla\config\vite.config.ts`
- `C:\dev\enregla\src\main.tsx`
- `C:\dev\enregla\src\App.tsx`
- `C:\dev\enregla\src\lib\queryClient.ts`
- `C:\dev\enregla\src\lib\lucide-icons.ts`
- `C:\dev\enregla\src\lib\dates.ts`
- `C:\dev\enregla\src\lib\auth.ts`
- `C:\dev\enregla\src\hooks\useAuth.ts`
- `C:\dev\enregla\src\hooks\usePermitEvents.ts`
- `C:\dev\enregla\src\components\ui\form.tsx` (effectively dead)
- `C:\dev\enregla\src\features\permits\PermitUploadForm.tsx` (ineffective dynamic import)
- `C:\dev\enregla\src\features\permits\PermitTable.tsx`
- `C:\dev\enregla\src\features\dashboard\DashboardMap.tsx` (xyflow entry)
- `C:\dev\enregla\src\features\public-links\PublicVerificationPage.tsx` (public route receiving whole bundle)
- `C:\dev\enregla\dist\assets\index-BthlnBED.js` (1.25 MB single chunk)
- `C:\dev\enregla\dist\assets\index-C1Lc1b5g.css` (135 kB)

---

*End of Pass 1 report. No fixes applied per instructions.*
