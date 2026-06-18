-- Asignación de permiso: "Mi empresa" (yo) por defecto, o delegado a EnRegla
-- (servicio de tramitación). Columnas de delegación + apertura de permits_update
-- a anon para demo mode (antes solo authenticated → la asignación no persistía).
alter table public.permits
  add column if not exists delegated_to_enregla boolean not null default false,
  add column if not exists delegation_requested_by uuid references public.profiles(id),
  add column if not exists delegation_requested_at timestamptz;

drop policy if exists "permits_update" on public.permits;
create policy "permits_update" on public.permits
for update
using (
  company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
  or company_id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
)
with check (
  (
    company_id = '50707999-f033-41c4-91c9-989966311972'::uuid
    or company_id in (select profiles.company_id from public.profiles where profiles.id = (select auth.uid()))
  )
  and public.company_can_write(company_id)
);