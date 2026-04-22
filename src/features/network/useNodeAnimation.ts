import { useState, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';

export function useNodeAnimation(nodes: Node[]): Set<string> {
  const [animatedNodes, setAnimatedNodes] = useState<Set<string>>(new Set());
  const nodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(nodes.map(n => n.id));
    const newNodeIds = nodes
      .map(n => n.id)
      .filter(id => !nodeIdsRef.current.has(id));

    if (newNodeIds.length > 0) {
      // Sort: empresa first, then sedes, then permisos
      const sortedNew = newNodeIds.sort((a, b) => {
        if (a === 'company') return -1;
        if (b === 'company') return 1;

        const aNode = nodes.find(n => n.id === a);
        const bNode = nodes.find(n => n.id === b);

        if (aNode?.type === 'sede' && bNode?.type === 'permit') return -1;
        if (aNode?.type === 'permit' && bNode?.type === 'sede') return 1;

        return 0;
      });

      // Stagger animation: 50ms delay between each node
      const timers: ReturnType<typeof setTimeout>[] = [];
      sortedNew.forEach((id, index) => {
        const timer = setTimeout(() => {
          setAnimatedNodes(prev => new Set([...prev, id]));
        }, index * 50);
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }

    nodeIdsRef.current = currentIds;
  }, [nodes]);

  return animatedNodes;
}
