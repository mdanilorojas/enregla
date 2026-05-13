# Pass 3 — Git Hygiene & Release Readiness

**Auditor**: Claude (Opus 4.7)
**Date**: 2026-05-12
**Repo**: `C:\dev\enregla\`
**Branch under review**: `feat/dominio-v2` (29 commits ahead of `origin/main`, 0 behind, pushed and in sync with `origin/feat/dominio-v2`)

---

## TL;DR — Top 5

1. **[P0] Supabase `service_role` JWT committed to git history** — A full service-role token for project `zqaqhapxqwkvninnyqiu` (valid until 2091) is embedded in `docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266`, on `main` since commit `6bf483c` (2026-04-14). The remote `https://github.com/mdanilorojas/enregla` appears public. Key must be rotated immediately in Supabase, and history rewritten or the project migrated.
2. **[P0] No release tags, no CHANGELOG updates since 2026-04-20** — 120 commits have landed since May 1 (including a full v2 domain rework and pre-production audit), yet `git tag --list` is empty and `CHANGELOG.md` still ends at `[1.0.0-MVP] 2026-04-20`. There is no way to identify what shipped where.
3. **[P1] 29-commit branch pending integration, no open PR visible** — `feat/dominio-v2` carries a large schema + domain rework (115 files, +9908/-2765) and has been pushed, but `gh pr list` returns HTTP 401 (gh not authenticated in this session). Assuming no PR, the work is stranded outside `main` without review checkpoint.
4. **[P1] No commit hooks (no husky / lint-staged / pre-commit)** — CI in `.github/workflows/ci.yml` runs lint+typecheck+build+test, but nothing local guards against a developer pushing a broken branch or a secret. Combined with finding #1, this is the hygiene gap that allowed the leak.
5. **[P2] Docs leak more credentials as placeholders that look real** — Multiple `eyJhbGc...` tokens (some truncated, some full, some real) appear across `docs/legacy/`, `docs/superpowers/plans/`, `docs/superpowers/specs/`. Even truncated JWTs tied to real project refs give attackers the header/claim pattern. Needs a sweep, not just one file.

---

## Findings by severity

### P0 — Blockers (must fix before release / before next push)

#### P0-1. `service_role` JWT in tracked file and git history

**Evidence** (verbatim from `docs/superpowers/plans/2026-04-14-incremental-onboarding-implementation.md:1266`):

```
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXFoYXB4cXdrdm5pbm55cWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA5OTgxNSwiZXhwIjoyMDkxNjc1ODE1fQ.Ugp946oliHqOL81ML1QWrF9yaJUb2FQzew5E3KUlJ44'
```

Decoded payload: `{"iss":"supabase","ref":"zqaqhapxqwkvninnyqiu","role":"service_role","iat":1776099815,"exp":2091675815}`.

This is a **real service-role key** (full three-segment JWT with signature) for the production project ref `zqaqhapxqwkvninnyqiu` (same ref referenced in `.mcp.json:5` and `.env.local`). `role:service_role` bypasses all RLS. Expiry is year 2091.

Introduced by:
```
6bf483c fix(onboarding): address code review issues
Author: Mario Danilo Rojas <mariodanilorojas@gmail.com>
Date:   Tue Apr 14 17:56:24 2026 -0500
```

File is still tracked (`git ls-files` confirms). Git remote is `https://github.com/mdanilorojas/enregla`. Removing the file on HEAD does not remove it from history — must be rotated in Supabase dashboard first, then history rewritten (`git filter-repo`) or the exposure accepted and monitored.

---

### P1 — High (should fix this sprint)

#### P1-1. No tags, CHANGELOG stale by ~3 weeks of heavy commits

```
git tag --list --sort=-creatordate | head -10    # (empty)
git tag --list | wc -l                           # 0
```

`CHANGELOG.md` header: `Last Updated: 2026-04-20 · Next Release: Phase 2 (Q2 2026)`. The `[Unreleased]` section still lists items already shipped (Marco Legal v2, Renovaciones v2, etc.) and does not mention any of the 29 `feat/dominio-v2` commits nor the pre-production audit (`audit(db+edge) B1-B16`, `audit(frontend) B17-B20 + H24`, `audit(lint) 100 → 0`). There is no version on `main` after `1.0.0-MVP`.

#### P1-2. `feat/dominio-v2` is a large unmerged branch

```
git rev-list --count origin/main..HEAD  → 29
git rev-list --count HEAD..origin/main  → 0
git diff --stat origin/main..HEAD | tail -1
  115 files changed, 9908 insertions(+), 2765 deletions(-)
```

Scope breakdown of the 29 commits:

| type:scope       | count |
|------------------|------:|
| feat:db          | 9     |
| audit:*          | 6     |
| feat:domain      | 2     |
| fix:db           | 2     |
| fix:dashboard    | 2     |
| fix:auth         | 1     |
| fix:ui           | 1     |
| feat:permits     | 1     |
| feat:onboarding  | 1     |
| feat:legal       | 1     |
| spec/plan        | 2     |

Branch is pushed (`origin/feat/dominio-v2`), but `gh pr list` returned `HTTP 401: Requires authentication` — no PR visibility from this session. No "WIP" commits on this branch (good), but the 6 `audit:*` commits on this feature branch suggest the pre-production audit work was mixed with the v2 domain rework instead of landing on `main` first.

#### P1-3. No local git hooks, no husky / lint-staged / pre-commit

```
ls .git/hooks/                   # only *.sample files
ls .husky/ 2>&1                  # directory does not exist
grep 'husky|lint-staged|...' package.json   # No matches found
git config --get core.hooksPath  # (empty)
```

CI (`.github/workflows/ci.yml`) is the only guard. A developer can commit + push without local lint/typecheck/test and only discover the break in GitHub Actions. Combined with P0-1, this is how the service-role JWT reached `main` undetected.

#### P1-4. `.env.development` is tracked and committed

`git ls-files` returns both `.env.example` (intentional template) **and** `.env.development` (real dev settings):

```
.env.development   (2 lines, only VITE_UI_VERSION=v2 — currently no secrets)
```

History shows it was committed in `d5a36f2` ("Add Supabase authentication and backend integration"). Even though current content is benign, having `.env.development` tracked is a footgun: a future commit adding `VITE_SUPABASE_URL` or an anon key to it would land silently. `.gitignore` only covers `.env`, `.env.local`, `.env*.local` — not `.env.development`.

---

### P2 — Medium

#### P2-1. JWT-like strings across many docs

`rg 'eyJhbGciOiJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,}'` matches only the one full JWT (P0-1), but broader `eyJ` matches surface project-ref-bearing example keys in `docs/legacy/SUPABASE_SETUP.md`, `docs/superpowers/specs/2026-04-13-permitops-v1-demo-design.md`, `docs/superpowers/plans/2026-04-13-permitops-v1-implementation.md`, `docs/superpowers/plans/2026-04-22-email-notifications-implementation.md`, `docs/superpowers/specs/2026-04-22-email-notifications-design.md`. All of these should be audited for real-vs-fake and normalized to `<REDACTED>` placeholders.

#### P2-2. Large HTML artifacts committed at repo root

Top tracked files by size:
```
271128 package-lock.json                    (expected)
268466 policia-judicial.html                (stray demo page)
148500 design-system-complete.html          (DS showcase, root level)
 32862 design-system-showcase.html
 27641 atlassian-ds-showcase.html
```

`policia-judicial.html` is 262 KB at repo root with no clear owner. `design-system-*.html` and `atlassian-ds-showcase.html` are design artifacts that belong under `docs/` or `public/`, not root. They inflate `git clone` and pollute the project surface.

#### P2-3. 120 commits in 12 days, no sprint boundary

```
git log --since="2026-05-01" --oneline | wc -l  → 120
```

Themes (by commit subject keywords): `audit:*` (6), `feat(db)` heavy, domain v2 rework, GTM/landing sprint, atlassian DS migration, email notifications, CRM, dashboard redesign. High velocity is fine, but with no tags and stale CHANGELOG, there is no way to bisect "what was in last week's build" or roll back cleanly.

#### P2-4. Untracked files that look like work-in-progress

```
Untracked files:
  .codex/                         (contains config.toml — tooling, probably gitignore candidate)
  AGENTS.md                       (83 lines — appears to be project instructions, should be tracked or removed)
  docs/superpowers/follow-ups/2026-05-10-verification-process-gap.md
  docs/superpowers/reviews/2026-05-12-mega-audit/
```

`AGENTS.md` and the follow-up doc look like intentional artifacts that have not been added. `.codex/` looks like IDE/tool config (should likely join `.vscode/`, `.idea`, `.windsurf/` in `.gitignore`).

---

### P3 — Low

#### P3-1. `.gitignore` is minimal but not broken

Current `.gitignore` covers `node_modules`, `dist`, `dist-ssr`, `*.local`, `.env`, `.env.local`, `.env*.local`, `.vscode/*`, `.idea`, `.DS_Store`, `.superpowers`, and common log patterns. Verified:

```
git check-ignore -v .env.local         → .gitignore:21:.env*.local
git check-ignore -v node_modules       → .gitignore:10:node_modules
git check-ignore -v dist/index.html    → .gitignore:11:dist
```

Missing entries that would be healthier:
- `.codex/`, `.agents/`, `.claude/` (present as untracked dirs in working tree; `.claude/settings.local.json` is actually tracked — see below)
- `.env.development`, `.env.production`, `.env.staging` (see P1-4)
- `coverage/`, `.vitest-cache/`, `.eslintcache`
- `*.tsbuildinfo`

#### P3-2. `.claude/settings.local.json` is tracked

```
git ls-files | grep .claude
  .claude/settings.local.json
```

By convention `*.local.*` files are per-developer overrides and should not be tracked. This is a minor leak risk (permissions, env hints) and noise in PR diffs.

#### P3-3. Stale local branches

Local branches: `audit/pre-production-2026-05-10`, `feature/atlassian-ds-migration`, `feature/database-audit`, `feature/db-reliability`, `feature/frontend-design-improvements`, `feature/internal-crm`. Several of these are already merged (their commits appear in `git log` on `main`). Housekeeping: prune after verifying.

#### P3-4. Config layout — **no stale duplicates found**

Contrary to initial suspicion, repo has a clean `config/` directory with:
```
config/eslint.config.js
config/tailwind.config.js
config/tsconfig.app.json
config/tsconfig.json
config/tsconfig.node.json
config/vite.config.ts
```
Only `vitest.config.ts` lives at root (because vitest discovery prefers root). `package.json` scripts correctly reference `--config config/...`. **No stale root-level vite/eslint/tailwind/tsconfig duplicates exist.** This finding is cleared.

---

## Evidence appendix (verbatim)

### git status / tracking

```
$ git rev-parse --abbrev-ref HEAD
feat/dominio-v2

$ git status
On branch feat/dominio-v2
Your branch is up to date with 'origin/feat/dominio-v2'.

Untracked files:
  .codex/
  AGENTS.md
  docs/superpowers/follow-ups/2026-05-10-verification-process-gap.md
  docs/superpowers/reviews/2026-05-12-mega-audit/

$ git rev-list --count origin/main..HEAD
29
$ git rev-list --count HEAD..origin/main
0

$ git remote -v
origin	https://github.com/mdanilorojas/enregla (fetch)
origin	https://github.com/mdanilorojas/enregla (push)

$ git rev-parse --abbrev-ref --symbolic-full-name @{u}
origin/feat/dominio-v2
```

### Tags

```
$ git tag --list --sort=-creatordate | head -10
(empty)
$ git tag --list | wc -l
0
```

### CHANGELOG staleness

```
CHANGELOG.md:221  Last Updated: 2026-04-20
CHANGELOG.md:222  Next Release: Phase 2 (Q2 2026) - Feature Parity
```

### .env files ever committed (history)

```
$ git log --all --diff-filter=A --name-only --pretty=format: | grep -iE '^\.env' | sort -u
.env.development
.env.example
.env.local.template
```

`.env.local.template` was added on commit `c9e83f7` (2026-05-06). `.env.development` on `9d540c7` (2026-04-14). `.env.example` on `d5a36f2` (2026-04-10). None of these currently contain secrets, but `.env.development` is not covered by `.gitignore`.

### PR visibility

```
$ gh pr list --state all --limit 10
HTTP 401: Requires authentication (https://api.github.com/graphql)
Try authenticating with:  gh auth login
```

Cannot verify PR state from this session.

### Hooks

```
$ ls .git/hooks/        # only *.sample
$ ls .husky/            # directory does not exist
$ git config --get core.hooksPath   # (empty)
$ grep 'husky|lint-staged|pre-commit' package.json
(no matches)
```

### Largest tracked files

```
271128  package-lock.json
268466  policia-judicial.html
148500  design-system-complete.html
144539  docs/superpowers/plans/2026-05-05-atlassian-ds-migration.md
 84359  docs/superpowers/visuals/.../question-1c-resumen-general-v2-IA-clara.html
 81807  docs/superpowers/plans/2026-05-11-dominio-v2-implementation.md
 81025  docs/superpowers/specs/2026-05-06-gtm-bootstrap-design.html
 ...
```

### WIP / revert markers (across all branches)

```
1170e85 On feature/db-reliability: dashboard LocationCardV2 refactor - WIP, not part of DB sprint
eb620c2 wip: dashboard, documents, locations, permits refactors + network playground
5904954 Revert Supabase integration - back to mock authentication
```

None of these are on `main` or `feat/dominio-v2`. They live on feature/ branches.

### CI workflow (for reference)

`.github/workflows/ci.yml` runs on PR + push to `main`: `npm ci` → `npm run lint` → `tsc --noEmit` → `npm run build` (with placeholder env) → `npm test -- --run`. Good coverage, but nothing guards local commits.

---

## Summary table

| ID    | Severity | Area                       | One-line                                                                 |
|-------|----------|----------------------------|--------------------------------------------------------------------------|
| P0-1  | P0       | Secrets / git history      | service_role JWT committed in onboarding plan doc since 2026-04-14      |
| P1-1  | P1       | Release mgmt               | 0 tags, CHANGELOG stuck at MVP, 120 commits since                        |
| P1-2  | P1       | Integration                | 29-commit `feat/dominio-v2` branch, PR visibility unknown                |
| P1-3  | P1       | Local guardrails           | No husky / pre-commit hook; only CI guards quality                       |
| P1-4  | P1       | Env hygiene                | `.env.development` tracked; `.gitignore` does not cover non-`.local` envs |
| P2-1  | P2       | Doc secrets                | Example JWTs in multiple docs tied to real project ref                   |
| P2-2  | P2       | Repo cleanliness           | 260 KB+ HTML artifacts at repo root                                      |
| P2-3  | P2       | Release cadence            | No sprint boundary or version history for last 12 days                   |
| P2-4  | P2       | Untracked WIP              | `AGENTS.md`, follow-ups, `.codex/` floating                              |
| P3-1  | P3       | .gitignore coverage        | Missing entries for IDE/tool dirs and env-variant files                  |
| P3-2  | P3       | Per-dev config             | `.claude/settings.local.json` tracked                                    |
| P3-3  | P3       | Branch hygiene             | ~6 stale feature/* branches locally                                      |
| P3-4  | P3       | Config layout              | CLEARED — no stale root duplicates; `config/` is canonical               |

No fixes applied. Pass-3 complete.
