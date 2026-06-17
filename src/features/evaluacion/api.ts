import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/demo';
import type {
  BusinessTypeDef,
  Condition,
  Evaluation,
  FieldOption,
  InputFieldDef,
  RequirementDef,
} from './types';
import { getBusinessType as getTsBusinessType, listBusinessTypes as listTsBusinessTypes } from './catalog';
import * as local from './storage';

// Tablas nuevas (business_types, evaluation_input_fields, requirement_catalog,
// evaluations) aún no están en el database.ts generado. Acceso por cliente sin
// tipar; los resultados se mapean a los tipos del dominio.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// --- Catálogo (lectura pública; fallback al catálogo TS si la red falla) ---

interface FieldRow {
  key: string;
  label: string;
  type: InputFieldDef['type'];
  options: FieldOption[] | null;
  required: boolean;
  help: string | null;
  unit: string | null;
}

interface ReqRow {
  code: string;
  area: RequirementDef['area'];
  name: string;
  authority: string;
  description: string;
  mandatory: boolean;
  renewal: RequirementDef['renewal'];
  legal_reference: string | null;
  applies_when: Condition[] | null;
}

function mapField(r: FieldRow): InputFieldDef {
  return {
    key: r.key,
    label: r.label,
    type: r.type,
    options: r.options ?? undefined,
    required: r.required,
    help: r.help ?? undefined,
    unit: r.unit ?? undefined,
  };
}

function mapReq(r: ReqRow): RequirementDef {
  return {
    code: r.code,
    area: r.area,
    name: r.name,
    authority: r.authority,
    description: r.description,
    mandatory: r.mandatory,
    renewal: r.renewal,
    legalReference: r.legal_reference ?? undefined,
    appliesWhen: r.applies_when && r.applies_when.length > 0 ? r.applies_when : undefined,
  };
}

export async function fetchBusinessTypes(): Promise<{ slug: string; name: string; description: string }[]> {
  const { data, error } = await db
    .from('business_types')
    .select('slug,name,description')
    .eq('active', true)
    .order('name');
  if (error || !data) return listTsBusinessTypes().map((b) => ({ slug: b.slug, name: b.name, description: b.description }));
  return data;
}

export async function fetchBusinessType(slug: string): Promise<BusinessTypeDef | null> {
  const { data: bt, error } = await db
    .from('business_types')
    .select('id,slug,name,description,active')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !bt) return getTsBusinessType(slug) ?? null;

  const [{ data: fields }, { data: reqs }] = await Promise.all([
    db.from('evaluation_input_fields').select('*').eq('business_type_id', bt.id).order('sort'),
    db.from('requirement_catalog').select('*').eq('business_type_id', bt.id).order('sort'),
  ]);

  return {
    slug: bt.slug,
    name: bt.name,
    description: bt.description,
    active: bt.active,
    inputFields: (fields ?? []).map(mapField),
    requirements: (reqs ?? []).map(mapReq),
  };
}

// --- Evaluaciones (DB para staff; localStorage en demo) ---

interface EvalRow {
  id: string;
  business_type_id: string;
  prospect_name: string;
  prospect_ruc: string | null;
  prospect_city: string | null;
  contact: string | null;
  inputs: Evaluation['inputs'];
  company_id: string | null;
  location_id: string | null;
  created_at: string;
  business_types?: { slug: string } | null;
}

function mapEval(r: EvalRow): Evaluation {
  return {
    id: r.id,
    businessTypeSlug: r.business_types?.slug ?? '',
    prospect: {
      name: r.prospect_name,
      ruc: r.prospect_ruc ?? undefined,
      city: r.prospect_city ?? undefined,
      contact: r.contact ?? undefined,
      companyId: r.company_id ?? undefined,
      locationId: r.location_id ?? undefined,
    },
    inputs: r.inputs,
    createdAt: r.created_at,
  };
}

export async function listEvaluations(): Promise<Evaluation[]> {
  if (DEMO_MODE) return local.listEvaluations();
  const { data, error } = await db
    .from('evaluations')
    .select('*, business_types(slug)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapEval);
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
  if (DEMO_MODE) return local.getEvaluation(id) ?? null;
  const { data, error } = await db
    .from('evaluations')
    .select('*, business_types(slug)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapEval(data);
}

export async function saveEvaluation(
  data: Omit<Evaluation, 'id' | 'createdAt'>
): Promise<Evaluation> {
  if (DEMO_MODE) return local.saveEvaluation(data);

  const { data: bt } = await db
    .from('business_types')
    .select('id')
    .eq('slug', data.businessTypeSlug)
    .maybeSingle();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: inserted, error } = await db
    .from('evaluations')
    .insert({
      business_type_id: bt?.id,
      prospect_name: data.prospect.name,
      prospect_ruc: data.prospect.ruc ?? null,
      prospect_city: data.prospect.city ?? null,
      contact: data.prospect.contact ?? null,
      inputs: data.inputs,
      company_id: data.prospect.companyId ?? null,
      location_id: data.prospect.locationId ?? null,
      created_by: user?.id ?? null,
    })
    .select('*, business_types(slug)')
    .single();
  if (error) throw error;
  return mapEval(inserted);
}

export async function deleteEvaluation(id: string): Promise<void> {
  if (DEMO_MODE) {
    local.deleteEvaluation(id);
    return;
  }
  await db.from('evaluations').delete().eq('id', id);
}
