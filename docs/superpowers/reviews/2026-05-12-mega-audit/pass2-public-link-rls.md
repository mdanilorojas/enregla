# Pass 2 — Independent Verification: Public-Link RLS Claim

**Date:** 2026-05-12
**Scope:** Independently reproduce (or falsify) the P0 claim that anon can cross-read company documents/permits via token-less public-link policies. Also verify the companion `leads` INSERT leak claim.
**Method:** Direct SQL probing via `mcp__supabase__execute_sql`, role switch via `SET LOCAL ROLE anon` inside `DO` blocks (required — bare `SET ROLE` between MCP statements does not reliably propagate to subsequent statements in this harness), synthetic data in staging, then cleanup.

---

## TL;DR

| Claim | Verdict | Evidence location |
|---|---|---|
| Public-link document/permit RLS unbound to presented token | **PARTIAL — confirmed for storage+documents policies but NOT EXPLOITABLE in current schema** | §1–§5 |
| `get_public_permits` RPC lacks token binding | **REFUTED** — RPC does `WHERE pl.token = link_token` | §2 |
| `leads` allows anon INSERT spam | **CONFIRMED** | §6 |
| Public verification page functions correctly for non-demo companies | **REFUTED AS A SIDE FINDING** — feature is broken client-side for non-demo companies | §5 |

The headline P0 framing ("anon with ANY valid token for company A can read ANY document or permit from company A") is **NOT reproducible** as written, because the policies responsible (`documents_select_anon`, `permit_docs_select_public_link`) are effectively **dead code** for anon: their `EXISTS` subqueries read `permits`/`public_links`, and those two tables have NO anon-visible rows outside the demo company (hardcoded UUID). The vulnerability as described does not execute today — but the policies are malformed and would become exploitable the moment a non-demo anon SELECT policy is added to `permits` or `public_links` (e.g. if someone tries to fix the broken public-verification page incorrectly).

---

## 1. Policy definitions (evidence)

Dumped from `pg_policies` / `pg_policy`:

### `public.documents` — `documents_select_anon`
Role: `anon`. Qual:
```sql
EXISTS (
  SELECT 1 FROM permits p
  WHERE p.id = documents.permit_id
    AND (
      p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid    -- demo
      OR EXISTS (
        SELECT 1 FROM public_links pl
        WHERE pl.company_id = p.company_id                            -- NO token predicate
          AND p.is_active = true
          AND pl.is_active = true
          AND (pl.expires_at IS NULL OR pl.expires_at > now())
          AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
      )
    )
)
```
No token/header/JWT claim is ever consulted. The predicate is "any active public_link for this company exists, optionally scoped to a location." This matches the claim's description.

### `storage.objects` — `permit_docs_select_public_link`
Roles: `anon, authenticated`. Qual:
```sql
bucket_id = 'permit-documents'
AND (storage.foldername(name))[1] = 'permits'
AND (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-...-[0-9a-f]{12}$'
AND EXISTS (
  SELECT 1 FROM permits p JOIN public_links pl ON pl.company_id = p.company_id
  WHERE p.id::text = (storage.foldername(objects.name))[2]
    AND p.is_active = true
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
    AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
)
```
Same pattern — no token binding.

### `public.public_links` policies
Only four — ALL role `authenticated`. **There is no `SELECT TO anon` policy on `public_links` at all.** Consequence: anon cannot see any row of `public_links` directly.

### `public.permits` — `permits_select`
Role: `public` (the PG catch-all pseudo-role). Qual:
```sql
company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
OR company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
```
For anon, `auth.uid()` is NULL so the `profiles` subquery is empty. **Anon can only see demo-company permits.** There is no token-aware anon predicate.

---

## 2. `get_public_permits` RPC body (REFUTES that part of the claim)

```sql
CREATE OR REPLACE FUNCTION public.get_public_permits(link_token text)
  RETURNS TABLE(...)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT l.name, l.address, p.type, p.permit_number, p.status,
         p.issue_date, p.expiry_date, p.issuer
  FROM permits p
  INNER JOIN locations l ON p.location_id = l.id
  INNER JOIN public_links pl ON pl.company_id = p.company_id
  WHERE pl.token = link_token                                 -- TOKEN BINDING PRESENT
    AND pl.is_active = true
    AND (pl.expires_at IS NULL OR pl.expires_at > now())
    AND p.is_active = true
    AND p.status = 'vigente'
    AND (pl.location_id IS NULL OR p.location_id = pl.location_id);
END;
$function$
```
This RPC **correctly** binds to the specific token presented. The claim that `get_public_permits` lacks token binding is **REFUTED**. (It runs `SECURITY DEFINER` so it bypasses RLS on the joined tables, which is necessary for it to return anything at all — see §4.)

---

## 3. Client code path (`src/lib/api/publicLinks.ts`)

The public verification page at `/p/:token` (`src/features/public-links/PublicVerificationPage.tsx:10`) calls `getPublicLinkData(token)` which:

1. Queries `public_links.select(...).eq('token', token)` directly via PostgREST (anon key, no JWT). Lines 123–137.
2. If that succeeds, queries `permits.select(..., documents(...)).eq('location_id', link.location_id)`. Lines 158–168.
3. Calls `supabase.storage.from('permit-documents').createSignedUrl(doc.file_path, 300)` per document. Lines 177–189.

It does **not** call the `get_public_permits` RPC (the RPC is defined but orphaned in the read path; only `increment_public_link_view` RPC is invoked for analytics at line 150).

**This means the app depends on anon being able to SELECT `public_links`, `permits`, `documents`, and `storage.objects` through RLS — not through the RPC.** The token, after being used as a `.eq('token', token)` filter in the `public_links` query, is not thereafter propagated anywhere: the `permits` query is filtered by `location_id` from the link row, with no token re-verification in the RLS layer. The RLS layer would need to grant access based on "an active link exists" because it has no other anchor. The broken policies in §1 were written in that spirit — but they never work because of §4.

---

## 4. Reproduction attempt — the exploit does NOT fire

### 4.1 Setup (as superuser, bypasses RLS)
Synthetic data: two companies (A with id `aaaaaaaa-…`, B with id `bbbbbbbb-…`), one location + one permit + one document each. Active, company-wide public_link only on A (token `TOKEN-A`). B has no public_link.

### 4.2 Probe as anon (via `DO $$ ... SET LOCAL ROLE anon; ... $$`)
Queried each table directly for known-existing rows from company A (which has the link):

| Probe | Visible to anon |
|---|---|
| `permits WHERE id = <A permit>` | 0 rows |
| `public_links WHERE id = <A link>` | 0 rows |
| `documents WHERE id = <A document>` | 0 rows |

**Anon cannot see a single row of company A's data — neither through the permissive `documents_select_anon` policy nor directly.**

Why: the `documents_select_anon` qual contains `EXISTS (SELECT 1 FROM permits p ...)`. That subquery is executed under the current role's RLS. For anon, `permits_select` only matches the demo company, so the subquery returns no rows, so the outer `EXISTS` is false, so the document is not visible. Identical reasoning kills the storage policy.

### 4.3 Methodological note
My initial attempts using bare `SET ROLE anon;` followed by a separate `INSERT`/`SELECT` statement in the same MCP call sometimes showed the role-switched effect and sometimes not — the MCP wrapper's statement handling appears to not reliably carry GUC state across semicolon-separated statements in every case. All conclusions above were re-verified using `DO $$ SET LOCAL ROLE anon; ... $$` blocks, which guarantee the role is active for the probe. The `DO`-block evidence is the canonical one.

---

## 5. Side finding: the public verification page is broken for non-demo companies

Because `public_links` has no anon SELECT policy and `permits_select` blocks non-demo anon access, the client path in `getPublicLinkData` returns null for any real tenant's token. The page renders "Link No Válido" (`PublicVerificationPage.tsx:98–117`). Only the demo company's links work, and those work only because the policy has the demo UUID hardcoded.

The orphaned, correctly-written `get_public_permits` RPC (§2) appears to be the intended safe path that was never wired up.

## 6. Companion claim — `leads` INSERT as anon (CONFIRMED)

Policy on `public.leads`:
```sql
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT TO public
  WITH CHECK (true)
```
(`polroles = {0}` i.e. PUBLIC; `polpermissive = true`; `polwithcheck = true`.)

Reproduction (via DO block returning status in a temp table):
```sql
DO $$
DECLARE v_result text;
BEGIN
  SET LOCAL ROLE anon;
  INSERT INTO public.leads (nombre, negocio, email, source)
  VALUES ('TESTSPAM','MyBiz','test@test.com','otro');
  v_result := 'INSERT_SUCCEEDED';
EXCEPTION WHEN OTHERS THEN
  v_result := format('INSERT_FAILED: %s %s', SQLSTATE, SQLERRM);
END $$;
```
Result: **`INSERT_SUCCEEDED`** — a row was created by role `anon` with no rate limit, no captcha, no honeypot. Row was then cleaned up.

**CONFIRMED**: anon can spam `leads` unboundedly. CHECK constraints enforce only the email regex, field lengths, and enumerated `source` values (`diagnostico|partners|home|sobre|otro`). No abuse controls.

---

## 7. What a correct public-link design would look like

Option A (preferred, minimal diff): route **all** anon access through `SECURITY DEFINER` RPCs (`get_public_permits`, plus a new `get_public_link_documents(link_token)` and a `sign_public_permit_document(link_token, permit_id)`), and **remove** the broken `documents_select_anon` and `permit_docs_select_public_link` policies entirely. Client uses only RPCs; RLS for anon collapses back to "demo company only."

Option B (keep table-level RLS): parameterize the RLS predicate with the presented token, e.g. via a request header read through `current_setting('request.headers', true)::json->>'x-public-link-token'` (PostgREST passes headers into GUCs). Policy predicate becomes:
```sql
EXISTS (SELECT 1 FROM public_links pl
        WHERE pl.token = current_setting('request.jwt.claims', true)::json->>'public_link_token'
          AND pl.company_id = p.company_id
          AND pl.is_active = true ...)
```
This requires adding anon SELECT policies on `public_links` and `permits` that also filter by the header-supplied token, and rewriting the client to send that header. It's more surface area and easier to get wrong than Option A.

For `leads`: add rate-limiting (per-IP counter), a honeypot field, and possibly a Supabase Edge Function in front of the table.

---

## 8. Evidence-based verdicts

- **Claim "anon with any token for company A can read any doc/permit from company A"**: Policies are shaped that way, but NOT exploitable today. `PARTIAL` — shape of the vulnerability is real, but the detonation requires another misconfiguration to fire. Fix severity: P1 (latent time-bomb; trivial to turn into P0 by anyone "fixing" the broken public page).
- **Claim "`get_public_permits` RPC is unbound to token"**: `REFUTED`. It binds correctly.
- **Claim "`leads` anon INSERT is open"**: `CONFIRMED`. P2 (spam / cost). Easy fix.

## 9. Files touched during verification
- `src/lib/api/publicLinks.ts` (read only)
- `src/features/public-links/PublicVerificationPage.tsx` (read only)
- `src/App.tsx` (read only — confirmed `/p/:token` route)

## 10. Cleanup
All synthetic test rows (companies/locations/permits/documents/public_links) were deleted. `tmp_exploit` / `tmp_probe` / `tmp_audit_result` temp tables are session-scoped and disappear automatically. Verified `SELECT count(*) FROM companies WHERE id IN (synthetic ids) = 0`. One test lead row (`test@test.com`) was deleted; verified count=0.
