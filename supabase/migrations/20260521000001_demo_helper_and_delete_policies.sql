-- Centraliza el bypass de la company demo en una función SECURITY DEFINER
-- y agrega DELETE policies que faltaban (audit gap).
-- El UUID hardcodeado de demo sigue dispersa en muchas migraciones legacy;
-- esta migración no las reescribe (riesgo). Las nuevas políticas usan el helper
-- y migraciones futuras deben preferirlo.

CREATE OR REPLACE FUNCTION public.is_demo_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT p_company_id = '50707999-f033-41c4-91c9-989966311972'::uuid;
$$;

GRANT EXECUTE ON FUNCTION public.is_demo_company(uuid) TO authenticated, anon;

COMMENT ON FUNCTION public.is_demo_company(uuid) IS
  'Helper único para chequear si un company_id es la empresa demo. '
  'Centraliza el bypass que antes estaba hardcoded en cada policy.';

-- ============================================================================
-- DELETE policies — el audit detectó que DELETE no tenía company_can_write()
-- por lo que un trial expirado podía borrar datos. Se agregan acá.
-- ============================================================================

DROP POLICY IF EXISTS "locations_delete" ON public.locations;
CREATE POLICY "locations_delete"
ON public.locations
FOR DELETE
TO authenticated
USING (
  (
    public.is_demo_company(company_id)
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "permits_delete" ON public.permits;
CREATE POLICY "permits_delete"
ON public.permits
FOR DELETE
TO authenticated
USING (
  (
    public.is_demo_company(company_id)
    OR company_id IN (
      SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
    )
  )
  AND public.company_can_write(company_id)
);

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete"
ON public.documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permits p
    WHERE p.id = documents.permit_id
      AND (
        public.is_demo_company(p.company_id)
        OR p.company_id IN (
          SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
        )
      )
      AND public.company_can_write(p.company_id)
  )
);

-- ============================================================================
-- Storage delete: cubre permit-documents bucket. La policy existente de SELECT
-- y INSERT permiten al demo. Para DELETE, replicamos el mismo patrón.
-- ============================================================================

DROP POLICY IF EXISTS "permit_docs_delete" ON storage.objects;
CREATE POLICY "permit_docs_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'permit-documents'
  AND (
    -- Demo company: cualquier authenticated puede borrar bajo /permits/{permit_id_demo}/...
    EXISTS (
      SELECT 1 FROM public.permits p
      WHERE (storage.foldername(name))[2] = p.id::text
        AND public.is_demo_company(p.company_id)
    )
    OR
    -- Real company: solo si el permit pertenece al company del usuario
    EXISTS (
      SELECT 1 FROM public.permits p
      WHERE (storage.foldername(name))[2] = p.id::text
        AND p.company_id IN (
          SELECT profiles.company_id FROM profiles WHERE profiles.id = (SELECT auth.uid())
        )
    )
  )
);
