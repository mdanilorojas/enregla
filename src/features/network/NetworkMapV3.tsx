// src/features/network/NetworkMapV3.tsx
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAuth } from '@/hooks/useAuth';
import { useLocations } from '@/hooks/useLocations';
import { usePermits } from '@/hooks/usePermits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStaticLayout } from './useStaticLayout';
import { useNodeAnimation } from './useNodeAnimation';
import { CompanyNode } from './nodes/CompanyNode';
import { SedeNode } from './nodes/SedeNode';
import { PermitNode } from './nodes/PermitNode';

const nodeTypes: NodeTypes = {
  company: CompanyNode,
  sede: SedeNode,
  permit: PermitNode,
};

export function NetworkMapV3() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const { permits, loading: permitsLoading, error: permitsError } = usePermits();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Static layout
  const { nodes: layoutNodes, edges: layoutEdges } = useStaticLayout({
    locations,
    permits,
    isDesktop,
    companyName: profile?.company_name || 'Empresa',
  });

  // Animated nodes
  const animatedNodes = useNodeAnimation(layoutNodes);

  // Apply animation class to nodes
  const nodesWithAnimation = useMemo(() => {
    return layoutNodes.map(node => ({
      ...node,
      className: animatedNodes.has(node.id) ? 'animate-fadeIn' : 'opacity-0',
    }));
  }, [layoutNodes, animatedNodes]);

  const [nodes, , onNodesChange] = useNodesState(nodesWithAnimation);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  // Node click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'sede') {
        navigate(`/locations/${node.id}`);
      } else if (node.type === 'permit') {
        navigate(`/permits/${node.id}`);
      }
    },
    [navigate]
  );

  // Loading state
  if (locationsLoading || permitsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-neutral-600">Cargando mapa de red...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (locationsError || permitsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-error/10">
            <svg
              className="h-6 w-6 text-status-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Error al cargar datos
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              {locationsError || permitsError}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <svg
              className="h-8 w-8 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              No hay sedes registradas
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Agrega tu primera sede para comenzar a visualizar tu red de compliance
            </p>
          </div>
          <button
            onClick={() => navigate('/locations/new')}
            className="mt-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
          >
            Agregar sede
          </button>
        </div>
      </div>
    );
  }

  // Mobile view (list instead of network map)
  if (!isDesktop) {
    return (
      <div className="flex h-screen flex-col bg-neutral-50">
        <div className="border-b bg-white px-4 py-4">
          <h1 className="text-xl font-semibold text-neutral-900">Red de Sedes</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {locations.length} {locations.length === 1 ? 'sede' : 'sedes'} registradas
          </p>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {locations.map(location => {
              const locPermits = permits.filter(
                p => p.location_id === location.id && p.is_active
              );
              const compliance = locPermits.length
                ? Math.round(
                    (locPermits.filter(p => p.status === 'vigente').length /
                      locPermits.length) *
                      100
                  )
                : 0;
              const critical = locPermits.filter(
                p => p.status === 'vencido' || p.status === 'no_registrado'
              ).length;

              return (
                <button
                  key={location.id}
                  onClick={() => navigate(`/locations/${location.id}`)}
                  className="w-full rounded-lg border bg-white p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">
                        {location.name}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">
                        {location.address}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        location.risk_level === 'critico'
                          ? 'bg-status-error/10 text-status-error'
                          : location.risk_level === 'alto'
                            ? 'bg-status-warning/10 text-status-warning'
                            : location.risk_level === 'medio'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-status-success/10 text-status-success'
                      }`}
                    >
                      {location.risk_level}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600">Cumplimiento: </span>
                      <span className="font-medium text-neutral-900">
                        {compliance}%
                      </span>
                    </div>
                    {critical > 0 && (
                      <div>
                        <span className="text-neutral-600">Críticos: </span>
                        <span className="font-medium text-status-error">
                          {critical}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Success state - Network map
  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1,
          minZoom: 0.5,
        }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
