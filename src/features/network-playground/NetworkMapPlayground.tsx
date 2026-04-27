import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { supabase } from '@/lib/supabase';

import { PremiumCompanyNode } from './nodes/PremiumCompanyNode';
import { PremiumLocationNode } from './nodes/PremiumLocationNode';

import { AnimatedFlowEdge } from './edges/AnimatedFlowEdge';
import { DashedAnimatedEdge } from './edges/DashedAnimatedEdge';
import { GradientPulseEdge } from './edges/GradientPulseEdge';

import { GradientMeshBackground } from './backgrounds/GradientMeshBackground';
import { AuroraBackground } from './backgrounds/AuroraBackground';
import { CleanGridBackground } from './backgrounds/CleanGridBackground';

import { radialLayout } from './layouts/radialLayout';
import { hierarchicalLayout } from './layouts/hierarchicalLayout';
import { clusteredLayout } from './layouts/clusteredLayout';
import { forceLayout } from './layouts/forceLayout';

import { Layers, Zap, Palette, Filter } from 'lucide-react';

type LayoutKey = 'radial' | 'hierarchical' | 'clustered' | 'force';
type EdgeKey = 'flow' | 'dashed' | 'gradient' | 'smooth';
type BgKey = 'mesh' | 'aurora' | 'clean';
type RiskFilter = 'all' | 'critico' | 'alto' | 'medio' | 'bajo';

const nodeTypes: NodeTypes = {
  company: PremiumCompanyNode,
  location: PremiumLocationNode,
};

const edgeTypes: EdgeTypes = {
  flow: AnimatedFlowEdge,
  dashed: DashedAnimatedEdge,
  gradient: GradientPulseEdge,
};

export function NetworkMapPlayground() {
  const { companyId } = useAuth();
  const { locations, loading: locationsLoading } = useLocations(companyId);
  const { permits, loading: permitsLoading } = usePermits({ companyId });

  const [layout, setLayout] = useState<LayoutKey>('radial');
  const [edgeStyle, setEdgeStyle] = useState<EdgeKey>('flow');
  const [background, setBackground] = useState<BgKey>('mesh');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const [companyName, setCompanyName] = useState('EnRegla Demo');
  useEffect(() => {
    if (!companyId) return;
    (supabase.from('companies') as any)
      .select('name')
      .eq('id', companyId)
      .single()
      .then(({ data }: { data: { name: string } | null }) => {
        if (data?.name) setCompanyName(data.name);
      });
  }, [companyId]);

  // Apply filter
  const filteredLocations = useMemo(() => {
    if (riskFilter === 'all') return locations;
    return locations.filter((l) => l.risk_level === riskFilter);
  }, [locations, riskFilter]);

  // Build layout
  const layoutResult = useMemo(() => {
    const opts = { locations: filteredLocations, permits, companyName };
    switch (layout) {
      case 'radial':
        return radialLayout(opts);
      case 'hierarchical':
        return hierarchicalLayout(opts);
      case 'clustered':
        return clusteredLayout(opts);
      case 'force':
        return forceLayout(opts);
    }
  }, [layout, filteredLocations, permits, companyName]);

  // Apply edge style
  const styledEdges: Edge[] = useMemo(() => {
    return layoutResult.edges.map((edge) => {
      if (edgeStyle === 'smooth') {
        return {
          ...edge,
          type: 'smoothstep',
          animated: edge.animated,
          markerEnd: { type: MarkerType.ArrowClosed, color: (edge.style as any)?.stroke },
        };
      }
      const loc = filteredLocations.find((l) => l.id === edge.target);
      return {
        ...edge,
        type: edgeStyle,
        data: { riskLevel: loc?.risk_level || 'bajo' },
        animated: false, // custom edges manage their own animation
      };
    });
  }, [layoutResult.edges, edgeStyle, filteredLocations]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(layoutResult.nodes);
    setEdges(styledEdges);
  }, [layoutResult.nodes, styledEdges, setNodes, setEdges]);

  const renderBackground = useCallback(() => {
    switch (background) {
      case 'mesh':
        return <GradientMeshBackground />;
      case 'aurora':
        return <AuroraBackground />;
      case 'clean':
        return <CleanGridBackground />;
    }
  }, [background]);

  if (locationsLoading || permitsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const riskCounts = {
    all: locations.length,
    critico: locations.filter((l) => l.risk_level === 'critico').length,
    alto: locations.filter((l) => l.risk_level === 'alto').length,
    medio: locations.filter((l) => l.risk_level === 'medio').length,
    bajo: locations.filter((l) => l.risk_level === 'bajo').length,
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Floating Control Panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Network Map Playground</h1>
              <p className="text-[10px] text-gray-500">
                {filteredLocations.length} de {locations.length} sedes visibles
              </p>
            </div>
          </div>
        </div>

        {/* Layout selector */}
        <ControlGroup icon={<Layers size={12} />} label="Layout">
          <ControlButton active={layout === 'radial'} onClick={() => setLayout('radial')}>
            Radial
          </ControlButton>
          <ControlButton active={layout === 'hierarchical'} onClick={() => setLayout('hierarchical')}>
            Jerárquico
          </ControlButton>
          <ControlButton active={layout === 'clustered'} onClick={() => setLayout('clustered')}>
            Clusters
          </ControlButton>
          <ControlButton active={layout === 'force'} onClick={() => setLayout('force')}>
            Force
          </ControlButton>
        </ControlGroup>

        {/* Edge style */}
        <ControlGroup icon={<Zap size={12} />} label="Edges">
          <ControlButton active={edgeStyle === 'flow'} onClick={() => setEdgeStyle('flow')}>
            Particles
          </ControlButton>
          <ControlButton active={edgeStyle === 'dashed'} onClick={() => setEdgeStyle('dashed')}>
            Dashed
          </ControlButton>
          <ControlButton active={edgeStyle === 'gradient'} onClick={() => setEdgeStyle('gradient')}>
            Gradient
          </ControlButton>
          <ControlButton active={edgeStyle === 'smooth'} onClick={() => setEdgeStyle('smooth')}>
            Smooth
          </ControlButton>
        </ControlGroup>

        {/* Background */}
        <ControlGroup icon={<Palette size={12} />} label="Background">
          <ControlButton active={background === 'mesh'} onClick={() => setBackground('mesh')}>
            Mesh
          </ControlButton>
          <ControlButton active={background === 'aurora'} onClick={() => setBackground('aurora')}>
            Aurora
          </ControlButton>
          <ControlButton active={background === 'clean'} onClick={() => setBackground('clean')}>
            Clean
          </ControlButton>
        </ControlGroup>

        {/* Risk filter */}
        <ControlGroup icon={<Filter size={12} />} label="Filtro de riesgo">
          <FilterChip
            active={riskFilter === 'all'}
            onClick={() => setRiskFilter('all')}
            count={riskCounts.all}
            color="gray"
          >
            Todas
          </FilterChip>
          <FilterChip
            active={riskFilter === 'critico'}
            onClick={() => setRiskFilter('critico')}
            count={riskCounts.critico}
            color="red"
          >
            Crítico
          </FilterChip>
          <FilterChip
            active={riskFilter === 'alto'}
            onClick={() => setRiskFilter('alto')}
            count={riskCounts.alto}
            color="orange"
          >
            Alto
          </FilterChip>
          <FilterChip
            active={riskFilter === 'medio'}
            onClick={() => setRiskFilter('medio')}
            count={riskCounts.medio}
            color="amber"
          >
            Medio
          </FilterChip>
          <FilterChip
            active={riskFilter === 'bajo'}
            onClick={() => setRiskFilter('bajo')}
            count={riskCounts.bajo}
            color="emerald"
          >
            Bajo
          </FilterChip>
        </ControlGroup>
      </div>

      {/* Flow canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1, minZoom: 0.3 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        {renderBackground()}
        <Controls
          showInteractive={false}
          className="!bg-white/95 !border-gray-200 !shadow-xl !rounded-xl [&_button]:!bg-white [&_button]:!border-gray-100 [&_button]:!text-gray-600 [&_button:hover]:!bg-blue-50 [&_button:hover]:!text-blue-600"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'company') return '#1E3A8A';
            const risk = (n.data as { riskLevel?: string })?.riskLevel;
            switch (risk) {
              case 'critico':
                return '#EF4444';
              case 'alto':
                return '#F97316';
              case 'medio':
                return '#F59E0B';
              default:
                return '#10B981';
            }
          }}
          maskColor="rgba(15, 23, 42, 0.05)"
          className="!bg-white/95 !border !border-gray-200 !rounded-xl !shadow-xl"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

function ControlGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 px-4 py-3 min-w-[240px]">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, { activeBg: string; activeText: string; dot: string }> = {
    gray: { activeBg: 'bg-gray-700', activeText: 'text-white', dot: 'bg-gray-500' },
    red: { activeBg: 'bg-red-600', activeText: 'text-white', dot: 'bg-red-500' },
    orange: { activeBg: 'bg-orange-600', activeText: 'text-white', dot: 'bg-orange-500' },
    amber: { activeBg: 'bg-amber-600', activeText: 'text-white', dot: 'bg-amber-500' },
    emerald: { activeBg: 'bg-emerald-600', activeText: 'text-white', dot: 'bg-emerald-500' },
  };
  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? `${c.activeBg} ${c.activeText} shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : c.dot}`} />
      {children}
      <span className={`text-[10px] font-bold ${active ? 'opacity-90' : 'opacity-60'}`}>{count}</span>
    </button>
  );
}
