import { describe, it, expect } from 'vitest';
import { BUSINESS_TYPES, businessTypeLabel, type BusinessType } from '@/lib/domain/business-types';

describe('BUSINESS_TYPES', () => {
  it('exports 12 types including "otro"', () => {
    expect(BUSINESS_TYPES).toHaveLength(12);
    expect(BUSINESS_TYPES.includes('otro')).toBe(true);
  });

  // Regresion guard: estos valores DEBEN coincidir con el whitelist del RPC
  // create_company_for_user (ver supabase/migrations/*free_tier* y
  // *change_business_type_rpc*). Si divergen, el wizard rompe en el paso
  // "Empresa" con ERRCODE 23514 (Invalid business_type) de forma silenciosa.
  it('matches the create_company_for_user DB whitelist exactly', () => {
    const DB_WHITELIST = [
      'restaurante', 'retail', 'food_truck', 'consultorio', 'cafeteria',
      'panaderia', 'bar', 'farmacia', 'gimnasio', 'salon_belleza',
      'oficina', 'otro',
    ];
    expect([...BUSINESS_TYPES].sort()).toEqual([...DB_WHITELIST].sort());
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
