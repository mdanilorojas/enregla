// tests/features/network/useStaticLayout.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaticLayout } from '@/features/network/useStaticLayout';

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
});
