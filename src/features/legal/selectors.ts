import type { LegalReference, PermitType } from '@/types';
import { PERMIT_TYPE_LABELS } from '@/types';
import {
  LEGAL_REFERENCES,
  PERMIT_TO_CATEGORY,
  CATEGORY_ORDER,
  type LegalCategory,
} from '@/data/legal-references';

export function getAllPermits(): LegalReference[] {
  return CATEGORY_ORDER.flatMap((cat) => getPermitsByCategory(cat));
}

export function getPermitsByCategory(
  category: LegalCategory | 'all'
): LegalReference[] {
  const entries = Object.entries(LEGAL_REFERENCES) as Array<[PermitType, LegalReference]>;
  if (category === 'all') {
    return entries.map(([, ref]) => ref);
  }
  return entries
    .filter(([type]) => PERMIT_TO_CATEGORY[type] === category)
    .map(([, ref]) => ref);
}

export function getCategoryCount(category: LegalCategory): number {
  return getPermitsByCategory(category).length;
}

export function getPermitByType(permitType: string): LegalReference | null {
  if (!(permitType in LEGAL_REFERENCES)) return null;
  return LEGAL_REFERENCES[permitType as PermitType];
}

export function getCategoryForPermit(permitType: PermitType): LegalCategory {
  return PERMIT_TO_CATEGORY[permitType];
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalize(s: string): string {
  return stripAccents(s).toLowerCase().trim();
}

export function searchPermits(query: string): LegalReference[] {
  const q = normalize(query);
  if (!q) return getAllPermits();

  return getAllPermits().filter((ref) => {
    const haystack = [
      PERMIT_TYPE_LABELS[ref.permitType],
      ref.description,
      ref.sources.map((s) => `${s.name} ${s.shortName} ${s.entity}`).join(' '),
    ]
      .map(normalize)
      .join(' ');
    return haystack.includes(q);
  });
}

export function getIssuerShort(ref: LegalReference): string {
  const primary = ref.sources[0];
  if (!primary) return '';
  const entity = primary.entity;
  const shortMatch = entity.match(/\(([^)]+)\)/);
  if (shortMatch) return shortMatch[1];
  const parts = entity.split(' ');
  if (parts.length > 3) return parts.slice(0, 3).join(' ') + '…';
  return entity;
}
