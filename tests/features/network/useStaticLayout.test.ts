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

  it('distributes sedes in horizontal row', () => {
    const mockLocations: Location[] = [
      {
        id: 'loc-1',
        name: 'Sede 1',
        address: 'Calle 1',
        risk_level: 'bajo',
        status: 'operando',
        company_id: 'comp-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 'loc-2',
        name: 'Sede 2',
        address: 'Calle 2',
        risk_level: 'medio',
        status: 'operando',
        company_id: 'comp-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
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

    const locationNodes = result.current.nodes.filter(n => n.type === 'location');

    expect(locationNodes).toHaveLength(2);

    // Locations should be positioned horizontally with SEDE_SPACING (320px)
    expect(locationNodes[0].position.x).toBe(0);
    expect(locationNodes[1].position.x).toBe(320);

    // All at same Y position
    locationNodes.forEach(node => {
      expect(node.position.y).toBe(280);
    });
  });

  it('does not show individual permit nodes in static layout', () => {
    const mockLocation: Location = {
      id: 'loc-1',
      name: 'Sede Test',
      address: 'Test Address',
      risk_level: 'bajo',
      status: 'operando',
      company_id: 'comp-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const mockPermits: Permit[] = Array.from({ length: 5 }, (_, i) => ({
      id: `permit-${i}`,
      type: 'Funcionamiento',
      status: 'vigente' as const,
      location_id: 'loc-1',
      company_id: 'comp-1',
      is_active: true,
      issuer: 'Test',
      permit_number: null,
      issue_date: null,
      expiry_date: null,
      notes: null,
      version: 1,
      superseded_by: null,
      archived_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }));

    const { result } = renderHook(() =>
      useStaticLayout({
        locations: [mockLocation],
        permits: mockPermits,
        isDesktop: true,
        companyName: 'Test',
      })
    );

    // Static layout doesn't create individual permit nodes
    // Permits are aggregated inside location node data
    const permitNodes = result.current.nodes.filter(n => n.type === 'permit');
    expect(permitNodes).toHaveLength(0);

    // But permit data should be in location node
    const locationNode = result.current.nodes.find(n => n.type === 'location');
    expect(locationNode?.data.totalPermits).toBe(5);
    expect(locationNode?.data.permits).toHaveLength(5);
  });

  it('shows location nodes on mobile', () => {
    const mockLocation: Location = {
      id: 'loc-1',
      name: 'Sede Test',
      address: 'Test',
      risk_level: 'bajo',
      status: 'operando',
      company_id: 'comp-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
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
        permit_number: null,
        issue_date: null,
        expiry_date: null,
        notes: null,
        version: 1,
        superseded_by: null,
        archived_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
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

    // On mobile, locations should still be shown
    const locationNodes = result.current.nodes.filter(n => n.type === 'location');
    expect(locationNodes).toHaveLength(1);

    // Static layout never creates separate permit nodes
    const permitNodes = result.current.nodes.filter(n => n.type === 'permit');
    expect(permitNodes).toHaveLength(0);
  });
});
