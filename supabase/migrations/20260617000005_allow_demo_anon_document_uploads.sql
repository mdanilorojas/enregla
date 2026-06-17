-- En demo mode (anon) subir documentos de permiso fallaba con
-- "new row violates row-level security policy": documents_insert y la policy de
-- storage permit_docs_insert_authenticated eran TO authenticated, aunque sus
-- checks ya contemplan la company demo. Abrir el rol a PUBLIC (anon+authenticated);
-- los checks siguen restringiendo a la company demo o a la empresa del usuario,
-- y mantienen el gate de suscripción (company_can_write) para empresas reales.

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
for insert
with check (
  exists (
    select 1 from public.permits p
    where p.id = documents.permit_id
      and (
        p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
        or p.company_id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
      )
      and public.company_can_write(p.company_id)
  )
);

drop policy if exists "permit_docs_insert_authenticated" on storage.objects;
create policy "permit_docs_insert_authenticated" on storage.objects
for insert
with check (
  bucket_id = 'permit-documents'
  and (storage.foldername(name))[1] = 'permits'
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (
    exists (
      select 1 from public.permits p
      where (p.id)::text = (storage.foldername(name))[2]
        and p.company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    )
    or exists (
      select 1 from public.permits p
      join public.profiles pr on pr.company_id = p.company_id
      where (p.id)::text = (storage.foldername(name))[2]
        and pr.id = (select auth.uid())
    )
  )
);