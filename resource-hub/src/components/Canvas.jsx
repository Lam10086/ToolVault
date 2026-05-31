import React, { useContext, useMemo } from 'react';
import { DBContext } from '../context/DBContext';
import { ReactFlow, MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Canvas component renders resources as draggable nodes using React Flow.
 * Positions are generated lazily on first render.
 */
export const Canvas = () => {
  const { resources } = useContext(DBContext);

  // Convert resources to React Flow nodes
  const nodes = useMemo(() => {
    return resources.map((res, idx) => ({
      id: `${res.id}`,
      data: { label: res.title },
      position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 120 },
      style: { border: '1px solid var(--tw-shadow-color)', padding: '8px', borderRadius: '4px', background: 'var(--tw-bg-opacity)' },
    }));
  }, [resources]);

  const edges = []; // No edges needed for now

  return (
    <div className="h-full w-full bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
