import type {
  OnboardingLocationInput,
  IndustryType,
  ClassificationResult,
  ObligationResult,
  RenewalItem,
  ChecklistItem,
  PermitType,
  RiskLevel,
} from '@/types';
import { getLegalReference } from '@/data/legal-references';

const BASE_OBLIGATIONS: ObligationResult[] = [
  {
    type: 'ruc',
    name: 'RUC / situación tributaria',
    issuer: 'SRI',
    frequency: 'Continuo',
    confidence: 'alta',
    validateInCity: false,
    required: true,
  },
  {
    type: 'patente_municipal',
    name: 'Patente municipal',
    issuer: 'Municipio de Quito',
    frequency: 'Anual',
    confidence: 'alta',
    validateInCity: true,
    required: true,
  },
  {
    type: 'uso_suelo',
    name: 'Certificado de uso de suelo',
    issuer: 'Municipio de Quito',
    frequency: 'Por evento / renovación',
    confidence: 'media',
    validateInCity: true,
    required: true,
  },
  {
    type: 'bomberos',
    name: 'Permiso de bomberos',
    issuer: 'Cuerpo de Bomberos de Quito',
    frequency: 'Anual',
    confidence: 'alta',
    validateInCity: true,
    required: true,
  },
];

const FOOD_OBLIGATION: ObligationResult = {
  type: 'arcsa',
  name: 'Permiso sanitario ARCSA',
  issuer: 'ARCSA',
  frequency: 'Anual',
  confidence: 'alta',
  validateInCity: false,
  required: true,
};

const SIGNAGE_OBLIGATION: ObligationResult = {
  type: 'rotulacion',
  name: 'Permiso de rotulación',
  issuer: 'Municipio de Quito',
  frequency: 'Por evento',
  confidence: 'media',
  validateInCity: true,
  required: false,
};

const FOOD_INDUSTRIES: IndustryType[] = ['restaurante', 'cafeteria', 'bar', 'dark_kitchen'];

export function classifyLocation(
  location: OnboardingLocationInput,
  industry: IndustryType,
  index: number
): ClassificationResult {
  const obligations: ObligationResult[] = [...BASE_OBLIGATIONS];

  const needsARCSA = location.handlesFood || FOOD_INDUSTRIES.includes(industry);
  if (needsARCSA) {
    obligations.push(FOOD_OBLIGATION);
  }

  if (location.hasSignage) {
    obligations.push(SIGNAGE_OBLIGATION);
  }

  if (location.hasWarehouse) {
    const bomberosIdx = obligations.findIndex(o => o.type === 'bomberos');
    if (bomberosIdx >= 0) {
      obligations[bomberosIdx] = {
        ...obligations[bomberosIdx],
        name: 'Permiso de bomberos (categoría ampliada por bodega)',
      };
    }
  }

  const renewalStructure: RenewalItem[] = obligations
    .filter(o => o.frequency === 'Anual')
    .map(o => ({
      permitType: o.type,
      name: o.name,
      frequency: o.frequency,
      estimatedMonth: estimateRenewalMonth(o.type),
    }));

  const checklist = generateChecklist(obligations, location);

  const missingCount = obligations.filter(o => o.required).length;
  let riskLevel: RiskLevel;
  if (location.stage === 'apertura') {
    riskLevel = missingCount >= 4 ? 'alto' : 'medio';
  } else {
    riskLevel = 'medio';
  }

  const obligationsWithLegalBasis = obligations.map(o => {
    const ref = getLegalReference(o.type);
    return {
      ...o,
      legalSummary: ref
        ? ref.sources.map(s => `${s.shortName} — ${s.articles || ''}`).join('; ')
        : undefined,
      frequencyBasis: ref?.frequencyBasis,
    };
  });

  return {
    locationId: `loc-new-${index}`,
    locationName: location.name,
    obligations: obligationsWithLegalBasis,
    riskLevel,
    renewalStructure,
    checklist,
  };
}

function estimateRenewalMonth(type: PermitType): string {
  const months: Partial<Record<PermitType, string>> = {
    patente_municipal: 'Enero - Marzo',
    bomberos: 'Enero - Febrero',
    arcsa: 'Según emisión',
  };
  return months[type] || 'Según emisión';
}

function generateChecklist(obligations: ObligationResult[], location: OnboardingLocationInput): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let id = 1;

  if (location.stage === 'apertura') {
    items.push({
      id: `chk-${id++}`,
      task: 'Obtener certificado de uso de suelo',
      permitType: 'uso_suelo',
      priority: 'critica',
      completed: false,
    });
  }

  items.push({
    id: `chk-${id++}`,
    task: 'Verificar vigencia del RUC y establecimientos registrados',
    permitType: 'ruc',
    priority: 'alta',
    completed: false,
  });

  items.push({
    id: `chk-${id++}`,
    task: 'Reunir documentación para patente municipal',
    permitType: 'patente_municipal',
    priority: 'alta',
    completed: false,
  });

  items.push({
    id: `chk-${id++}`,
    task: 'Agendar inspección de bomberos',
    permitType: 'bomberos',
    priority: 'alta',
    completed: false,
  });

  if (obligations.some(o => o.type === 'arcsa')) {
    items.push({
      id: `chk-${id++}`,
      task: 'Preparar solicitud ARCSA — permiso de funcionamiento',
      permitType: 'arcsa',
      priority: 'alta',
      completed: false,
    });
  }

  if (obligations.some(o => o.type === 'rotulacion')) {
    items.push({
      id: `chk-${id++}`,
      task: 'Solicitar permiso de rotulación para fachada',
      permitType: 'rotulacion',
      priority: 'media',
      completed: false,
    });
  }

  items.push({
    id: `chk-${id++}`,
    task: 'Subir permisos existentes al sistema',
    priority: 'media',
    completed: false,
  });

  return items;
}

export function classifyAllLocations(
  locations: OnboardingLocationInput[],
  industry: IndustryType
): ClassificationResult[] {
  return locations.map((loc, i) => classifyLocation(loc, industry, i));
}
