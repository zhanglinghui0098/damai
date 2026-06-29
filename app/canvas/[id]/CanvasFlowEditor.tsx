'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// =====================================================================
// Phase 1 scaffold — 06-30 01:00
// 只验证 React Flow 集成 + 路由可达, 节点/边具体逻辑在 Phase 2 实现
// =====================================================================

// 6 个 placeholder node type (Phase 2 替换成完整组件)
function TextNode({ data }: { data: { label?: string } }) {
  return (
    <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>
      <div style={{ fontSize: 11, color: '#6e8cd6' }}>text</div>
      <div>{data?.label || 'TextNode'}</div>
    </div>
  );
}
function ImageNode() { return <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>image</div>; }
function VideoGenNode() { return <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>video-gen</div>; }
function AudioGenNode() { return <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>audio-gen</div>; }
function MergeNode() { return <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>merge</div>; }
function OutputNode() { return <div style={{ padding: 12, background: '#1a1a1a', border: '1px solid #6e8cd6', borderRadius: 6, color: '#fff', minWidth: 120 }}>output</div>; }

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
  merge: MergeNode,
  output: OutputNode,
};

const initialNodes: Node[] = [
  { id: '1', type: 'text', position: { x: 0, y: 0 }, data: { label: 'Scaffold' } },
  { id: '2', type: 'output', position: { x: 0, y: 200 }, data: { label: 'Output' } },
];
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'bezier' },
];

export default function CanvasFlowEditor({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlowEditorInner projectId={projectId} />
    </ReactFlowProvider>
  );
}

function CanvasFlowEditorInner({ projectId }: { projectId: string }) {
  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    // Phase 2: 接 setNodes + localStorage
  }, []);
  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    // Phase 2: 接 setEdges + localStorage
  }, []);
  const onConnect: OnConnect = useCallback((connection: Connection) => {
    // Phase 2: addEdge(connection)
  }, []);

  return (
    <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#0a0a0a' }} data-testid="canvas-flow-editor">
      <div style={{ position: 'absolute', top: 8, left: 8, color: '#6e8cd6', fontSize: 12, fontFamily: 'monospace', zIndex: 10 }}>
        CanvasFlowEditor scaffold · project {projectId} · @xyflow/react v12
      </div>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="#1a1a1a" />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
