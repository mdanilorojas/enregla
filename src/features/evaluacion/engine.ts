import {
  AREA_LABELS,
  AREA_ORDER,
  type BusinessTypeDef,
  type Condition,
  type InputValues,
  type RequirementArea,
  type RequirementDef,
} from './types';

export interface AreaResult {
  area: RequirementArea;
  label: string;
  items: RequirementDef[];
}

/** Evalúa una sola condición contra los valores capturados. */
export function matchCondition(cond: Condition, values: InputValues): boolean {
  const value = values[cond.field];

  if ('eq' in cond) {
    return value === cond.eq;
  }
  if ('gt' in cond) {
    return typeof value === 'number' && value > cond.gt;
  }
  if ('gte' in cond) {
    return typeof value === 'number' && value >= cond.gte;
  }
  if ('includes' in cond) {
    return Array.isArray(value) && value.includes(cond.includes);
  }
  return false;
}

/** Un requisito aplica si no tiene condiciones, o si TODAS se cumplen. */
export function requirementApplies(
  req: RequirementDef,
  values: InputValues
): boolean {
  if (!req.appliesWhen || req.appliesWhen.length === 0) return true;
  return req.appliesWhen.every((c) => matchCondition(c, values));
}

/**
 * Filtra los requisitos aplicables del tipo de negocio según los datos
 * capturados y los agrupa por área en orden fijo. Función pura.
 */
export function evaluateRequirements(
  businessType: BusinessTypeDef,
  values: InputValues
): AreaResult[] {
  const applicable = businessType.requirements.filter((r) =>
    requirementApplies(r, values)
  );

  return AREA_ORDER.map((area) => ({
    area,
    label: AREA_LABELS[area],
    items: applicable.filter((r) => r.area === area),
  })).filter((group) => group.items.length > 0);
}

/** Total de requisitos aplicables (para resúmenes). */
export function countRequirements(results: AreaResult[]): number {
  return results.reduce((sum, g) => sum + g.items.length, 0);
}
