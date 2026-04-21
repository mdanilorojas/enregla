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

    // Color mapping for risk levels
    const riskColor: Record<string, string> = {
      critico: '#ef4444',
      alto: '#f97316',
      medio: '#eab308',
      bajo: '#22c55e',
    };

    // Permit status colors
    const statusEdgeColor: Record<string, string> = {
      vigente: '#22c55e',
      por_vencer: '#eab308',
      vencido: '#ef4444',
      no_registrado: '#d1d5db',
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

    // Company node at origin
    const companyPos = { x: 0, y: 0 };
    nodes.push({
      id: 'company',
      type: 'company',
      position: companyPos,
      data: {
        name: companyName,
        locationCount: locations.length,
      },
    });

    // Sedes in circle (radius 350px)
    const SEDE_RADIUS = 350;

    locations.forEach((loc, i) => {
      const angle = (2 * Math.PI * i / locations.length) - Math.PI / 2; // Start at top
      const sedePos = {
        x: Math.cos(angle) * SEDE_RADIUS,
        y: Math.sin(angle) * SEDE_RADIUS,
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

      // Edge: Company → Sede
      const handles = getHandlePair(companyPos.x, companyPos.y, sedePos.x, sedePos.y);
      edges.push({
        id: `company-${loc.id}`,
        source: 'company',
        target: loc.id,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        style: {
          stroke: riskColor[loc.risk_level] || '#9ca3af',
          strokeWidth: 2,
          opacity: 0.35,
        },
        animated: loc.risk_level === 'critico',
      });

      // Permits around each sede (only on desktop)
      if (isDesktop) {
        locPermits.forEach((permit, j) => {
          // Dynamic radius based on permit count: 120px min, 240px max
          const permitRadius = Math.max(120, Math.min(240, 80 + locPermits.length * 12));

          // Distribute in arc aligned with sede's angle
          const permitAngle = (2 * Math.PI * j / locPermits.length) + angle;
          const permitPos = {
            x: sedePos.x + Math.cos(permitAngle) * permitRadius,
            y: sedePos.y + Math.sin(permitAngle) * permitRadius,
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

          // Edge: Sede → Permit
          const permitHandles = getHandlePair(sedePos.x, sedePos.y, permitPos.x, permitPos.y);
          edges.push({
            id: `${loc.id}-${permit.id}`,
            source: loc.id,
            target: permit.id,
            sourceHandle: `s-${permitHandles.sourceHandle}`,
            targetHandle: permitHandles.targetHandle,
            style: {
              stroke: statusEdgeColor[permit.status] || '#d1d5db',
              strokeWidth: (permit.status === 'vencido' || permit.status === 'no_registrado') ? 2.5 : 1.5,
              opacity: permit.status === 'no_registrado' ? 0.35 : 0.6,
            },
            animated: permit.status === 'vencido',
          });
        });
      }
    });

    return { nodes, edges };
  }, [locations, permits, isDesktop, companyName]);

  return { nodes, edges };
}
