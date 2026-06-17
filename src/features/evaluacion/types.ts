// Tipos del módulo Evaluación (instrumento de venta interno).
// El catálogo canónico vive en catalog/ y refleja exactamente el seed de la
// migración Supabase.

export type RequirementArea =
  | 'funcionamiento'
  | 'sectorial'
  | 'sri'
  | 'laboral_iess';

export type InputFieldType =
  | 'number'
  | 'text'
  | 'boolean'
  | 'select'
  | 'multiselect';

export type RenewalPeriod =
  | 'anual'
  | 'cada_2_anos'
  | 'periodico'
  | 'unico'
  | 'ninguno';

export interface FieldOption {
  value: string;
  label: string;
}

export interface InputFieldDef {
  key: string;
  label: string;
  type: InputFieldType;
  options?: FieldOption[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Sufijo visual (ej. "m²"). Solo UI. */
  unit?: string;
}

/** Una condición sobre un valor capturado. Todas las condiciones de un
 *  requisito deben cumplirse para que aplique. */
export type Condition =
  | { field: string; eq: string | number | boolean }
  | { field: string; gt: number }
  | { field: string; gte: number }
  | { field: string; includes: string };

export interface RequirementDef {
  code: string;
  area: RequirementArea;
  name: string;
  authority: string;
  description: string;
  /** Obligatorio (true) vs recomendado (false) cuando aplica. */
  mandatory: boolean;
  renewal: RenewalPeriod;
  legalReference?: string;
  /** Si se omite, el requisito aplica siempre. */
  appliesWhen?: Condition[];
}

export interface BusinessTypeDef {
  slug: string;
  name: string;
  description: string;
  active: boolean;
  inputFields: InputFieldDef[];
  requirements: RequirementDef[];
}

export type InputValue = string | number | boolean | string[];
export type InputValues = Record<string, InputValue>;

/** Datos de identidad del prospecto (no son drivers del motor). */
export interface ProspectMeta {
  name: string;
  ruc?: string;
  city?: string;
  contact?: string;
  /** Vínculo opcional a un cliente EnRegla existente. */
  companyId?: string;
  locationId?: string;
}

export interface Evaluation {
  id: string;
  businessTypeSlug: string;
  prospect: ProspectMeta;
  inputs: InputValues;
  createdAt: string;
}

export const AREA_ORDER: RequirementArea[] = [
  'funcionamiento',
  'sectorial',
  'sri',
  'laboral_iess',
];

export const AREA_LABELS: Record<RequirementArea, string> = {
  funcionamiento: 'Permisos de funcionamiento',
  sectorial: 'Requisitos sectoriales',
  sri: 'Tributario (SRI)',
  laboral_iess: 'Laboral e IESS',
};

export const RENEWAL_LABELS: Record<RenewalPeriod, string> = {
  anual: 'Anual',
  cada_2_anos: 'Cada 2 años',
  periodico: 'Periódico',
  unico: 'Único',
  ninguno: 'Permanente',
};
