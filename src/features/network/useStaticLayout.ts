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

    // Helper function to calculate handle pair
    function getHandlePair(sx: number, sy: number, tx: number, ty: number) {
      const angle = Math.atan2(ty - sy, tx - sx);
      if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
        return { sourceHandle: 'right', targetHandle: 'left' };
      } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
        return { sourceHandle: 'bottom', targetHandle: 'top' };
      } else if (angle >= -(3 * Math.PI) / 4 && angle < -Math.PI / 4) {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
      }
      return { sourceHandle: 'left', targetHandle: 'right' };
    }

    // Color mapping for risk levels - Brighter for dark bg
    const riskColor: Record<string, string> = {
      critico: '#f87171',
      alto: '#fb923c',
      medio: '#facc15',
      bajo: '#4ade80',
    };

    // Permit status colors - Vibrant for dark bg
    const statusEdgeColor: Record<string, string> = {
      vigente: '#4ade80',
      por_vencer: '#facc15',
      vencido: '#f87171',
      no_registrado: '#6b7280',
    };

    // Calculate compliance
    function calculateCompliance(permits: Permit[]): number {
      const active = permits.filter(p => p.is_active);
      if (active.length === 0) return 0;
      const vigentes = active.filter(p => p.status === 'vigente').length;
      return Math.round((vigentes / active.length) * 100);
    }

    // Count critical issues
    function countCritical(permits: Permit[]): number {
      return permits.filter(p =>
        p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
      ).length;
    }

    // Hierarchical layout: empresa arriba, sedes en fila, permisos debajo
    const SEDE_Y_OFFSET = 280; // Distancia vertical empresa → sedes
    const SEDE_SPACING = 320;  // Espaciado horizontal entre sedes
    const PERMIT_Y_OFFSET = 220; // Distancia vertical sede → permisos
    const PERMIT_SPACING = 200; // Espaciado horizontal entre permisos

    // Company node at top center
    const totalWidth = (locations.length - 1) * SEDE_SPACING;
    const companyPos = { x: totalWidth / 2, y: 0 };
    nodes.push({
      id: 'company',
      type: 'company',
      position: companyPos,
      data: {
        name: companyName,
        locationCount: locations.length,
      },
    });

    // Sedes in horizontal row
    locations.forEach((loc, i) => {
      const sedePos = {
        x: i * SEDE_SPACING,
        y: SEDE_Y_OFFSET,
      };

      const locPermits = permits.filter(p => p.location_id === loc.id && p.is_active);
      const compliance = calculateCompliance(locPermits);
      const critical = countCritical(locPermits);

      nodes.push({
        id: loc.id,
        type: 'sede',
        position: sedePos,
        data: {
          name: loc.name,
          address: loc.address,
          riskLevel: loc.risk_level,
          compliance,
          critical,
          permitCount: locPermits.length,
        },
      });

      // Edge: Company → Sede (vertical straight line)
      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        style: {
          stroke: riskColor[loc.risk_level] || '#6b7280',
          strokeWidth: 3,
          opacity: 0.7,
        },
        animated: loc.risk_level === 'critico',
        type: 'straight',
      });

      // Permits below each sede in horizontal row (only on desktop)
      if (isDesktop) {
        const permitRowWidth = (locPermits.length - 1) * PERMIT_SPACING;
        const permitStartX = sedePos.x - permitRowWidth / 2;

        locPermits.forEach((permit, j) => {
          const permitPos = {
            x: permitStartX + j * PERMIT_SPACING,
            y: sedePos.y + PERMIT_Y_OFFSET,
          };

          nodes.push({
            id: permit.id,
            type: 'permit',
            position: permitPos,
            data: {
              label: permit.type,
              status: permit.status,
              issuer: permit.issuer || 'N/A',
            },
          });

          // Edge: Sede → Permit (vertical straight line)
          edges.push({
            id: `${loc.id}-${permit.id}`,
            source: loc.id,
            target: permit.id,
            sourceHandle: 's-bottom',
            targetHandle: 'top',
            style: {
              stroke: statusEdgeColor[permit.status] || '#6b7280',
              strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 3 : 2.5,
              opacity: permit.status === 'no_registrado' ? 0.3 : 0.6,
            },
            animated: permit.status === 'vencido',
            type: 'straight',
          });
        });
      }
    });

    return { nodes, edges };
  }, [locations, permits, isDesktop, companyName]);

  return { nodes, edges };
}
