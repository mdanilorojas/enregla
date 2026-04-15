import { useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Node, Edge } from '@xyflow/react';

interface SimNode extends SimulationNodeDatum {
  id: string;
  type?: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

interface UseForceLayoutOptions {
  nodes: Node[];
  edges: Edge[];
  onTick: (positions: Map<string, { x: number; y: number }>) => void;
}

export function useForceLayout({ nodes, edges, onTick }: UseForceLayoutOptions) {
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);

  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      x: n.position.x,
      y: n.position.y,
      // Fix permit nodes in place - don't let physics move them
      ...(n.type === 'permit' ? { fx: n.position.x, fy: n.position.y } : {}),
    }));

    const simLinks: SimLink[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));

    simNodesRef.current = simNodes;

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((link) => {
            const src = link.source as SimNode;
            const tgt = link.target as SimNode;
            if (src.type === 'company' || tgt.type === 'company') return 280;
            if (src.type === 'sede' || tgt.type === 'sede') return 150;
            return 120;
          })
          .strength((link) => {
            const src = link.source as SimNode;
            const tgt = link.target as SimNode;
            if (src.type === 'company' || tgt.type === 'company') return 0.3;
            return 0.6;
          }),
      )
      .force(
        'charge',
        forceManyBody<SimNode>()
          .strength((d) => {
            if (d.type === 'company') return -800;
            if (d.type === 'sede') return -500;
            return -200;
          }),
      )
      .force('center', forceCenter(0, 0).strength(0.05))
      .force(
        'collide',
        forceCollide<SimNode>()
          .radius((d) => {
            if (d.type === 'company') return 100;
            if (d.type === 'sede') return 90;
            return 60;
          })
          .strength(0.7),
      )
      .force('x', forceX(0).strength(0.02))
      .force('y', forceY(0).strength(0.02))
      .alpha(1)
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    sim.on('tick', () => {
      const positions = new Map<string, { x: number; y: number }>();
      simNodes.forEach((sn) => {
        positions.set(sn.id, { x: sn.x ?? 0, y: sn.y ?? 0 });
      });
      onTick(positions);
    });

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges, onTick]);

  const fixNode = useCallback((id: string, x: number, y: number) => {
    const sn = simNodesRef.current.find((n) => n.id === id);
    if (sn) {
      sn.fx = x;
      sn.fy = y;
      simRef.current?.alpha(0.3).restart();
    }
  }, []);

  const releaseNode = useCallback((id: string) => {
    const sn = simNodesRef.current.find((n) => n.id === id);
    if (sn) {
      sn.fx = null;
      sn.fy = null;
    }
  }, []);

  return { fixNode, releaseNode };
}
