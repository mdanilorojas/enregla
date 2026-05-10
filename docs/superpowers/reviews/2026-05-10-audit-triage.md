# Pre-Production Audit — Consolidated Triage

**Branch:** `audit/pre-production-2026-05-10`
**Date:** 2026-05-10
**Auditors:** 7 parallel agents (DB+RLS, DB perf, FE arch, FE sec, BE/edge, Auth/session, Storage)
**Severity model (strict):** BLOCKER = cross-company data leak, data loss, auth bypass, service_role leak, cron silently dead. Per user instruction: fix 100%.

---

## Scorecard

| Area | Blockers | High | Medium | Low |
|---|---|---|---|---|
| DB schema + RLS | 4 | 5 | 6 | 4 |
| DB performance | 0 | 4 | 6 | 0 |
| Frontend architecture | 2 | 12 | 11 | 0 |
| Frontend security | 2 | 3 | 5 | 0 |
| Backend + edge + cron | 4 | 5 | 5 | 0 |
| Auth + session + E2E RLS | 3 | 5 | 6 | 4 |
| Storage + upload | 5 | 4 | 4 | 2 |
| **Totals (dedup pending)** | **~20** | **~38** | **~43** | **~10** |

Many findings overlap across agents (e.g., storage bucket `public=true` is flagged by Storage, DB, FE-sec). After dedup, ~45 unique findings.

---

## BLOCKERS (dedup, ordered by fix dependency)

### B1 — Cron job is dead (10 days of silent data loss)
**Source:** Backend F2.
**Problem:** pg_cron `send-expiry-alerts-daily` fails every run with `function extensions.http_post(...) does not exist`. Should use `net.http_post` (pg_net).
**Impact:** Product's core feature (compliance alerts) off since 2026-05-01. Every permit at 30/15/7 days missed. Customers would miss legal deadlines.
**Fix:** Rewrite cron with `net.http_post` + secret header; verify first successful run.

### B2 — Edge function publicly invokable, no auth, no rate limit, `*` CORS
**Source:** Backend F1+F3+F6, FE-sec F3.
**Problem:** `send-expiry-alerts` has `verify_jwt: false`, no `x-cron-secret` check, CORS `*`. Anyone can trigger emails to all users.
**Fix:** Require `x-cron-secret` header; restrict CORS to prod origin; reject non-POST; set secret via vault.

### B3 — Service-role JWT embedded plaintext in cron command (proposed in docs)
**Source:** Backend F3.
**Problem:** Deployment docs instruct to paste service_role JWT into cron body (`SELECT command FROM cron.job` → readable). If followed, total RLS bypass leak.
**Fix:** Store secret in vault; reference via `current_setting` / `vault.decrypted_secrets`; update docs.

### B4 — Idempotency broken; re-running cron double-sends emails
**Source:** Backend F4.
**Problem:** `notification_logs` has no unique constraint on `(user_id, permit_id, notification_type, date)`. `index.ts` does not check prior sends before calling Resend.
**Fix:** Add unique constraint; implement pre-send claim pattern (insert `pending` row with `ON CONFLICT DO NOTHING`, then send, then update).

### B5 — `get_expiring_permits()` is SECURITY DEFINER and EXECUTE-granted to anon/authenticated
**Source:** Backend F12.
**Problem:** Cross-tenant permit data readable via `supabase.rpc('get_expiring_permits')`. Defaults public.
**Fix:** `REVOKE EXECUTE FROM PUBLIC, anon, authenticated; GRANT TO service_role`.

### B6 — Storage bucket `permit-documents` is `public=true`
**Source:** Storage F1, FE-sec F9.
**Problem:** Live bucket state was flipped from `false` (mig 005) to `true` outside migrations. Every object globally readable via predictable URL.
**Fix:** `UPDATE storage.buckets SET public=false`; migrate all `getPublicUrl` call sites to `createSignedUrl`; commit state as migration.

### B7 — Storage RLS policies short-circuit via `OR foldername[1]='permits'` → ANY user can R/W/D any file
**Source:** DB F1, Storage F2, Auth F12.
**Problem:** All four storage.objects policies use top-level `OR` with the `'permits'` prefix check, which is always true for real paths. Anon/any auth can delete/upload/read anything in bucket.
**Fix:** Rewrite with `AND` semantics; scope to `authenticated` role; per-company path check via EXISTS.

### B8 — Anon unlimited 50MB upload → storage DoS
**Source:** Storage F3.
**Problem:** INSERT policy role = `public` (includes anon). `file_size_limit = 52MB`. No rate limit.
**Fix:** Restrict INSERT to `authenticated`; lower `file_size_limit` to 5MB (match client); add per-company quota check.

### B9 — Inspector public URLs live forever, revocation impossible
**Source:** Storage F4.
**Problem:** `publicLinks.ts:203-205` uses `getPublicUrl`. Flipping `is_active=false` doesn't invalidate prior URLs.
**Fix:** Use `createSignedUrl(filePath, 300)` in the public link RPC response.

### B10 — `documents` INSERT doesn't verify file_path belongs to uploader
**Source:** Storage F5.
**Problem:** User A can upload to company B's path, then insert docs row with `permit_id=A_permit` and `file_path=B_path` — DB row pointing to B's file.
**Fix:** Add `WITH CHECK (file_path LIKE 'permits/' || permit_id::text || '/%')` or move upload to Edge Function with service_role.

### B11 — `partners` table readable/writable by every authenticated user
**Source:** DB F2, FE-sec F1.
**Problem:** Policy `partners_all USING (auth.uid() IS NOT NULL)` — entire internal CRM leaks to every paying customer.
**Fix:** Add `profiles.is_staff boolean`; gate `partners` to staff-only.

### B12 — `leads` table readable/writable by every authenticated user
**Source:** DB F3, FE-sec F2.
**Problem:** `leads_select/update/delete USING (auth.uid() IS NOT NULL)` — entire sales pipeline leaks to every paying customer. Same staff-gate fix.

### B13 — `companies_insert WITH CHECK (true)` → anyone can create companies, pollute, stake ID
**Source:** DB F5, FE-sec F11, Auth F1.
**Problem:** Live policy doesn't match what mig 004 intended. Attacker can INSERT companies freely, including during onboarding state where they can then insert locations/permits in other companies via onboarding fallback.
**Fix:** Restrict `WITH CHECK` to `user_company_id() IS NULL AND auth.uid() IS NOT NULL` (once onboarding, only once).

### B14 — Onboarding auto-assign + auto-create triggers are NOT installed
**Source:** Auth F5.
**Problem:** `pg_trigger` for `companies` / `locations` returns zero rows. Functions exist but aren't bound. Real (non-demo) users get stuck in onboarding loop: `profile.company_id` never set, `ProtectedOnboardingRoute` bounces them back to `/setup` forever.
**Fix:** Create triggers (or replace with SECURITY DEFINER RPC `create_company_and_assign`).

### B15 — Demo mode is an unauthenticated cross-tenant backdoor
**Source:** Auth F2.
**Problem:** Every policy has `company_id = '50707999-...' OR <auth>`. Client-side mock user in `useAuth` (demo path) produces no Supabase session. Anyone with the anon key can hit REST with that company_id and read/write/delete demo data. DELETE allowed to anon → sales demo can be wiped by anyone.
**Fix:** Gate demo via JWT claim `app_metadata.is_demo=true`; issue real session for demo via SECURITY DEFINER RPC; remove DELETE from demo branches; remove client-side mock user; remove 6 hardcoded UUID literals from `src/features/**`.

### B16 — `get_public_permits()` SECURITY DEFINER + no expiry on tokens + anon increments counters
**Source:** DB F4.
**Problem:** Tokens live forever; anon can brute-probe + mutate `view_count` unauthenticated; storage policy 007 doesn't actually check the caller's token.
**Fix:** Add `expires_at` column; return signed URLs instead of bucket public URLs (ties to B9); the `Public access via active public link` storage policy should be replaced by an Edge Function that validates token + expiry + company + returns signed URL.

### B17 — No ErrorBoundary anywhere in app
**Source:** FE-arch F2.
**Problem:** Single render exception blanks whole app. With `file_path: null` edge case (FE-arch F12) this is reachable today.
**Fix:** Add root ErrorBoundary in `main.tsx`, nested one inside authenticated Outlet. Severity: user-facing = product unusable on any unhandled error.

### B18 — React Query configured but `QueryClientProvider` not mounted
**Source:** FE-arch F1, Auth F4.
**Problem:** Every hook hand-rolls fetch; no cache; every mount re-fetches. No `queryClient.clear()` on logout (Finding Auth F3) means user-A cache persists to user-B session.
**Fix:** Mount provider in `main.tsx`; migrate core hooks; clear cache on `SIGNED_OUT`.

### B19 — Client-session data on `localStorage` (XSS-stealable refresh token)
**Source:** Auth F10.
**Problem:** Tokens in localStorage. Any XSS = full account takeover. No CSP header (FE-sec F4).
**Fix:** Add strict CSP header in `vercel.json`; longer-term plan a cookie-based session (out of sprint scope).

### B20 — OAuth implicit flow accepts hash-injected tokens (session fixation)
**Source:** Auth F7.
**Problem:** Supabase client default = hash flow. Attacker-crafted `/auth/callback#access_token=...` fixes a session onto victim.
**Fix:** Switch to `flowType: 'pkce'`; use `exchangeCodeForSession`.

---

## HIGH (non-blocker but real, fix this sprint)

Grouped. Full detail in agent reports.

**H1** — `profiles_select` has hardcoded demo UUID; blocks future teammate visibility. (DB F7)
**H2** — `documents_select` open to `public` role. (DB F8)
**H3** — `notification_logs` has no INSERT policy (inconsistent). (DB F9)
**H4** — Companies table: missing UNIQUE on `ruc`; `ON DELETE SET NULL` from profiles exposes cross-company select on detached users. (DB F11)
**H5** — FKs with no `ON DELETE` action → runtime "cannot delete" errors. (DB F13)
**H6** — Auth leaked-password check disabled (Supabase setting). (DB F17, FE-sec F10)
**H7** — Permits list unpaginated; `select('*')`; react-table loads all rows. (DB-perf F1, F8)
**H8** — React Query never used, every mount re-fetches (overlaps B18). (DB-perf F2)
**H9** — Public verification page = 5 serial DB round-trips (DB-perf F3) → collapse into nested select + async RPC.
**H10** — Edge function: `auth.admin.listUsers()` called **per company** in a loop. O(N×all_users). (DB-perf F4, BE F7)
**H11** — 30 `as any` casts across API layer. (FE-arch F8)
**H12** — `useAuth.ts` has module-level mutable singletons + race conditions. (FE-arch F9)
**H13** — `RenewPermitModal` swallows errors silently. (FE-arch F10)
**H14** — Demo company UUID hardcoded in 4+ sites, no central constant. (FE-arch F11)
**H15** — `PermitDetailView.tsx:460` assumes `doc.file_path != null`. (FE-arch F12)
**H16** — `companies_select` fallback lets freshly-signed-up users see ALL companies. (FE-sec F5, Auth F1 overlaps)
**H17** — Anon leads INSERT has no captcha / no rate limit / no length constraints. (FE-sec F6, DB F6)
**H18** — File MIME validated only client-side. (FE-sec F8, Storage F7)
**H19** — Resume after crash mid-batch not possible (no checkpoint). (BE F5)
**H20** — PII (emails) in edge function logs. (BE F8)
**H21** — Two AFTER INSERT triggers on `auth.users` can race. (BE F9)
**H22** — `handle_new_user` assigns every user `role='admin'`. (BE F10)
**H23** — `VITE_DEMO_MODE` at build time: misconfig flips production to demo. (Auth F6)
**H24** — Dev Login button (`handleDevLogin`) included in dev builds; could ship to prod. (Auth F8)
**H25** — 5 `components/ui/*` dead files (form, sheet, sidebar, tooltip, dropdown-menu) + 5 dead feature components. (FE-arch F6, F7)
**H26** — Dead `src/store/index.ts` mock store. (FE-arch F3)
**H27** — Dead `src/features/onboarding/` legacy. (FE-arch F4)
**H28** — Dead `src/features/internal-crm/` (unwired routes; hooks exist). (FE-arch F5)
**H29** — Orphan files: upload-first / DB-insert-later rolls back inconsistently. (Storage F6)
**H30** — User-controlled filename stored verbatim in DB; naive ext extraction. (Storage F8)
**H31** — Non-admin DELETE on storage allowed by `Users can delete own documents` policy. (Storage F10 overlaps B7)

---

## MEDIUM & LOW

Full list in individual agent reports (too many to enumerate here; ~50+ items). Representative:
- Multiple permissive policies on `legal_*` (perf waste).
- `get_expiring_permits` not sargable → Seq Scan on permits.
- `setTimeout` in AuthCallback has no cleanup.
- 117 console.* in 28 files.
- Bell button dead UI.
- Accessibility: icon-only buttons missing `aria-label`.
- Design system routes reachable in prod.
- `RenewPermitModal` no pagination spinner.
- `LocationDetailView` fetches all locations to find one by ID.
- `noopLock` disables cross-tab token sync race-safe.

These will be fixed in Phase 5.

---

## Fix sequencing (ordered by dependency + blast radius)

1. **Database schema fixes** (B6, B7, B8, B10, B11, B12, B13, B14, B16 + some HIGH DB) — one migration file. Must be first: everything else assumes correct RLS.
2. **Auth / session hardening** (B15, B19, B20, H12, H16, H23, H24) — after DB policies stable.
3. **Edge function + cron** (B1, B2, B3, B4, B5, H10, H19, H20, H21, H22) — can be parallel with auth since independent code.
4. **Frontend foundation** (B17 ErrorBoundary, B18 QueryClient) — enables Finding overlaps with Auth F3 cache clear.
5. **Remove demo hardcodes + feature dead code** (H25, H26, H27, H28, H14).
6. **Performance + polish** (DB-perf findings, remaining HIGH/MEDIUM).
7. **Re-audit** (Phase 6) and full verification (Phase 7).
