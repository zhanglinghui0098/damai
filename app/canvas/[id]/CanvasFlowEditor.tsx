'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// =====================================================================
// Phase 3.5 — 画布 chrome 1:1 恢复
// 06-30 07:00
//
// 把老 CanvasEditor.tsx 的 4 件套 (TopBar / "脉" logo / FloatingTools /
// ZoomControls) + 4 类操作 (contextmenu / 空白 / 拖拽 / onAdd) 1:1
// 移植到 React Flow 底层,保留老画布视觉/操作,只换底层架构。
//
// 关键差异 vs Phase 2:
// - 移除 React Flow 自带 MiniMap / Controls / Dots Background
// - 外层 div 加 radial-gradient 圆点 (背景 fixed 跟老画布一致)
// - 坐标转换用 useReactFlow().screenToFlowPosition (替代自研 scrollLeft)
// - 拖拽/pan/zoom 用 React Flow 内置 (替代自研 onMouseDown)
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

// FloatingTools 节点规格 (Chrome 1:1 移植自老 CanvasEditor.tsx)
const FLOATING_NODE_SPECS: Record<string, { label: string; iconChar: string }> = {
  text: { label: '文本', iconChar: '≡' },
  image: { label: '图片', iconChar: '▣' },
  'video-gen': { label: '视频', iconChar: '▶' },
  'audio-gen': { label: '音频', iconChar: '♪' },
  merge: { label: '合并', iconChar: '⊕' },
  output: { label: '成片', iconChar: '◉' },
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
// 3. VideoGenNode
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
// 4. AudioGenNode
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

// =====================================================================
// Chrome 4 件套 (1:1 移植自老 CanvasEditor.tsx)
// =====================================================================

// 顶部状态条
function TopBar({
  credits,
  savedAt,
  nodeCount,
  edgeCount,
  onTitleClick,
}: {
  credits: number;
  savedAt: Date | null;
  nodeCount: number;
  edgeCount: number;
  onTitleClick: () => void;
}) {
  const timeStr = savedAt
    ? savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';
  return (
    <div
      data-top-bar="1"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 50,
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={onTitleClick}
        title="返回首页"
        style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer' }}
      >
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff' }}>
          大脉
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
          {savedAt ? `已保存到云端 · ${timeStr}` : '编辑中…'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          data-top-bar="1"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 980,
            fontSize: '0.8125rem',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>◆</span>
          <span>{credits.toLocaleString()}</span>
        </div>
        <button
          data-top-bar="1"
          style={{
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 980,
            color: '#fff',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          社区
        </button>
        <button
          data-top-bar="1"
          style={{
            width: 32, height: 32,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⤴
        </button>
      </div>
    </div>
  );
}

// 左侧浮动工具栏
function FloatingTools({ onAdd }: { onAdd: (type: string, x: number, y: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      data-floating-tools="1"
      style={{
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 6,
        background: 'rgba(20,20,22,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        backdropFilter: 'blur(20px)',
        zIndex: 40,
        pointerEvents: 'auto',
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          data-floating-tools="1"
          onClick={() => setOpen(!open)}
          style={{
            width: 32, height: 32,
            background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: '1.125rem',
            fontWeight: 300,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
        {open && (
          <div
            data-floating-tools="1"
            style={{
              position: 'absolute',
              left: 'calc(100% + 8px)',
              top: 0,
              minWidth: 180,
              padding: 6,
              background: 'rgba(20,20,22,0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {Object.entries(FLOATING_NODE_SPECS).map(([type, spec]) => (
              <button
                key={type}
                data-floating-tools="1"
                onClick={(e) => {
                  // 用点击位置算 Flow 坐标 (React Flow 内部坐标系)
                  const rect = (e.currentTarget.closest('[data-canvas-region]') as HTMLElement)?.getBoundingClientRect();
                  const screenX = e.clientX - (rect?.left || 0);
                  const screenY = e.clientY - (rect?.top || 0);
                  // 暂时用 screen 坐标, 实际 onAdd 内部用 useReactFlow().screenToFlowPosition 转换
                  onAdd(type, screenX, screenY);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '0.8125rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 16, opacity: 0.6, fontSize: '0.875rem' }}>
                  {spec.iconChar}
                </span>
                <span>{spec.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 占位图标按钮 (跟老画布一致) */}
      {['📁', '📋', '💬'].map((emoji, i) => (
        <button
          key={i}
          data-floating-tools="1"
          style={{
            width: 32, height: 32,
            background: 'transparent',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
          }}
        >
          {emoji}
        </button>
      ))}
      <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px auto' }} />
      <button
        data-floating-tools="1"
        style={{
          width: 32, height: 32,
          background: 'transparent',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
      >
        N
      </button>
    </div>
  );
}

// Zoom 缩放控件 (1:1 移植, 替代 React Flow 自带 Controls)
function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const btnStyle: React.CSSProperties = {
    width: 28, height: 28,
    background: 'rgba(20,20,22,0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <div
      data-zoom-controls="1"
      style={{
        position: 'absolute',
        right: 16,
        bottom: 64,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 40,
        pointerEvents: 'auto',
      }}
    >
      <button onClick={onZoomIn} style={{ ...btnStyle, borderRadius: '8px 8px 0 0' }} title="放大">+</button>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <div style={{
        ...btnStyle,
        width: 28, height: 28,
        background: 'rgba(20,20,22,0.85)',
        fontSize: '0.6875rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.7)',
      }} onClick={onReset} title="重置">{Math.round(zoom * 100)}%</div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <button onClick={onZoomOut} style={{ ...btnStyle, borderRadius: '0 0 8px 8px' }} title="缩小">−</button>
    </div>
  );
}

// "脉" 圆形 logo (右下角浮按钮)
function PulseLogo({ onClick }: { onClick: () => void }) {
  return (
    <div
      data-logo="1"
      onClick={onClick}
      title="打开大脉 AI 助手"
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 36, height: 36,
        borderRadius: 18,
        background: 'linear-gradient(135deg, #6e8cd6, #5a7fbf)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: 700,
        cursor: 'pointer',
        zIndex: 40,
        pointerEvents: 'auto',
      }}
    >
      脉
    </div>
  );
}

// =====================================================================
// 主画布 (Phase 3.5)
// =====================================================================
export default function CanvasFlowEditor({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlowEditorInner projectId={projectId} />
    </ReactFlowProvider>
  );
}

function CanvasFlowEditorInner({ projectId }: { projectId: string }) {
  const storageKey = useMemo(() => `damai:canvas-v2:${projectId}`, [projectId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [credits] = useState(1000);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const { screenToFlowPosition, zoomIn, zoomOut, setViewport, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(1);

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

  // 保存 localStorage (debounced) + 更新 savedAt
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey + ':nodes', JSON.stringify(nodes));
        localStorage.setItem(storageKey + ':edges', JSON.stringify(edges));
        setSavedAt(new Date());
      } catch (e) {
        console.warn('localStorage save failed', e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, edges, storageKey]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      console.log('[canvas-v2] onConnect:', JSON.stringify(connection));
      setEdges((eds) => {
        const newEdges = addEdge({ ...connection, type: 'bezier' }, eds);
        console.log('[canvas-v2] onConnect -> edges:', eds.length, '->', newEdges.length);
        return newEdges;
      });
    },
    [setEdges]
  );

  // 监听 edges 变化 (调试连接消失)
  const handleEdgesChange = useCallback(
    (changes: any) => {
      console.log('[canvas-v2] onEdgesChange ALL:', JSON.stringify(changes));
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // 调试: 每次 edges 变化时 log
  useEffect(() => {
    console.log('[canvas-v2] edges render:', edges.length, 'ids:', edges.map(e => e.id));
  }, [edges]);

  // FloatingTools 添加节点: 用 screenToFlowPosition 精准坐标
  const handleAdd = useCallback((type: string, screenX: number, screenY: number) => {
    // screenX/Y 是相对 canvas-region 的坐标, 加 canvas-region 位置拿绝对 screen 坐标
    const region = document.querySelector('[data-canvas-region]') as HTMLElement;
    if (!region) return;
    const rect = region.getBoundingClientRect();
    const pos = screenToFlowPosition({
      x: rect.left + screenX,
      y: rect.top + screenY,
    });
    const newId = `n${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type,
        position: pos,
        data: { text: type === 'text' ? '新节点' : '' },
      },
    ]);
  }, [screenToFlowPosition, setNodes]);

  // 双击空白创建节点
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newId = `n${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type: 'text',
          position: pos,
          data: { text: '新节点' },
        },
      ]);
    },
    [screenToFlowPosition, setNodes]
  );

  // 阻止右键菜单 (chrome 1:1)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 同步 zoom 状态 (给 ZoomControls 显示)
  useEffect(() => {
    const interval = setInterval(() => {
      const z = getZoom();
      setZoom((prev) => (Math.abs(prev - z) > 0.001 ? z : prev));
    }, 100);
    return () => clearInterval(interval);
  }, [getZoom]);

  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleZoomReset = useCallback(() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 }), [setViewport]);

  // 返回首页
  const goHome = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/';
  }, []);

  // AI 助手 (暂 console.log, 后续接 API)
  const goAgent = useCallback(() => {
    console.log('[damai] goAgent 暂未实现');
  }, []);

  return (
    <div
      data-canvas="1"
      onContextMenu={handleContextMenu}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        overflow: 'hidden',
      }}
    >
      {/* 画布区域 (top:56 留 TopBar 位置) */}
      <div
        data-canvas-region="1"
        style={{
          position: 'absolute',
          top: 56, left: 0, right: 0, bottom: 0,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDoubleClick={onPaneDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'bezier', style: { stroke: '#6e8cd6', strokeWidth: 2 } }}
        />
      </div>

      {/* Chrome 4 件套 (1:1 移植) */}
      <TopBar
        credits={credits}
        savedAt={savedAt}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        onTitleClick={goHome}
      />
      <FloatingTools onAdd={handleAdd} />
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleZoomReset}
      />
      <PulseLogo onClick={goAgent} />
    </div>
  );
}
