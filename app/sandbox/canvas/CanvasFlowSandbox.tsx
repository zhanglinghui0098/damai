// =====================================================================
// CanvasFlowSandbox.tsx — 大脉画布 v2 sandbox
// 07-02: 新加路由 /sandbox/canvas, 完全不动 /canvas/[id]
// - 范围 C: 不接 production API, localStorage 存 (key: damai:canvas-v2:r2:sandbox)
// - 保留 07-01 修复: 蓝紫 edge (0.85 + 2.5px) + ssr:false (在 page.tsx)
// - 5 个低风险改动 (跟 prototype 1:1):
//   1) 拖线到空白弹菜单 (onConnectEnd)
//   2) 新建节点放鼠标位置 (screenToFlowPosition)
//   3) save strip measured
//   4) edge type 'selfDrawn' (重命名)
//   5) useUpstreamUrls 自动 i2i
// =====================================================================

'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useConnection,
  ConnectionMode,
  MarkerType,
  MiniMap,
  useStore,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  NodeProps,
  EdgeProps,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './CanvasFlowSandbox.module.css';

// ====================================================================
// 节点类型常量
// ====================================================================
const NODE_TYPES = ['text', 'image', 'video-gen', 'audio-gen', 'merge', 'output'] as const;
type NodeType = typeof NODE_TYPES[number];

const NODE_LABELS: Record<NodeType, string> = {
  text: '文字',
  image: '图片',
  'video-gen': '视频生成',
  'audio-gen': '音频生成',
  merge: '合并',
  output: '成片输出',
};

const NODE_ICONS: Record<NodeType, string> = {
  text: '≡',
  image: '▣',
  'video-gen': '▶',
  'audio-gen': '♪',
  merge: '⊕',
  output: '◉',
};

// AI 模型 / 比例 / 画质 / 时长 / 音频类型 — 跟生产代码一致
const AI_MODELS = {
  text: [
    { id: 'deepseek', label: 'DeepSeek V3', cost: 1 },
    { id: 'gemini', label: 'Gemini 2.5', cost: 4 },
    { id: 'claude', label: 'Claude 4.5', cost: 4 },
  ],
  image: [
    { id: 'jimeng', label: '即梦', cost: 8 },
    { id: 'nano', label: 'Nano Banana', cost: 12 },
  ],
  'video-gen': [
    { id: 'seedance', label: 'Seedance 2.0', cost: 8 },
    { id: 'wan', label: 'Wan 2.6', cost: 12 },
    { id: 'kling', label: '可灵', cost: 16 },
  ],
  'audio-gen': [
    { id: 'music2', label: 'MiniMax Music 2.6', cost: 25 },
    { id: 'tts', label: 'MiniMax TTS', cost: 6 },
  ],
};
const ASPECTS = ['自适应', '16:9', '9:16', '1:1'];
const QUALITIES = ['1K', '2K', '4K'];
const DURATIONS = [4, 5, 8, 10, 15];
const AUDIO_TYPES = ['音乐', '歌词', '自适应', '纯音乐'];
const QUANTITIES = [1, 2, 4];

// ====================================================================
// 共享 UI 组件
// ====================================================================

function ModelChip({
  models,
  value,
  onChange,
}: {
  models: { id: string; label: string; cost: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = models.find((m) => m.id === value) || models[0];
  return (
    <div
      className={styles.modelChip}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button className={styles.modelChipBtn} onClick={() => setOpen(!open)}>
        <span>✦ </span>
        {current.label}
        <span style={{ opacity: 0.6, marginLeft: 4 }}>·{current.cost}</span>
      </button>
      {open && (
        <div className={styles.modelChipMenu}>
          {models.map((m) => (
            <button
              key={m.id}
              className={m.id === current.id ? styles.active : ''}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              <span>{m.label}</span>
              <span style={{ opacity: 0.6 }}>·{m.cost}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onChange,
  prefix,
}: {
  options: (string | number)[];
  value: string | number;
  onChange: (v: any) => void;
  prefix?: string;
}) {
  return (
    <div
      className={styles.chipRow}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {options.map((o) => {
        const label = String(o);
        const active = label === String(value);
        return (
          <button
            key={label}
            className={active ? styles.active : ''}
            onClick={() => onChange(o)}
          >
            {prefix && <span className={styles.prefix}>{prefix}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}

function RunButton({
  cost,
  status,
  onRun,
}: {
  cost: number;
  status?: 'idle' | 'running' | 'done' | 'error';
  onRun?: () => void;
}) {
  const running = status === 'running';
  const isError = status === 'error';
  const isDone = status === 'done';
  return (
    <div
      className={styles.runRow}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isError && <div className={`${styles.status} ${styles.error}`}>⚠ 调用失败</div>}
      {isDone && <div className={`${styles.status} ${styles.done}`}>✓ 已生成</div>}
      {!isError && !isDone && (
        <div className={styles.costPill}>
          <span className={styles.gem}>◆</span>
          <span style={{ fontWeight: 500 }}>{cost}</span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button
        className={`${styles.runBtn} ${running ? styles.running : ''} ${isDone ? styles.done : ''} ${isError ? styles.error : ''}`}
        disabled={running}
        onClick={onRun}
        title={running ? '运行中...' : isDone ? '重新运行' : isError ? '重试' : '运行'}
      >
        {running ? '⏳' : isDone ? '↻' : isError ? '↻' : '↑'}
      </button>
    </div>
  );
}

function NodeTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder || '描述你想要生成的内容…'}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        color: '#fff',
        border: 'none',
        outline: 'none',
        resize: 'none',
        fontSize: 12,
        fontFamily: 'inherit',
        lineHeight: 1.4,
        padding: 0,
      }}
    />
  );
}

// ====================================================================
// 自定义 hooks
// ====================================================================

// useUpstreamUrls: 找 nodeId 上游的所有 image node 的 url
function useUpstreamUrls(
  nodeId: string,
  edges: Edge[],
  nodes: Node[],
): string[] {
  return useMemo(() => {
    if (!nodeId) return [];
    const urls: string[] = [];
    edges.forEach((e) => {
      if (e.target === nodeId) {
        const src = nodes.find((n) => n.id === e.source);
        if (src && src.type === 'image' && (src.data as any)?.url) {
          urls.push((src.data as any).url);
        }
      }
    });
    return urls;
  }, [nodeId, edges, nodes]);
}

// ====================================================================
// 自定义节点
// ====================================================================

type BaseNodeData = {
  text?: string;
  model?: string;
  aspect?: string;
  quality?: string;
  duration?: number;
  audioType?: string;
  quantity?: number;
  inputs?: number;
  url?: string;
  prompt?: string;
};

function BaseNode({
  id,
  data,
  selected,
  type,
  topSection,
  mainContent,
  bottomSection,
  showPorts = true,
  mainClass = '',
}: {
  id: string;
  data: BaseNodeData;
  selected: boolean;
  type: NodeType;
  topSection?: React.ReactNode;
  mainContent: React.ReactNode;
  bottomSection?: React.ReactNode;
  showPorts?: boolean;
  mainClass?: string;
}) {
  // useConnection: 监听当前连接状态 (drag-connect 核心)
  const connection = useConnection();
  const isTarget = connection.inProgress && (connection.fromNode?.id !== id);

  return (
    <div className={styles.scaffold}>
      {selected && topSection}
      <div
        className={`${styles.node} ${styles.main} ${mainClass ? styles[mainClass] || '' : ''} ${selected ? styles.selected : ''} ${isTarget ? styles.isTarget : ''}`}
      >
        <div className={styles.nodeHeader}>
          <span className={styles.icon}>{NODE_ICONS[type] || '?'}</span>
          {NODE_LABELS[type] || type}
        </div>
        <div className={styles.nodeBody}>{mainContent}</div>
        {showPorts && (
          <Handle
            type="source"
            id="left"
            position={Position.Left}
            isConnectableStart
            isConnectableEnd
            className={`${styles.handle} ${isTarget ? styles.isTarget : ''}`}
            style={{ left: -32 }}
          >
            +
          </Handle>
        )}
        {showPorts && (
          <Handle
            type="source"
            id="right"
            position={Position.Right}
            isConnectableStart
            isConnectableEnd
            className={`${styles.handle} ${isTarget ? styles.isTarget : ''}`}
            style={{ right: -32 }}
          >
            +
          </Handle>
        )}
      </div>
      {selected && bottomSection}
    </div>
  );
}

function TextNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  const [text, setText] = useState(d.text || '');
  const [model, setModel] = useState(d.model || 'deepseek');
  const [quantity, setQuantity] = useState(d.quantity || 1);
  const modelInfo = AI_MODELS.text.find((m) => m.id === model) || AI_MODELS.text[0];
  return (
    <BaseNode
      id={id}
      data={d}
      selected={!!selected}
      type="text"
      mainClass="text"
      mainContent={
        <NodeTextarea value={text} onChange={setText} rows={4} />
      }
      bottomSection={
        <div className={styles.bottomSection}>
          <div className={styles.toolRow}>
            <div className={styles.leftTools}>
              <button className={styles.toolBtn} title="AI 优化">✨</button>
              <button className={styles.toolBtn} title="预设">+</button>
            </div>
            <button className={styles.toolBtn} title="展开">↗</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ModelChip models={AI_MODELS.text} value={model} onChange={setModel} />
            <ChipRow options={QUANTITIES} value={quantity} onChange={setQuantity} prefix="×" />
          </div>
          <RunButton cost={modelInfo.cost * quantity} />
        </div>
      }
    />
  );
}

function ImageNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  // useStore 拿 store 里的 nodes + edges
  const storeNodes = useStore((s) => s.nodes);
  const storeEdges = useStore((s) => s.edges);
  const upstreamUrls = useUpstreamUrls(id, storeEdges, storeNodes);
  const i2i = upstreamUrls.length > 0;
  const [model, setModel] = useState(d.model || 'jimeng');
  const [aspect, setAspect] = useState(d.aspect || '自适应');
  const [quality, setQuality] = useState(d.quality || '2K');
  const [quantity, setQuantity] = useState(d.quantity || 1);
  const modelInfo = AI_MODELS.image.find((m) => m.id === model) || AI_MODELS.image[0];
  return (
    <BaseNode
      id={id}
      data={d}
      selected={!!selected}
      type="image"
      mainClass="image"
      topSection={
        <div className={styles.topSection}>
          <button className={styles.uploadBtn} title="本地上传">↑ 上传</button>
        </div>
      }
      mainContent={
        <>
          {i2i && (
            <div className={styles.i2iBadge}>
              🔗 i2i 模式・{upstreamUrls.length} 张参考图
            </div>
          )}
          {d.url ? (
            <img
              src={d.url}
              style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6 }}
              alt=""
            />
          ) : (
            <div className={styles.placeholder}>
              {i2i ? 'i2i 模式 (用上游图当参考)' : '🖼 待生成 / 上传图片'}
            </div>
          )}
        </>
      }
      bottomSection={
        <div className={styles.bottomSection}>
          <div className={styles.toolRow}>
            <div className={styles.leftTools}>
              <button className={styles.toolBtn} title="AI 优化">✨</button>
              <button className={styles.toolBtn} title="预设">+</button>
            </div>
            <button className={styles.toolBtn} title="展开">↗</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ModelChip models={AI_MODELS.image} value={model} onChange={setModel} />
            <ChipRow options={ASPECTS} value={aspect} onChange={setAspect} />
            <ChipRow options={QUALITIES} value={quality} onChange={setQuality} />
            <ChipRow options={QUANTITIES} value={quantity} onChange={setQuantity} prefix="×" />
            {i2i && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                <span style={{ fontSize: 11, color: '#4ade80' }}>🔗</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  i2i 模式 自动开启 · {upstreamUrls.length} 张参考图
                </span>
              </div>
            )}
          </div>
          <RunButton cost={modelInfo.cost * quantity} />
        </div>
      }
    />
  );
}

function VideoGenNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  const [model, setModel] = useState(d.model || 'seedance');
  const [duration, setDuration] = useState(d.duration || 5);
  const [aspect, setAspect] = useState(d.aspect || '16:9');
  const [quality, setQuality] = useState(d.quality || '2K');
  const [quantity, setQuantity] = useState(d.quantity || 1);
  const modelInfo = AI_MODELS['video-gen'].find((m) => m.id === model) || AI_MODELS['video-gen'][0];
  return (
    <BaseNode
      id={id}
      data={d}
      selected={!!selected}
      type="video-gen"
      mainClass="video"
      mainContent={<div className={styles.placeholder}>▶ 待生成视频</div>}
      bottomSection={
        <div className={styles.bottomSection}>
          <div className={styles.toolRow}>
            <div className={styles.leftTools}>
              <button className={styles.toolBtn} title="AI 优化">✨</button>
              <button className={styles.toolBtn} title="预设">+</button>
            </div>
            <button className={styles.toolBtn} title="展开">↗</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ModelChip models={AI_MODELS['video-gen']} value={model} onChange={setModel} />
            <ChipRow options={DURATIONS} value={duration} onChange={setDuration} />
            <ChipRow options={ASPECTS} value={aspect} onChange={setAspect} />
            <ChipRow options={QUALITIES} value={quality} onChange={setQuality} />
            <ChipRow options={QUANTITIES} value={quantity} onChange={setQuantity} prefix="×" />
          </div>
          <RunButton cost={modelInfo.cost * quantity} />
        </div>
      }
    />
  );
}

function AudioGenNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  const [model, setModel] = useState(d.model || 'music2');
  const [audioType, setAudioType] = useState(d.audioType || '纯音乐');
  const modelInfo = AI_MODELS['audio-gen'].find((m) => m.id === model) || AI_MODELS['audio-gen'][0];
  return (
    <BaseNode
      id={id}
      data={d}
      selected={!!selected}
      type="audio-gen"
      mainClass="audio"
      mainContent={<div className={styles.placeholder}>♪ 待生成音频</div>}
      bottomSection={
        <div className={styles.bottomSection}>
          <div className={styles.toolRow}>
            <div className={styles.leftTools}>
              <button className={styles.toolBtn} title="AI 优化">✨</button>
              <button className={styles.toolBtn} title="预设">+</button>
            </div>
            <button className={styles.toolBtn} title="展开">↗</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ModelChip models={AI_MODELS['audio-gen']} value={model} onChange={setModel} />
            <ChipRow options={AUDIO_TYPES} value={audioType} onChange={setAudioType} />
          </div>
          <RunButton cost={modelInfo.cost} />
        </div>
      }
    />
  );
}

function MergeNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  const [inputs, setInputs] = useState(d.inputs || 2);
  // N 个左 handle 垂直排列
  const inputHandles = Array.from({ length: inputs }).map((_, i) => (
    <Handle
      key={`in-${i}`}
      type="source"
      id={`in-${i}`}
      position={Position.Left}
      isConnectableStart
      isConnectableEnd
      className={`${styles.handle} ${styles.handleMerge}`}
      style={{ top: 20 + i * 18, left: -32, width: 18, height: 18, fontSize: 12 }}
    />
  ));
  return (
    <div className={styles.scaffold}>
      <div className={`${styles.node} ${styles.main} ${styles.merge} ${selected ? styles.selected : ''}`}>
        <div className={styles.nodeHeader}>
          <span className={styles.icon}>⊕</span>
          合并
        </div>
        <div className={styles.nodeBody}>
          <div className={styles.placeholder}>合并 {inputs} 路输入</div>
        </div>
        {inputHandles}
        <Handle
          type="source"
          id="right"
          position={Position.Right}
          isConnectableStart
          isConnectableEnd
          className={styles.handle}
          style={{ right: -32 }}
        >
          +
        </Handle>
      </div>
      {selected && (
        <div className={styles.bottomSection}>
          <div className={styles.toolRow}>
            <div className={styles.leftTools}>
              <button className={styles.toolBtn} title="AI 优化">✨</button>
            </div>
            <button className={styles.toolBtn} title="展开">↗</button>
          </div>
          <ChipRow options={[2, 3, 4, 5]} value={inputs} onChange={setInputs} prefix="×" />
        </div>
      )}
    </div>
  );
}

function OutputNode({ id, data, selected }: NodeProps) {
  const d = data as BaseNodeData;
  return (
    <BaseNode
      id={id}
      data={d}
      selected={!!selected}
      type="output"
      showPorts={false}
      mainClass="video"
      mainContent={<div className={styles.placeholder}>◉ 成片输出</div>}
    />
  );
}

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
  merge: MergeNode,
  output: OutputNode,
};

// ====================================================================
// Edge 渲染: 自定义 edge 带剪刀按钮
// ====================================================================

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + (targetX - sourceX) / 2} ${sourceY}, ${sourceX + (targetX - sourceX) / 2} ${targetY}, ${targetX} ${targetY}`;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return (
    <g
      className={`${styles.edge} ${selected ? styles.selected : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <path
        className="react-flow__edge-path"
        d={edgePath}
        style={{ fill: 'none' }}
        data-id={id}
      />
      {hovered && (
        <foreignObject
          x={midX - 11}
          y={midY - 11}
          width={22}
          height={22}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            className={styles.edgeCutBtn}
            onClick={(e) => {
              e.stopPropagation();
              (data as any)?.onCut?.(id);
            }}
            title="剪断此连接"
          >
            ✂
          </div>
        </foreignObject>
      )}
    </g>
  );
}

const edgeTypes = { selfDrawn: CustomEdge };

// ====================================================================
// 拖拽中的候选线 (ConnectionLine)
// ====================================================================
function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionStatus: 'valid' | 'invalid' | null;
}) {
  const isInvalid = connectionStatus === 'invalid';
  const stroke = isInvalid
    ? 'rgba(255,90,90,0.85)'
    : 'rgba(160,200,255,0.9)';
  const strokeWidth = 2.5;
  const dashArray = '6 4';
  const pathD = `M ${fromX} ${fromY} C ${fromX + (toX - fromX) / 2} ${fromY}, ${fromX + (toX - fromX) / 2} ${toY}, ${toX} ${toY}`;
  return (
    <g>
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        d={pathD}
        style={{ pointerEvents: 'none' }}
      />
      <circle
        cx={fromX}
        cy={fromY}
        r={5}
        fill="#6e8cd6"
        stroke="#0a0a0a"
        strokeWidth={1.5}
        style={{ pointerEvents: 'none' }}
      />
      <circle
        cx={toX}
        cy={toY}
        r={5}
        fill={isInvalid ? 'rgba(110,140,214,0.5)' : '#6e8cd6'}
        stroke="#0a0a0a"
        strokeWidth={1.5}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}

// ====================================================================
// 外层 App: 套 ReactFlowProvider (useReactFlow 必须在里面)
// ====================================================================
export default function App() {
  return (
    <ReactFlowProvider>
      <CanvasApp />
    </ReactFlowProvider>
  );
}

function CanvasApp() {
  // localStorage 加载 (跟生产一致, key: damai:canvas-v2:r2:sandbox)
  const STORAGE_KEY = 'damai:canvas-v2:r2:sandbox';
  const loadFromStorage = (): { nodes: Node[]; edges: Edge[] } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.nodes && parsed.edges) {
          // migration: 旧 type='default' → 'selfDrawn'
          const edges = parsed.edges.map((e: Edge) =>
            e.type === 'default' ? { ...e, type: 'selfDrawn' } : e
          );
          return { nodes: parsed.nodes, edges };
        }
      }
    } catch (e) {
      /* ignore */
    }
    return { nodes: [], edges: [] };
  };
  const initial = loadFromStorage();

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [menu, setMenu] = useState<{ screenX: number; screenY: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastPaneClickRef = useRef(0);

  const { zoomIn, zoomOut, getZoom, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const t = setInterval(() => {
      const z = getZoom();
      setZoomLevel((prev) => (Math.abs(prev - z) > 0.001 ? z : prev));
    }, 100);
    return () => clearInterval(t);
  }, [getZoom]);

  const addLog = useCallback((msg: string) => {
    setLog((l) => [...l.slice(-4), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  // localStorage 自动保存 (debounced 300ms) — ⚠️ save 时 strip measured
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const nodesForSave = nodes.map(({ measured, ...rest }: any) => rest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: nodesForSave, edges }));
      } catch (e) {
        /* quota exceeded */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, edges]);

  // Esc 键关菜单 / 取消 edge/node 选中
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null);
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })));
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNodes, setEdges]);

  // 删除 edge (剪刀)
  const cutEdge = useCallback(
    (id: string) => {
      addLog(`[damai] cut edge ${id}`);
      setEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [setEdges, addLog],
  );

  // onConnect: 拖线创建 edge (type: 'selfDrawn')
  const onConnect = useCallback(
    (connection: Connection) => {
      addLog(`[damai] onConnect: ${JSON.stringify(connection)}`);
      if (connection.source === connection.target) {
        addLog(`[damai] self-loop blocked`);
        return;
      }
      if (
        edges.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle &&
            e.targetHandle === connection.targetHandle,
        )
      ) {
        addLog(`[damai] duplicate, skipped`);
        return;
      }
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'selfDrawn',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
              color: 'rgba(110,140,214,0.85)',
            },
            data: { onCut: cutEdge },
          },
          eds,
        ),
      );
    },
    [edges, setEdges, cutEdge, addLog],
  );

  // 拖线到空白 (非 + 端口) → 弹节点菜单
  const onConnectEnd = useCallback(
    (event: any) => {
      const target = event && (event.target || event.currentTarget);
      const onHandle = target && target.closest && target.closest('.react-flow__handle');
      if (onHandle) return;
      const clientX = (event && event.clientX) || 0;
      const clientY = (event && event.clientY) || 0;
      setMenu({ screenX: clientX, screenY: clientY });
      addLog(`[damai] connect drop on empty (${clientX},${clientY}) → popup`);
    },
    [addLog],
  );

  // 双击空白: 弹节点菜单
  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastPaneClickRef.current < 350) {
      setMenu({ screenX: event.clientX, screenY: event.clientY });
    }
    lastPaneClickRef.current = now;
  }, []);

  // addNode 接受可选 screenPos; 没传 = 视口中心 + jitter
  const addNode = useCallback(
    (type: NodeType, screenPos?: { x: number; y: number }) => {
      const newId = String(Date.now());
      let flowPos: { x: number; y: number };
      if (screenPos) {
        flowPos = screenToFlowPosition({ x: screenPos.x, y: screenPos.y });
        flowPos.x -= 150;
        flowPos.y -= 50;
      } else {
        const center = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        flowPos = {
          x: center.x - 150 + (Math.random() - 0.5) * 200,
          y: center.y - 80 + (Math.random() - 0.5) * 100,
        };
      }
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type,
          position: flowPos,
          data: { prompt: NODE_LABELS[type] + ' 节点' } as BaseNodeData,
        },
      ]);
      setMenu(null);
      addLog(
        `[damai] add node ${type} (${newId}) at (${Math.round(flowPos.x)},${Math.round(flowPos.y)})`,
      );
    },
    [setNodes, addLog, screenToFlowPosition],
  );

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addLog('[damai] clear all');
  }, [setNodes, setEdges, addLog]);

  // demo: 加载 6 节点
  const loadDemo = useCallback(() => {
    const demo: Node[] = [
      { id: 't1', type: 'text', position: { x: 60, y: 80 }, data: { text: '现代极简客厅' } },
      { id: 'i1', type: 'image', position: { x: 320, y: 80 }, data: {} },
      { id: 'v1', type: 'video-gen', position: { x: 580, y: 80 }, data: {} },
      { id: 'a1', type: 'audio-gen', position: { x: 320, y: 340 }, data: {} },
      { id: 'm1', type: 'merge', position: { x: 840, y: 200 }, data: { inputs: 2 } },
      { id: 'o1', type: 'output', position: { x: 1100, y: 200 }, data: {} },
    ];
    const demoEdges: Edge[] = [
      { id: 'e1', source: 't1', target: 'i1', sourceHandle: 'right', targetHandle: 'left', type: 'selfDrawn', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' }, data: { onCut: cutEdge } },
      { id: 'e2', source: 'i1', target: 'v1', sourceHandle: 'right', targetHandle: 'left', type: 'selfDrawn', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' }, data: { onCut: cutEdge } },
      { id: 'e3', source: 'a1', target: 'm1', sourceHandle: 'right', targetHandle: 'left', type: 'selfDrawn', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' }, data: { onCut: cutEdge } },
      { id: 'e4', source: 'v1', target: 'm1', sourceHandle: 'right', targetHandle: 'left', type: 'selfDrawn', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' }, data: { onCut: cutEdge } },
      { id: 'e5', source: 'm1', target: 'o1', sourceHandle: 'right', targetHandle: 'left', type: 'selfDrawn', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' }, data: { onCut: cutEdge } },
    ];
    setNodes(demo);
    setEdges(demoEdges);
    addLog('[damai] load demo (6 nodes + 5 edges)');
  }, [setNodes, setEdges, addLog, cutEdge]);

  return (
    <div className={styles.root}>
      {/* 顶部状态条 */}
      <div className={styles.topbar}>
        <div className={styles.logo}>大脉</div>
        <div className={styles.saveTime}>
          <span className={styles.ok}>● </span>
          {`已保存到云端・${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`}
        </div>
        <div className={styles.credits}>
          <span className={styles.gem}>◆</span>
          <span>3,532</span>
        </div>
        <button
          className={styles.topbarBtn}
          onClick={() => addLog('[damai] 社区 (TODO)')}
        >
          社区
        </button>
        <button
          className={styles.topbarBtn}
          onClick={() => addLog('[damai] 分享 (TODO)')}
        >
          分享
        </button>
      </div>

      {/* 左侧浮动工具 (6 节点 + 4 占位) */}
      <div className={styles.floatingTools}>
        {['+', '▣', '▶', '♪', '⊕', '◉'].map((icon, i) => (
          <button
            key={i}
            title={NODE_LABELS[NODE_TYPES[i]]}
            onClick={() => addNode(NODE_TYPES[i])}
          >
            {icon}
          </button>
        ))}
        <div
          style={{
            width: 24,
            height: 1,
            background: 'rgba(255,255,255,0.1)',
            margin: '4px 0',
          }}
        />
        <button title="文件 (TODO)" style={{ opacity: 0.4 }}>📁</button>
        <button title="模板 (TODO)" style={{ opacity: 0.4 }}>📋</button>
        <button title="评论 (TODO)" style={{ opacity: 0.4 }}>💬</button>
        <button title="通知 (TODO)" style={{ opacity: 0.4 }}>N</button>
      </div>

      {/* "脉" logo 右下 */}
      <div className={styles.pulseLogo} title="大脉 AI 视频工厂">脉</div>

      {/* 信息面板 */}
      <div className={styles.infoPanel}>
        <h4>操作方式 (sandbox v2)</h4>
        <ul>
          <li>
            <b style={{ color: '#fff' }}>左键</b> 拖节点 = 移动
          </li>
          <li>
            <b style={{ color: '#fff' }}>左键</b> 拖 + 端口 = 连线
          </li>
          <li>
            <b style={{ color: '#fbbf24' }}>右键</b> 拖空白 ={' '}
            <b style={{ color: '#fbbf24' }}>平移画布</b>
          </li>
          <li>
            <b style={{ color: '#4ade80' }}>左键</b> 拖空白 ={' '}
            <b style={{ color: '#4ade80' }}>框选多个节点</b>
          </li>
          <li>
            <code>Cmd/Ctrl</code> + 点节点 = 多选
          </li>
          <li>
            <code>滚轮</code> = 缩放
          </li>
          <li>
            <code>Backspace</code> = 删除所选
          </li>
          <li>双击空白 → 弹节点菜单</li>
          <li>点节点 → 显示 op-panel</li>
          <li>鼠标放 edge 上 → 剪刀 ✂</li>
        </ul>
        <h4 style={{ marginTop: 10 }}>日志 (最近 5 条)</h4>
        {log.map((l, i) => (
          <div
            key={i}
            style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}
          >
            {l}
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <button className={styles.topbarBtn} onClick={loadDemo}>
            加载 demo
          </button>
          <button className={styles.topbarBtn} onClick={clearAll}>
            清空
          </button>
        </div>
      </div>

      {/* React Flow 画布 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingTop: 56,
          paddingBottom: 28,
        }}
      >
        <div className={styles.canvasBg} />
        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({
            ...e,
            data: { ...(e.data as any), onCut: cutEdge },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={ConnectionLine}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={30}
          panOnDrag={[2]}
          selectionOnDrag
          selectionMode="full"
          panActivationKeyCode={null}
          onContextMenu={(e) => e.preventDefault()}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1, minZoom: 0.3 }}
          defaultEdgeOptions={{
            type: 'selfDrawn',
            style: { stroke: 'rgba(110,140,214,0.85)', strokeWidth: 2.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
              color: 'rgba(110,140,214,0.85)',
            },
          }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Control']}
        >
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            style={{ background: 'rgba(20,20,20,0.7)' }}
            maskColor="rgba(110,140,214,0.1)"
          />
        </ReactFlow>
        {/* 自研 ZoomControls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={() => zoomIn()}
            title="放大"
          >
            +
          </button>
          <div className={styles.zoomPct}>{Math.round(zoomLevel * 100)}%</div>
          <button
            className={styles.zoomBtn}
            onClick={() => zoomOut()}
            title="缩小"
          >
            −
          </button>
        </div>
      </div>

      {/* 节点菜单 */}
      {menu && (
        <>
          <div
            className={styles.menuMask}
            onClick={() => {
              setMenu(null);
              setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
              setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
            }}
          />
          <div
            className={styles.nodeMenu}
            style={{ left: menu.screenX, top: menu.screenY }}
            onClick={(e) => e.stopPropagation()}
          >
            {NODE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() =>
                  addNode(t, { x: menu.screenX, y: menu.screenY })
                }
              >
                <span style={{ marginRight: 8, color: '#6e8cd6' }}>
                  {NODE_ICONS[t]}
                </span>
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 底部状态条 */}
      <div className={styles.statusbar}>
        <span>{`节点: ${nodes.length}`}</span>
        <span>{`连线: ${edges.length}`}</span>
        <span className={styles.ok}>●  右键 pan</span>
        <span className={styles.ok}>●  左键 框选</span>
        <span className={styles.ok}>●  ConnectionLine</span>
        <span className={styles.ok}>●  ZoomControls</span>
        <span className={styles.ok}>●  MiniMap</span>
        <span className={styles.ok}>●  Merge 多输入</span>
        <span className={styles.ok}>●  i2i 自动检测</span>
        <span className={styles.ok}>●  edge selfDrawn</span>
        <span className={styles.ok}>●  /sandbox/canvas (v2)</span>
      </div>
    </div>
  );
}
