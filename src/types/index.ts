export type IndustryType =
  | 'restaurante'
  | 'cafeteria'
  | 'bar'
  | 'dark_kitchen'
  | 'retail'
  | 'belleza'
  | 'farmacia'
  | 'bodega'
  | 'hospitalidad';

export type RiskLevel = 'critico' | 'alto' | 'medio' | 'bajo';

export type PermitType =
  | 'patente_municipal'
  | 'bomberos'
  | 'arcsa'
  | 'uso_suelo'
  | 'rotulacion'
  | 'ruc';

export type PermitStatus =
  | 'vigente'
  | 'por_vencer'
  | 'vencido'
  | 'no_registrado'
  | 'en_tramite';

export type LocationStage = 'apertura' | 'operando' | 'renovando';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
export type TaskPriority = 'critica' | 'alta' | 'media' | 'baja';
export type RenewalStatus = 'pendiente' | 'en_proceso' | 'completado' | 'vencido';
export type DocumentStatus = 'vigente' | 'vencido' | 'faltante';
export type DocumentType = 'permiso_pdf' | 'comprobante_pago' | 'contrato' | 'informe_inspeccion' | 'uso_suelo';

export interface Company {
  id: string;
  name: string;
  ruc: string;
  industry: IndustryType;
  locationCount: number;
  createdAt: string;
}

export interface Location {
  id: string;
  companyId: string;
  name: string;
  address: string;
  city: string;
  stage: LocationStage;
  handlesFood: boolean;
  sellsAlcohol: boolean;
  hasSignage: boolean;
  hasWarehouse: boolean;
  riskLevel: RiskLevel;
}

export interface Permit {
  id: string;
  locationId: string;
  type: PermitType;
  status: PermitStatus;
  issuer: string;
  issuedDate?: string;
  expiryDate?: string;
  documentIds: string[];
}

export interface Renewal {
  id: string;
  permitId: string;
  locationId: string;
  dueDate: string;
  status: RenewalStatus;
  owner?: string;
  priority: TaskPriority;
}

export interface Document {
  id: string;
  locationId: string;
  permitId?: string;
  name: string;
  type: DocumentType;
  uploadedAt: string;
  expiryDate?: string;
  status: DocumentStatus;
  thumbnailUrl?: string;
}

export interface Task {
  id: string;
  locationId: string;
  permitId?: string;
  title: string;
  description: string;
  dueDate?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
}

export interface OnboardingInput {
  companyName: string;
  ruc: string;
  industry: IndustryType;
  locationCount: number;
  locations: OnboardingLocationInput[];
}

export interface OnboardingLocationInput {
  name: string;
  address: string;
  city: string;
  stage: LocationStage;
  handlesFood: boolean;
  sellsAlcohol: boolean;
  hasSignage: boolean;
  hasWarehouse: boolean;
}

export interface ClassificationResult {
  locationId: string;
  locationName: string;
  obligations: ObligationResult[];
  riskLevel: RiskLevel;
  renewalStructure: RenewalItem[];
  checklist: ChecklistItem[];
}

export interface LegalSource {
  name: string;
  shortName: string;
  type: 'ley_organica' | 'reglamento' | 'ordenanza' | 'resolucion' | 'decreto' | 'normativa';
  articles?: string;
  url?: string;
  entity: string;
  scope: 'nacional' | 'municipal' | 'institucional';
}

export interface LegalReference {
  permitType: PermitType;
  description: string;
  sources: LegalSource[];
  frequencyBasis: string;
  consequences: string[];
  requiredDocuments: string[];
  typicalProcess: string[];
  estimatedCost?: string;
  disclaimer?: string;
}

export interface ObligationResult {
  type: PermitType;
  name: string;
  issuer: string;
  frequency: string;
  confidence: 'alta' | 'media';
  validateInCity: boolean;
  required: boolean;
  legalSummary?: string;
  frequencyBasis?: string;
}

export interface RenewalItem {
  permitType: PermitType;
  name: string;
  frequency: string;
  estimatedMonth?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  permitType?: PermitType;
  priority: TaskPriority;
  completed: boolean;
}

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  patente_municipal: 'Patente municipal',
  bomberos: 'Permiso de bomberos',
  arcsa: 'Permiso sanitario ARCSA',
  uso_suelo: 'Certificado uso de suelo',
  rotulacion: 'Permiso de rotulación',
  ruc: 'RUC / situación tributaria',
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  no_registrado: 'No registrado',
  en_tramite: 'En trámite',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  restaurante: 'Restaurante',
  cafeteria: 'Cafetería',
  bar: 'Bar',
  dark_kitchen: 'Dark / cloud kitchen',
  retail: 'Retail / supermercado',
  belleza: 'Belleza / estética',
  farmacia: 'Farmacia',
  bodega: 'Bodega / distribuidora',
  hospitalidad: 'Hospitalidad / entretenimiento',
};

export const STAGE_LABELS: Record<LocationStage, string> = {
  apertura: 'En apertura',
  operando: 'Operando',
  renovando: 'En renovación',
};
