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
