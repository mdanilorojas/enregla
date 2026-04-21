// src/features/network/useStaticLayout.ts
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Location, Permit } from '@/types/database';

interface UseStaticLayoutOptions {
  locations: Location[];
  permits: Permit[];
  isDesktop: boolean;
  companyName: string;
}

export function useStaticLayout({
  locations,
  permits,
  isDesktop,
  companyName,
}: UseStaticLayoutOptions) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Company node at origin
    nodes.push({
      id: 'company',
      type: 'company',
      position: { x: 0, y: 0 },
      data: {
        name: companyName,
        locationCount: locations.length,
      },
    });

    return { nodes, edges };
  }, [locations, permits, isDesktop, companyName]);

  return { nodes, edges };
}
