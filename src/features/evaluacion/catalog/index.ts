import type { BusinessTypeDef } from '../types';
import { clinica } from './clinica';

// Registry de tipos de negocio. Refleja el seed de `business_types` en Supabase.
// Agregar nuevos tipos (restaurante, gimnasio, etc.) registrándolos aquí.
const REGISTRY: Record<string, BusinessTypeDef> = {
  [clinica.slug]: clinica,
};

export function getBusinessType(slug: string): BusinessTypeDef | undefined {
  return REGISTRY[slug];
}

export function listBusinessTypes(): BusinessTypeDef[] {
  return Object.values(REGISTRY);
}
