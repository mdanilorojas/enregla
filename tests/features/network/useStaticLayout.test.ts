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
});
