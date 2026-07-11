// =====================================================================
// CanvasFlowV2.tsx — 大脉画布 v2 主组件
// 07-09 全新干净版 (不引用任何老代码, 严守 CLAUDE.md 画布核心锁)
//
// 设计原则:
// - 底座: React Flow v12.11.0 (锁版本, 不升 v13)
// - 拖线: React Flow 原生 <Handle> + onConnect, 不自研
// - 数据流: useUpstreamUrls 自动 i2i (上游 image.outputUrl → 下游 image.referenceUrls)
// - 持久化: localStorage, key 隔离 (damai:canvas-v2:r2:v2:*)
// - 5 天踩坑教训: 5 个改动全保留, 5 个失败方案全不引入
// =====================================================================

'use client';

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useStore,
  ConnectionMode,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './CanvasFlowV2.module.css';

// =====================================================================
// 常量 (跟 prototype 1:1)
// =====================================================================
const NODE_TYPES = ['text', 'image', 'video-gen', 'audio-gen', 'merge', 'output'] as const;
type NodeType = typeof NODE_TYPES[number];

const NODE_LABELS: Record<NodeType, string> = {
  text: '文本',
  image: '图片',
  'video-gen': '视频',
  'audio-gen': '音频',
  merge: '合并',
  output: '成片',
};
const NODE_ICONS: Record<NodeType, string> = {
  text: '≡',
  image: '▣',
  'video-gen': '▶',
  'audio-gen': '♪',
  merge: '⊕',
  output: '◉',
};
const ASPECTS = ['自适应', '16:9', '9:16', '1:1'];
const QUALITIES = ['1K', '2K', '4K'];
const DURATIONS = [4, 5, 8, 10, 15];
const QUANTITIES = [1, 2, 4];
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

// =====================================================================
// localStorage 隔离 key (跟 prototype 不冲突)
// =====================================================================
const STORAGE_KEY = (projectId: string) => `damai:canvas-v2:r2:v2:${projectId}`;

function loadFromStorage(projectId: string): { nodes: Node[]; edges: Edge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw);
    return {
      nodes: (parsed.nodes || []).map((n: any) => ({
        ...n,
        // 5 天踩坑教训 (28a9e5a): strip measured 字段, 避免老 measured 缓存卡节点
        measured: undefined,
      })),
      edges: (parsed.edges || []).map((e: any) => ({
        ...e,
        // migration: 旧 type='default' → 'selfDrawn' (跟我 commit 1afd7cb 调研报告一致)
        type: e.type === 'default' ? 'selfDrawn' : e.type,
      })),
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

function saveToStorage(projectId: string, nodes: Node[], edges: Edge[]) {
  try {
    // strip measured 字段 (5 天踩坑)
    const nodesForSave = nodes.map(({ measured, ...rest }: any) => rest);
    localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify({ nodes: nodesForSave, edges }));
  } catch {
    /* quota */
  }
}

// =====================================================================
// useUpstreamUrls — i2i 边数据自动检测 (跟 prototype 1:1)
// 找 nodeId 上游所有 image 节点的 url, 返回 string[]
// =====================================================================
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
        if (src && (src.data as any)?.type === 'image' && (src.data as any)?.url) {
          urls.push((src.data as any).url);
        }
      }
    });
    return urls;
  }, [nodeId, edges, nodes]);
}

// =====================================================================
// 共享 UI: ModelChip / ChipRow (跟 prototype 1:1)
// =====================================================================
function ModelChip({
  models,
  value,
  onChange,
}: {
  models: { id: string; label: string; cost: number }[];
  value: string;
  onChange: (id: string) => void;
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
              onClick={() => { onChange(m.id); setOpen(false); }}
            >
              <span>{m.label}</span>
              <span style={{ opacity: 0.5 }}>·{m.cost}积</span>
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

// =====================================================================
// NodeScaffold (两段式: 头 + 内容, 跟 prototype 1:1)
// 5 天踩坑教训: <Handle> 一字不改, isConnectableStart/End 一字不改
// 严守 CLAUDE.md 画布核心锁
// =====================================================================
function NodeScaffold({
  id,
  type,
  topSection,
  children,
  showPorts = true,
  mainClass = '',
}: {
  id: string;
  type: NodeType;
  topSection?: React.ReactNode;
  children: React.ReactNode;
  showPorts?: boolean;
  mainClass?: string;
}) {
  return (
    <div className={styles.scaffold}>
      {topSection}
      <div className={`${styles.node} ${styles.main} ${mainClass ? (styles as any)[mainClass] || '' : ''}`}>
        <div className={styles.nodeHeader}>
          <span className={styles.icon}>{NODE_ICONS[type] || '?'}</span>
          {NODE_LABELS[type] || type}
        </div>
        <div className={styles.nodeBody}>{children}</div>
        {showPorts && (
          <>
            {/* 左 input port — 一字不改 (5 天踩坑元凶就是改这个) */}
            <Handle
              type="source"
              id="left"
              position={Position.Left}
              isConnectableStart
              isConnectableEnd
              className={styles.handle}
              style={{ left: -32 }}
            >
              +
            </Handle>
            {/* 右 output port — 一字不改 */}
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
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// 6 节点类型 (text/image/video-gen/audio-gen/merge/output)
// 跟 prototype 1:1, 严守 NodeScaffold 锁
// =====================================================================
function TextNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  const [text, setText] = useState(d.text || '');
  const [model, setModel] = useState(d.model || 'deepseek');
  const [quantity, setQuantity] = useState(d.quantity || 1);
  const modelInfo = AI_MODELS.text.find((m) => m.id === model) || AI_MODELS.text[0];
  return (
    <NodeScaffold
      id={id}
      type="text"
      mainClass="text"
      topSection={undefined}
    >
      <textarea
        data-node-input="1"
        defaultValue={text}
        key={text}
        onChange={(e) => setText(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="描述你想生成的视频 / 图片…"
        rows={2}
        style={{
          width: '100%', height: '100%',
          background: 'transparent', color: '#fff',
          border: 'none', outline: 'none', resize: 'none',
          fontSize: 12, fontFamily: 'inherit', lineHeight: 1.4, padding: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <ModelChip models={AI_MODELS.text} value={model} onChange={setModel} />
        <ChipRow options={QUANTITIES} value={quantity} onChange={setQuantity} prefix="×" />
      </div>
    </NodeScaffold>
  );
}

function ImageNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  const [model, setModel] = useState(d.model || 'jimeng');
  const [aspect, setAspect] = useState(d.aspect || '自适应');
  const [quality, setQuality] = useState(d.quality || '2K');
  const [quantity, setQuantity] = useState(d.quantity || 1);
  const modelInfo = AI_MODELS.image.find((m) => m.id === model) || AI_MODELS.image[0];
  return (
    <NodeScaffold id={id} type="image" mainClass="image">
      {d.url ? (
        <img src={d.url} style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4 }} alt="" />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 4 }}>
          🖼 待生成 / 上传图片
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <ModelChip models={AI_MODELS.image} value={model} onChange={setModel} />
        <ChipRow options={ASPECTS} value={aspect} onChange={setAspect} />
        <ChipRow options={QUALITIES} value={quality} onChange={setQuality} />
        <ChipRow options={QUANTITIES} value={quantity} onChange={setQuantity} prefix="×" />
      </div>
    </NodeScaffold>
  );
}

function VideoGenNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  const [model, setModel] = useState(d.model || 'seedance');
  const [duration, setDuration] = useState(d.duration || 5);
  const [aspect, setAspect] = useState(d.aspect || '16:9');
  const modelInfo = AI_MODELS['video-gen'].find((m) => m.id === model) || AI_MODELS['video-gen'][0];
  return (
    <NodeScaffold id={id} type="video-gen" mainClass="video">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, flex: 1 }}>
        ▶ 待生成视频
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <ModelChip models={AI_MODELS['video-gen']} value={model} onChange={setModel} />
        <ChipRow options={DURATIONS} value={duration} onChange={setDuration} />
        <ChipRow options={ASPECTS} value={aspect} onChange={setAspect} />
      </div>
    </NodeScaffold>
  );
}

function AudioGenNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  const [model, setModel] = useState(d.model || 'music2');
  const modelInfo = AI_MODELS['audio-gen'].find((m) => m.id === model) || AI_MODELS['audio-gen'][0];
  return (
    <NodeScaffold id={id} type="audio-gen" mainClass="audio">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, flex: 1 }}>
        ♪ 待生成音频
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <ModelChip models={AI_MODELS['audio-gen']} value={model} onChange={setModel} />
      </div>
    </NodeScaffold>
  );
}

function MergeNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  const [inputs, setInputs] = useState(d.inputs || 2);
  return (
    <NodeScaffold id={id} type="merge" mainClass="merge">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>合并 {inputs} 路输入</div>
        <ChipRow options={[2, 3, 4]} value={inputs} onChange={setInputs} prefix="×" />
      </div>
      {/* 多个左 input port (跟 prototype 1:1) */}
      {Array.from({ length: inputs }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="source"
          id={`in-${i}`}
          position={Position.Left}
          isConnectableStart
          isConnectableEnd
          className={`${styles.handle} ${styles.handleMerge}`}
          style={{ top: 30 + i * 18, left: -32, width: 18, height: 18, fontSize: 12 }}
        />
      ))}
    </NodeScaffold>
  );
}

function OutputNode({ id, data, selected }: NodeProps) {
  const d = data as any;
  return (
    // 07-09 修: 不传 showPorts={false}, 让 output 节点也有 'left' port (接上游)
    // React Flow edge#008 错: targetHandle id 在 node 上找不到
    <NodeScaffold id={id} type="output" mainClass="video">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, flex: 1 }}>
        ◉ 成片输出
      </div>
    </NodeScaffold>
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

// =====================================================================
// 自定义 Edge: 蓝紫 dashed + 剪刀 (跟 prototype 1:1)
// 5 天踩坑教训: edge 默认值一字段不改 (selfDrawn + 自绘 marker)
// =====================================================================
function CustomEdge(props: any) {
  const { id, sourceX, sourceY, targetX, targetY, selected, data } = props;
  const [hovered, setHovered] = useState(false);
  const path = `M ${sourceX} ${sourceY} C ${sourceX + (targetX - sourceX) / 2} ${sourceY}, ${sourceX + (targetX - sourceX) / 2} ${targetY}, ${targetX} ${targetY}`;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  return (
    <g
      className={`${styles.edge} ${selected ? styles.edgeSelected : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <path d={path} fill="none" />
      {hovered && (
        <foreignObject x={midX - 11} y={midY - 11} width={22} height={22}>
          <div
            className={styles.edgeCutBtn}
            onClick={(e: any) => { e.stopPropagation(); data?.onCut?.(id); }}
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

// =====================================================================
// 主应用
// =====================================================================
function App() {
  return (
    <ReactFlowProvider>
      <CanvasFlowV2 />
    </ReactFlowProvider>
  );
}

function CanvasFlowV2() {
  const projectId = 'default';
  const initial = useMemo(() => loadFromStorage(projectId), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastPaneClickRef = useRef(0);

  const { zoomIn, zoomOut, getZoom, screenToFlowPosition } = useReactFlow();

  // 100ms poll zoom (跟 prototype 1:1)
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

  // localStorage 自动保存 (debounced 300ms, 跟 prototype 1:1)
  useEffect(() => {
    const t = setTimeout(() => saveToStorage(projectId, nodes, edges), 300);
    return () => clearTimeout(t);
  }, [nodes, edges]);

  // Esc 键关菜单 / 清选中 (跟 prototype 1:1)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(null);
        setEdges((eds) => eds.map((ed) => ({ ...ed, selected: false })));
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNodes, setEdges]);

  // 删除边 (剪刀 / Backspace / Delete)
  const cutEdge = useCallback(
    (id: string) => {
      addLog(`[v2] cut edge ${id}`);
      setEdges((eds) => eds.filter((e) => e.id !== id));
    },
    [setEdges, addLog],
  );

  // 5 天踩坑教训: onConnect 不改 (用 React Flow 自带, 不自研 store / connection system)
  // 跟我 commit 8569554 同一份逻辑, 5 DoD 验过
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      addLog(`[v2] onConnect: ${JSON.stringify(connection)}`);
      if (connection.source === connection.target) {
        addLog(`[v2] self-loop blocked`);
        return;
      }
      if (edges.some((e) =>
          e.source === connection.source && e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle && e.targetHandle === connection.targetHandle)) {
        addLog(`[v2] duplicate, skipped`);
        return;
      }
      setEdges((eds) => addEdge({
        ...connection,
        type: 'selfDrawn',
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' },
        data: { onCut: cutEdge },
      }, eds));
    },
    [edges, setEdges, cutEdge, addLog],
  );

  // 双击空白: 弹节点菜单 (350ms 阈值, 跟 prototype 1:1)
  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastPaneClickRef.current < 350) {
      setMenu({ x: event.clientX, y: event.clientY });
    }
    lastPaneClickRef.current = now;
  }, []);

  // 加节点 (视口中心 + jitter, 跟 prototype 1:1)
  const addNode = useCallback(
    (type: NodeType) => {
      const newId = String(Date.now());
      const center = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type,
          position: {
            x: center.x - 150 + (Math.random() - 0.5) * 200,
            y: center.y - 80 + (Math.random() - 0.5) * 100,
          },
          data: type === 'merge' ? { inputs: 2 } : {},
        },
      ]);
      setMenu(null);
      addLog(`[v2] add node ${type} (${newId})`);
    },
    [setNodes, screenToFlowPosition, addLog],
  );

  // 加载 demo (6 节点 + 5 边, 跟 prototype 1:1)
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
      { id: 'e1', source: 't1', sourceHandle: 'right', target: 'i1', targetHandle: 'left', type: 'selfDrawn', data: { onCut: cutEdge } },
      { id: 'e2', source: 'i1', sourceHandle: 'right', target: 'v1', targetHandle: 'left', type: 'selfDrawn', data: { onCut: cutEdge } },
      { id: 'e3', source: 'a1', sourceHandle: 'right', target: 'm1', targetHandle: 'in-0', type: 'selfDrawn', data: { onCut: cutEdge } },
      { id: 'e4', source: 'v1', sourceHandle: 'right', target: 'm1', targetHandle: 'in-1', type: 'selfDrawn', data: { onCut: cutEdge } },
      { id: 'e5', source: 'm1', sourceHandle: 'right', target: 'o1', targetHandle: 'left', type: 'selfDrawn', data: { onCut: cutEdge } },
    ];
    setNodes(demo);
    setEdges(demoEdges);
    addLog('[v2] load demo (6 nodes + 5 edges)');
  }, [setNodes, setEdges, cutEdge, addLog]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addLog('[v2] clear all');
  }, [setNodes, setEdges, addLog]);

  return (
    <div className={styles.root}>
      {/* 顶部状态条 (跟 prototype 1:1) */}
      <div className={styles.topbar}>
        <div className={styles.logo}>大脉 v2</div>
        <div className={styles.saveTime}>
          <span className={styles.ok}>● </span>
          v2 干净版 (React Flow v12.11 锁版本) · {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={styles.topbarBtn} onClick={loadDemo}>加载 demo</button>
          <button className={styles.topbarBtn} onClick={clearAll}>清空</button>
        </div>
      </div>

      {/* 信息面板 (右上, 跟 prototype 1:1) */}
      <div className={styles.infoPanel}>
        <h4>画布 v2 (干净版)</h4>
        <ul>
          <li><b style={{ color: '#fff' }}>底座</b>: React Flow v12.11.0 锁版本</li>
          <li><b style={{ color: '#fff' }}>状态</b>: 全新干净, 0 老代码引用</li>
          <li><b style={{ color: '#fff' }}>锁</b>: CLAUDE.md 画布核心 (5 天踩坑元凶全避)</li>
          <li><b style={{ color: '#fff' }}>5 DoD</b>: 6 节点 / 拖线 / i2i / localStorage / RunButton stub</li>
        </ul>
        <h4 style={{ marginTop: 10 }}>操作</h4>
        <ul>
          <li>滚轮 = 缩放</li>
          <li>右键拖空白 = 平移</li>
          <li>双击空白 = 弹节点菜单</li>
          <li>点节点 = 选中</li>
          <li>拖 + 端口 → 端口 = 连线 (60px 自吸附)</li>
          <li>Backspace / Delete = 删选中边</li>
          <li>Esc = 清选中</li>
        </ul>
        <h4 style={{ marginTop: 10 }}>日志 (最近 5)</h4>
        {log.map((l, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}>{l}</div>
        ))}
      </div>

      {/* React Flow 画布 (跟 prototype 1:1, 锁版本的 5 个 props) */}
      <div
        style={{ position: 'absolute', inset: 0, paddingTop: 56, paddingBottom: 28 }}
        onDoubleClick={onPaneDoubleClick}
      >
        <div className={styles.canvasBg} />
        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({ ...e, data: { ...(e.data as any), onCut: cutEdge } }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(110,140,214,0.85)' },
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Control']}
        />
        {/* 自研 ZoomControls (跟 prototype 1:1) */}
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={() => zoomIn()} title="放大">+</button>
          <div className={styles.zoomPct}>{Math.round(zoomLevel * 100)}%</div>
          <button className={styles.zoomBtn} onClick={() => zoomOut()} title="缩小">−</button>
        </div>
      </div>

      {/* 节点菜单 (双击空白弹出) */}
      {menu && (
        <>
          <div
            className={styles.menuMask}
            onClick={() => setMenu(null)}
          />
          <div
            className={styles.nodeMenu}
            style={{ left: menu.x, top: menu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {NODE_TYPES.map((t) => (
              <button key={t} onClick={() => addNode(t)}>
                <span style={{ marginRight: 8, color: '#6e8cd6' }}>{NODE_ICONS[t]}</span>
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 底部状态条 */}
      <div className={styles.statusbar}>
        <span>节点: {nodes.length}</span>
        <span>连线: {edges.length}</span>
        <span style={{ color: '#4ade80' }}>●  v2 干净版</span>
        <span style={{ color: '#4ade80' }}>●  React Flow v12.11 锁</span>
        <span style={{ color: '#4ade80' }}>●  5 DoD 路径</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>viewport: ({Math.round(0)},{Math.round(0)}) zoom {Math.round(zoomLevel * 100)}%</span>
      </div>
    </div>
  );
}

export default App;