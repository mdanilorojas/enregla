import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermitPreviewStep } from './PermitPreviewStep';

// Mock the data hooks so the test is deterministic (no network).
vi.mock('@/lib/domain/permit-requirements', () => ({
  usePermitRequirements: () => ({
    data: [
      {
        id: '1', business_type: 'restaurante', permit_type: 'bomberos',
        is_mandatory: true, issuer_id: null, required_role: 'admin',
        cost_min: 30, cost_max: 80, cost_currency: 'USD', cost_notes: null,
        cost_updated_at: null, fine_min: 200, fine_max: 2000, fine_source: null,
        applies_when: null,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock('@/lib/domain/issuers', () => ({ useIssuers: () => ({ data: [] }) }));

describe('PermitPreviewStep', () => {
  it('renders the business-type heading and a requirement row', () => {
    render(<PermitPreviewStep businessType="restaurante" />);
    expect(screen.getByText(/vas a necesitar estos permisos/i)).toBeTruthy();
    expect(screen.getByText(/Restaurante/i)).toBeTruthy();
    expect(screen.getByText(/Bomberos/i)).toBeTruthy();
  });
});
