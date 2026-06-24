import { describe, it, expect } from 'vitest';
import { buildOnboardingLeadParams } from './onboarding';

describe('buildOnboardingLeadParams', () => {
  it('maps input to RPC params, passing permit type through', () => {
    const p = buildOnboardingLeadParams({
      nombre: 'Danilo Rojas',
      email: 'danilo@gmail.com',
      telefono: '0987654321',
      negocio: 'Mi Restaurante',
      ciudad: 'Quito',
      permitType: 'arcsa',
    });
    expect(p.p_nombre).toBe('Danilo Rojas');
    expect(p.p_email).toBe('danilo@gmail.com');
    expect(p.p_telefono).toBe('0987654321');
    expect(p.p_negocio).toBe('Mi Restaurante');
    expect(p.p_ciudad).toBe('Quito');
    expect(p.p_permit_type).toBe('arcsa');
  });

  it('nulls out optional empty/whitespace fields', () => {
    const p = buildOnboardingLeadParams({
      nombre: 'X', email: 'x@y.com', negocio: 'N', permitType: 'bomberos', telefono: '  ',
    });
    expect(p.p_telefono).toBeNull();
    expect(p.p_ciudad).toBeNull();
  });
});
