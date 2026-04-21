// tests/features/network/useStaticLayout.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaticLayout } from '@/features/network/useStaticLayout';
import type { Location, Permit } from '@/types/database';

describe('useStaticLayout', () => {
  it('positions company node at origin (0, 0)', () => {
    const { result } = renderHook(() =>
      useStaticLayout({
        locations: [],
        permits: [],
        isDesktop: true,
        companyName: 'Test Company',
      })
    );

    const companyNode = result.current.nodes.find(n => n.id === 'company');

    expect(companyNode).toBeDefined();
    expect(companyNode?.position).toEqual({ x: 0, y: 0 });
    expect(companyNode?.type).toBe('company');
    expect(companyNode?.data.name).toBe('Test Company');
  });

  it('distributes sedes in circle with radius 350px', () => {
    const mockLocations = [
      {
        id: 'loc-1',
        name: 'Sede 1',
        address: 'Calle 1',
        risk_level: 'bajo',
        company_id: 'comp-1',
        is_active: true,
        created_at: '2024-01-01',
      },
      {
        id: 'loc-2',
        name: 'Sede 2',
        address: 'Calle 2',
        risk_level: 'medio',
        company_id: 'comp-1',
        is_active: true,
        created_at: '2024-01-01',
      },
    ];

    const { result } = renderHook(() =>
      useStaticLayout({
        locations: mockLocations,
        permits: [],
        isDesktop: true,
        companyName: 'Test',
      })
    );

    const sedeNodes = result.current.nodes.filter(n => n.type === 'sede');

    expect(sedeNodes).toHaveLength(2);

    sedeNodes.forEach(sede => {
      const distance = Math.sqrt(sede.position.x ** 2 + sede.position.y ** 2);
      expect(distance).toBeCloseTo(350, 1);
    });
  });

  it('positions permits around sede with dynamic radius based on count', () => {
    const mockLocation: Location = {
      id: 'loc-1',
      name: 'Sede Test',
      address: 'Test Address',
      risk_level: 'bajo',
      company_id: 'comp-1',
      is_active: true,
      created_at: '2024-01-01',
    };

    const mockPermits: Permit[] = Array.from({ length: 5 }, (_, i) => ({
      id: `permit-${i}`,
      type: 'Funcionamiento',
      status: 'vigente' as const,
      location_id: 'loc-1',
      company_id: 'comp-1',
      is_active: true,
      issuer: 'Test',
      created_at: '2024-01-01',
    }));

    const { result } = renderHook(() =>
      useStaticLayout({
        locations: [mockLocation],
        permits: mockPermits,
        isDesktop: true,
        companyName: 'Test',
      })
    );

    const permitNodes = result.current.nodes.filter(n => n.type === 'permit');

    expect(permitNodes).toHaveLength(5);

    // Expected radius for 5 permits: Math.max(120, Math.min(240, 80 + 5 * 12)) = 140px
    const expectedRadius = 140;

    permitNodes.forEach(permit => {
      // Calculate distance from sede (at angle -90° = top, x=0, y=-350)
      const sedePos = { x: 0, y: -350 };
      const dx = permit.position.x - sedePos.x;
      const dy = permit.position.y - sedePos.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      expect(distance).toBeCloseTo(expectedRadius, 1);
    });
  });

  it('hides permits when isDesktop is false', () => {
    const mockLocation: Location = {
      id: 'loc-1',
      name: 'Sede Test',
      address: 'Test',
      risk_level: 'bajo',
      company_id: 'comp-1',
      is_active: true,
      created_at: '2024-01-01',
    };

    const mockPermits: Permit[] = [
      {
        id: 'permit-1',
        type: 'Test',
        status: 'vigente',
        location_id: 'loc-1',
        company_id: 'comp-1',
        is_active: true,
        issuer: 'Test',
        created_at: '2024-01-01',
      },
    ];

    const { result } = renderHook(() =>
      useStaticLayout({
        locations: [mockLocation],
        permits: mockPermits,
        isDesktop: false, // Mobile
        companyName: 'Test',
      })
    );

    const permitNodes = result.current.nodes.filter(n => n.type === 'permit');
    expect(permitNodes).toHaveLength(0);
  });
});
