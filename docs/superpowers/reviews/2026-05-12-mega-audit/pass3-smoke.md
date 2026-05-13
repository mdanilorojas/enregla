# Pass 3 — Golden-Path Behavioral Smoke

**Date:** 2026-05-12
**Method:** Boot dev + preview servers, curl all target routes, diff dev vs prod, scan shipped bundle for secrets.
**Dev command:** `npm run dev` (Vite 8.0.7) — port 5173 was already taken, fell back to **5174**.
**Preview command:** `npm run build && npx vite preview --port 4173` — 4173 taken, fell back to **4174**.
**No prior dev server running** (netstat checked; the 5173 collision was a lingering process from earlier in today's session, not a cross-tab reuse).

---

## TL;DR — Top 5 findings

1. **Dev/Prod route drift on `/design-system-showcase`** — In dev this URL serves `C:\dev\enregla\design-system-showcase.html` (a standalone 32KB static file at repo root, ~1770 lines). In preview/prod it serves the SPA shell and React Router renders `<DesignSystemShowcase />`. Two totally different surfaces at the same URL depending on environment. Static HTML files at the repo root (`design-system-showcase.html`, `design-system-complete.html`, `atlassian-ds-showcase.html`) are **not** in `public/` so they are never copied to `dist/`.
2. **No secret leaks in production bundle.** Only the Supabase project URL (`zqaqhapxqwkvninnyqiu.supabase.co`) and the **publishable** key (`sb_publishable_jWaxTO1Pg1fUtWS4j1o3ow_6lBBvK5-…`) are embedded. Zero JWTs, zero `service_role`, zero `sbp_` / `sk_live` tokens, zero sourcemap references (`sourceMappingURL`).
3. **No source maps shipped.** `dist/assets/` contains only `index-DGkT-n1M.js` + `index-MvIBCW8A.css`. No `.map` files. No `//# sourceMappingURL=` comment in the JS. Good — can't reverse-engineer origin code.
4. **Bundle is a single 1.24 MB chunk (353 KB gzipped)** — no code splitting. Vite warns explicitly: *"Some chunks are larger than 500 kB after minification"*. Plus an `INEFFECTIVE_DYNAMIC_IMPORT` warning: `src/lib/supabase.ts` is both statically and dynamically imported, so the dynamic import is a no-op.
5. **No server-side 404** — Vite's SPA fallback (dev) and `vite preview` (prod) both serve `index.html` with HTTP 200 for *every* unknown path. The React Router catch-all is `<Route path="*" element={<Navigate to="/" replace />} />` in `src/App.tsx:121` — everything bounces to `/`. There is no dedicated NotFound page; users can't tell a typo from a real page.

---

## 1. Dev server bootstrap

```
$ cd C:/dev/enregla && npm run dev

> enregla@0.0.0 dev
> vite --config config/vite.config.ts

Port 5173 is in use, trying another one...

  VITE v8.0.7  ready in 191 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

No errors. Startup: 191 ms.

## 2. Route-by-route smoke (DEV server @ :5174)

```
=== GET / ===                           HTTP 200 | size=767B   | text/html
=== GET /login ===                      HTTP 200 | size=767B   | text/html
=== GET /auth/callback ===              HTTP 200 | size=767B   | text/html
=== GET /p/ABC123 ===                   HTTP 200 | size=767B   | text/html
=== GET /design-system ===              HTTP 200 | size=767B   | text/html
=== GET /design-system-showcase ===     HTTP 200 | size=32559B | text/html   ← ANOMALY
=== GET /nonexistent ===                HTTP 200 | size=767B   | text/html
```

All 767-byte responses are the Vite-injected SPA shell (with `@react-refresh` + `@vite/client`). The 32.5 KB response is a **different document entirely** — the static `design-system-showcase.html` from repo root, served by Vite's static file middleware.

### Home HTML (verbatim, dev)
```html
<!doctype html>
<html lang="es">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EnRegla - Gestión de Compliance</title>
    <meta name="description" content="Plataforma SaaS de gestión de compliance normativo para empresas multi-sede en LATAM" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

HTML looks correct: `<title>`, `<meta charset="UTF-8">`, `<meta viewport>` all present, `lang="es"`, description tag, favicon. Only one app script tag (`/src/main.tsx`). Empty `#root` div as expected — client-side rendered.

`main.tsx` (fetched from `/src/main.tsx`, 4.7 KB) imports React, ReactDOM, Toaster, QueryClientProvider, App, ErrorBoundary, queryClient, and calls `assertDemoModeNotInProduction()` before rendering. No inline errors visible in the module graph.

## 3. Build + preview

```
> enregla@0.0.0 build
> tsc -b config/tsconfig.json && vite build --config config/vite.config.ts

vite v8.0.7 building client environment for production...
Found 1 warning while optimizing generated CSS:
│   .text-\[var\(--ds-status-\*-text\)\] {
│     color: var(--ds-status-*-text);
┆                            ^--  Unexpected token Delim('*')

✓ 3139 modules transformed.
dist/index.html                     0.61 kB │ gzip:   0.37 kB
dist/assets/index-MvIBCW8A.css    136.08 kB │ gzip:  22.30 kB
dist/assets/index-DGkT-n1M.js   1,246.02 kB │ gzip: 353.50 kB

[INEFFECTIVE_DYNAMIC_IMPORT] Warning: src/lib/supabase.ts is dynamically imported by
src/features/permits/PermitUploadForm.tsx but also statically imported by
src/features/auth/AuthCallback.tsx, src/features/onboarding-incremental/IncrementalWizard.tsx,
src/features/permits/AssigneePicker.tsx, src/features/settings/CompanyTab.tsx,
src/hooks/useAuth.ts, ...

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
✓ built in 676ms
```

**Build succeeds in 676 ms.** Two compile-time warnings worth logging:
- CSS: `--ds-status-*-text` is a literal class generated from a Tailwind arbitrary value that contains `*`. Harmless but dirty.
- `INEFFECTIVE_DYNAMIC_IMPORT` on `src/lib/supabase.ts` — the dynamic import in `PermitUploadForm.tsx` is pointless; module is always in the main chunk.

### Preview smoke (PREVIEW server @ :4174)

```
=== PREVIEW GET / ===                           HTTP 200 | size=610B | text/html
=== PREVIEW GET /login ===                      HTTP 200 | size=610B | text/html
=== PREVIEW GET /auth/callback ===              HTTP 200 | size=610B | text/html
=== PREVIEW GET /p/ABC123 ===                   HTTP 200 | size=610B | text/html
=== PREVIEW GET /design-system ===              HTTP 200 | size=610B | text/html
=== PREVIEW GET /design-system-showcase ===     HTTP 200 | size=610B | text/html   ← different from dev
=== PREVIEW GET /nonexistent ===                HTTP 200 | size=610B | text/html
```

All routes now return the same 610-byte production shell. `/design-system-showcase` no longer delivers the 32 KB static file — it falls through to the React Router component. **This means any link / screenshot / review pointing at `/design-system-showcase` in dev is showing something that does not exist in production.**

### Production index.html (verbatim)
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EnRegla - Gestión de Compliance</title>
    <meta name="description" content="Plataforma SaaS de gestión de compliance normativo para empresas multi-sede en LATAM" />
    <script type="module" crossorigin src="/assets/index-DGkT-n1M.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-MvIBCW8A.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Clean. Same meta as dev, no stray inline scripts.

## 4. Route-behavior summary

| Route | Dev (:5174) | Preview (:4174) | Behavior |
|-------|-------------|-----------------|----------|
| `/` | 200 SPA shell | 200 SPA shell | OK — React Router hands off to `ProtectedRoute → Dashboard`, unauth redirects to `/login` client-side. No server 301/302 involved. |
| `/login` | 200 SPA shell | 200 SPA shell | OK |
| `/auth/callback` | 200 SPA shell | 200 SPA shell | OK — `AuthCallback.tsx` reads the URL, calls `supabase.auth.exchangeCodeForSession`. Without a `?code=` it should show an error inside the component; couldn't verify DOM without a headless browser. |
| `/p/ABC123` | 200 SPA shell | 200 SPA shell | OK — public-link viewer will hit Supabase, see no row, show error page. |
| `/design-system` | 200 SPA shell | 200 SPA shell | OK |
| `/design-system-showcase` | **200, 32.5 KB static HTML** | 200 SPA shell | **BROKEN — dev/prod divergence.** See finding #1. |
| `/nonexistent` | 200 SPA shell | 200 SPA shell | Unexpected for a server check but correct for an SPA; React Router catch-all redirects to `/`. No visible NotFound page. |

## 5. Source maps & build artefacts

```
$ ls C:/dev/enregla/dist/
assets  favicon.svg  index.html

$ ls C:/dev/enregla/dist/assets/
index-DGkT-n1M.js  index-MvIBCW8A.css

$ ls C:/dev/enregla/dist/assets/*.map
ls: cannot access 'C:/dev/enregla/dist/assets/*.map': No such file or directory

$ grep -oE "sourceMappingURL=[^ ]+" C:/dev/enregla/dist/assets/index-DGkT-n1M.js
(no matches)
```

No `.map` files, no sourcemap URL comment. `vite.config.ts` defaults (`build.sourcemap=false`) apply.

## 6. Secrets-leak audit of shipped bundle

Bundle size: **1,246,024 bytes** (1.24 MB), 1 chunk.

### Searches performed

```
grep -oE "[a-z0-9]+\.supabase\.co"           → zqaqhapxqwkvninnyqiu.supabase.co (expected)
grep "service_role|SERVICE_ROLE"             → no matches
grep "sk_live|sbp_"                          → no matches
grep "eyJhbGciOiJIUzI1NiI"                   → 0 occurrences (no HS256 JWTs)
grep -oE "eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+"  → no JWT pairs found
grep -oE "sb_publishable_[A-Za-z0-9_-]+"     → sb_publishable_jWaxTO1Pg1fUtWS4j1o3ow_6lBBvK5-
grep -oE "(anon|publishable)[^a-zA-Z].{0,80}"
  → publishable_jWaxTO1Pg1fUtWS4j1o3ow_6lBBvK5-`,{auth:{persistSession:!0,autoRefreshToken:!0,…}
```

### Verdict

- **Supabase URL** embedded: `zqaqhapxqwkvninnyqiu.supabase.co` — expected, required by `supabase-js`.
- **Publishable (anon) key** embedded: `sb_publishable_jWaxTO1Pg1fUtWS4j1o3ow_…` — this is the PostgREST-callable anon key, safe to ship by design (protected by RLS).
- **No service-role key.**
- **No sourcemaps** that would reveal original source.
- `.env.local` contains only `VITE_*` vars (URL, anon key, `VITE_UI_VERSION`, `VITE_DEMO_MODE`). `.env.example` explicitly warns *"DO NOT put secrets in VITE_\* variables"*. Pattern is being followed.

No P0 secrets leak.

## 7. Observations for follow-up passes

- `design-system-showcase.html`, `design-system-complete.html`, `atlassian-ds-showcase.html` sit in the **repo root** (not `public/`). In dev Vite finds them via static-file middleware and serves them. In prod they're invisible. Either move them into `public/` (ship them), move them into `docs/`, or delete them. Today they silently shadow a real React route in development.
- `<Route path="*" element={<Navigate to="/" replace />} />` means every typo / stale bookmark silently bounces home. A real `NotFound` component with a "this page doesn't exist" message would help UX and SEO.
- Main chunk 1.24 MB uncompressed. No `React.lazy` / route-level code splitting anywhere. Login / marketing-shell users download the whole app plus Supabase plus react-query plus all feature modules on first paint.
- `INEFFECTIVE_DYNAMIC_IMPORT` on `src/lib/supabase.ts` — if the intent of the dynamic import in `PermitUploadForm.tsx` was to defer Supabase, it's failing silently. Either make all callers dynamic, or drop the dynamic import.

## 8. Processes left running

- Dev server (ID `bc7ufarqs`) on `http://localhost:5174`.
- Preview server (ID `bcl995r41`) on `http://localhost:4174`.

Both started by this pass; no prior dev server was running.
