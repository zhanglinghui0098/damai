'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// =====================================================================
// Phase 2.1 — 6 节点类型真实组件
// 06-30 02:50
// =====================================================================

// 共享样式
const NODE_BG = '#1a1a1a';
const NODE_BORDER = 'rgba(110, 140, 214, 0.5)';
const NODE_BORDER_SELECTED = '#6e8cd6';
const HEADER_BG = 'rgba(110, 140, 214, 0.15)';
const PORT_BG = '#6e8cd6';

const baseNodeStyle: React.CSSProperties = {
  background: NODE_BG,
  border: `1px solid ${NODE_BORDER}`,
  borderRadius: 8,
  color: '#fff',
  minWidth: 180,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const headerStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: HEADER_BG,
  color: '#6e8cd6',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  borderBottom: `1px solid ${NODE_BORDER}`,
};

const bodyStyle: React.CSSProperties = {
  padding: 10,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.85)',
};

// 节点图标
const NodeIcon = ({ type }: { type: string }) => {
  const iconStyle: React.CSSProperties = { fontSize: 14, color: '#6e8cd6' };
  switch (type) {
    case 'text': return <span style={iconStyle}>≡</span>;
    case 'image': return <span style={iconStyle}>▣</span>;
    case 'video-gen': return <span style={iconStyle}>▶</span>;
    case 'audio-gen': return <span style={iconStyle}>♪</span>;
    case 'merge': return <span style={iconStyle}>⊕</span>;
    case 'output': return <span style={iconStyle}>◉</span>;
    default: return null;
  }
};

// 输入端口 (左)
function InputHandle({ selected }: { selected?: boolean }) {
  return (
    <Handle
      type="target"
      position={Position.Left}
      style={{
        background: PORT_BG,
        width: 10,
        height: 10,
        border: selected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)',
      }}
    />
  );
}

// 输出端口 (右)
function OutputHandle({ selected }: { selected?: boolean }) {
  return (
    <Handle
      type="source"
      position={Position.Right}
      style={{
        background: PORT_BG,
        width: 10,
        height: 10,
        border: selected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)',
      }}
    />
  );
}

// 节点类型标签
const TYPE_LABELS: Record<string, string> = {
  text: '文字',
  image: '图片',
  'video-gen': '视频生成',
  'audio-gen': '音频生成',
  merge: '合并',
  output: '成片输出',
};

// ---------------------------------------------------------------------
// 1. TextNode
// ---------------------------------------------------------------------
type TextNodeData = { text?: string; label?: string };
function TextNode({ data, selected }: NodeProps<Node<TextNodeData>>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1 }}>
      <InputHandle selected={selected} />
      <OutputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="text" />
        {TYPE_LABELS.text}
      </div>
      <div style={bodyStyle}>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setEditing(false)}
            style={{
              width: '100%', minHeight: 60, background: 'rgba(0,0,0,0.3)',
              color: '#fff', border: '1px solid rgba(110,140,214,0.3)',
              borderRadius: 4, padding: 6, fontSize: 12, fontFamily: 'inherit',
              resize: 'none',
            }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{ minHeight: 24, cursor: 'text', color: text ? 'inherit' : 'rgba(255,255,255,0.4)' }}
          >
            {text || '点击输入文字...'}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 2. ImageNode
// ---------------------------------------------------------------------
type ImageNodeData = { url?: string; prompt?: string; label?: string };
function ImageNode({ data, selected }: NodeProps<Node<ImageNodeData>>) {
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1 }}>
      <InputHandle selected={selected} />
      <OutputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="image" />
        {TYPE_LABELS.image}
      </div>
      <div style={bodyStyle}>
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.url} alt="" style={{ width: '100%', borderRadius: 4, display: 'block' }} />
        ) : (
          <div style={{
            height: 80,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
          }}>
            待生成 / 上传图片
          </div>
        )}
        {data.prompt && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {data.prompt.slice(0, 40)}{data.prompt.length > 40 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. VideoGenNode (video-gen)
// ---------------------------------------------------------------------
type VideoGenData = { prompt?: string; status?: 'idle' | 'generating' | 'done'; url?: string; label?: string };
function VideoGenNode({ data, selected }: NodeProps<Node<VideoGenData>>) {
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1 }}>
      <InputHandle selected={selected} />
      <OutputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="video-gen" />
        {TYPE_LABELS['video-gen']}
      </div>
      <div style={bodyStyle}>
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <video src={data.url} controls style={{ width: '100%', borderRadius: 4, display: 'block' }} />
        ) : data.status === 'generating' ? (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e8cd6' }}>
            生成中...
          </div>
        ) : (
          <div style={{
            height: 80,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
          }}>
            待生成视频
          </div>
        )}
        {data.prompt && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {data.prompt.slice(0, 50)}{data.prompt.length > 50 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 4. AudioGenNode (audio-gen)
// ---------------------------------------------------------------------
type AudioGenData = { prompt?: string; status?: 'idle' | 'generating' | 'done'; url?: string; label?: string };
function AudioGenNode({ data, selected }: NodeProps<Node<AudioGenData>>) {
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1 }}>
      <InputHandle selected={selected} />
      <OutputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="audio-gen" />
        {TYPE_LABELS['audio-gen']}
      </div>
      <div style={bodyStyle}>
        {data.url ? (
          <audio src={data.url} controls style={{ width: '100%' }} />
        ) : data.status === 'generating' ? (
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e8cd6' }}>
            生成中...
          </div>
        ) : (
          <div style={{
            height: 50,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
          }}>
            待生成音频
          </div>
        )}
        {data.prompt && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {data.prompt.slice(0, 50)}{data.prompt.length > 50 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 5. MergeNode
// ---------------------------------------------------------------------
type MergeData = { inputs?: number; label?: string };
function MergeNode({ data, selected }: NodeProps<Node<MergeData>>) {
  const inputCount = data.inputs || 2;
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1 }}>
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          id={`in-${i}`}
          style={{
            background: PORT_BG,
            width: 10,
            height: 10,
            top: `${30 + i * 25}%`,
            border: selected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)',
          }}
        />
      ))}
      <OutputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="merge" />
        {TYPE_LABELS.merge} ({inputCount} 输入)
      </div>
      <div style={bodyStyle}>
        <div style={{
          height: 60,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          border: '1px dashed rgba(110,140,214,0.3)',
        }}>
          合并 {inputCount} 路输入
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 6. OutputNode
// ---------------------------------------------------------------------
type OutputData = { url?: string; status?: 'idle' | 'composing' | 'done'; label?: string };
function OutputNode({ data, selected }: NodeProps<Node<OutputData>>) {
  return (
    <div style={{ ...baseNodeStyle, borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER, borderWidth: selected ? 2 : 1, minWidth: 220 }}>
      <InputHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="output" />
        {TYPE_LABELS.output}
      </div>
      <div style={bodyStyle}>
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <video src={data.url} controls style={{ width: '100%', borderRadius: 4, display: 'block' }} />
        ) : data.status === 'composing' ? (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e8cd6' }}>
            合成中...
          </div>
        ) : (
          <div style={{
            height: 100,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
          }}>
            待合成成片
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
  merge: MergeNode,
  output: OutputNode,
};

// 初始 demo 节点 (Phase 2.4 用真实案例模板替换)
const initialNodes: Node[] = [
  { id: '1', type: 'text', position: { x: 100, y: 100 }, data: { text: '现代极简客厅, 大理石地板, 自然光' } },
  { id: '2', type: 'image', position: { x: 380, y: 100 }, data: { prompt: 'modern minimalist living room' } },
  { id: '3', type: 'video-gen', position: { x: 660, y: 100 }, data: { prompt: 'walkthrough shot' } },
  { id: '4', type: 'audio-gen', position: { x: 380, y: 320 }, data: { prompt: 'calm ambient music' } },
  { id: '5', type: 'merge', position: { x: 940, y: 200 }, data: { inputs: 2 } },
  { id: '6', type: 'output', position: { x: 1220, y: 200 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'bezier' },
  { id: 'e2-3', source: '2', target: '3', type: 'bezier' },
  { id: 'e4-5', source: '4', target: '5', type: 'bezier' },
  { id: 'e3-5', source: '3', target: '5', type: 'bezier' },
  { id: 'e5-6', source: '5', target: '6', type: 'bezier' },
];

export default function CanvasFlowEditor({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlowEditorInner projectId={projectId} />
    </ReactFlowProvider>
  );
}

function CanvasFlowEditorInner({ projectId }: { projectId: string }) {
  // Phase 2.3: localStorage 持久化
  const storageKey = useMemo(() => `damai:canvas-v2:${projectId}`, [projectId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 加载 localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey + ':nodes');
      if (raw) setNodes(JSON.parse(raw));
      const rawE = localStorage.getItem(storageKey + ':edges');
      if (rawE) setEdges(JSON.parse(rawE));
    } catch (e) {
      console.warn('localStorage load failed', e);
    }
  }, [storageKey, setNodes, setEdges]);

  // 保存 localStorage (debounced via microtask)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey + ':nodes', JSON.stringify(nodes));
        localStorage.setItem(storageKey + ':edges', JSON.stringify(edges));
      } catch (e) {
        console.warn('localStorage save failed', e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, edges, storageKey]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'bezier' }, eds)),
    [setEdges]
  );

  // Phase 2.5: 双击空白创建节点
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // 用 viewport 计算位置 — React Flow 自动处理坐标转换
      const target = event.target as HTMLElement;
      const rect = target.closest('.react-flow__pane')?.getBoundingClientRect();
      if (!rect) return;
      // 简单算法: 在 pane 中心 + 一些偏移 (Phase 3 改成精准坐标)
      const newId = `n${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type: 'text',
          position: { x: event.clientX - rect.left - 90, y: event.clientY - rect.top - 40 },
          data: { text: '新节点' },
        },
      ]);
    },
    [setNodes]
  );

  return (
    <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#0a0a0a' }} data-testid="canvas-flow-editor">
      <div style={{ position: 'absolute', top: 8, left: 8, color: '#6e8cd6', fontSize: 12, fontFamily: 'monospace', zIndex: 10 }}>
        CanvasFlowEditor · {projectId} · {nodes.length} nodes · {edges.length} edges · @xyflow/react v12
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDoubleClick={onPaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'bezier', style: { stroke: '#6e8cd6', strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="rgba(110, 140, 214, 0.1)" />
        <Controls />
        <MiniMap pannable zoomable nodeColor="#6e8cd6" maskColor="rgba(10,10,10,0.7)" />
      </ReactFlow>
    </div>
  );
}
