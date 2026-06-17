-- Módulo Evaluación: catálogo de tipos de negocio, campos de captura,
-- requisitos por tipo, e instancias de estudio. Herramienta interna de venta.
-- Acceso restringido a staff EnRegla (profiles.is_staff = true).
--
-- NOTA: el catálogo canónico se mantiene también en código
-- (src/features/evaluacion/catalog/). Este seed debe reflejar ese módulo.

-- Helper: ¿el usuario actual es staff?
create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_staff from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.business_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluation_input_fields (
  id uuid primary key default gen_random_uuid(),
  business_type_id uuid not null references public.business_types(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null check (type in ('number','text','boolean','select','multiselect')),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  help text,
  unit text,
  sort int not null default 0,
  unique (business_type_id, key)
);

create table if not exists public.requirement_catalog (
  id uuid primary key default gen_random_uuid(),
  business_type_id uuid not null references public.business_types(id) on delete cascade,
  code text not null,
  area text not null check (area in ('funcionamiento','sectorial','sri','laboral_iess')),
  name text not null,
  authority text not null,
  description text not null default '',
  mandatory boolean not null default true,
  renewal text not null check (renewal in ('anual','cada_2_anos','periodico','unico','ninguno')),
  legal_reference text,
  applies_when jsonb not null default '[]'::jsonb,
  sort int not null default 0,
  unique (business_type_id, code)
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  business_type_id uuid not null references public.business_types(id),
  prospect_name text not null,
  prospect_ruc text,
  prospect_city text,
  contact text,
  inputs jsonb not null default '{}'::jsonb,
  company_id uuid references public.companies(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists evaluations_created_by_idx on public.evaluations(created_by);
create index if not exists evaluation_input_fields_bt_idx on public.evaluation_input_fields(business_type_id);
create index if not exists requirement_catalog_bt_idx on public.requirement_catalog(business_type_id);

-- ---------------------------------------------------------------------------
-- RLS (solo staff)
-- ---------------------------------------------------------------------------

alter table public.business_types enable row level security;
alter table public.evaluation_input_fields enable row level security;
alter table public.requirement_catalog enable row level security;
alter table public.evaluations enable row level security;

-- Catálogo: lectura para staff.
create policy "staff read business_types" on public.business_types
  for select using (public.is_staff_user());
create policy "staff read input_fields" on public.evaluation_input_fields
  for select using (public.is_staff_user());
create policy "staff read requirements" on public.requirement_catalog
  for select using (public.is_staff_user());

-- Evaluaciones: staff CRUD completo.
create policy "staff read evaluations" on public.evaluations
  for select using (public.is_staff_user());
create policy "staff insert evaluations" on public.evaluations
  for insert with check (public.is_staff_user());
create policy "staff update evaluations" on public.evaluations
  for update using (public.is_staff_user()) with check (public.is_staff_user());
create policy "staff delete evaluations" on public.evaluations
  for delete using (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- Seed: clínica (refleja src/features/evaluacion/catalog/clinica.ts)
-- ---------------------------------------------------------------------------

insert into public.business_types (slug, name, description, active)
values ('clinica', 'Clínica / Consultorio médico',
        'Establecimiento de salud: consultorios, clínicas y centros médicos.', true)
on conflict (slug) do nothing;

with bt as (select id from public.business_types where slug = 'clinica')
insert into public.evaluation_input_fields
  (business_type_id, key, label, type, options, required, help, unit, sort)
values
  ((select id from bt), 'area_m2', 'Área del local', 'number', '[]', true, null, 'm²', 1),
  ((select id from bt), 'staff_count', 'Número total de personal', 'number', '[]', true, 'Incluye personal administrativo y de salud.', null, 2),
  ((select id from bt), 'health_professionals', 'Profesionales de salud', 'number', '[]', true, 'Médicos, odontólogos, enfermería, etc.', null, 3),
  ((select id from bt), 'services', 'Servicios que ofrece', 'multiselect',
     '[{"value":"consulta_externa","label":"Consulta externa"},{"value":"imagenologia","label":"Imagenología / Rayos X"},{"value":"laboratorio","label":"Laboratorio clínico"},{"value":"farmacia_interna","label":"Farmacia interna"},{"value":"procedimientos_menores","label":"Procedimientos menores"},{"value":"hospitalizacion","label":"Hospitalización"},{"value":"odontologia","label":"Odontología"}]',
     false, null, null, 4),
  ((select id from bt), 'handles_medications', '¿Maneja o almacena medicamentos / insumos?', 'boolean', '[]', false, null, null, 5),
  ((select id from bt), 'generates_biohazard', '¿Genera desechos biopeligrosos?', 'boolean', '[]', false, 'Cortopunzantes, material contaminado, biológicos.', null, 6),
  ((select id from bt), 'sells_food', '¿Vende alimentos o bebidas?', 'boolean', '[]', false, 'Cafetería, máquinas expendedoras, etc.', null, 7)
on conflict (business_type_id, key) do nothing;

with bt as (select id from public.business_types where slug = 'clinica')
insert into public.requirement_catalog
  (business_type_id, code, area, name, authority, description, mandatory, renewal, legal_reference, applies_when, sort)
values
  ((select id from bt), 'uso_suelo', 'funcionamiento', 'Certificado de Uso de Suelo', 'Municipio (GAD)', 'Compatibilidad del local con la actividad de salud según zonificación municipal.', true, 'unico', 'Ordenanzas municipales de uso y ocupación de suelo', '[]', 1),
  ((select id from bt), 'luae_patente', 'funcionamiento', 'LUAE / Patente Municipal', 'Municipio (GAD)', 'Licencia única de actividades económicas y patente para operar en el cantón.', true, 'anual', 'COOTAD; ordenanzas municipales', '[]', 2),
  ((select id from bt), 'bomberos', 'funcionamiento', 'Permiso de Funcionamiento de Bomberos', 'Cuerpo de Bomberos', 'Inspección de prevención de incendios y condiciones de seguridad del local.', true, 'anual', 'Reglamento de Prevención de Incendios', '[]', 3),
  ((select id from bt), 'acess_pf', 'funcionamiento', 'Permiso de Funcionamiento ACESS', 'ACESS', 'Permiso de funcionamiento del establecimiento de salud, base para operar legalmente.', true, 'anual', 'Normativa ACESS para establecimientos de salud', '[]', 4),
  ((select id from bt), 'acess_profesionales', 'sectorial', 'Registro de profesionales de salud', 'ACESS', 'Registro y validación del talento humano de salud que labora en el establecimiento.', true, 'periodico', 'Normativa ACESS de talento humano en salud', '[{"field":"health_professionals","gt":0}]', 5),
  ((select id from bt), 'arcsa_bpm', 'sectorial', 'Registro / BPM ARCSA (medicamentos e insumos)', 'ARCSA', 'Permiso sanitario y buenas prácticas para manejo y almacenamiento de medicamentos e insumos.', true, 'anual', 'Normativa técnica sanitaria ARCSA', '[{"field":"handles_medications","eq":true}]', 6),
  ((select id from bt), 'desechos_biopeligrosos', 'sectorial', 'Gestión de desechos biopeligrosos', 'Gestor ambiental autorizado / GAD', 'Contrato con gestor calificado para recolección y disposición de desechos sanitarios.', true, 'periodico', 'Reglamento de manejo de desechos sanitarios', '[{"field":"generates_biohazard","eq":true}]', 7),
  ((select id from bt), 'licencia_ambiental', 'sectorial', 'Registro / Licencia Ambiental (SUIA)', 'MAATE (SUIA)', 'Regularización ambiental del establecimiento por generación de desechos peligrosos.', true, 'unico', 'SUIA — Sistema Único de Información Ambiental', '[{"field":"generates_biohazard","eq":true}]', 8),
  ((select id from bt), 'arcsa_alimentos', 'sectorial', 'Permiso ARCSA de alimentos y bebidas', 'ARCSA', 'Permiso sanitario para venta o expendio de alimentos y bebidas en el local.', true, 'anual', 'Normativa técnica sanitaria ARCSA (alimentos)', '[{"field":"sells_food","eq":true}]', 9),
  ((select id from bt), 'ruc', 'sri', 'RUC activo', 'SRI', 'Registro Único de Contribuyentes habilitado con la actividad económica correcta.', true, 'unico', 'Ley de Registro Único de Contribuyentes', '[]', 10),
  ((select id from bt), 'regimen_tributario', 'sri', 'Régimen tributario (RIMPE / General)', 'SRI', 'Definición y cumplimiento del régimen tributario aplicable al negocio.', true, 'ninguno', 'Ley de Régimen Tributario Interno', '[]', 11),
  ((select id from bt), 'facturacion_electronica', 'sri', 'Facturación electrónica', 'SRI', 'Emisión de comprobantes electrónicos autorizados por el SRI.', true, 'ninguno', 'Resoluciones SRI de comprobantes electrónicos', '[]', 12),
  ((select id from bt), 'declaraciones', 'sri', 'Declaraciones IVA y Renta', 'SRI', 'Declaraciones periódicas de IVA y declaración anual de Impuesto a la Renta.', true, 'periodico', 'Ley de Régimen Tributario Interno', '[]', 13),
  ((select id from bt), 'iess_afiliacion', 'laboral_iess', 'Afiliación de empleados al IESS', 'IESS', 'Afiliación obligatoria de todo el personal en relación de dependencia.', true, 'periodico', 'Ley de Seguridad Social', '[{"field":"staff_count","gt":0}]', 14),
  ((select id from bt), 'riesgos_trabajo', 'laboral_iess', 'Registro de riesgos del trabajo', 'IESS (Riesgos del Trabajo)', 'Registro y prevención de riesgos laborales del personal.', true, 'periodico', 'Reglamento del Seguro General de Riesgos del Trabajo', '[{"field":"staff_count","gt":0}]', 15),
  ((select id from bt), 'reglamento_sst', 'laboral_iess', 'Reglamento de Higiene y Seguridad (SST)', 'Ministerio del Trabajo', 'Reglamento interno de seguridad y salud, obligatorio desde 10 trabajadores.', true, 'unico', 'Código del Trabajo; normativa del MDT', '[{"field":"staff_count","gte":10}]', 16)
on conflict (business_type_id, code) do nothing;
