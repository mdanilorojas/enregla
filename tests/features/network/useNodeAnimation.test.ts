import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeAnimation } from '@/features/network/useNodeAnimation';
import type { Node } from '@xyflow/react';

describe('useNodeAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty set initially', () => {
    const { result } = renderHook(() => useNodeAnimation([]));
    expect(result.current.size).toBe(0);
  });

  it('detects and animates new nodes with stagger', () => {
    const { result, rerender } = renderHook(
      ({ nodes }) => useNodeAnimation(nodes),
      { initialProps: { nodes: [] as Node[] } }
    );

    const newNodes: Node[] = [
      { id: 'company', type: 'company', position: { x: 0, y: 0 }, data: {} },
      { id: 'sede-1', type: 'sede', position: { x: 100, y: 0 }, data: {} },
      { id: 'permit-1', type: 'permit', position: { x: 200, y: 0 }, data: {} },
    ];

    act(() => {
      rerender({ nodes: newNodes });
    });

    // Initially, no nodes animated yet (stagger hasn't fired)
    expect(result.current.has('company')).toBe(false);

    // Company should animate immediately (0ms)
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current.has('company')).toBe(true);

    // Sede after 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.has('sede-1')).toBe(true);

    // Permit after another 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.has('permit-1')).toBe(true);
  });

  it('sorts company first, then sedes, then permits', () => {
    const { result, rerender } = renderHook(
      ({ nodes }) => useNodeAnimation(nodes),
      { initialProps: { nodes: [] as Node[] } }
    );

    const newNodes: Node[] = [
      { id: 'permit-1', type: 'permit', position: { x: 0, y: 0 }, data: {} },
      { id: 'sede-1', type: 'sede', position: { x: 0, y: 0 }, data: {} },
      { id: 'company', type: 'company', position: { x: 0, y: 0 }, data: {} },
    ];

    act(() => {
      rerender({ nodes: newNodes });
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Company should be first despite being last in array
    expect(result.current.has('company')).toBe(true);
    expect(result.current.has('sede-1')).toBe(false);
    expect(result.current.has('permit-1')).toBe(false);
  });
});
