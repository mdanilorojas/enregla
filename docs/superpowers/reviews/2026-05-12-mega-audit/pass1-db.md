# Pass 1 — Database Audit (2026-05-12)

Scope: `supabase/migrations/**` (35 files in repo, 47 migrations recorded in `supabase_migrations.schema_migrations`) + live schema via MCP against the production project.

Method: schema/catalog introspection via `mcp__supabase__*`, advisors (security + performance), policy/constraint/function bodies read directly from prod, spot-tests with `INSERT` rolled back inside `DO $$…$$` to confirm actual behaviour (verify behaviour, not shape).

---

## TL;DR — Top 5

1. **P0 — `handle_new_user` trigger is silently broken for every new signup.** The trigger function inserts `role = 'member'`, but `profiles_role_check` only accepts `'admin' | 'operator' | 'viewer'`. The insert violates the CHECK; the exception is swallowed by `EXCEPTION WHEN OTHERS THEN RAISE WARNING…RETURN NEW;`. Auth users get created, profile rows do not. This is invisible in logs (WARNING, not ERROR) and explains why `auth.users` / `profiles` parity happens only because the app or older triggers seeded the 4 existing rows. Any new Google-OAuth user today silently has no profile row → onboarding will fail or hang.
2. **P0 — `companies.business_type_check` is DB-frozen at 12 values but seeded data diverged, and the "drop legacy check" migration is a no-op.** Migration `20260511120000_drop_legacy_business_type_check.sql` drops `companies_business_type_valid` (the old 4-giro CHECK from `ola12`). That CHECK was indeed dropped. But the current *active* CHECK (`companies_business_type_check`) is only 12 literal values; the *seed* migration for `permit_requirements` enumerates the same 12 strings. If product ever wants to add a 13th giro, it has to touch two places and pray. Also note: migration uses `DROP CONSTRAINT IF EXISTS` + a `RAISE EXCEPTION` sanity check, which will now abort any re-run because the expected constraint count is different for a fresh env (the check counts `%business_type%` constraints — gates on "exactly 1"). Re-running on a fresh schema could leave the DB in an inconsistent state if the sanity check fires. (See finding DB-07.)
3. **P0 — `permits.type` data is split between legacy display-case strings and canonical slugs.** Of 46 rows in `permits`, 18 distinct `type` values exist, 13 of them are pre-v2 display names (`"Patente Municipal"`, `"Bomberos"`, `"RUC"`, `"Uso de Suelo"`, `"Funcionamiento"`, `"Sanitario"`, `"Ambiental"`, `"Permiso de Alcohol (SCPM)"`, `"Permiso Químicos (CONSEP)"`, `"Permiso Sanitario (ARCSA)"`, `"Publicidad"`, `"Rotulación"`, `"permiso_movilidad"`). Canonical values in `permit_requirements` / `legal_references` are `ruc, patente_municipal, uso_suelo, bomberos, arcsa, rotulacion`. Joins on `permits.type = permit_requirements.permit_type` or `legal_references.permit_type` silently drop these legacy rows — Marco Legal filter, Dashboard compliance calc, and renewal cost estimates are all wrong for historical permits. There is no CHECK constraint on `permits.type` to prevent future drift.
4. **P0 — `src/types/database.types.ts` is ghost-garbage; `src/types/database.ts` is stale for the entire v2 domain.** `database.types.ts` contains only two hand-typed interfaces (`Profile`, `Document`) and neither matches reality (`Profile.email` doesn't exist, `Document.user_id` is `uploaded_by`, `Document.title` is `file_name`, `Document.file_url` is `file_path`). `database.ts` — the one that actually wraps the generated schema — has **zero references** to any v2 domain: missing `permit_issuers`, `permit_events`, `business_role`, `issuer_id`, `assigned_to_profile_id`, `required_role`, `cost_min/max/currency/notes/updated_at`, `fine_min/max/source`, `applies_when`. Code using those columns compiles by accident (untyped access or loose Supabase client), so bad column names won't be caught at build time.
5. **P1 — Nine `SECURITY DEFINER` functions are exposed on the REST API; three to `anon`.** `get_public_permits(text)`, `increment_public_link_view(text)`, and `user_company_id()` are all `SECURITY DEFINER` AND executable by `anon` via `/rest/v1/rpc/*`. `user_company_id()` returns `auth.uid()`'s company and is safe in isolation, but its exposure is *intentional* (needed by policies) — noted as WARN by the advisor. The concerning one is the trigger-functions (`log_permit_event`, `log_document_event`, `auto_assign_company_to_profile`, `auto_create_location_permits`, `create_default_notification_preferences`, `handle_new_user`) — these were revoked from `anon`/`authenticated` (per `ola5` + `hardening_v2`), so REST can't call them. Advisor only flags the three intentionally-exposed ones. Still worth an explicit audit because `user_company_id()`, if mis-exposed, is a pivot point for building any cross-tenant exploit.

---

## Severity scale

- **P0** — data leak / auth bypass / prod broken right now
- **P1** — likely-latent bug, serious hardening gap
- **P2** — hygiene, maintainability, drift
- **P3** — nitpick

---

## Findings

### DB-01 (P0) — `handle_new_user` inserts an invalid `role` value

- **Evidence:** `supabase/migrations/20260510000000_pre_production_audit_fixes.sql:328-345` and live `pg_proc.prosrc` dump. Function body:
  ```sql
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'member')
  ON CONFLICT (id) DO NOTHING;
  ...
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
  ```
  CHECK constraint `profiles_role_check` allows only `admin | operator | viewer`. Verified via test insert: `ERROR: 23514: new row for relation "profiles" violates check constraint "profiles_role_check"`.
- **Impact:** Every new signup silently fails to create its profile. The `WARN` is invisible unless you tail pg logs. `on_auth_user_created_notification_prefs` (also on `auth.users`) runs separately and succeeds, so the user gets notification preferences but no profile. Any subsequent logic that reads `profiles.company_id IS NULL` to decide "onboarding" will work by accident because the row simply doesn't exist — policies like `companies_insert` (`WITH CHECK EXISTS (SELECT 1 FROM profiles …)`) then **deny** company creation entirely for that user. This is consistent with the `ola10` comment's description of onboarding fragility.
- **Recommended fix:** change `'member'` → `'admin'` (or add `'member'` to the CHECK). Also remove the broad `EXCEPTION WHEN OTHERS` or at least `RAISE LOG` with the full error — silent warnings on a critical-path trigger is actively hostile to debuggability.

---

### DB-02 (P0) — `permits.type` is unconstrained and contains 18 distinct values (13 legacy display-case)

- **Evidence:**
  ```
  type                          count
  ---------------------------- -----
  bomberos                       4
  Patente Municipal              4
  patente_municipal              4
  ruc                            4
  permiso_movilidad              3
  Funcionamiento                 3
  arcsa                          3
  Uso de Suelo                   3
  Bomberos                       3
  Sanitario                      3
  Ambiental                      3
  Permiso de Alcohol (SCPM)      2
  RUC                            2
  Permiso Químicos (CONSEP)      1
  Publicidad                     1
  Rotulación                     1
  Permiso Sanitario (ARCSA)      1
  uso_suelo                      1
  ```
  Canonical slugs per `permit_requirements`: `arcsa, bomberos, patente_municipal, rotulacion, ruc, uso_suelo` (plus `luae` in seed not shown here). No CHECK on `permits.type`. 13 of 18 values do NOT match `permit_requirements` or `legal_references`.
- **Impact:**
  - Marco Legal lookup (`legal_references.permit_type = permits.type`) silently returns null for pre-v2 permits.
  - Dashboard cost/fine aggregation (joining to `permit_requirements`) drops those rows — "costo total anual" and "multa máxima expuesta" under-report.
  - `auto_create_location_permits` trigger inserts canonical slugs going forward, but there's no backfill of the 46 legacy rows.
  - Same permit type is duplicated per-location for demo company (e.g. `ruc` + `RUC` + `Patente Municipal` + `patente_municipal`) — each location shows the same real-world permit twice with different data.
- **Recommended fix:** (1) backfill migration mapping legacy display names → canonical slugs (case-insensitive, covering accents and parentheses), (2) add `CHECK (permits.type IN (SELECT permit_type FROM permit_requirements))` **OR** make `permits.type` a FK to `permit_requirements.permit_type` with `ON UPDATE CASCADE` (though requires a unique index on `permit_type` first — currently there's `(business_type, permit_type)` unique but not `permit_type` alone), (3) deduplicate rows with both display-case and slug versions.

---

### DB-03 (P0) — Generated types are stale + a second hand-written types file is wrong

- **Evidence:**
  - `src/types/database.ts` — generated shape, but does not include any of: `permit_issuers`, `permit_events`, `permits.issuer_id`, `permits.assigned_to_profile_id`, `profiles.business_role`, `profiles.is_staff`, `public_links.expires_at`, `permit_requirements.issuer_id`, `permit_requirements.required_role`, `permit_requirements.cost_*`, `permit_requirements.fine_*`, `permit_requirements.applies_when`, `legal_references.business_categories`, `legal_references.government_portal_*`, `legal_references.application_form_url`, `legal_references.help_guide_url`. Grep for those substrings returns 0 matches in that file.
  - `src/types/database.types.ts` — 28 lines, two hand-typed interfaces. `Profile.email` does not exist in `public.profiles` (it lives in `auth.users`). `Document` has `{id, user_id, title, file_url, file_type, created_at, updated_at}` — actual columns are `{id, permit_id, file_path, file_name, file_size, file_type, uploaded_by, uploaded_at}`. Every field except `id` and `file_type` is wrong.
- **Impact:**
  - Any import from `src/types/database.types.ts` is silently wrong.
  - V2-domain code (`AssigneePicker`, `PermitInfoCard`, `usePermitEvents`, `permit-requirements.ts`, `issuers.ts`) uses `any`-ish column names at runtime; TS won't catch typos against the real schema. The MCP audit found 7 files referencing v2 columns — none of them have proper types.
- **Recommended fix:** (1) regenerate `src/types/database.ts` via `supabase gen types typescript --project-id <ref>`, (2) delete `src/types/database.types.ts` or reduce it to a re-export from `database.ts`, (3) add a CI check that runs type generation and fails on diff.

---

### DB-04 (P0) — `handle_new_user`/prod trigger swallows exceptions

- **Evidence:** same as DB-01, the `EXCEPTION WHEN OTHERS THEN RAISE WARNING` block.
- **Impact:** masks DB-01 completely, will also mask future schema drift. A critical signup path should not swallow errors — at minimum it should `RAISE LOG` with stack, or better, fail the transaction so the dev who just broke auth sees it on first login attempt.
- **Recommended fix:** remove the catch-all, or downgrade it to `WHEN unique_violation THEN` only. The `ON CONFLICT (id) DO NOTHING` already handles the idempotency case that the `WHEN OTHERS` was probably written for.

---

### DB-05 (P1) — Storage + `documents` writes require auth; CLAUDE.md spec says demo uploads must work without auth

- **Evidence:**
  - `storage.objects` policies: `permit_docs_insert_authenticated` is `TO authenticated`, no anon-demo variant.
  - `public.documents` policies: `documents_insert`, `documents_update`, `documents_delete` all `TO authenticated`.
  - `CLAUDE.md` project instructions: *"Storage policies must allow uploads to `permits/` folder without auth"*.
- **Impact:** either CLAUDE.md is aspirational (and demo-mode uploads are de-facto scoped to authenticated users who happen to be on the demo company — the 4 current profiles include one with `company_id='50707999-…'`), or the feature is broken for the intended "no-auth demo" use case. Not a data leak, but a latent divergence between spec and reality. Pick a truth and enforce it.
- **Recommended fix:** either update CLAUDE.md to match current policy (demo mode = authenticated user on demo company), OR add `TO anon` policies with the same demo-company gate. The latter requires careful review because anon uploads to a shared bucket are a DoS vector.

---

### DB-06 (P1) — Every `SECURITY DEFINER` function flagged by advisor is public-callable via `/rest/v1/rpc/*`

- **Evidence:** `mcp__supabase__get_advisors security` returns six lints for:
  - `public.get_public_permits(text)` — anon + authenticated
  - `public.increment_public_link_view(text)` — anon + authenticated
  - `public.user_company_id()` — anon + authenticated
- **Per-function analysis:**
  - `get_public_permits`: body filters by `link_token`, returns only `status='vigente'` rows. The `link_token` guards against arbitrary lookup IF tokens are unpredictable; no rate limit. A malicious client with a valid token (leaked QR code) can enumerate all vigente permits for that company. Reasonable product behaviour for a QR inspector flow. Low-risk but public-facing.
  - `increment_public_link_view`: unauthenticated visitors can call `/rest/v1/rpc/increment_public_link_view?link_token=…` unlimited times — inflates the `view_count` and moves `last_viewed_at`, giving a noisy signal. Not a data leak; is a counter-manipulation primitive.
  - `user_company_id()`: returns `NULL` for anon (because `auth.uid()` is NULL). Safe in isolation. But exposing it as an RPC lets any caller confirm the function *exists* at the known URL, and makes the RLS helper observable. Low impact, but it should be `REVOKE EXECUTE … FROM anon, authenticated` with a policy-only grant (policies can call revoked functions because RLS runs as `postgres`/`supabase_admin`).
- **Impact:** `user_company_id()` being RPC-callable is the spicier of the three. The same function is used inside every single-tenant RLS policy; if its behaviour ever changes to leak data, the attack surface is huge.
- **Recommended fix:** `REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon, authenticated` — policies still work because PostgREST evaluates RLS as `supabase_admin`. For `increment_public_link_view`, add rate-limit via edge function wrapper or add a cheap token-existence check (already present).

---

### DB-07 (P1) — `drop_legacy_business_type_check` migration has a self-destructing sanity check

- **Evidence:** `supabase/migrations/20260511120000_drop_legacy_business_type_check.sql:11-22`:
  ```sql
  DO $$
  DECLARE n int;
  BEGIN
    SELECT count(*) INTO n FROM pg_constraint
    WHERE conrelid = 'public.companies'::regclass
      AND conname LIKE '%business_type%';
    IF n <> 1 THEN
      RAISE EXCEPTION 'Se esperaba 1 constraint sobre business_type, hay %', n;
    END IF;
  END $$;
  ```
- **Impact:** works in prod because the local repo state matches prod. Re-running the migration against a fresh database where `companies_business_type_valid` never existed will... succeed, because `DROP … IF EXISTS` is a no-op, and the count is still 1 (just `companies_business_type_check`). Actually this is fine. The risk is different: if a future dev adds a second business_type constraint (e.g. renames `business_type` or adds a case-insensitivity check), this old migration now throws. Counting by name pattern is brittle.
- **Recommended fix:** replace the name-pattern count with explicit `SELECT 1 FROM pg_constraint WHERE conname='companies_business_type_valid'` before the DROP — or simply delete the DO block. The `DROP … IF EXISTS` is already idempotent.

---

### DB-08 (P1) — `auto_create_location_permits` trigger can duplicate permits if the app retries a location insert

- **Evidence:** `permits` has no UNIQUE on `(location_id, type)` or `(company_id, location_id, type, is_active)`. Trigger body loops over all `permit_requirements` for the company's `business_type` and `INSERT`s each. No `ON CONFLICT`.
- **Impact:** any client retry (network flake, user double-click) creates `2*N` permits per location. Not currently showing (46 permits / 9 locations ≈ 5.1, below typical 6-requirement count), but a latent correctness issue.
- **Recommended fix:** add `ALTER TABLE permits ADD CONSTRAINT permits_one_active_per_location_type UNIQUE (location_id, type) WHERE is_active = true;` (partial unique index, since versioning replaces old permits). Then the trigger loop becomes `INSERT … ON CONFLICT (location_id, type) WHERE is_active = true DO NOTHING`.

---

### DB-09 (P1) — `lead.assigned_to`, `partner.assigned_to`, `notification_preferences.user_id` FKs have no `ON DELETE` → default `NO ACTION`

- **Evidence:**
  ```
  leads_assigned_to_fkey         FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
  partners_assigned_to_fkey      FOREIGN KEY (assigned_to) REFERENCES auth.users(id)
  notification_preferences_user_id_fkey  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ```
  No `ON DELETE` clause → defaults to `NO ACTION` (blocks user deletion).
- **Impact:** deleting a staff member from `auth.users` (e.g. offboarding) requires manual cleanup of any `leads.assigned_to` or `partners.assigned_to` pointing at them. `notification_preferences` is worse — blocks *any* user deletion because every user gets prefs auto-created. In practice Supabase admins use cascade=true when deleting, which bypasses this, but it's brittle.
- **Recommended fix:** `ON DELETE SET NULL` for `leads`/`partners` (preserves lead/partner data, just unassigns). `ON DELETE CASCADE` for `notification_preferences` (prefs are owned by the user).

---

### DB-10 (P2) — `leads.INSERT` policy `WITH CHECK (true)` is unauthenticated + unrate-limited

- **Evidence:** `pg_policies` → `"Anyone can insert leads" ON leads FOR INSERT TO public WITH CHECK true`. Advisor flags this as `rls_policy_always_true`.
- **Impact:** by design — landing page submits leads via `anon`. But there's no rate limit, no captcha check, no dedup, no size limit beyond column-level CHECK. A bot can insert hundreds of garbage rows per second. The CHECK constraints on name/negocio/email length bound row size but not row count.
- **Recommended fix:** add captcha (hCaptcha / Turnstile) at application layer, keep `WITH CHECK true`. DB-layer: consider a trigger that RAISEs when more than N rows/minute come from same IP/email; or move ingestion to an edge function with token gate.

---

### DB-11 (P2) — 12 timestamp columns use `timestamp without time zone`; rest of schema uses `timestamptz`

- **Evidence:** mixed types:
  - `timestamp without time zone` (legacy): `companies.{created,updated}_at`, `documents.uploaded_at`, `locations.{created,updated}_at`, `notification_logs.{created,sent}_at`, `permits.{archived,created,updated}_at`, `profiles.{created,updated}_at`, `public_links.{created,last_viewed,updated}_at`.
  - `timestamptz` (v2 / newer): `leads.*`, `notification_preferences.*`, `partners.*`, `permit_events.created_at`, `permit_issuers.*`, `permit_requirements.created_at`, `public_links.expires_at`.
- **Impact:** mixing types causes subtle bugs when JS sends ISO-with-TZ strings; Postgres strips the TZ for `timestamp` columns but applies client TZ for `timestamptz`. Deployed app is Ecuador (UTC-5), server in AWS us-east-1 (or wherever Supabase hosts) — not the same TZ. Dates near midnight can off-by-one. CLAUDE.md doesn't declare a convention.
- **Recommended fix:** migration `ALTER TABLE … ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC'` for every legacy column. Adopt `timestamptz` as the single type going forward. Add an ADR.

---

### DB-12 (P2) — 13 unused indexes per performance advisor

- **Evidence:** `mcp__supabase__get_advisors performance` returns INFO for 13 indexes on FK columns that have never been scanned:
  - `idx_documents_uploaded_by`, `idx_leads_assigned_to`, `idx_notification_logs_permit_id`, `idx_partners_assigned_to`, `idx_public_links_created_by`, `idx_public_links_location_id`, `idx_legal_consequences_legal_reference_id`, `idx_legal_process_steps_legal_reference_id`, `idx_legal_required_documents_legal_reference_id`, `idx_legal_sources_legal_reference_id`, `idx_permits_assigned_to`, `idx_permit_events_actor_id`, `idx_permit_requirements_issuer_id`.
- **Impact:** minimal — small-row-count tables — but every index adds write overhead. The legal_* indexes are on 6–35-row tables; pg will always seq-scan. Same for notification_logs (0 rows), partners (0 rows), leads (0 rows).
- **Recommended fix:** drop the 5 indexes on tables with < 100 rows after confirming no upcoming join path needs them. Keep the FK indexes on `permits`, `documents`, `public_links` — they'll be hit once usage ramps. The `WHERE actor_id IS NOT NULL` and `WHERE issuer_id IS NOT NULL` partial indexes are already tiny and cheap.

---

### DB-13 (P2) — `notification_logs` SELECT policy is `TO public` (not `TO authenticated`)

- **Evidence:** `pg_policies.notification_logs` → `"Users can read own company notification logs"` with `roles = {public}`. Uses `user_company_id()` which returns NULL for anon, so rows are filtered. Behaviour is safe, but declaring `TO public` when the intent is "authenticated on their own company" is a footgun — if someone ever re-writes `user_company_id()` to return a default, anon suddenly can read.
- **Impact:** defense-in-depth only. Current behaviour is correct.
- **Recommended fix:** `ALTER POLICY "Users can read own company notification logs" ON notification_logs TO authenticated;`.

---

### DB-14 (P2) — `permits.issuer` column kept "DEPRECATED" alongside `issuer_id`

- **Evidence:** column comment says *"DEPRECATED: reemplazado por issuer_id. Drop en release posterior."* Migration `20260511000003_permits_domain.sql` did a best-effort backfill. As of now there are rows with `issuer_id IS NULL AND issuer IS NOT NULL` (SCPM, CONSEP per that migration comment).
- **Impact:** clients reading `permits` must handle both columns. Every `SELECT permits.*` carries dead weight. New permits go through the form which sets `issuer_id`; legacy ones are frozen in text.
- **Recommended fix:** decide whether SCPM and CONSEP become real `permit_issuers` (and backfill `issuer_id`) or those legacy text rows are archived. Then drop `permits.issuer`.

---

### DB-15 (P2) — `permit_events` has no INSERT/UPDATE/DELETE policies; writes rely solely on `REVOKE`

- **Evidence:** `pg_policies.permit_events` has only two SELECT policies. `REVOKE INSERT, UPDATE, DELETE ON public.permit_events FROM anon, authenticated` was applied. Writes happen via `log_permit_event` and `log_document_event` (`SECURITY DEFINER`).
- **Impact:** correct by design — trigger bypasses RLS when function owner is postgres. BUT: if someone ever adds an explicit INSERT policy (e.g. "allow authenticated to log manual events") and forgets that the `REVOKE` is still in place, `INSERT` still fails because the role also lost `INSERT` at the privilege layer. Double gate is safe, but the mental model requires knowing both layers. Worth a code comment at the table definition.
- **Recommended fix:** add a `COMMENT ON TABLE permit_events IS 'Write-only via triggers (log_permit_event, log_document_event). Direct INSERT/UPDATE/DELETE is revoked from anon, authenticated.'` so the next dev doesn't waste an afternoon.

---

### DB-16 (P2) — `profiles_select` policy uses both `company_id = '50707999-…'` literal AND `user_company_id()` — dual code paths

- **Evidence:** `pg_policies.profiles`:
  ```sql
  USING (
    (id = auth.uid())
    OR (company_id = '50707999-f033-41c4-91c9-989966311972'::uuid)
    OR (auth.uid() IS NOT NULL AND company_id IS NOT NULL AND company_id = user_company_id())
  )
  ```
- **Impact:** works, but the demo-company literal hardcode is duplicated across `companies_select`, `locations_*`, `permits_*`, `documents_*`, storage policies. Changing the demo UUID requires touching ~12 policies. A constant (VIEW or function returning the UUID) would centralize it.
- **Recommended fix:** `CREATE FUNCTION public.demo_company_id() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '50707999-f033-41c4-91c9-989966311972'::uuid $$;` + refactor policies. Low urgency but high pay-off when demo UUID inevitably changes.

---

### DB-17 (P2) — `leads.email` column has two overlapping validations (CHECK + format), but no unique constraint

- **Evidence:** `leads_email_format_check` regex + no UNIQUE. Same email can submit the landing form arbitrarily many times.
- **Impact:** dup leads inflate CRM metrics and waste staff time. Not a security issue.
- **Recommended fix:** `UNIQUE NULLS NOT DISTINCT (lower(email))` or, softer, a partial unique on `(lower(email), source)` so the same person filling multiple landing pages still counts separately.

---

### DB-18 (P2) — `companies.city`, `locations.address`, `locations.risk_level` are `NOT NULL` but `risk_level` has no default; app must always supply it

- **Evidence:** `locations.risk_level` — NOT NULL, CHECK `('bajo','medio','alto','critico')`, no default.
- **Impact:** every INSERT INTO locations must supply risk_level. Fine when through the onboarding form; risky if a future script forgets.
- **Recommended fix:** `DEFAULT 'medio'` (or whatever the product's sensible default is). Document the choice.

---

### DB-19 (P3) — `get_public_permits` function signature returns `address` but old version (001_initial_schema.sql:101) returned `location_address`

- **Evidence:** `src/types/database.ts:770` expects `address`. Live function returns `address`. Legacy migration said `location_address`. Everything compiles because the newer migration (`20260510000000:255`) overrode the signature.
- **Impact:** none, just confusing archaeology.
- **Recommended fix:** consider a `DROP FUNCTION` in the legacy migration or a comment noting it was superseded.

---

### DB-20 (P3) — Migration history vs repo drift: 35 files in `supabase/migrations/`, 47 rows in `schema_migrations`

- **Evidence:** `mcp__supabase__list_migrations` returns 47 rows including `ola1` … `ola12`, `fix_documents_rls`, `fix_storage_rls_policies`, `008_legal_references`, `permit_requirements`, `add_permit_trigger`, `add_get_expiring_permits_function`, `allow_demo_profile_access`, `allow_demo_documents_operations`, `simplify_documents_rls_for_demo`, `create_permit_documents_bucket`, `enable_pg_net_for_cron_http`. None of these exist in `supabase/migrations/`. The repo shows the bootstrap-era `001_…` → `014_…` files plus `20260422*`, `20260506*`, `20260507_leads/partners/pre_production_audit_fixes`, plus v2 `20260511*`. So: the `ola*` migrations were applied via `mcp__supabase__apply_migration` and never committed (the `20260510_pre_production_audit_fixes.sql` is described as a "committed for version-control parity" of changes already applied to prod).
- **Impact:** a fresh clone + `supabase db reset` will NOT reproduce production. This is the classic Supabase workflow hazard. The audit ran against prod directly, but local dev will diverge.
- **Recommended fix:** dump `schema_migrations.statements` for every entry not in the repo and commit them. Or: accept drift and document that prod is the source of truth — update CLAUDE.md to say "migrations in repo are illustrative; `schema_migrations` in prod is authoritative".

---

### DB-21 (P3) — Auth config: leaked password protection is disabled

- **Evidence:** advisor lint `auth_leaked_password_protection` (WARN). Supabase's HIBP integration is off.
- **Impact:** users can pick `password123`. OAuth-only flows (Google) sidestep this, but if email/password is ever enabled, exposure grows.
- **Recommended fix:** enable in Supabase Auth dashboard. Zero-cost defense.

---

### DB-22 (P3) — `locations.company_id`, `permits.company_id`, `permits.location_id` are nullable — but real data is 100% populated

- **Evidence:** `is_nullable = YES` on all three; current data has 0 NULLs.
- **Impact:** latent — a bad INSERT can orphan a permit/location from its company, and RLS policies evaluate `company_id = '...'` to NULL, filtering correctly but semantically the row is unreachable.
- **Recommended fix:** `ALTER TABLE permits ALTER COLUMN company_id SET NOT NULL;` (same for `location_id` and `locations.company_id`). Safe because live data has no NULLs.

---

## Tables referenced in DB but rare/absent in src/

Spot-checked via `grep -l <name> src/`:

- `notification_logs` — present in `src/lib/api/notifications.ts` (likely; not grepped). DB has 0 rows. Cron + edge function populate it.
- `notification_preferences` — present.
- `permit_events` — 7 files reference it. OK.
- `permit_issuers` — 7 files. OK.
- `legal_*` — present via `get_legal_reference` RPC + types.
- `partners` — present in `src/features/partners/` (inferred). DB has 0 rows.
- `leads` — present. DB has 0 rows (nuked in `ola4`).

No shadow tables found.

---

## Verification queries used

Captured here so the next audit can re-run them verbatim.

```sql
-- RLS enabled per table
SELECT n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','storage') AND c.relkind='r';

-- All policies with qual/with_check
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public','storage');

-- SECURITY DEFINER functions with search_path + exposure
SELECT p.proname, pg_get_function_arguments(p.oid), p.prosecdef, p.proconfig
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef;

-- Function EXECUTE grants per role
SELECT p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE')
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace, pg_roles r
WHERE n.nspname='public' AND p.prosecdef AND r.rolname IN ('anon','authenticated','service_role');

-- FKs without ON DELETE
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint WHERE contype='f' AND pg_get_constraintdef(oid) NOT LIKE '%ON DELETE%';

-- Nullable NOT-NULL candidates
SELECT table_name, column_name, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND is_nullable='YES'
  AND column_name IN ('company_id','permit_id','location_id','user_id','permit_type');

-- Orphan checks
SELECT 'permits' AS t, count(*) FROM permits p
  WHERE company_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id=p.company_id);
```

---

## Files touched

- `C:\dev\enregla\supabase\migrations\*` (read-only, audit pass)
- `C:\dev\enregla\src\types\database.ts`, `database.types.ts` (read-only, audit pass)
- No write operations performed against the DB; all DO-blocks were rolled back.

---

_End pass 1 — DB._
