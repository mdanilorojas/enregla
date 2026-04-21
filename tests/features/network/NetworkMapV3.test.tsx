import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NetworkMapV3 } from '@/features/network/NetworkMapV3';

// Create mock functions
const mockUseLocations = vi.fn();
const mockUsePermits = vi.fn();

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { company_id: 'test-company', company_name: 'Test Company' } }),
}));

vi.mock('@/hooks/useLocations', () => ({
  useLocations: () => mockUseLocations(),
}));

vi.mock('@/hooks/usePermits', () => ({
  usePermits: () => mockUsePermits(),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true, // Desktop by default
}));

describe('NetworkMapV3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching data', () => {
    mockUseLocations.mockReturnValue({
      locations: [],
      loading: true,
      error: null,
    });

    mockUsePermits.mockReturnValue({
      permits: [],
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <NetworkMapV3 />
      </BrowserRouter>
    );

    const loadingText = screen.getByText('Cargando mapa de red...');
    expect(loadingText).toBeTruthy();
  });
});
