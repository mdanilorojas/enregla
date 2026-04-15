import { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useForceLayout } from '@/features/network/useForceLayout';
import { SedeNode } from '@/features/network/nodes/SedeNode';
import { PermitNode } from '@/features/network/nodes/PermitNode';
import { CompanyNode } from '@/features/network/nodes/CompanyNode';
import type { RiskLevel, PermitStatus, Location, Permit } from '@/types';

// Node types for ReactFlow
const nodeTypes = {
  sede: SedeNode,
  permit: PermitNode,
  company: CompanyNode,
};

// Color mapping for risk levels
const riskColor: Record<RiskLevel, string> = {
  critico: '#ef4444',  // Red
  alto: '#f97316',     // Orange
  medio: '#eab308',    // Yellow
  bajo: '#22c55e',     // Green
};

// Color mapping for permit status
const statusEdgeColor: Record<PermitStatus, string> = {
  vigente: '#22c55e',       // Green
  por_vencer: '#eab308',    // Yellow
  vencido: '#ef4444',       // Red
  no_registrado: '#d1d5db', // Gray
};

/**
 * Calculate which handles to use based on node positions (for proper edge routing)
 */
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

/**
 * Calculate compliance percentage for a location's permits
 * @param permits - Array of permits for a location
 * @returns Compliance percentage (0-100)
 */
function calculateCompliance(permits: Permit[]): number {
  const active = permits.filter(p => p.is_active);
  if (active.length === 0) return 0;
  const vigentes = active.filter(p => p.status === 'vigente').length;
  return Math.round((vigentes / active.length) * 100);
}

/**
 * Count critical issues (expired or not registered permits)
 * @param permits - Array of permits for a location
 * @returns Count of critical permits
 */
function countCritical(permits: Permit[]): number {
  return permits.filter(p =>
    p.is_active && (p.status === 'vencido' || p.status === 'no_registrado')
  ).length;
}

interface NetworkMapViewV2Props {
  embedded?: boolean;
}

export function NetworkMapViewV2({ embedded = false }: NetworkMapViewV2Props) {
  const navigate = useNavigate();
  const draggingRef = useRef<string | null>(null);

  // Load data from Supabase
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { locations, loading: locationsLoading, error: locationsError } = useLocations(companyId);
  const { permits, loading: permitsLoading, error: permitsError } = usePermits({ companyId });

  // Combined loading and error states
  const loading = locationsLoading || permitsLoading;
  const error = locationsError || permitsError;

  // Responsive detection: desktop shows permits, mobile shows only locations
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // TODO: Add helper functions (Task 3)
  // TODO: Generate nodes and edges (Task 4)
  // TODO: Add ReactFlow state and physics (Task 5)
  // TODO: Add loading/error/empty states (Task 6)
  // TODO: Implement ReactFlow render (Task 7)

  return (
    <div>NetworkMapViewV2 - TODO</div>
  );
}
