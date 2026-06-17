-- locations_delete aplicaba solo a 'authenticated' → en demo mode (anon) no
-- borraba sedes. Recrear sin restricción de rol manteniendo la cláusula demo:
-- anon solo puede borrar la company demo; usuarios reales solo su empresa.
-- Cascada (permits, documents, public_links, eventos) por FK ON DELETE CASCADE.
drop policy if exists "locations_delete" on public.locations;
create policy "locations_delete" on public.locations
for delete
using (
  company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  or company_id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
);