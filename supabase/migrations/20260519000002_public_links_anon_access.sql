-- Permite acceso anonimo (sin login) a public_links + datos relacionados.
-- Bug: la pagina /p/:token devolvia "Link No Valido" porque anon no podia
-- leer public_links (policy solo permitia authenticated).

CREATE POLICY "public_links_select_anon"
ON public.public_links
FOR SELECT
TO anon
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

DROP POLICY IF EXISTS "locations_select_anon" ON public.locations;
CREATE POLICY "locations_select_anon"
ON public.locations
FOR SELECT
TO anon
USING (
  company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  OR EXISTS (
    SELECT 1 FROM public.public_links pl
    WHERE pl.is_active = true
      AND (pl.expires_at IS NULL OR pl.expires_at > now())
      AND (pl.location_id = locations.id OR pl.location_id IS NULL)
      AND pl.company_id = locations.company_id
  )
);

DROP POLICY IF EXISTS "permits_select_anon" ON public.permits;
CREATE POLICY "permits_select_anon"
ON public.permits
FOR SELECT
TO anon
USING (
  is_active = true AND (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    OR EXISTS (
      SELECT 1 FROM public.public_links pl
      WHERE pl.is_active = true
        AND (pl.expires_at IS NULL OR pl.expires_at > now())
        AND (pl.location_id = permits.location_id OR pl.location_id IS NULL)
        AND pl.company_id = permits.company_id
    )
  )
);
