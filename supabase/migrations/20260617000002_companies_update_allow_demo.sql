-- companies_update no permitía escribir la company demo (sin cláusula demo y
-- aplicada solo a authenticated), a diferencia de locations/permits. En demo mode
-- (auth.uid() null) el UPDATE afectaba 0 filas sin error → cambios de empresa
-- (nombre/RUC/ciudad) fallaban en silencio.
drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies
for update
using (
  id = '50707999-f033-41c4-91c9-989966311972'::uuid
  or id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
)
with check (
  id = '50707999-f033-41c4-91c9-989966311972'::uuid
  or id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
);