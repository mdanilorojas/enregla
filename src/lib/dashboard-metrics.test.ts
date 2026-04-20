import { describe, test, expect } from 'vitest';
import { calculateLocationRiskLevel } from './dashboard-metrics';
import type { Location, Permit } from '@/types/database';

// Helper: Create mock location with specific age
function createMockLocation({ hoursAgo }: { hoursAgo: number }): Location {
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id: 'test-location-id',
    company_id: 'test-company-id',
    name: 'Test Location',
    address: 'Test Address',
    status: 'operando',
    risk_level: 'bajo', // Will be overwritten by calculation
    created_at: createdAt.toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Helper: Create mock permit with specific status
function createMockPermit({
  status,
  locationId = 'test-location-id'
}: {
  status: 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado';
  locationId?: string;
}): Permit {
  return {
    id: `permit-${Math.random()}`,
    company_id: 'test-company-id',
    location_id: locationId,
    type: 'ruc',
    status,
    permit_number: null,
    issue_date: null,
    expiry_date: null,
    issuer: null,
    notes: null,
    is_active: true,
    version: 1,
    superseded_by: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('calculateLocationRiskLevel', () => {
  describe('Etapa 1: 0-48 horas sin documentos', () => {
    test('0-24h sin documentos → bajo', () => {
      const location = createMockLocation({ hoursAgo: 12 });
      const permits = [
        createMockPermit({ status: 'no_registrado' }),
        createMockPermit({ status: 'no_registrado' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
    });

    test('24-48h sin documentos → medio', () => {
      const location = createMockLocation({ hoursAgo: 36 });
      const permits = [
        createMockPermit({ status: 'no_registrado' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('medio');
    });

    test('<48h con documentos → transición a etapa 2', () => {
      const location = createMockLocation({ hoursAgo: 12 });
      const permits = [
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'vigente' }),
      ];

      // Con documentos subidos, usar lógica de etapa 2
      expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
    });
  });

  describe('Etapa 2: 48h+ o con documentos', () => {
    test('sin permisos → crítico', () => {
      const location = createMockLocation({ hoursAgo: 50 });
      const permits: Permit[] = [];

      expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
    });

    test('con permisos faltantes → crítico', () => {
      const location = createMockLocation({ hoursAgo: 100 });
      const permits = [
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'no_registrado' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
    });

    test('con permisos vencidos → crítico', () => {
      const location = createMockLocation({ hoursAgo: 100 });
      const permits = [
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'vencido' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('critico');
    });

    test('con permisos por vencer → medio', () => {
      const location = createMockLocation({ hoursAgo: 100 });
      const permits = [
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'por_vencer' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('medio');
    });

    test('todos vigentes → bajo', () => {
      const location = createMockLocation({ hoursAgo: 100 });
      const permits = [
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'vigente' }),
        createMockPermit({ status: 'vigente' }),
      ];

      expect(calculateLocationRiskLevel(location, permits)).toBe('bajo');
    });
  });
});
