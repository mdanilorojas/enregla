import { describe, it, expect } from 'vitest';
import { BUSINESS_TYPES, businessTypeLabel, type BusinessType } from '@/lib/domain/business-types';

describe('BUSINESS_TYPES', () => {
  it('exports 12 types including "otro"', () => {
    expect(BUSINESS_TYPES).toHaveLength(12);
    expect(BUSINESS_TYPES.includes('otro')).toBe(true);
  });

  it('maps every type to a label', () => {
    for (const t of BUSINESS_TYPES) {
      expect(businessTypeLabel(t)).toBeTruthy();
      expect(businessTypeLabel(t)).not.toEqual(t); // label is not just the slug
    }
  });

  it('businessTypeLabel returns slug for unknown value', () => {
    expect(businessTypeLabel('foo' as BusinessType)).toEqual('foo');
  });
});
