# Pass 2 — DB claims verification

Independent reproduction/falsification of P0/P1 DB claims from `pass1-db.md`.
All evidence is live-queried from the Supabase project on 2026-05-12.

---

## CLAIM 1 — `handle_new_user` trigger silently broken (role='member' vs CHECK admin|operator|viewer)

**Verdict: CONFIRMED (P0).**

### Evidence 1a — function body inserts role='member'

```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
```

```
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'                     -- <--- not in allowed set
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth user creation because of profile insert failure
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$
```

### Evidence 1b — CHECK constraint only allows admin|operator|viewer

```sql
SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
 WHERE conrelid = 'public.profiles'::regclass AND contype = 'c';
```

```
profiles_role_check           CHECK ((role = ANY (ARRAY['admin', 'operator', 'viewer'])))
profiles_business_role_check  CHECK ((business_role = ANY (ARRAY['empleado','representante_legal','contador','tecnico_responsable'])))
```

`'member'` is NOT in the allowed set → every trigger-driven insert violates the constraint, is caught by `EXCEPTION WHEN OTHERS`, and is swallowed.

### Evidence 1c — live reproduction (rolled back via cleanup)

Performed inside a `DO` block with a temp-table audit log so we could capture counts. Insert a synthetic auth user, check `public.profiles` and `public.notification_preferences` for rows against that id, then delete all three (auth.users + its two dependents) to leave DB state unchanged.

```
k                 v
test_id           49d7c591-0d20-4264-aad7-383f736a8c92
profile_rows      0
notif_pref_rows   1
```

The second trigger (`on_auth_user_created_notification_prefs`) DID create its row, so auth.users insert itself fired triggers correctly. The first trigger (`handle_new_user`) silently failed — **profile was NOT created**.

### Evidence 1d — triggers attached to auth.users

```sql
SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger
 WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
```

```
on_auth_user_created                     -> handle_new_user()
on_auth_user_created_notification_prefs  -> create_default_notification_preferences()
```

### Evidence 1e — profile/user counts currently balanced (masking the bug)

```sql
SELECT (SELECT count(*) FROM auth.users) users, (SELECT count(*) FROM public.profiles) profiles;
-- users=4, profiles=4
```

### Evidence 1f — all existing profiles have role='admin' (NOT 'member')

```sql
SELECT role, count(*) FROM public.profiles GROUP BY role;
-- admin  4
```

Timeline explains why: existing profiles were all created BEFORE the regression was deployed.

| email | auth_created | profile_created | gap |
|---|---|---|---|
| demo@enregla.ec | 2026-04-14 00:56:57 | 2026-04-14 00:56:57 | +0.15s |
| pauriofrio25@gmail.com | 2026-04-23 15:50:15 | 2026-04-23 15:50:15 | -0.01s |
| mario.rojas@bairesdev.com | 2026-05-07 19:28:29 | 2026-05-07 19:28:29 | -0.03s |
| mariodanilorojas@gmail.com | 2026-05-07 19:46:49 | 2026-05-07 19:46:49 | -0.00s |

Bad migration `20260510_pre_production_audit_fixes` was applied **2026-05-10 23:20:08 UTC**, AFTER all four signups. The prior migration `20260422165811_auto_create_profile_trigger.sql` inserted `'admin'` (valid). So the regression was introduced by the so-called "hardening" migration itself (file line 337 of `supabase/migrations/20260510000000_pre_production_audit_fixes.sql`).

### Blast radius (additional finding)

`src/features/onboarding-incremental/IncrementalWizard.tsx:63` → `saveProfile()` in `src/lib/api/onboarding.ts:118-133` does `UPDATE … WHERE id = userId`. If the trigger has not created the profile row, this UPDATE affects **zero rows silently** (no error, `data` empty). Onboarding appears to succeed but the user ends up with no profile → dashboard load hits `profile = null` → app shows empty state forever. There is no INSERT fallback anywhere in the frontend (grep `\.from\('profiles'\)` returns only selects and updates). Any new OAuth signup after 2026-05-10 is broken end-to-end.

---

## CLAIM 2 — Three SECURITY DEFINER functions exposed to anon

**Verdict: CONFIRMED (but nuance).**

### Evidence 2a — grants query

```sql
SELECT p.proname, pg_get_function_arguments(p.oid) args,
       p.prosecdef sdef,
       array_agg(DISTINCT a.privilege_type) FILTER (WHERE a.grantee='anon') anon_privs
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  LEFT JOIN information_schema.routine_privileges a
    ON a.specific_name = p.proname || '_' || p.oid::text
 WHERE n.nspname='public' AND p.proname IN ('get_public_permits','increment_public_link_view','user_company_id')
 GROUP BY p.proname, p.oid;
```

```
proname                      args              sdef  anon_privs
user_company_id              (none)            t     {EXECUTE}
get_public_permits           link_token text   t     {EXECUTE}
increment_public_link_view   link_token text   t     {EXECUTE}
```

Supabase advisor also flags all three as `anon_security_definer_function_executable` (WARN).

### Nuance

- `get_public_permits(link_token)` and `increment_public_link_view(link_token)` are **by design** public — they power the public share-link feature. They internally gate on `pl.token = link_token AND pl.is_active AND (pl.expires_at IS NULL OR pl.expires_at > now())`. So while the advisor flags them, they are intentional if the token check is trusted. Still worth marking `STABLE` vs `VOLATILE` on `increment_public_link_view` (it does writes — OK, `VOLATILE` is default).
- `user_company_id()` is a DIFFERENT story. It is a helper used inside RLS policies and there is NO good reason for `anon` to have EXECUTE. It reads `profiles.company_id WHERE id = auth.uid()`, so when anon calls it `auth.uid()` is null and it returns null — no data leak, but also no reason to grant anon EXECUTE. **P1 remediation:** `REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon;` — tidy surface-area reduction.

---

## CLAIM 3 — `permits.type` has duplicates differing only by case and snake_case vs Title Case

**Verdict: CONFIRMED (worse than claimed — 18 distinct values, 10 of them collisions).**

```sql
SELECT type, count(*) FROM permits GROUP BY type ORDER BY lower(type);
```

| type | count |
|---|---|
| Ambiental | 3 |
| arcsa | 3 |
| **Bomberos** | 3 |
| **bomberos** | 4 |
| Funcionamiento | 3 |
| **Patente Municipal** | 4 |
| **patente_municipal** | 4 |
| Permiso de Alcohol (SCPM) | 2 |
| Permiso Químicos (CONSEP) | 1 |
| Permiso Sanitario (ARCSA) | 1 |
| permiso_movilidad | 3 |
| Publicidad | 1 |
| Rotulación | 1 |
| **ruc** | 4 |
| **RUC** | 2 |
| Sanitario | 3 |
| Uso de Suelo | 3 |
| uso_suelo | 1 |

Hard duplicates (differ only by case/format): Bomberos/bomberos, Patente Municipal/patente_municipal, RUC/ruc, Uso de Suelo/uso_suelo, and ARCSA-flavored overlap (arcsa vs "Permiso Sanitario (ARCSA)"). Count of rows affected by dup pairs: ~29 out of 51. There is no CHECK, no enum, no FK to a reference table. This breaks grouping, filtering, and compliance rollups.

---

## CLAIM 4 — Storage uploads require auth (CLAUDE.md demo-mode claim is outdated)

**Verdict: CONFIRMED — CLAUDE.md is wrong. Storage INSERT policy does NOT allow unauth uploads.**

```sql
SELECT policyname, cmd, roles FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects';
```

| policyname | cmd | roles |
|---|---|---|
| permit_docs_insert_authenticated | INSERT | {authenticated} |
| permit_docs_select_authenticated | SELECT | {authenticated} |
| permit_docs_delete_admin | DELETE | {authenticated} |
| permit_docs_select_public_link | SELECT | {anon,authenticated} |

INSERT policy is `roles={authenticated}` — anon cannot upload, period. The SELECT/INSERT `qual`/`with_check` does reference the demo company id (`50707999-...`) as one branch of the OR, but since the policy is restricted to the `authenticated` role it does not grant anon upload.

CLAUDE.md says: *"Storage policies must allow uploads to `permits/` folder without auth"* → this has NOT been true for at least one migration cycle. Either demo-mode upload is broken in the browser, or the codepath avoids Storage (inlines or skips). Either the policy must be extended to `{anon}` with the demo-company branch, or CLAUDE.md must be updated to remove the claim.

---

## NEW findings spotted while running the above

### NEW P0 — `leads` table has `INSERT WITH CHECK (true)` policy for role `-` (public)

From `get_advisors` security lint:

> Table `public.leads` has an RLS policy `Anyone can insert leads` for `INSERT` that allows unrestricted access (WITH CHECK clause is always true). This effectively bypasses row-level security.

Anyone on the internet can INSERT rows into `public.leads`. Depending on what `leads` stores, this is either a form endpoint (intentional but needs rate limiting / captcha / length limits) or a data-integrity hole. Either way it's unbounded → spam / storage-fill / DoS vector. Verify intent; if intentional, add row-size + rate limits via trigger.

### NEW P1 — `profiles.created_at` and `updated_at` are `timestamp without time zone`

From `information_schema.columns` dump for `public.profiles`:
- `created_at` / `updated_at` → `timestamp without time zone`

This is inconsistent with `auth.users.created_at` which is `timestamptz`. When comparing (as we did in the timeline query) Postgres silently applies server timezone → subtle drift bugs. Should be `timestamptz`.

### NEW P1 — `auth_leaked_password_protection` disabled

From advisors: HaveIBeenPwned check is off. One-click fix in Supabase dashboard. Not a DB migration.

### NEW P2 — `auto_assign_company_to_profile` trigger does UPDATE but never INSERT

Function body:
```
UPDATE profiles SET company_id = NEW.id, role = 'admin', updated_at = NOW()
 WHERE id = auth.uid() AND company_id IS NULL;
```

If the profile row was never created by `handle_new_user` (see Claim 1), this UPDATE silently does nothing. The company row gets inserted, but the profile-company link is never made. Compounds the Claim 1 blast radius.

---

## Summary table

| Claim | Verdict | Severity |
|---|---|---|
| handle_new_user silently broken (role='member') | CONFIRMED | P0 |
| 3× SECURITY DEFINER exposed to anon | CONFIRMED (2 intentional, 1 tightening needed) | P1 (partial) |
| permits.type has case/format duplicates | CONFIRMED (worse — 10 collisions) | P0 |
| Storage uploads require auth (CLAUDE.md claim outdated) | CONFIRMED | P1 docs-vs-db drift |
| **NEW:** leads.Anyone can insert leads → unrestricted INSERT | FOUND | P0 |
| **NEW:** profiles.created_at is timestamp (not timestamptz) | FOUND | P1 |
| **NEW:** leaked_password_protection disabled | FOUND | P1 |
| **NEW:** auto_assign_company_to_profile UPDATE no-ops when profile missing | FOUND | P2 (compound) |

Verified by live SQL against prod Supabase on 2026-05-12. No schema changes made; reproduction test cleaned up.
