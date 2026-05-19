# Pass 1 — Docs Drift Audit

**Date:** 2026-05-12
**Branch:** `feat/dominio-v2`
**Auditor:** Claude (Opus 4.7) — read-only review pass
**Scope:** all root docs + `docs/**`. No fixes, report only.

---

## TL;DR — Top 5 Doc Issues

1. **CLAUDE.md stale on branch + focus.** Claims `Active Branch: main` and focus is "Core features implementation, real-time data, document uploads, demo mode" — actual branch is `feat/dominio-v2`, focus for 2+ weeks has been the dominio-v2 rediseño (emisores, costos, roles, events). The "tech stack" block also says "Custom UI-v2 component system (transitioning from Shadcn)" — the repo today has **no** `components/ui-v2` folder; everything was consolidated into `src/components/ui/` (shadcn is the de-facto system).
2. **README.md is SEVERELY OUT OF DATE.** Project structure describes `src/features-v2/` (doesn't exist), `src/features/documents/`, `src/features/tasks/` (don't exist), `scripts/create-demo-data.sql` (doesn't exist), `docs/UI-V2-INVENTORY.md` at that path (actual path is `docs/project/UI-V2-INVENTORY.md`), `.impeccable.md` references, "v1 or v2" UI toggle via env var (no such toggle in code). `VITE_UI_VERSION` appears nowhere in src.
3. **OAUTH-SETUP.md contradicts reality.** Framed as "Problema Actual" describing an unfixed error; but commit `c493222 fix(auth): OAuth callback con PKCE + corregir dominio a .ec` (2026-05-11) already fixed both PKCE and the `.ec` domain. The doc reads like an open ticket, not a how-to. It also lists `http://localhost:3000` Redirect URL alongside `5173`; the project runs on `5173` only.
4. **Pre-production audit (2026-05-10) marked "GO", but its own follow-up documents a regression it missed.** `2026-05-10-verification-process-gap.md` explicitly says the re-audit agents read `pg_policies` shape but didn't SET ROLE anon/authenticated, and a 403 was discovered on dev-server boot (mitigated by commit `046b578 audit(fix): restore user_company_id() EXECUTE grant`). The audit report itself still says "Verdict: GO for sale"; this closing claim is not amended even though the very next commit was a hot-patch of the audit.
5. **Dominio v2 plan has silently skipped steps.** Task 15 (delete `src/data/legal-references.ts`) was NEVER executed — the file still exists and is imported by 6 files (`classification-rules.ts`, `CategoryChips.tsx`, `LegalPermitDetailView.tsx`, `selectors.ts`, `LegalIndexView.tsx`, `PermitCard.tsx`). Task 7 Step 7.4 says "mínimo 6 filas" in `legal_references` — commit `d65fbe7` did migrate, but the TS file was not removed. Task 16 smoke-test/PR step was also skipped (no PR exists, branch never pushed/merged yet).

---

## Per-doc Drift Matrix

| Doc | Path | Last date in doc | Status | Notes |
|---|---|---|---|---|
| CLAUDE.md | root | — | **DRIFT** | Stale branch, stale focus, UI claim wrong |
| AGENTS.md | root | — | **DRIFT** | Mirror of CLAUDE.md with one wording change ("by Codex" instead of "by Claude") — same drift |
| README.md | root | 2026-04-20 | **SEVERELY OUT OF DATE** | Many paths wrong; v1/v2 split gone; shadcn still branded as current UI |
| CONTRIBUTING.md | root | 2026-04-20 | **DRIFT** | Still instructs to import from `@/components/ui-v2` — folder doesn't exist |
| CHANGELOG.md | root | 2026-04-20 | **STALE** | No entry since 1.0.0-MVP; dominio v2 + audit work absent |
| OAUTH-SETUP.md | root | — | **DRIFT** | Reads as open problem; fix already shipped 2026-05-11 |
| CUSTOM-DOMAIN-SETUP.md | root | — | ACCURATE (aspirational) | Describes a future-state. Nothing to verify until enabled |
| docs/README.md | | 2026-04-20 | **DRIFT** | References `architecture/.impeccable.md` + docs paths that have drifted |
| docs/core/README.md | | 2026-04-20 | ACCURATE | Matches files in `docs/core/` |
| docs/architecture/.impeccable.md | | (unknown) | out of scope (design tokens doc) | Exists, but is hidden-file naming for a "canonical" doc — fragile |
| docs/ULTRA-REVIEW-2026-05-04.md | | 2026-05-04 | **STALE** | Frozen snapshot; metrics quoted (18 migrations, 2 test files, 71 console.logs) don't match current state (35 migrations, 3 test files per last audit) |
| docs/superpowers/specs/2026-05-07-database-audit-design.md | | 2026-05-07 | ACCURATE | Describes work that was executed |
| docs/superpowers/specs/2026-05-10-dominio-enregla-v2-design.md | | 2026-05-10 | ACCURATE (as spec) | Implementation matches 90%+; see "Unimplemented plan steps" |
| docs/superpowers/plans/2026-05-11-dominio-v2-implementation.md | | 2026-05-11 | **DRIFT** | Task 15/16 not done; task 7 left TS file not deleted |
| docs/superpowers/reviews/2026-05-10-pre-production-audit.md | | 2026-05-10 | **DRIFT** | Still claims "GO"; regression caught same day not reflected |
| docs/superpowers/reviews/2026-05-10-audit-triage.md | | 2026-05-10 | ACCURATE (triage snapshot) | Pre-fix state; intended as a snapshot |
| docs/superpowers/follow-ups/2026-05-10-verification-process-gap.md | | 2026-05-10 | ACCURATE (open) | **Not yet closed.** CLAUDE.md Definition-of-Done not added; hook not added. |
| docs/superpowers/follow-ups/2026-05-07-database-audit-pendings.md | | 2026-05-07 | ACCURATE | Both tasks marked completed in-doc. Tip: could be archived. |
| docs/superpowers/follow-ups/2026-05-07-legal-sources-registry.md | | 2026-05-07 | OPEN (intended) | Still a pending follow-up, honest status |
| docs/project/UI-V2-INVENTORY.md | | 2026-04-20 | **SEVERELY OUT OF DATE** | Talks about UI v1 vs UI v2 split — split no longer exists in code |
| docs/project/UI-V2-MERGE-PLAN.md | | 2026-04-20 | **SEVERELY OUT OF DATE** | Merge already happened; plan now archival |
| docs/project/status-2026-04-14.md | | 2026-04-14 | ARCHIVAL | Point-in-time doc, OK as-is |
| docs/legacy/* | | — | ARCHIVED | Explicitly legacy; no action |
| docs/core/CODE-REVIEW-FINDINGS.md | | 2026-04-20 | **STALE** | References `src/features-v2/locations/LocationCardV2.tsx:161,172` — path doesn't exist (file lives under `src/features/locations/`). Blockers listed are resolved; doc presents them as open. |
| docs/core/PRODUCT.md, ROADMAP.md, BACKLOG.md | | 2026-04-20 | not verified in detail | Appears consistent; out of scope for a stale-claim sweep |
| docs/product/PRODUCT.md, ROADMAP.md, BACKLOG.md | | (mirror) | **DUPLICATION** | `docs/core/` and `docs/product/` both host PRODUCT/ROADMAP/BACKLOG — drift risk |

---

## Per-doc Stale Claims (5+ per major doc)

### CLAUDE.md

Claims verified against code:

1. "Active Branch: main" — **FALSE.** Current branch is `feat/dominio-v2`; last 25 commits live on that branch.
2. "Focus: Real-time data from Supabase, document uploads, demo mode" — **DRIFT.** Focus for weeks has been dominio v2 (emisores, costos, roles, events). `git log --since="2026-05-09"` shows this plainly.
3. "UI: Custom UI-v2 component system (transitioning from Shadcn)" — **FALSE.** No `ui-v2` folder exists in `src/components/`. Components live in `src/components/ui/` and are Radix + CVA + tailwind (shadcn-style). Grep confirms 0 files matching `ui-v2`.
4. "State: React hooks + context" — **INCOMPLETE.** Real app uses React Query (`@tanstack/react-query`) mounted in main.tsx, plus Zustand (`src/store/authStore.ts`). Context is minor.
5. "Use mcp__supabase__execute_sql and mcp__supabase__apply_migration tools - You have direct access" — accurate.
6. Demo company UUID `50707999-f033-41c4-91c9-989966311972` — **TRUE.** Matches `src/lib/demo.ts:6`.
7. Policy Pattern code block — partially inaccurate. The example says `company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())`; actual policies in live DB use `(SELECT auth.uid())` wrapping per the 2026-05-10 perf migration. Pattern won't cause a bug but no longer matches house style.

### AGENTS.md

Same file content as CLAUDE.md except line 43 says "handled by Codex" vs CLAUDE's "handled by Claude". Both drift the same way. Having two near-identical files invites contradictory edits.

### README.md

1. "Project Structure" tree shows `src/features-v2/` — **FALSE.** No such directory.
2. Tree shows `src/features/documents/`, `src/features/tasks/` — **FALSE.** Neither exists.
3. "`components/ui-v2/` # shadcn/ui components" — **FALSE.** Folder doesn't exist; components are under `src/components/ui/`.
4. "`components/layout-v2/`" — **FALSE.** Only `src/components/layout/AppLayout.tsx` exists.
5. "`scripts/create-demo-data.sql # Demo data seeding`" — **FALSE.** Actual seed script is `scripts/seed-demo.ts` (TypeScript).
6. "`VITE_UI_VERSION=v2`" env var — **FALSE.** No match in `src/` for `VITE_UI_VERSION`. The only current UI toggle is `VITE_DEMO_MODE`.
7. Documentation section links `./docs/CODE-REVIEW-FINDINGS.md` — **FALSE.** File is at `./docs/core/CODE-REVIEW-FINDINGS.md` or `./docs/project/CODE-REVIEW-FINDINGS.md` (duplicated).
8. Links `./docs/UI-V2-INVENTORY.md` — **FALSE.** File is at `./docs/project/UI-V2-INVENTORY.md`.
9. Phase 2 "Coming Soon" feature list (Marco Legal v2, Renovaciones v2, Tareas v2) is partly shipped — Marco Legal v2 landed as `LegalIndexView` + `LegalMatrixView` + DB-backed data (commit 36e0a7e, 2026-05-11).
10. "Supabase Project: `zqaqhapxqwkvninnyqiu`" — **TRUE** (matches `.mcp.json`, `.codex/config.toml`). But exposing project ref in README is a minor security smell; separate issue.
11. "Last Updated: 2026-04-20" — hasn't been touched since launch despite major architectural changes.

### CONTRIBUTING.md

1. "All new features must use `components/ui-v2/`" — **FALSE.** Folder doesn't exist; import path `@/components/ui-v2` would fail TypeScript.
2. "Badge variants: `risk-critico`, `risk-alto`..." — verified against `src/components/ui/badge.tsx` — need to spot-check if those variants still exist. (Not pulled in this pass; filed as likely-OK).
3. "Design System link to `./docs/architecture/.impeccable.md`" — file exists at that path (hidden dotfile).
4. Code example shows `<Card onClick={() => navigate(...)}>` — fine pattern.
5. "Last Updated: 2026-04-20" — no updates across multiple architecture shifts.

### CHANGELOG.md

1. Last entry is `[1.0.0-MVP] - 2026-04-20`. Zero entries between then and today (2026-05-12). Missed: audit remediation, dominio v2, 35→ migrations, PKCE, ErrorBoundary, React Query mount.
2. "Planned Phase 2" lists "Marco Legal v2" — shipped.
3. "Next Release: Phase 2 (Q2 2026)" — we are in Q2 and shipping.
4. Migration guide still says `Badge color prop → variant` as a "breaking change" — not useful as ongoing reference.
5. Version Table stops at 1.0.0-MVP; no 1.1.0 / audit-patch release recorded.

### OAUTH-SETUP.md

1. Frame "Problema Actual: Unsafe attempt to load URL http://localhost:3000/..." — **STALE.** The issue was fixed in commit `c493222` on 2026-05-11 (PKCE + `.ec` domain correction).
2. Lists localhost:3000 as dev URL — **FALSE.** `npm run dev` uses Vite default 5173.
3. `supabase.auth.getSession()` described as session-extraction — **outdated semantics** after moving to PKCE (`exchangeCodeForSession` is the PKCE-correct call per B20 fix).
4. References `chrome-error://chromewebdata/` error — symptom, no longer reproducing in current build.
5. No mention of PKCE flow at all, despite it being the current client config (`src/lib/supabase.ts` uses `flowType: 'pkce'`).

### docs/superpowers/plans/2026-05-11-dominio-v2-implementation.md

1. Task 15 "Delete `src/data/legal-references.ts`" — **NOT DONE.** File still exists and has 6 importers.
2. Task 16 Step 16.5 "git push + gh pr create" — **NOT DONE.** No PR; branch still local/unmerged as of 2026-05-12.
3. Task 9.1 "Regenerate `src/types/database.types.ts` with `npx supabase gen types`" — unverified; need to check if current types file matches post-migration schema.
4. Plan assumes branch starts from `main` "once `audit/pre-production-2026-05-10` is merged" — audit branch status not documented; unclear if it was merged cleanly into main first.
5. Self-Review section says "placeholder scan: sin TBD ni TODO" — Task 7 Step 7.2 explicitly punts with "completar fielmente desde TS" as a manual copy job; the seed may not be as comprehensive as the plan target (verify against live `legal_references` table — out of scope for this pass).

### docs/superpowers/reviews/2026-05-10-pre-production-audit.md

1. "Verdict: GO for sale to first customers" — **DRIFT.** Regression found <24h later (captured in `2026-05-10-verification-process-gap.md`); `user_company_id` was broken, hotfixed by `046b578`. Audit never updated to reflect this.
2. "Storage bucket `permit-documents` private, signed URLs only" — plausibly TRUE but not re-verified in this pass.
3. "Demo UUID centralized in `src/lib/demo.ts`" — **TRUE** (verified by direct read).
4. "Dev Login button removed from LoginView" — unverified in this pass (needs grep).
5. "ErrorBoundary root in main.tsx" — verified by directory listing; `src/components/ErrorBoundary.tsx` exists. Good.
6. Operator-action #3 "Point Resend `from:` to verified `@enregla.ec`" — still open (`RESEND_FROM` referenced but not confirmed set).
7. "16/16 passing, 3 dead tests removed" — snapshot from 2026-05-10. Not re-verified for the dominio-v2 work after; commit history shows many frontend changes without explicit test commits.

---

## Unfinished Work From Prior Audits (2026-05-10 pre-production)

Audit item vs current state:

### Operator-action residuals (listed as required "before the first paying customer")

1. **Set `CRON_SECRET`** (both DB and edge function) — **STATUS UNKNOWN.** No commit references it; need manual verification with MCP (out of this pass' scope). If unset, notifications silently fail.
2. **Enable HaveIBeenPwned leaked-password protection** — **STATUS UNKNOWN.** Dashboard toggle, no commit evidence.
3. **Point Resend `from:` to verified `@enregla.ec`** — **STATUS UNKNOWN.** Grep shows `onboarding@resend.dev` still referenced in `supabase/functions/send-expiry-alerts/email-service.ts`.

### Recommended follow-ups from audit (section "Follow-ups")

| Item | Status | Evidence |
|---|---|---|
| Regenerate Supabase types, remove `as any` casts | **PARTIAL.** Plan task 9.1 says to regen after dominio v2 migrations; unclear if executed | No dedicated commit |
| CAPTCHA + rate-limit for `leads` INSERT | **NOT DONE** | No commit, no code change |
| Migrate hand-rolled useState/useEffect hooks to useQuery | **PARTIAL.** New hooks (`useCompany`, `usePermitEvents`, `useIssuers`, `usePermitRequirements`) use React Query. Old ones (`useLocations`, `usePermits`, `useDocuments`, `useLeads`, `usePartners`, `useAuth`, `useNotificationPreferences`) not migrated. | Grep confirms mix |
| Paginate permits server-side (DB-perf F1) for >500-permit accounts | **NOT DONE** | No pagination code added |
| `/reset-password` route | **NOT DONE** | Not in `App.tsx` routes |
| Heartbeat + Slack alert for cron failures | **NOT DONE** | No heartbeat code |
| Move `Toaster` inside `<ErrorBoundary>` | **NOT VERIFIED.** Need to inspect `main.tsx` structure |

### Verification-process-gap follow-up (2026-05-10)

- Option A (Definition of Done in CLAUDE.md) — **NOT DONE.** CLAUDE.md has no "Definition of Done" section.
- Option B (Stop hook in `~/.claude/settings.json`) — **NOT DONE.** Can't verify without reading settings, but no commit references.
- Option C (audit verification checklist template) — **NOT DONE.** No file in `docs/superpowers/templates/`.

Recommendation from follow-up was "A + B combinadas". Neither landed. Zero progress in 2 days.

---

## Unimplemented / Silently-Skipped Steps from Dominio v2 Plan

Cross-reference of `2026-05-11-dominio-v2-implementation.md` tasks vs git log + current state:

| Task | Commit | Status |
|---|---|---|
| Task 1: `permit_issuers` schema + seed | `2effa18 feat(db): nueva tabla permit_issuers + seed de 5 emisores reales` | **DONE** |
| Task 2: Expand business_type to 12 | `2815baf feat(db): ampliar business_type a 12 giros` | **DONE** (plus followup `2cf7bb3 fix(db): drop legacy companies_business_type_valid CHECK` — post-hoc fix) |
| Task 3: `permit_requirements` fields | `b89f2c8 feat(db): campos de costo, multa, rol, issuer en permit_requirements` | **DONE** |
| Task 4: `permits.issuer_id` + `assigned_to_profile_id` | `fc54232` | **DONE** |
| Task 5: `profiles.business_role` + trigger | `10f2833` | **DONE** |
| Task 6: `permit_events` + triggers | `ef041f7` | **DONE** |
| Task 7: Legal tables seed from TS | `d65fbe7 feat(db): migrar marco legal de src/data/legal-references.ts a tablas DB` + `0944e1d feat(db): backfill business_categories + URLs in legal_references` | **DONE in DB** — but plan Step 15 (delete the TS file) was skipped. File + its 6 importers still present. |
| Task 8: Matriz seed 10×8 | `d37db71` | **DONE** |
| Task 9: Frontend domain catalogues | `a134006` | **DONE** |
| Task 10: hooks + RoleBadge + CostRangeLabel | `14399af` | **DONE** |
| Task 11: Dashboard fix | `5884f34` | **DONE** (+ `ac79bfb fix(dashboard): quitar lluvia de ComplianceWeatherCard estado err` — later tweak) |
| Task 12: PermitInfoCard + AssigneePicker + Timeline | `987984b` | **DONE** |
| Task 13: Marco legal from DB + matriz route | `36e0a7e` | **DONE** — but code still imports from `src/data/legal-references.ts` for `CATEGORY_META`, `PERMIT_TO_CATEGORY`, `getLegalReference` helpers. Only the main data rows moved to DB. |
| Task 14: 12-giro dropdown in onboarding | `db9dc6c` | **DONE** |
| Task 15: Delete `src/data/legal-references.ts` | — | **NOT DONE.** 6 files still import it. Delete would break TypeScript. |
| Task 16: Verify + PR | — | **NOT DONE.** No PR; no typecheck/lint/test evidence post-merge; branch not pushed per commit graph. |

**Net:** 14/16 tasks implemented, 2 (cleanup + verify/PR) silently dropped. Dominio v2 is "code complete" but not merged, reviewed, or cleaned.

Secondary: after `10_fix_user_company_id_grants` and `20260511000008_hardening_v2.sql` (commit `fc168b2`) there's also a `20260511120000_drop_legacy_business_type_check.sql` (commit `2cf7bb3`) — these weren't in the plan but were required by reality. They're fine as fixes, just worth noting the plan didn't anticipate them.

---

## Duplication / Contradiction

1. **CLAUDE.md vs AGENTS.md** — near-identical. Only difference: "by Claude" vs "by Codex" in the DB Management header. Two-file setup ensures they drift independently.
2. **`docs/core/` vs `docs/product/`** — both host `PRODUCT.md`, `ROADMAP.md`, `BACKLOG.md`. README in `docs/core/` declares itself "ORO PURO" / source of truth; README in `docs/` treats them as separate with `product/` = "source files" and `core/` = "essential". Result: two copies that will drift and no enforcement they match.
3. **`docs/core/CODE-REVIEW-FINDINGS.md` vs `docs/project/CODE-REVIEW-FINDINGS.md`** — both exist per directory listings. Haven't diffed; safe to assume divergent.
4. **`docs/core/PM-DOCUMENTATION-AUDIT.md` vs `docs/project/PM-DOCUMENTATION-AUDIT.md`** — same duplication.
5. **OAUTH-SETUP.md vs CUSTOM-DOMAIN-SETUP.md** — both prescribe Supabase Dashboard URL Configuration changes. OAUTH says "Add `https://app.enregla.ec/auth/callback` to Redirect URLs"; CUSTOM-DOMAIN says "redirect URLs NO cambian (siguen siendo `https://app.enregla.ec/auth/callback`)". Consistent on the final URL, but the CUSTOM-DOMAIN doc is aspirational (Pro plan + DNS changes) while OAUTH is presented as current. No strong contradiction, just presentation mismatch.
6. **README.md tech table vs CLAUDE.md tech list** — README says "Tailwind + shadcn/ui", CLAUDE says "UI-v2 (transitioning from Shadcn)". Both wrong in different ways. Reality: shadcn/Radix components live in `src/components/ui/`, no v2 split.
7. **README says "Phase 1 MVP shipped 2026-04-20, Phase 2 Q2 2026 upcoming"** vs **ROADMAP.md** — not spot-checked in detail in this pass, flag for deeper review.

---

## Orphan Specs (no matching implementation in code)

Walking `docs/superpowers/specs/`:

| Spec | Implementation status |
|---|---|
| 2026-04-13 permitops-v1-demo | implementation file present, superseded by v2 work |
| 2026-04-14 document-upload-flow | `features/documents/` folder is gone — but `PermitUploadForm` exists under `features/permits/`. Spec ≠ code location anymore. |
| 2026-04-14 incremental-onboarding | matches `features/onboarding-incremental/` — OK |
| 2026-04-14 shadcn-migration | matches `src/components/ui/` — OK (but code evolved beyond pure shadcn) |
| 2026-04-15 create-location | matches `CreateLocationModal` — OK |
| 2026-04-15 network-map-v2 | folder exists at `features/network/` but v2 is gone (v3 superseded) |
| 2026-04-15 public-links | matches `features/public-links/` — OK |
| 2026-04-15 sedes-v2-view | `features/locations/LocationsListViewV2.tsx` exists. OK. |
| 2026-04-21 network-map-v3 | matches current `features/network/` — OK |
| 2026-04-22 email-notifications | `supabase/functions/send-expiry-alerts/` exists — OK |
| 2026-05-05 atlassian-ds-migration | spec claims an Atlassian Design System migration. Code has Radix + tailwind, not Atlassian. **Likely abandoned/partial.** Orphan. |
| 2026-05-06 db-reliability | has both .md and .html; migrations present in some form. Probably done in Ola form during the 2026-05-07 audit. |
| 2026-05-06 gtm-bootstrap | GTM-focused spec (go-to-market / landing); code has `features/` but GTM landing is ambiguous. Flag for owner to verify. |
| 2026-05-07 database-audit | matches executed work — OK |
| 2026-05-07 marco-legal-redesign | overlapped and then subsumed by dominio v2. Still partially accurate. |
| 2026-05-10 dominio-enregla-v2 | 90% implemented, see above — OK |

**Most orphaned:** `2026-05-05-atlassian-ds-migration-design.md` — no evidence in code of Atlassian design system integration.

---

## MEMORY.md Cross-reference (read-only)

`C:\Users\Danilo\.claude\projects\C--dev-enregla\memory\MEMORY.md` lists five items:

1. "Visual-first workflow" — ✓ matches repo practice (specs + HTML companions are in `docs/superpowers/specs/`).
2. "Deploy flow Vercel" — ✓ consistent with `vercel.json` and Supabase project.
3. "User learning git" — meta; OK.
4. "Verify behavior, not shape" — ✓ directly ties to `2026-05-10-verification-process-gap.md`.
5. Links to `feedback_*.md` / `reference_*.md` files in memory — not verified (outside project repo).

No contradictions with repo. Memory correctly notes the verification gap is still open.

---

## Follow-ups Status

| Follow-up file | Open | Evidence of closure |
|---|---|---|
| `2026-05-07-database-audit-pendings.md` | **CLOSED** in-file | Both tasks have "Completados" section dated 2026-05-07 |
| `2026-05-07-legal-sources-registry.md` | **OPEN by design** | Describes a standalone legal-research project not yet started |
| `2026-05-10-verification-process-gap.md` | **OPEN** | None of the recommendations (A/B/C) have landed in CLAUDE.md, settings.json, or templates dir — as of 2026-05-12. This is the single most impactful unaddressed follow-up. |

---

## Evidence Index

- Current branch: `git -C C:/dev/enregla branch --show-current` → `feat/dominio-v2`
- No `src/components/ui-v2/` dir: `ls` failed
- No `src/features-v2/` dir: `ls` failed
- No `src/features/documents/`, `tasks/`: `ls` failed
- `src/data/legal-references.ts` still exists; grep found 6 importers
- `flowType: 'pkce'` in `src/lib/supabase.ts:39` (audit B20 fix landed)
- `src/lib/demo.ts:28` runs the `.ec`/`.se` host guard — domain fix landed
- 35 migrations in `supabase/migrations/`, last being `20260511120000_drop_legacy_business_type_check.sql`
- `package.json` confirms React 19.2.4, Vite 8, TS 6.0.2, React Query 5.100, Zustand 5.0.12 (README's version claims largely accurate on dependencies)
- Git log since 2026-05-09 shows: 5 audit commits → 16 dominio-v2 commits → 4 fix/hardening commits. Audit branch was committed but no merge-commit for an `audit/pre-production-2026-05-10` branch is visible in log — possibly already in main and `feat/dominio-v2` branched from there.

---

## Not Done (Out of Scope for This Pass)

- Did not verify live DB state (would require executing queries).
- Did not diff the duplicated `docs/core/` vs `docs/product/` files to quantify drift.
- Did not re-run lint/tests/typecheck to verify the current tree's actual health.
- Did not deeply compare ROADMAP.md "Phase 2" bullets against shipped work (only surface-checked).
- Did not read every spec file line-by-line; only verified the named ones from the brief (`2026-05-10-dominio-enregla-v2-design.md`, `2026-05-07-database-audit-design.md`) in full.
