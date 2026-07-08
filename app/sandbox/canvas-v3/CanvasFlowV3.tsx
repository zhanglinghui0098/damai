// =====================================================================
// CanvasFlowV3.tsx — 大脉画布 v3 (完全自研, SVG + React state 自管)
// 07-08: user 决定推倒 React Flow + tldraw, 完全自研
// ⚠️ 高风险决策, 5 天踩坑就是因为自研画布底座不稳. 严守 CLAUDE.md.
// - 不依赖任何画布 SDK (React Flow / tldraw / Konva)
// - SVG 节点 + 边 + 候选线, React state 管数据
// - 视口控制 (zoom/pan) 自己做, 不调用 React Flow hooks
// - 5 个验收项: brief Part 5
// =====================================================================

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// =====================================================================
// 常量 (跟 brief 3.7 一致 + 跟 prototype 1:1)
// =====================================================================
const THEME = {
  bg: '#0a0a0a',
  nodeBg: '#1a1a1a',
  accent: '#6e8cd6',
  accentHover: '#87a3dc',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.65)',
  textTertiary: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
  borderSelected: '#6e8cd6',
  success: '#10b981',
  warn: '#f59e0b',
  error: '#ef4444',
  // 节点 type → 颜色 (brief 3.1)
  nodeTypeColor: {
    text: '#6e8cd6',        // 蓝紫
    image: '#10b981',       // 绿
    'video-gen': '#f59e0b', // 橙
    'audio-gen': '#ec4899', // 粉
    merge: '#8b5cf6',       // 紫
    output: '#facc15',      // 黄
  },
} as const;

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

// 节点默认大小
const NODE_DEFAULT_SIZE: Record<NodeType, { w: number; h: number }> = {
  text: { w: 280, h: 180 },
  image: { w: 280, h: 240 },
  'video-gen': { w: 280, h: 220 },
  'audio-gen': { w: 280, h: 160 },
  merge: { w: 280, h: 140 },
  output: { w: 280, h: 200 },
};

// 5 天踩坑教训: localStorage key 命名 (brief 3.4 改 r3, 我用 v3 区分自研)
const STORAGE_KEY = (projectId: string) => `damai:canvas-v2:r3:v3:${projectId}`;

// =====================================================================
// 类型
// =====================================================================

type NodeStatus = 'idle' | 'running' | 'done' | 'error';

type BaseNodeData = {
  label?: string;
  prompt?: string;
  url?: string;
  status?: NodeStatus;
  error?: string;
  inputs?: number;  // merge
  // node 特定字段
  model?: string;
  aspect?: string;
  quality?: string;
  duration?: number;
};

type V3Node = {
  id: string;
  type: NodeType;
  x: number;       // 世界坐标
  y: number;
  w: number;
  h: number;
  data: BaseNodeData;
};

type EdgeData = {
  type: 'default' | 'i2i';
  refUrls?: string[];
};

type V3Edge = {
  id: string;
  source: string;        // node id
  sourceHandle: 'left' | 'right' | `in-${number}`;
  target: string;
  targetHandle: 'left' | 'right' | `in-${number}`;
  data: EdgeData;
};

type Viewport = { x: number; y: number; zoom: number };

type ConnectionDrag =
  | {
      fromNodeId: string;
      fromHandle: 'left' | 'right' | `in-${number}`;
      fromX: number;  // 屏幕坐标
      fromY: number;
      mouseX: number;
      mouseY: number;
      snapTarget: { nodeId: string; handle: string; x: number; y: number } | null;
    }
  | null;

type NodeDrag =
  | { nodeId: string; offsetX: number; offsetY: number }
  | null;

type Menu = { x: number; y: number } | null;

// =====================================================================
// 工具: 屏幕坐标 ↔ 世界坐标 (自研, 跟 React Flow 思路一样但不用 SDK)
// =====================================================================
function screenToWorld(viewport: Viewport, sx: number, sy: number) {
  return {
    x: (sx - viewport.x) / viewport.zoom,
    y: (sy - viewport.y) / viewport.zoom,
  };
}
function worldToScreen(viewport: Viewport, wx: number, wy: number) {
  return {
    x: wx * viewport.zoom + viewport.x,
    y: wy * viewport.zoom + viewport.y,
  };
}

// =====================================================================
// localStorage (brief 3.4 + 5 天踩坑: save 时 strip tldraw 内部字段)
// 我们不用 tldraw, 但 save 时要 strip 自研"运行时"字段 (status running 状态不存)
// =====================================================================
function loadFromStorage(projectId: string): { nodes: V3Node[]; edges: V3Edge[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw);
    return {
      nodes: (parsed.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        x: n.x ?? 100,
        y: n.y ?? 100,
        w: n.w ?? NODE_DEFAULT_SIZE[n.type as NodeType]?.w ?? 280,
        h: n.h ?? NODE_DEFAULT_SIZE[n.type as NodeType]?.h ?? 200,
        data: n.data ?? {},
      })),
      edges: (parsed.edges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
        data: e.data ?? { type: 'default' },
      })),
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

function saveToStorage(projectId: string, nodes: V3Node[], edges: V3Edge[]) {
  try {
    // strip 运行时字段 (running 状态, error 临时信息)
    const nodesForSave = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
      data: { ...n.data, status: n.data.status === 'running' ? 'idle' : n.data.status, error: undefined },
    }));
    const edgesForSave = edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle,
      target: e.target,
      targetHandle: e.targetHandle,
      data: e.data,
    }));
    localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify({ nodes: nodesForSave, edges: edgesForSave }));
  } catch {
    /* quota */
  }
}

// =====================================================================
// 端口位置 (brief 3.3)
// =====================================================================
function getHandlePos(
  node: V3Node,
  handle: 'left' | 'right' | `in-${number}`,
): { x: number; y: number } {
  const h = node.h;
  if (handle === 'left') return { x: node.x, y: node.y + h / 2 };
  if (handle === 'right') return { x: node.x + node.w, y: node.y + h / 2 };
  // in-0..in-3 (merge 节点多 input)
  const idx = parseInt(handle.split('-')[1] || '0');
  return { x: node.x, y: node.y + 30 + idx * 18 };
}

// i2i 边数据 (brief 3.3): 上游是 image 且 url 存在 → 标 i2i
function detectI2iEdge(source: V3Node | undefined, target: V3Node | undefined, existingData?: EdgeData): EdgeData {
  if (existingData?.type === 'i2i') {
    // 收集所有上游 image 节点的 url
    // (实际 i2i 边只在 image → image 时标, 但任意上游是 image + 有 url 就 i2i)
    if (source?.type === 'image' && source.data.url) {
      return { type: 'i2i', refUrls: [source.data.url] };
    }
    return { type: 'default' };
  }
  if (source?.type === 'image' && source.data.url && target?.type === 'image') {
    return { type: 'i2i', refUrls: [source.data.url] };
  }
  return { type: 'default' };
}

// =====================================================================
// NodeScaffold (brief 3.2) — 两段式: 头 + 内容
// 6 节点共用, 简化版
// =====================================================================
function NodeScaffold({
  node,
  selected,
  onPointerDown,
  children,
}: {
  node: V3Node;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}) {
  const typeColor = THEME.nodeTypeColor[node.type];
  return (
    <g
      onPointerDown={onPointerDown}
      style={{ cursor: 'move' }}
    >
      {/* 节点 body */}
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={8}
        ry={8}
        fill={THEME.nodeBg}
        stroke={selected ? THEME.borderSelected : 'rgba(255,255,255,0.15)'}
        strokeWidth={selected ? 2 : 1}
      />
      {/* 头 (Section A) */}
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={28}
        rx={8}
        ry={8}
        fill={typeColor}
        opacity={0.15}
      />
      {/* 头底部 (裁剪圆角) */}
      <rect
        x={node.x}
        y={node.y + 14}
        width={node.w}
        height={14}
        fill={typeColor}
        opacity={0.15}
      />
      <line
        x1={node.x}
        y1={node.y + 28}
        x2={node.x + node.w}
        y2={node.y + 28}
        stroke={typeColor}
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      {/* 头文字 (icon + label) */}
      <text
        x={node.x + 10}
        y={node.y + 19}
        fontSize={11}
        fontWeight={600}
        fill={typeColor}
        style={{ textTransform: 'uppercase', letterSpacing: 0.5, userSelect: 'none' }}
      >
        {NODE_ICONS[node.type]} {NODE_LABELS[node.type]}
      </text>
      {/* 状态指示器 (右上角) */}
      {node.data.status && node.data.status !== 'idle' && (
        <circle
          cx={node.x + node.w - 12}
          cy={node.y + 14}
          r={4}
          fill={
            node.data.status === 'running' ? THEME.accent
            : node.data.status === 'done' ? THEME.success
            : node.data.status === 'error' ? THEME.error
            : THEME.textTertiary
          }
        >
          {node.data.status === 'running' && (
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          )}
        </circle>
      )}
      {/* 内容区 (Section B) */}
      <foreignObject
        x={node.x}
        y={node.y + 28}
        width={node.w}
        height={node.h - 28}
      >
        <div style={{ width: '100%', height: '100%', padding: 10, color: THEME.textPrimary, fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {children}
        </div>
      </foreignObject>
    </g>
  );
}

// =====================================================================
// 6 节点 UI
// =====================================================================
function NodeContent({ node, refUrls, onUpdate }: { node: V3Node; refUrls: string[]; onUpdate: (data: BaseNodeData) => void }) {
  const { type, data } = node;
  if (type === 'text') {
    return (
      <textarea
        value={data.prompt || ''}
        onChange={(e) => onUpdate({ ...data, prompt: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="描述你想生成的视频 / 图片…"
        style={{
          width: '100%', height: '100%', background: 'transparent', color: '#fff',
          border: 'none', outline: 'none', resize: 'none', fontSize: 12,
          fontFamily: 'inherit', lineHeight: 1.4, padding: 0,
        }}
      />
    );
  }
  if (type === 'image') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        {data.url ? (
          <img src={data.url} style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4, objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textTertiary, fontSize: 11, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 4 }}>
            🖼 待生成 / 上传图片
          </div>
        )}
        <textarea
          value={data.prompt || ''}
          onChange={(e) => onUpdate({ ...data, prompt: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="提示词…"
          style={{
            width: '100%', minHeight: 40, background: 'rgba(255,255,255,0.04)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 6,
            fontSize: 11, fontFamily: 'inherit', resize: 'none', outline: 'none',
          }}
        />
        <RunButton
          nodeId={node.id}
          type={type}
          prompt={data.prompt || ''}
          refUrls={refUrls}
          cost={data.model === 'doubao-seedream-5' ? 8 : 12}
          status={data.status}
          error={data.error}
          onUpdate={onUpdate}
        />
      </div>
    );
  }
  if (type === 'video-gen') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        <textarea
          value={data.prompt || ''}
          onChange={(e) => onUpdate({ ...data, prompt: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="视频描述…"
          style={{
            width: '100%', minHeight: 60, background: 'rgba(255,255,255,0.04)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 6,
            fontSize: 11, fontFamily: 'inherit', resize: 'none', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4, fontSize: 10, color: THEME.textTertiary }}>
          <span>时长: {data.duration || 5}s</span>
          <span>·</span>
          <span>16:9</span>
        </div>
        <RunButton nodeId={node.id} type={type} prompt={data.prompt || ''} refUrls={[]} cost={data.model === 'kling' ? 16 : 8} status={data.status} error={data.error} onUpdate={onUpdate} />
      </div>
    );
  }
  if (type === 'audio-gen') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        <textarea
          value={data.prompt || ''}
          onChange={(e) => onUpdate({ ...data, prompt: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="音频描述 (BGM / 歌词)…"
          style={{
            width: '100%', minHeight: 40, background: 'rgba(255,255,255,0.04)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 6,
            fontSize: 11, fontFamily: 'inherit', resize: 'none', outline: 'none',
          }}
        />
        <RunButton nodeId={node.id} type={type} prompt={data.prompt || ''} refUrls={[]} cost={25} status={data.status} error={data.error} onUpdate={onUpdate} />
      </div>
    );
  }
  if (type === 'merge') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        <div style={{ color: THEME.textTertiary, fontSize: 11 }}>合并 {data.inputs || 2} 路输入</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onUpdate({ ...data, inputs: n })}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                padding: '2px 8px', background: (data.inputs || 2) === n ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer',
              }}
            >×{n}</button>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'output') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        {data.url ? (
          data.url.match(/\.(mp4|webm)/) ? (
            <video src={data.url} style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4 }} controls />
          ) : (
            <img src={data.url} style={{ maxWidth: '100%', maxHeight: 100, borderRadius: 4, objectFit: 'cover' }} alt="" />
          )
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textTertiary, fontSize: 11, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 4 }}>
            ◉ 成片输出 (等待上游)
          </div>
        )}
        {data.status === 'running' && <div style={{ color: THEME.accent, fontSize: 11 }}>⏳ 生成中…</div>}
        {data.status === 'done' && <div style={{ color: THEME.success, fontSize: 11 }}>✓ 已完成</div>}
        {data.status === 'error' && <div style={{ color: THEME.error, fontSize: 11 }}>⚠ {data.error || '失败'}</div>}
      </div>
    );
  }
  return null;
}

// RunButton: 调 POST /api/canvas/task-log 拿 taskId, 再调 /run-image (brief 3.5)
// ⚠️ v3 是 public 路由 (没 auth), 401 是 expected. UI 优雅处理.
// 真接 task-log API: 2026-07-04 (P2 #3.3 S2)
async function callRunImage(
  prompt: string,
  refUrls: string[],
): Promise<{ ok: boolean; outputUrl?: string; error?: string }> {
  try {
    // 1. POST /api/canvas/task-log
    const taskRes = await fetch('/api/canvas/task-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvasId: 'v3',
        taskType: 'image-gen',
        trigger: 'manual',
        prompt,
        refUrls,
      }),
    });
    if (!taskRes.ok) {
      if (taskRes.status === 401) return { ok: false, error: '请登录后运行' };
      return { ok: false, error: `task-log ${taskRes.status}` };
    }
    const { taskId } = await taskRes.json();
    if (!taskId) return { ok: false, error: 'task-log 返回无 taskId' };

    // 2. POST /api/canvas/run-image (带 refUrls i2i)
    const runRes = await fetch('/api/canvas/run-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, referenceUrls: refUrls, quantity: 1 }),
    });
    if (!runRes.ok) {
      return { ok: false, error: `run-image ${runRes.status}` };
    }
    const data = await runRes.json();
    return { ok: data.ok, outputUrl: data.outputUrls?.[0] || data.outputUrl, error: data.error };
  } catch (e: any) {
    return { ok: false, error: e?.message || '网络错误' };
  }
}

function RunButton({
  nodeId,
  type,
  prompt,
  refUrls,
  cost,
  status,
  error,
  onUpdate,
}: {
  nodeId: string;
  type: NodeType;
  prompt: string;
  refUrls: string[];
  cost: number;
  status?: NodeStatus;
  error?: string;
  onUpdate: (data: BaseNodeData) => void;
}) {
  const running = status === 'running';
  const isError = status === 'error';
  const isDone = status === 'done';

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (running) return;
    // 只 image 节点接 run-image (其他类型 TODO: video-gen / audio-gen)
    if (type !== 'image') {
      onUpdate({ status: 'error' as NodeStatus, error: `${type} 暂未接 API (TODO)` });
      return;
    }
    onUpdate({ status: 'running' as NodeStatus, error: undefined });
    const result = await callRunImage(prompt, refUrls);
    if (result.ok && result.outputUrl) {
      onUpdate({ status: 'done' as NodeStatus, url: result.outputUrl, error: undefined });
    } else {
      onUpdate({ status: 'error' as NodeStatus, error: result.error || '生成失败' });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
      <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 980, fontSize: 10, color: '#fff' }}>
        ◆ {cost}
      </span>
      <div style={{ flex: 1 }} />
      {isError && <span style={{ fontSize: 9, color: THEME.error }}>⚠ {error?.slice(0, 12) || '失败'}</span>}
      <button
        onClick={handleRun}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={running}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: running ? 'not-allowed' : 'pointer',
          background: isError ? 'rgba(239,68,68,0.5)' : isDone ? 'rgba(16,185,129,0.5)' : running ? 'rgba(110,140,214,0.4)' : '#fff',
          color: '#000', fontSize: 14,
        }}
        title={running ? '运行中…' : isError ? '重试' : isDone ? '重新运行' : '运行'}
      >
        {running ? '⏳' : isDone ? '↻' : isError ? '↻' : '↑'}
      </button>
    </div>
  );
}

// =====================================================================
// 主应用
// =====================================================================
export default function CanvasFlowV3() {
  const projectId = 'default';
  const initial = useMemo(() => loadFromStorage(projectId), []);
  const [nodes, setNodes] = useState<V3Node[]>(initial.nodes);
  const [edges, setEdges] = useState<V3Edge[]>(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDrag>(null);
  const [nodeDrag, setNodeDrag] = useState<NodeDrag>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [log, setLog] = useState<string[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((l) => [...l.slice(-4), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  // localStorage 自动保存 (debounced 300ms, brief 3.4)
  useEffect(() => {
    const t = setTimeout(() => saveToStorage(projectId, nodes, edges), 300);
    return () => clearTimeout(t);
  }, [nodes, edges]);

  // Esc 取消拖线 / 清除选中
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectionDrag(null);
        setNodeDrag(null);
        setMenu(null);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedEdgeId) {
        setEdges((es) => es.filter((ed) => ed.id !== selectedEdgeId));
        setSelectedEdgeId(null);
        addLog(`[v3] cut edge ${selectedEdgeId}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedEdgeId, setEdges, addLog]);

  // 加节点 (视口中心)
  const addNode = useCallback(
    (type: NodeType) => {
      const newId = String(Date.now());
      const size = NODE_DEFAULT_SIZE[type];
      // 视口中心
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const world = screenToWorld(viewport, cx, cy);
      setNodes((ns) => [
        ...ns,
        {
          id: newId,
          type,
          x: world.x - size.w / 2 + (Math.random() - 0.5) * 50,
          y: world.y - size.h / 2 + (Math.random() - 0.5) * 30,
          w: size.w,
          h: size.h,
          data: type === 'merge' ? { inputs: 2 } : {},
        },
      ]);
      setMenu(null);
      addLog(`[v3] add node ${type} (${newId})`);
    },
    [viewport, addLog],
  );

  // 加载 demo (6 节点 + 5 边, 跟老 sandbox 一致)
  const loadDemo = useCallback(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const world = screenToWorld(viewport, cx, cy);
    const baseX = world.x - 280;
    const baseY = world.y - 100;
    const demoNodes: V3Node[] = [
      { id: 't1', type: 'text', x: baseX, y: baseY, ...NODE_DEFAULT_SIZE.text, data: { prompt: '现代极简客厅' } },
      { id: 'i1', type: 'image', x: baseX + 340, y: baseY, ...NODE_DEFAULT_SIZE.image, data: {} },
      { id: 'v1', type: 'video-gen', x: baseX + 680, y: baseY, ...NODE_DEFAULT_SIZE['video-gen'], data: {} },
      { id: 'a1', type: 'audio-gen', x: baseX + 340, y: baseY + 300, ...NODE_DEFAULT_SIZE['audio-gen'], data: {} },
      { id: 'm1', type: 'merge', x: baseX + 1020, y: baseY + 100, ...NODE_DEFAULT_SIZE.merge, data: { inputs: 2 } },
      { id: 'o1', type: 'output', x: baseX + 1360, y: baseY + 100, ...NODE_DEFAULT_SIZE.output, data: {} },
    ];
    setNodes(demoNodes);
    // 5 边 (按 sandbox L201-205 顺序)
    const newEdges: V3Edge[] = [
      { id: 'e1', source: 't1', sourceHandle: 'right', target: 'i1', targetHandle: 'left', data: { type: 'default' } },
      { id: 'e2', source: 'i1', sourceHandle: 'right', target: 'v1', targetHandle: 'left', data: { type: 'i2i', refUrls: [] } },
      { id: 'e3', source: 'a1', sourceHandle: 'right', target: 'm1', targetHandle: 'in-0', data: { type: 'default' } },
      { id: 'e4', source: 'v1', sourceHandle: 'right', target: 'm1', targetHandle: 'in-1', data: { type: 'default' } },
      { id: 'e5', source: 'm1', sourceHandle: 'right', target: 'o1', targetHandle: 'left', data: { type: 'default' } },
    ];
    setEdges(newEdges);
    addLog('[v3] load demo (6 nodes + 5 edges)');
  }, [viewport, addLog]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    addLog('[v3] clear all');
  }, [addLog]);

  // ====================================================================
  // 全局 pointer events: 拖节点 / 拖视口 / 候选线跟随
  // ====================================================================
  useEffect(() => {
    if (!nodeDrag && !connectionDrag) return;
    const onMove = (e: PointerEvent) => {
      if (nodeDrag) {
        setNodes((ns) =>
          ns.map((n) => {
            if (n.id !== nodeDrag.nodeId) return n;
            const dx = (e.clientX - (svgRef.current?.getBoundingClientRect().left || 0)) / viewport.zoom;
            const dy = (e.clientY - (svgRef.current?.getBoundingClientRect().top || 0)) / viewport.zoom;
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return n;
            const wx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
            const wy = (e.clientY - rect.top - viewport.y) / viewport.zoom;
            return { ...n, x: wx - nodeDrag.offsetX, y: wy - nodeDrag.offsetY };
          }),
        );
      } else if (connectionDrag) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // 60px 屏幕距离, 找最近 port (排除自己, brief 3.3)
        let snap: ConnectionDrag['snapTarget'] = null;
        let minDist = 60;
        for (const n of nodes) {
          if (n.id === connectionDrag.fromNodeId) continue;
          // 节点的所有 port
          const ports: Array<{ nodeId: string; handle: 'left' | 'right' | `in-${number}` }> = [];
          if (n.type !== 'output') ports.push({ nodeId: n.id, handle: 'left' });
          if (n.type !== 'text') ports.push({ nodeId: n.id, handle: 'right' });
          if (n.type === 'merge') {
            const inputs = (n.data.inputs || 2);
            for (let i = 0; i < inputs; i++) ports.push({ nodeId: n.id, handle: `in-${i}` as any });
          }
          for (const p of ports) {
            const worldPos = getHandlePos(n, p.handle);
            const screenPos = worldToScreen(viewport, worldPos.x, worldPos.y);
            const d = Math.hypot(screenPos.x - mx, screenPos.y - my);
            if (d < minDist) {
              minDist = d;
              snap = { nodeId: p.nodeId, handle: p.handle, x: screenPos.x, y: screenPos.y };
            }
          }
        }
        setConnectionDrag({ ...connectionDrag, mouseX: mx, mouseY: my, snapTarget: snap });
      }
    };
    const onUp = (e: PointerEvent) => {
      if (connectionDrag) {
        // 创建边 or 弹菜单
        if (connectionDrag.snapTarget && connectionDrag.snapTarget.nodeId !== connectionDrag.fromNodeId) {
          const newEdge: V3Edge = {
            id: 'edge-' + Date.now(),
            source: connectionDrag.fromNodeId,
            sourceHandle: connectionDrag.fromHandle,
            target: connectionDrag.snapTarget.nodeId,
            targetHandle: connectionDrag.snapTarget.handle as any,
            data: { type: 'default' },
          };
          // i2i 自动检测
          const src = nodes.find((n) => n.id === newEdge.source);
          const tgt = nodes.find((n) => n.id === newEdge.target);
          newEdge.data = detectI2iEdge(src, tgt);
          setEdges((es) => [...es, newEdge]);
          addLog(`[v3] connect created ${newEdge.source}→${newEdge.target}${newEdge.data.type === 'i2i' ? ' (i2i)' : ''}`);
        } else if (!connectionDrag.snapTarget) {
          // 拖到空白, 弹菜单 (跟 onConnectEnd 一样)
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            setMenu({ x: e.clientX, y: e.clientY });
            addLog(`[v3] connect drop on empty → popup`);
          }
        }
        setConnectionDrag(null);
      } else if (nodeDrag) {
        setNodeDrag(null);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [nodeDrag, connectionDrag, nodes, viewport, setEdges, setNodes, addLog]);

  // ====================================================================
  // 画布 wheel: zoom
  // ====================================================================
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    setViewport((vp) => {
      const newZoom = Math.max(0.3, Math.min(3, vp.zoom * Math.exp(delta)));
      // 以鼠标为中心缩放
      const wx = (sx - vp.x) / vp.zoom;
      const wy = (sy - vp.y) / vp.zoom;
      return {
        x: sx - wx * newZoom,
        y: sy - wy * newZoom,
        zoom: newZoom,
      };
    });
  }, []);

  // 画布中键拖动: pan
  const panRef = useRef<{ startX: number; startY: number; vpX: number; vpY: number } | null>(null);
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) {
      // 中键 pan
      panRef.current = { startX: e.clientX, startY: e.clientY, vpX: viewport.x, vpY: viewport.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (e.button === 0) {
      // 左键点空白: 清选中 + 弹菜单 (跟 onPaneClick 一样)
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      // 双击检测 (brief 跟 React Flow 一致, 用 350ms 阈值)
      const now = Date.now();
      const lastClick = (e.currentTarget as any).__lastClick || 0;
      if (now - lastClick < 350) {
        setMenu({ x: e.clientX, y: e.clientY });
      }
      (e.currentTarget as any).__lastClick = now;
    }
  }, [viewport]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport((vp) => ({ ...vp, x: panRef.current!.vpX + dx, y: panRef.current!.vpY + dy }));
    }
  }, []);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    if (panRef.current) {
      panRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // 端口 pointer down
  const onHandlePointerDown = useCallback(
    (nodeId: string, handle: 'left' | 'right' | `in-${number}`) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const worldPos = getHandlePos(node, handle);
      const screenPos = worldToScreen(viewport, worldPos.x, worldPos.y);
      setConnectionDrag({
        fromNodeId: nodeId,
        fromHandle: handle,
        fromX: screenPos.x,
        fromY: screenPos.y,
        mouseX: screenPos.x,
        mouseY: screenPos.y,
        snapTarget: null,
      });
      addLog(`[v3] connect start from ${nodeId}.${handle}`);
    },
    [nodes, viewport, addLog],
  );

  // 节点 pointer down
  const onNodePointerDown = useCallback(
    (nodeId: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const wx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const wy = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setNodeDrag({
        nodeId,
        offsetX: wx - node.x,
        offsetY: wy - node.y,
      });
    },
    [nodes, viewport],
  );

  // 更新节点 data
  const updateNodeData = useCallback(
    (nodeId: string, data: BaseNodeData) => {
      setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data } : n)));
    },
    [],
  );

  // 算每个节点的 refUrls (i2i 上游 image url 数组)
  const refUrlsMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const n of nodes) {
      const urls: string[] = [];
      for (const e of edges) {
        if (e.target === n.id && e.data.type === 'i2i') {
          const src = nodes.find((nn) => nn.id === e.source);
          if (src?.type === 'image' && src.data.url) urls.push(src.data.url);
        }
      }
      m[n.id] = urls;
    }
    return m;
  }, [nodes, edges]);

  // ====================================================================
  // 渲染
  // ====================================================================
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: THEME.bg,
        color: THEME.textPrimary,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 13,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 顶部状态栏 (跟 brief 3.7 一致) */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 56,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          zIndex: 10,
        }}
      >
        <div style={{ color: THEME.accent, fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>大脉 v3</div>
        <div style={{ color: THEME.textTertiary, fontSize: 11 }}>
          <span style={{ color: THEME.success }}>● </span>
          自研画布 (SVG + React state) · {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={loadDemo}
            style={{
              background: 'rgba(110, 140, 214, 0.12)', border: '1px solid rgba(110, 140, 214, 0.25)',
              color: '#c4b5fd', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            }}
          >
            加载 demo
          </button>
          <button
            onClick={clearAll}
            style={{
              background: 'rgba(110, 140, 214, 0.12)', border: '1px solid rgba(110, 140, 214, 0.25)',
              color: '#c4b5fd', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* 信息面板 */}
      <div
        style={{
          position: 'absolute', right: 12, top: 68,
          width: 280,
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          color: THEME.textTertiary,
          lineHeight: 1.6,
          zIndex: 9,
        }}
      >
        <h4 style={{ margin: '0 0 6px 0', color: THEME.accent, fontSize: 12 }}>操作 (v3 自研)</h4>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><b style={{ color: '#fff' }}>滚轮</b> = 缩放 (以鼠标为中心)</li>
          <li><b style={{ color: '#fff' }}>中键拖</b> = 平移</li>
          <li><b style={{ color: '#fff' }}>左键拖节点</b> = 移动</li>
          <li><b style={{ color: '#fff' }}>左键拖端口</b> = 连线 (60px 吸附)</li>
          <li><b style={{ color: '#fff' }}>双击空白</b> = 弹节点菜单</li>
          <li><b style={{ color: '#fff' }}>Backspace/Delete</b> = 删边</li>
          <li><b style={{ color: '#fff' }}>Esc</b> = 清选中</li>
        </ul>
        <h4 style={{ margin: '10px 0 6px 0', color: THEME.accent, fontSize: 12 }}>i2i 检测</h4>
        <div style={{ fontSize: 10, color: THEME.textTertiary }}>
          上游 image 节点有 url + 下游是 image → 边自动 i2i
        </div>
        <h4 style={{ margin: '10px 0 6px 0', color: THEME.accent, fontSize: 12 }}>日志 (最近 5)</h4>
        {log.map((l, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}>{l}</div>
        ))}
      </div>

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, cursor: panRef.current ? 'grabbing' : 'default', display: 'block' }}
        onWheel={onWheel}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onDoubleClick={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {/* 背景 (跟 brief 3.7 一致) */}
        <defs>
          <pattern id="grid" width={20 * viewport.zoom} height={20 * viewport.zoom} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={0.8} fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 视口变换 */}
        <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}>
          {/* 边 (在节点下面) */}
          {edges.map((e) => {
            const src = nodes.find((n) => n.id === e.source);
            const tgt = nodes.find((n) => n.id === e.target);
            if (!src || !tgt) return null;
            const srcPos = getHandlePos(src, e.sourceHandle);
            const tgtPos = getHandlePos(tgt, e.targetHandle);
            const isSelected = selectedEdgeId === e.id;
            const isI2I = e.data.type === 'i2i';
            const stroke = isI2I ? THEME.success : isSelected ? '#c4b5fd' : THEME.accent;
            const strokeWidth = isSelected ? 2.5 : 2;
            const opacity = isSelected ? 1 : 0.7;
            const midX = (srcPos.x + tgtPos.x) / 2;
            return (
              <g key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEdgeId(e.id); }} style={{ cursor: 'pointer' }}>
                <path
                  d={`M ${srcPos.x} ${srcPos.y} C ${midX} ${srcPos.y}, ${midX} ${tgtPos.y}, ${tgtPos.x} ${tgtPos.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd="url(#arrowhead-blue)"
                />
                {isI2I && (
                  <text x={midX} y={(srcPos.y + tgtPos.y) / 2 - 6} fontSize={10} fill={THEME.success} textAnchor="middle">
                    i2i
                  </text>
                )}
              </g>
            );
          })}

          {/* 候选线 (拖线中) */}
          {connectionDrag && (
            <g>
              <line
                x1={connectionDrag.fromX}
                y1={connectionDrag.fromY}
                x2={connectionDrag.mouseX}
                y2={connectionDrag.mouseY}
                stroke={THEME.accent}
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
            </g>
          )}

          {/* 节点 */}
          {nodes.map((n) => (
            <g key={n.id}>
              <NodeScaffold
                node={n}
                selected={selectedNodeId === n.id}
                onPointerDown={onNodePointerDown(n.id)}
              >
                <NodeContent node={n} refUrls={refUrlsMap[n.id] || []} onUpdate={(d) => updateNodeData(n.id, d)} />
              </NodeScaffold>
              {/* 端口 (左) */}
              {n.type !== 'output' && (
                <circle
                  cx={getHandlePos(n, 'left').x}
                  cy={getHandlePos(n, 'left').y}
                  r={selectedNodeId === n.id ? 8 : 6}
                  fill={THEME.accent}
                  stroke={THEME.bg}
                  strokeWidth={2}
                  style={{ cursor: 'crosshair' }}
                  onPointerDown={onHandlePointerDown(n.id, 'left')}
                />
              )}
              {/* 端口 (右) */}
              {n.type !== 'text' && (
                <circle
                  cx={getHandlePos(n, 'right').x}
                  cy={getHandlePos(n, 'right').y}
                  r={selectedNodeId === n.id ? 8 : 6}
                  fill={THEME.success}
                  stroke={THEME.bg}
                  strokeWidth={2}
                  style={{ cursor: 'crosshair' }}
                  onPointerDown={onHandlePointerDown(n.id, 'right')}
                />
              )}
              {/* 端口 (in-N, merge) */}
              {n.type === 'merge' && Array.from({ length: n.data.inputs || 2 }).map((_, i) => {
                const p = getHandlePos(n, `in-${i}` as any);
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={selectedNodeId === n.id ? 7 : 5}
                    fill={THEME.accent}
                    stroke={THEME.bg}
                    strokeWidth={2}
                    style={{ cursor: 'crosshair' }}
                    onPointerDown={onHandlePointerDown(n.id, `in-${i}` as any)}
                  />
                );
              })}
            </g>
          ))}

          {/* 端口 snap target halo (60px 吸附时) */}
          {connectionDrag?.snapTarget && (
            <circle
              cx={connectionDrag.snapTarget.x}
              cy={connectionDrag.snapTarget.y}
              r={10}
              fill="none"
              stroke={THEME.accent}
              strokeWidth={2}
              opacity={0.5}
            />
          )}

          {/* arrowhead 定义 */}
          <defs>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={THEME.accent} />
            </marker>
          </defs>
        </g>
      </svg>

      {/* 节点菜单 (双击空白) */}
      {menu && (
        <>
          <div
            onClick={() => setMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 19 }}
          />
          <div
            style={{
              position: 'absolute',
              left: menu.x,
              top: menu.y,
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 20,
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {NODE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => addNode(t)}
                style={{
                  background: 'transparent', border: 'none', color: '#fff',
                  padding: '8px 12px', textAlign: 'left', borderRadius: 4, cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ color: THEME.nodeTypeColor[t] }}>{NODE_ICONS[t]}</span>
                {NODE_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 底部状态条 */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 28, background: 'rgba(0, 0, 0, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex', alignItems: 'center', padding: '0 16px',
          gap: 16, zIndex: 10, fontSize: 11, color: THEME.textTertiary,
        }}
      >
        <span>节点: {nodes.length}</span>
        <span>连线: {edges.length}</span>
        <span style={{ color: THEME.success }}>●  SVG 自研 v3</span>
        <span style={{ color: THEME.success }}>●  6 节点</span>
        <span style={{ color: THEME.success }}>●  i2i 自动</span>
        <span style={{ color: THEME.success }}>●  localStorage</span>
        <span style={{ color: THEME.success }}>●  端口 + 60px snap</span>
        <span style={{ color: THEME.success }}>●  RunButton stub</span>
        <span style={{ color: THEME.textTertiary }}>viewport: ({Math.round(viewport.x)},{Math.round(viewport.y)}) zoom {Math.round(viewport.zoom * 100)}%</span>
      </div>
    </div>
  );
}
