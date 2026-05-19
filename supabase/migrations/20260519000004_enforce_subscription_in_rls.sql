-- BLOCKER fix: subscription enforcement DB-side. Sin esto, una company con
-- trial expirado podia seguir insertando permits/locations/documents si
-- bypaseaba el guard del frontend (postman, curl). Ahora RLS bloquea.

CREATE OR REPLACE FUNCTION public.company_can_write(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id
      AND (
        subscription_status = 'active'
        OR (subscription_status = 'trial' AND trial_ends_at > NOW())
        OR id = '50707999-f033-41c4-91c9-989966311972'::uuid
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.company_can_write(uuid) TO authenticated;

DROP POLICY IF EXISTS "locations_insert" ON public.locations;
CREATE POLICY "locations_insert"
ON public.locations
FOR INSERT
TO authenticated
WITH CHECK (
  (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "locations_update" ON public.locations;
CREATE POLICY "locations_update"
ON public.locations
FOR UPDATE
TO authenticated
USING (
  company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR company_id IN (
    SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "permits_insert" ON public.permits;
CREATE POLICY "permits_insert"
ON public.permits
FOR INSERT
TO authenticated
WITH CHECK (
  (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "permits_update" ON public.permits;
CREATE POLICY "permits_update"
ON public.permits
FOR UPDATE
TO authenticated
USING (
  company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR company_id IN (
    SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = documents.permit_id
      AND (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        OR p.company_id IN (
          SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
        )
      )
      AND public.company_can_write(p.company_id)
  )
);

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = documents.permit_id
      AND (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        OR p.company_id IN (
          SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = documents.permit_id
      AND (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        OR p.company_id IN (
          SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
        )
      )
      AND public.company_can_write(p.company_id)
  )
);
