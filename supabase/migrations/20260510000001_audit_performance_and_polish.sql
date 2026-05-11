-- ============================================================================
-- PRE-PRODUCTION AUDIT — performance + polish pass
-- HIGH/MEDIUM remediation after the BLOCKERs migration.
-- Already applied to prod via mcp__supabase__apply_migration; committed for parity.
-- ============================================================================

-- 1. Wrap auth.uid() in (SELECT …) so the planner caches it instead of
--    re-evaluating per row (auth_rls_initplan advisor).

DROP POLICY partners_staff_select ON public.partners;
DROP POLICY partners_staff_insert ON public.partners;
DROP POLICY partners_staff_update ON public.partners;
DROP POLICY partners_staff_delete ON public.partners;

CREATE POLICY partners_staff_select ON public.partners FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

CREATE POLICY partners_staff_insert ON public.partners FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

CREATE POLICY partners_staff_update ON public.partners FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

CREATE POLICY partners_staff_delete ON public.partners FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

DROP POLICY leads_staff_select ON public.leads;
DROP POLICY leads_staff_update ON public.leads;
DROP POLICY leads_staff_delete ON public.leads;

CREATE POLICY leads_staff_select ON public.leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

CREATE POLICY leads_staff_update ON public.leads FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

CREATE POLICY leads_staff_delete ON public.leads FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_staff));

DROP POLICY companies_insert ON public.companies;
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND company_id IS NULL
  )
);

DROP POLICY profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated, anon
USING (
  id = (SELECT auth.uid())
  OR company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR (
    (SELECT auth.uid()) IS NOT NULL
    AND company_id IS NOT NULL
    AND company_id = public.user_company_id()
  )
);

DROP POLICY documents_select_authenticated ON public.documents;
CREATE POLICY documents_select_authenticated ON public.documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.permits p
  WHERE p.id = documents.permit_id
    AND (
      p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
      OR p.company_id IN (SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    )
));

-- 2. Consolidate duplicate anon SELECT policies on documents into one
DROP POLICY documents_select_anon_demo ON public.documents;
DROP POLICY documents_select_anon_public_link ON public.documents;

CREATE POLICY documents_select_anon ON public.documents FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.permits p
  WHERE p.id = documents.permit_id
    AND (
      p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
      OR EXISTS (
        SELECT 1 FROM public.public_links pl
        WHERE pl.company_id = p.company_id
          AND p.is_active = true
          AND pl.is_active = true
          AND (pl.expires_at IS NULL OR pl.expires_at > now())
          AND (pl.location_id IS NULL OR pl.location_id = p.location_id)
      )
    )
));
