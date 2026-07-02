'use client';

import { useCallback, useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useStore,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type EdgeProps,
  type ConnectionLineComponent,
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
  // 06-30 修复: 不能用 overflow: hidden — React Flow 的 Handle 是绝对定位,
  // 一半在节点内一半在节点外, overflow:hidden 会裁剪外部热区,
  // 导致鼠标松开时无法命中 Handle → onConnect 不触发 → 连线消失
  overflow: 'visible',
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

// 节点图标
const TYPE_LABELS: Record<string, string> = {
  text: '文字',
  image: '图片',
  'video-gen': '视频生成',
  'audio-gen': '音频生成',
  merge: '合并',
  output: '成片输出',
};

// 模型 / 比例 / 画质 配置 (06-30 06:25 加: TapNow/LibTV 风格节点内设置)
const AI_MODELS: Record<string, { id: string; label: string; cost: number }[]> = {
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

// 节点更新回调类型 (从主组件传入)
type UpdateDataFn = (id: string, data: Record<string, unknown>) => void;

// 共享: 输入框 (节点内 inline 编辑, 立即同步到 node.data)
function NodeTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      data-node-input="1"
      defaultValue={value}
      key={value /* 受控,刷新同步 external value */}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      placeholder={placeholder || '描述你想要生成的内容…'}
      rows={rows}
      style={{
        width: '100%',
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

// 共享: 模型 chip (点开下拉,单选)
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
      data-node-input="1"
      style={{ position: 'relative' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '4px 8px',
          background: 'rgba(110,140,214,0.15)',
          border: '1px solid rgba(110,140,214,0.3)',
          borderRadius: 6,
          color: '#6e8cd6',
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        ✦ {current.label} <span style={{ opacity: 0.6 }}>·{current.cost}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: 160,
            background: 'rgba(20,20,22,0.98)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: 4,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
          }}
        >
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              style={{
                display: 'flex',
                width: '100%',
                padding: '6px 10px',
                background: m.id === value ? 'rgba(110,140,214,0.2)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontSize: 12,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ flex: 1 }}>{m.label}</span>
              <span style={{ opacity: 0.5 }}>{m.cost}积</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 共享: 选项组 (水平 chip, 单选)
function ChipRow({
  options,
  value,
  onChange,
  prefix,
}: {
  options: string[] | number[];
  value: string | number;
  onChange: (v: any) => void;
  prefix?: string;
}) {
  return (
    <div
      data-node-input="1"
      style={{
        display: 'flex',
        gap: 4,
        padding: 2,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {options.map((o) => {
        const label = String(o);
        const active = label === String(value);
        return (
          <button
            key={label}
            onClick={() => onChange(o)}
            style={{
              flex: 1,
              padding: '3px 6px',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {prefix && <span style={{ opacity: 0.5 }}>{prefix}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// 共享: 节点底部运行按钮 (06-30 加: TapNow 风格圆形)
function RunButton({
  cost,
  status,
  onRun,
}: {
  cost: number;
  status?: 'idle' | 'running' | 'done' | 'error';
  onRun: () => void;
}) {
  const running = status === 'running';
  return (
    <div
      data-node-input="1"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 980,
          fontSize: 11,
          color: '#fff',
        }}
      >
        <span style={{ opacity: 0.6, fontSize: 10 }}>◆</span>
        <span style={{ fontWeight: 500 }}>{cost}</span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={onRun}
        disabled={running}
        style={{
          width: 28, height: 28,
          background: running ? 'rgba(255,255,255,0.1)' : '#fff',
          border: 'none',
          borderRadius: '50%',
          color: running ? '#fff' : '#0a0a0a',
          fontSize: 13,
          cursor: running ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {running ? '⋯' : '↑'}
      </button>
    </div>
  );
}

// 07-01 共享: 节点 scaffold (新 UI, 跟 image 节点一致)
// 3 段独立: 顶部浮动 (top) + 裸 main (mainContent) + 底部 op-panel (bottom)
// - 自研 PortDot (取代 React Flow Handle): left=input, right=output
// - 默认 subtle 永远可见 (老画布 06-29 修复风格)
// - selected 时高亮 (蓝紫发光), isBeingDraggedTo 时绿光 (有人正拖过来)
// - 07-02 改: 通过 NodeInteractionContext 拿 onPortMouseDown + isBeingDraggedTo
//   (不再用 props, 5 个调用点不用改)
function NodeScaffold({
  id,
  selected,
  mainWidth,
  mainHeight,
  mainContent,         // main area 内容 (textarea / video / audio / placeholder)
  topSection,          // 可选: 顶部浮动 (image 的 upload 按钮)
  bottomSection,       // 可选: 底部独立 panel (op-panel when selected)
  badge,               // 可选: 角标 (image 的 i2i 模式)
  mainStyle = {},      // main area 额外样式
  isBeingDraggedTo: propIsDragged,  // 可选: 强制覆盖 context 值 (OutputNode 用 false)
  showPorts = true,    // 可选: 是否显示 PortDot (OutputNode 用 false)
}: {
  id: string;
  selected: boolean;
  mainWidth: number;
  mainHeight: number;
  mainContent: React.ReactNode;
  topSection?: React.ReactNode;
  bottomSection?: React.ReactNode;
  badge?: React.ReactNode;
  mainStyle?: React.CSSProperties;
  isBeingDraggedTo?: boolean;
  showPorts?: boolean;
}) {
  const { onPortMouseDown, isBeingDraggedTo: ctxIsDragged } = useContext(NodeInteractionContext);
  const isBeingDraggedTo = propIsDragged !== undefined ? propIsDragged : ctxIsDragged(id);
  // 07-01: 强制 React Flow 重新测量节点尺寸
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);
  return (
    <div
      data-node-scaffold="1"
      style={{
        position: 'relative',
        background: 'transparent',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: mainWidth,
        width: 'fit-content',
      }}
    >
      {topSection}

      <div
        data-main-bare="1"
        style={{
          position: 'relative',
          width: mainWidth,
          height: mainHeight,
          background: 'rgba(0,0,0,0.3)',
          border: isBeingDraggedTo
            ? '2px solid #6e8cd6'
            : (selected ? '1.5px solid rgba(110,140,214,0.7)' : '1px solid rgba(255,255,255,0.08)'),
          borderRadius: 10,
          boxShadow: isBeingDraggedTo ? '0 0 0 3px rgba(110,140,214,0.3), 0 2px 12px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.12s',
          ...mainStyle,
        }}
      >
        {badge}
        {mainContent}

        {/* 07-02 自研 PortDot — 取代 React Flow <Handle/> 视觉 */}
        <PortDot
          nodeId={id}
          portId="left"
          isInput
          selected={selected}
          isBeingDraggedTo={isBeingDraggedTo}
          onMouseDown={(e) => onPortMouseDown(id, 'left', true, e)}
        />
        <PortDot
          nodeId={id}
          portId="right"
          isInput={false}
          selected={selected}
          isBeingDraggedTo={isBeingDraggedTo}
          onMouseDown={(e) => onPortMouseDown(id, 'right', false, e)}
        />

        {/* 07-02 隐形 React Flow Handle — 只注册 handle id 到 React Flow store (避 #008)
            视觉由自研 PortDot 接管, 这里 size=0 + opacity=0 + pointerEvents=none */}
        <Handle
          type="target"
          id="left"
          position={Position.Left}
          isConnectable={false}
          isConnectableStart={false}
          isConnectableEnd={false}
          style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
        />
        <Handle
          type="source"
          id="right"
          position={Position.Right}
          isConnectable={false}
          isConnectableStart={false}
          isConnectableEnd={false}
          style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
        />
      </div>

      {bottomSection}
    </div>
  );
}

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
// 1. TextNode (06-30 重设计: inline 编辑 + 模型 + 数量 + 运行按钮)
// ---------------------------------------------------------------------
type TextNodeData = {
  text?: string;
  prompt?: string;
  model?: string;
  quantity?: number;
  status?: 'idle' | 'running' | 'done' | 'error';
  errorMsg?: string;
};
function TextNode({ data, selected, id }: NodeProps<Node<TextNodeData>>) {
  const update = useNodeUpdate();
  // 07-02: useConnection 已删, isBeingDraggedTo 通过 NodeScaffold / ImageNode 内部 useContext 拿
  const model = data.model || 'deepseek';
  const modelInfo = AI_MODELS.text.find((m) => m.id === model) || AI_MODELS.text[0];
  const quantity = data.quantity || 1;
  return (
    <NodeScaffold
      id={id}
      selected={selected}
      mainWidth={300}
      mainHeight={140}
      mainContent={
        <NodeTextarea
          value={data.prompt || ''}
          onChange={(v) => update(id, { prompt: v, text: v })}
          placeholder="讲讲这款现代极简三人沙发…"
          rows={5}
        />
      }
      bottomSection={selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            width: 300,
            padding: '12px 14px 14px',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {/* Section 1: 工具行 ✨ + ↗ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={(e) => e.stopPropagation()} title="AI 优化 (TODO)" style={toolBtnStyle}>✨</button>
              <button onClick={(e) => e.stopPropagation()} title="预设 (TODO)" style={toolBtnStyle}>+</button>
            </div>
            <button onClick={(e) => e.stopPropagation()} title="展开 (TODO)" style={toolBtnStyle}>↗</button>
          </div>
          {/* Section 3: chips + cost + run */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <ModelChip models={AI_MODELS.text} value={model} onChange={(v) => update(id, { model: v })} />
              <ChipRow options={[1, 2, 4]} value={quantity} onChange={(v) => update(id, { quantity: Number(v) })} prefix="×" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              {data.errorMsg && <span style={{ fontSize: 10, color: '#ff6b6b', marginRight: 'auto' }}>⚠ {data.errorMsg}</span>}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>◆{modelInfo.cost * quantity}</span>
              <RunButton cost={modelInfo.cost * quantity} status={data.status} onRun={() => update(id, { status: 'running' })} />
            </div>
          </div>
        </div>
      )}
    />
  );
}

// 07-01 工具按钮统一样式 (op-panel 内的 ✨ + ↗)
const toolBtnStyle: React.CSSProperties = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.75)',
  cursor: 'pointer',
  fontSize: 14,
};

// ---------------------------------------------------------------------
// 2. ImageNode (06-30 重设计: prompt + 模型 + 比例 + 画质 + 数量 + 运行)
// 07-01 加 i2i 数据流: 读上游 image 节点的 url → run-image referenceUrls
// ---------------------------------------------------------------------
type ImageNodeData = {
  url?: string;
  outputUrl?: string;       // i2i 输出 url (持久化字段)
  outputUrls?: string[];    // 多张候选
  selectedOutputUrl?: string; // 用户在 overlay 选中的 (i2i 上游优先用这个)
  refCount?: number;        // 本次用了多少张参考图 (UI 展示)
  prompt?: string;
  model?: string;
  aspect?: string;
  quality?: string;
  quantity?: number;
  status?: 'idle' | 'running' | 'done' | 'error';
  errorMsg?: string;
};

// 07-01 新增: 读上游所有 image 节点的 url (i2i 数据流)
// 不用 useStore 重订阅每条边/节点, 用 shallow 比较, 只在 edges/nodes 变化时 re-render
function useUpstreamUrls(nodeId: string): string[] {
  return useStore((s) => {
    const incoming = s.edges.filter((e: Edge) => e.target === nodeId);
    if (incoming.length === 0) return [];
    const urls: string[] = [];
    for (const e of incoming) {
      const src = s.nodes.find((n: Node) => n.id === e.source);
      if (!src) continue;
      // 上游 url 字段优先级: selectedOutputUrl > outputUrl > url
      const d: any = src.data || {};
      const u = d.selectedOutputUrl || d.outputUrl || d.url;
      if (u) urls.push(u);
    }
    return urls;
  });
}

function ImageNode({ data, selected, id }: NodeProps<Node<ImageNodeData>>) {
  const update = useNodeUpdate();
  const fileInputRef = useRef<HTMLInputElement>(null);  // 07-01 新增: 本地上传
  const upstreamUrls = useUpstreamUrls(id);  // 07-01: 读上游
  // 07-02: 自研, ImageNode 自己用 (border + boxShadow 高亮拖过来的线)
  const { onPortMouseDown, isBeingDraggedTo: ctxIsDragged } = useContext(NodeInteractionContext);
  const isBeingDraggedTo = ctxIsDragged(id);
  const model = data.model || 'jimeng';
  const modelInfo = AI_MODELS.image.find((m) => m.id === model) || AI_MODELS.image[0];
  const aspect = data.aspect || '自适应';
  const quality = data.quality || '2K';
  const quantity = data.quantity || 1;
  const isI2I = upstreamUrls.length > 0;

  // 07-01 新增: 真正调用 run-image API, 带上 referenceUrls
  const onRun = useCallback(async () => {
    if (data.status === 'running') return;  // 防重入
    update(id, { status: 'running', errorMsg: undefined });
    try {
      const res = await fetch('/api/canvas/run-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt || '',
          model,
          aspect,
          quality,
          quantity,
          referenceUrls: isI2I ? upstreamUrls : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }
      // 写 url + outputUrl + refCount (UI 显示 + i2i 上游用)
      update(id, {
        url: json.outputUrl,
        outputUrl: json.outputUrl,
        outputUrls: json.outputUrls || [json.outputUrl],
        selectedOutputUrl: json.outputUrl,
        refCount: isI2I ? upstreamUrls.length : 0,
        status: 'done',
      });
    } catch (e: any) {
      console.error('[ImageNode run]', id, e);
      update(id, { status: 'error', errorMsg: e?.message || '生成失败' });
    }
  }, [id, data.prompt, data.status, model, aspect, quality, quantity, isI2I, upstreamUrls, update]);

  // 07-01 新增: 本地上传 (用上传 API, 不会走生成)
  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';  // reset 允许同文件再选
    if (!file) return;
    update(id, { status: 'running', errorMsg: undefined });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/canvas/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }
      // 上传成功 → 设 url (走完整 i2i 输出字段, 让下游 referenceUrls 能拿到)
      update(id, {
        url: json.url,
        outputUrl: json.url,
        outputUrls: [json.url],
        selectedOutputUrl: json.url,
        refCount: 0,
        status: 'done',
      });
    } catch (e: any) {
      console.error('[ImageNode upload]', id, e);
      update(id, { status: 'error', errorMsg: e?.message || '上传失败' });
    }
  }, [id, update]);

  return (
    // 07-01 重做 v2: 3 段独立 panel, op-panel 居中, + 端口弹出
    // - 默认 (未选中): 只显示裸图
    // - 选中: 上方浮出 upload 按钮 + 下方浮出 op-panel + 左右 + 端口弹出图外
    <div
      data-image-node="1"
      style={{
        position: 'relative',
        background: 'transparent',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',  // 关键: 让 image 和 op-panel 水平居中对齐
        // 不要 border/box-shadow, 让 3 段看着独立
      }}
    >
      {/* ============== Section 1: 上传按钮 (上方浮动, 仅 selected) ============== */}
      {selected && (
        <div
          data-upload-panel="1"
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 12px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.9)',
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(110,140,214,0.25)'; e.currentTarget.style.borderColor = 'rgba(110,140,214,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            title="本地图片上传, 作为参考图 (i2i 上游)"
          >
            <span style={{ fontSize: 13 }}>↑</span> 上传
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onUpload}
            style={{ display: 'none' }}
            data-testid={`upload-input-${id}`}
          />
        </div>
      )}

      {/* ============== Section 2: 裸图 (始终显示, 没 chrome) ============== */}
      <div
        data-image-bare="1"
        style={{
          position: 'relative',
          width: 300,
          height: 220,
          background: 'rgba(0,0,0,0.3)',
          border: isBeingDraggedTo
            ? '2px solid #6e8cd6'  // 拖线过来高亮
            : (selected ? '1.5px solid rgba(110,140,214,0.7)' : '1px solid rgba(255,255,255,0.08)'),
          borderRadius: 10,
          boxShadow: isBeingDraggedTo ? '0 0 0 3px rgba(110,140,214,0.3), 0 2px 12px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.12s',
          // overflow 不设 hidden, 让 + 端口能弹到图外
        }}
      >
        {/* i2i badge (顶部, 始终) */}
        {isI2I && (
          <div
            data-i2i-badge="1"
            style={{
              position: 'absolute',
              top: 6, left: 6,
              zIndex: 2,
              fontSize: 10,
              color: '#6e8cd6',
              background: 'rgba(110,140,214,0.18)',
              border: '1px solid rgba(110,140,214,0.5)',
              borderRadius: 3,
              padding: '2px 6px',
              fontWeight: 500,
            }}
            title={`将使用 ${upstreamUrls.length} 张上游图作为 i2i 参考`}
          >
            🔗 i2i · {upstreamUrls.length}
          </div>
        )}

        {/* 图片 / 占位框 (固定 300x220, + borderRadius 配父容器) */}
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 10,
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 12,
          }}>
            <span style={{ fontSize: 36, opacity: 0.5 }}>🖼</span>
            <span>{isI2I ? 'i2i 模式 (用上游图当参考)' : '待生成 / 上传图片'}</span>
          </div>
        )}
        {/* 07-02 自研 PortDot — 取代 React Flow <Handle/> 视觉 */}
        <PortDot
          nodeId={id}
          portId="left"
          isInput
          selected={selected}
          isBeingDraggedTo={isBeingDraggedTo}
          onMouseDown={(e) => onPortMouseDown(id, 'left', true, e)}
        />
        <PortDot
          nodeId={id}
          portId="right"
          isInput={false}
          selected={selected}
          isBeingDraggedTo={isBeingDraggedTo}
          onMouseDown={(e) => onPortMouseDown(id, 'right', false, e)}
        />

        {/* 07-02 隐形 React Flow Handle — 只注册 handle id 到 React Flow store (避 #008)
            视觉由自研 PortDot 接管, 这里 size=0 + opacity=0 + pointerEvents=none */}
        <Handle
          type="target"
          id="left"
          position={Position.Left}
          isConnectable={false}
          isConnectableStart={false}
          isConnectableEnd={false}
          style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
        />
        <Handle
          type="source"
          id="right"
          position={Position.Right}
          isConnectable={false}
          isConnectableStart={false}
          isConnectableEnd={false}
          style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none', background: 'transparent' }}
        />
      </div>

      {/* ============== Section 3: 操作台 (下方独立 panel, 仅 selected) ============== */}
      {selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            width: 300,  // 跟图同宽, 居中对齐 (parent flex column + alignItems: center)
            padding: '12px 14px 14px',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,  // 3 段之间的间隔
          }}
        >
          {/* ========== Section 1: 工具行 (左上: ✨ +, 右上: ↗) ========== */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={(e) => e.stopPropagation()}
                title="AI 优化提示词 (TODO)"
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >✨</button>
              <button
                onClick={(e) => e.stopPropagation()}
                title="预设 (TODO)"
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >+</button>
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              title="全屏展开 (TODO)"
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontSize: 15,
              }}
            >↗</button>
          </div>

          {/* ========== Section 2: 提示词 (大 textarea) ========== */}
          <NodeTextarea
            value={data.prompt || ''}
            onChange={(v) => update(id, { prompt: v })}
            placeholder="描述我们要生成的内容"
            rows={4}
          />

          {/* ========== Section 3: 模型 + 比例 + 画质 + 数量 + cost + run ========== */}
          <div>
            {/* 上行: 模型 + 比例 + 画质 + 数量 chips */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 5,
            }}>
              <ModelChip
                models={AI_MODELS.image}
                value={model}
                onChange={(v) => update(id, { model: v })}
              />
              <ChipRow
                options={ASPECTS.slice(0, 4)}
                value={aspect}
                onChange={(v) => update(id, { aspect: String(v) })}
              />
              <ChipRow
                options={QUALITIES.slice(0, 3)}
                value={quality}
                onChange={(v) => update(id, { quality: String(v) })}
              />
              <ChipRow
                options={[1, 2, 4]}
                value={quantity}
                onChange={(v) => update(id, { quantity: Number(v) })}
                prefix="×"
              />
            </div>

            {/* 下行: cost + run (右对齐) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 8,
            }}>
              {data.errorMsg && (
                <span style={{ fontSize: 10, color: '#ff6b6b', marginRight: 'auto' }}>⚠ {data.errorMsg}</span>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>
                ◆{modelInfo.cost * quantity}
              </span>
              <RunButton
                cost={modelInfo.cost * quantity}
                status={data.status}
                onRun={onRun}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// 3. VideoGenNode (06-30 重设计: prompt + 模型 + 模式 + 比例 + 时长 + 数量 + 运行)
// ---------------------------------------------------------------------
type VideoGenData = {
  url?: string;
  prompt?: string;
  model?: string;
  mode?: '首尾帧' | '参考图片';
  aspect?: string;
  duration?: number;
  audio?: '开启' | '静音';
  quantity?: number;
  status?: 'idle' | 'running' | 'done' | 'error';
  errorMsg?: string;
};
function VideoGenNode({ data, selected, id }: NodeProps<Node<VideoGenData>>) {
  const update = useNodeUpdate();
  // 07-02: useConnection 已删, isBeingDraggedTo 通过 NodeScaffold / ImageNode 内部 useContext 拿
  const model = data.model || 'seedance';
  const modelInfo = AI_MODELS['video-gen'].find((m) => m.id === model) || AI_MODELS['video-gen'][0];
  const mode = data.mode || '首尾帧';
  const aspect = data.aspect || '自适应';
  const duration = data.duration || 5;
  const audio = data.audio || '静音';
  const quantity = data.quantity || 1;
  // main area 内容: 视频 / 占位
  const mainContent = (
    <>
      {data.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <video src={data.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
      ) : data.status === 'running' ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: '#6e8cd6', fontSize: 12,
          animation: 'damaiRunPulse 1.1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 36, opacity: 0.6 }}>▶</span>
          <span>生成中…</span>
        </div>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: 'rgba(255,255,255,0.35)', fontSize: 12,
        }}>
          <span style={{ fontSize: 36, opacity: 0.5 }}>🎬</span>
          <span>待生成视频</span>
        </div>
      )}
    </>
  );
  return (
    <NodeScaffold
      id={id}
      selected={selected}
      mainWidth={300}
      mainHeight={200}
      mainContent={mainContent}
      bottomSection={selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            width: 300,
            padding: '12px 14px 14px',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {/* Section 1: 工具行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={(e) => e.stopPropagation()} title="AI 优化 (TODO)" style={toolBtnStyle}>✨</button>
              <button onClick={(e) => e.stopPropagation()} title="预设 (TODO)" style={toolBtnStyle}>+</button>
            </div>
            <button onClick={(e) => e.stopPropagation()} title="展开 (TODO)" style={toolBtnStyle}>↗</button>
          </div>
          {/* Section 2: prompt textarea */}
          <NodeTextarea
            value={data.prompt || ''}
            onChange={(v) => update(id, { prompt: v })}
            placeholder="镜头缓慢推近, 描述房间全景走位…"
            rows={3}
          />
          {/* Section 3: chips + cost + run */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <ModelChip models={AI_MODELS['video-gen']} value={model} onChange={(v) => update(id, { model: v })} />
              <ChipRow options={['首尾帧', '参考图片']} value={mode} onChange={(v) => update(id, { mode: v as any })} />
              <ChipRow options={ASPECTS.slice(0, 4)} value={aspect} onChange={(v) => update(id, { aspect: String(v) })} />
              <ChipRow options={DURATIONS.slice(0, 5)} value={duration} onChange={(v) => update(id, { duration: Number(v) })} />
              <ChipRow options={['开启', '静音']} value={audio} onChange={(v) => update(id, { audio: v as any })} />
              <ChipRow options={[1, 2, 4]} value={quantity} onChange={(v) => update(id, { quantity: Number(v) })} prefix="×" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              {data.errorMsg && <span style={{ fontSize: 10, color: '#ff6b6b', marginRight: 'auto' }}>⚠ {data.errorMsg}</span>}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>◆{modelInfo.cost * quantity * (duration / 5)}</span>
              <RunButton cost={modelInfo.cost * quantity * (duration / 5)} status={data.status} onRun={() => update(id, { status: 'running' })} />
            </div>
          </div>
        </div>
      )}
    />
  );
}

// ---------------------------------------------------------------------
// 4. AudioGenNode (06-30 重设计: prompt + 模型 + 类型 + 运行)
// ---------------------------------------------------------------------
type AudioGenData = {
  url?: string;
  prompt?: string;
  model?: string;
  audioType?: '音乐' | '歌词' | '自适应' | '纯音乐';
  status?: 'idle' | 'running' | 'done' | 'error';
  errorMsg?: string;
};
function AudioGenNode({ data, selected, id }: NodeProps<Node<AudioGenData>>) {
  const update = useNodeUpdate();
  // 07-02: useConnection 已删, isBeingDraggedTo 通过 NodeScaffold / ImageNode 内部 useContext 拿
  const model = data.model || 'music2';
  const modelInfo = AI_MODELS['audio-gen'].find((m) => m.id === model) || AI_MODELS['audio-gen'][0];
  const audioType = data.audioType || '纯音乐';
  // main area: 音频 / 占位
  const mainContent = (
    <>
      {data.url ? (
        <audio src={data.url} controls style={{ width: '100%' }} />
      ) : data.status === 'running' ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: '#6e8cd6', fontSize: 12,
          animation: 'damaiRunPulse 1.1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 36, opacity: 0.6 }}>♪</span>
          <span>生成中…</span>
        </div>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: 'rgba(255,255,255,0.35)', fontSize: 12,
        }}>
          <span style={{ fontSize: 36, opacity: 0.5 }}>🎵</span>
          <span>待生成音频</span>
        </div>
      )}
    </>
  );
  return (
    <NodeScaffold
      id={id}
      selected={selected}
      mainWidth={300}
      mainHeight={90}
      mainContent={mainContent}
      bottomSection={selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            width: 300,
            padding: '12px 14px 14px',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {/* Section 1: 工具行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={(e) => e.stopPropagation()} title="AI 优化 (TODO)" style={toolBtnStyle}>✨</button>
              <button onClick={(e) => e.stopPropagation()} title="预设 (TODO)" style={toolBtnStyle}>+</button>
            </div>
            <button onClick={(e) => e.stopPropagation()} title="展开 (TODO)" style={toolBtnStyle}>↗</button>
          </div>
          {/* Section 2: prompt textarea */}
          <NodeTextarea
            value={data.prompt || ''}
            onChange={(v) => update(id, { prompt: v })}
            placeholder="轻柔钢琴 + 雨声白噪音, 适合家居展示…"
            rows={3}
          />
          {/* Section 3: chips + cost + run */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <ModelChip models={AI_MODELS['audio-gen']} value={model} onChange={(v) => update(id, { model: v })} />
              <ChipRow options={['音乐', '歌词', '自适应', '纯音乐']} value={audioType} onChange={(v) => update(id, { audioType: v as any })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              {data.errorMsg && <span style={{ fontSize: 10, color: '#ff6b6b', marginRight: 'auto' }}>⚠ {data.errorMsg}</span>}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>◆{modelInfo.cost}</span>
              <RunButton cost={modelInfo.cost} status={data.status} onRun={() => update(id, { status: 'running' })} />
            </div>
          </div>
        </div>
      )}
    />
  );
}

// ---------------------------------------------------------------------
// 5. MergeNode (06-30 重设计: NodeShell + 输入数 chip)
// ---------------------------------------------------------------------
type MergeData = { inputs?: number; label?: string };
function MergeNode({ data, selected, id }: NodeProps<Node<MergeData>>) {
  const update = useNodeUpdate();
  // 07-02: useConnection 已删, isBeingDraggedTo 通过 NodeScaffold / ImageNode 内部 useContext 拿
  const inputCount = data.inputs || 2;
  // main area: 输入口可视化 + 标签
  const mainContent = (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12,
    }}>
      <span style={{ fontSize: 36, opacity: 0.5 }}>⊕</span>
      <span>合并多路输入 · {inputCount} 路</span>
    </div>
  );
  // 多个 input handle (每个输入口一个, 左侧排列) — 跟主 snap handle 共存
  const inputHandles = Array.from({ length: inputCount }).map((_, i) => (
    <Handle
      key={`in-${i}`}
      type="source"
      position={Position.Left}
      id={`in-${i}`}
      isConnectableStart={true}
      isConnectableEnd={true}
      style={{
        background: PORT_BG, width: 14, height: 14,
        top: `${20 + (i + 1) * (60 / (inputCount + 1))}%`,
        border: '1.5px solid rgba(0,0,0,0.4)',
        zIndex: 11,  // 比 snap (z=1) 和小 + (z=10) 都高
        cursor: 'crosshair',
      }}
    />
  ));
  return (
    <NodeScaffold
      id={id}
      selected={selected}
      mainWidth={300}
      mainHeight={120}
      mainContent={
        <>
          {inputHandles}
          {mainContent}
        </>
      }
      bottomSection={selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 14,
            width: 300,
            padding: '12px 14px 14px',
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {/* Section 1: 工具行 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={(e) => e.stopPropagation()} title="设置 (TODO)" style={toolBtnStyle}>⚙</button>
            </div>
            <button onClick={(e) => e.stopPropagation()} title="展开 (TODO)" style={toolBtnStyle}>↗</button>
          </div>
          {/* Section 3: 输入数 chips (merge 节点无 run 按钮) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>输入数:</span>
              <ChipRow options={[2, 3, 4]} value={inputCount} onChange={(v) => update(id, { inputs: Number(v) })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{inputCount} 路输入 · 1 路输出</span>
            </div>
          </div>
        </div>
      )}
    />
  );
}

// ---------------------------------------------------------------------
// 6. OutputNode (06-30 重设计: 只有 input, 显示成片)
// ---------------------------------------------------------------------
type OutputData = { url?: string; status?: 'idle' | 'running' | 'done'; label?: string };
function OutputNode({ data, selected, id }: NodeProps<Node<OutputData>>) {
  // main area: 成片视频 / 占位
  const mainContent = (
    <>
      {data.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <video src={data.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
      ) : data.status === 'running' ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: '#6e8cd6', fontSize: 12,
          animation: 'damaiRunPulse 1.1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 36, opacity: 0.6 }}>◉</span>
          <span>合成中…</span>
        </div>
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          color: 'rgba(255,255,255,0.35)', fontSize: 12,
        }}>
          <span style={{ fontSize: 36, opacity: 0.5 }}>◉</span>
          <span>待合成成片</span>
        </div>
      )}
    </>
  );
  return (
    <NodeScaffold
      id={id}
      selected={selected}
      isBeingDraggedTo={false}  // 终端节点, 不接受新连接
      mainWidth={300}
      mainHeight={200}
      showPorts={false}  // 终端节点, 没有 right + 端口
      mainContent={mainContent}
    />
  );
}

// 节点更新 Context — 06-30 加: 节点组件通过 useNodeUpdate hook 拿 updateNodeData
//   绕过 ReactFlow NodeProps 只能固化的限制
const NodeUpdateContext = createContext<UpdateDataFn | null>(null);
function useNodeUpdate(): UpdateDataFn {
  const ctx = useContext(NodeUpdateContext);
  if (!ctx) throw new Error('useNodeUpdate must be used within CanvasFlowEditor');
  return ctx;
}

// nodeTypes object — 06-30 改: 各节点用 Context 拿 update
const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
  merge: MergeNode,
  output: OutputNode,
};

// ---------------------------------------------------------------------
// 06-30 修复: 拖拽连线时的视觉反馈 (ConnectionLine)
// 没有这个组件, 拖拽过程中看不到临时连线, 用户以为连线"消失了"
// ---------------------------------------------------------------------
const ConnectionLine: ConnectionLineComponent = ({
  fromX, fromY, toX, toY, connectionStatus,
}) => {
  // connectionStatus: 'valid' | 'invalid' | undefined
  const isValid = connectionStatus === 'valid';
  const isInvalid = connectionStatus === 'invalid';
  // 07-01 修复: 拖线中 visible 跟 TapNow 一样 — 蓝紫色, 不灰白看不见
  //   之前灰白色 stroke=0.35 在黑底完全不可见, 用户以为拖线消失
  const stroke = isValid
    ? 'rgba(110,140,214,1)'             // 拖到有效 target → 蓝色高亮
    : isInvalid
      ? 'rgba(255,90,90,0.85)'          // 拖到无效位置 → 红色
      : 'rgba(110,140,214,0.55)';       // 拖拽中 → 蓝紫半透明 (07-01: 之前白 0.35 看不见)
  const strokeWidth = isValid ? 3 : 2.5;
  return (
    <g>
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        d={`M ${fromX} ${fromY} C ${fromX + (toX - fromX) / 2} ${fromY}, ${fromX + (toX - fromX) / 2} ${toY}, ${toX} ${toY}`}
      />
      {/* 起点圈 (拖出节点位置) */}
      <circle
        cx={fromX}
        cy={fromY}
        r={4}
        fill={PORT_BG}
        stroke="#0a0a0a"
        strokeWidth={1.5}
      />
      {/* 终点圆点 (鼠标位置) — 更大更好看 */}
      <circle
        cx={toX}
        cy={toY}
        r={isValid ? 7 : 6}
        fill={isValid ? '#6e8cd6' : 'rgba(110,140,214,0.5)'}
        stroke="#0a0a0a"
        strokeWidth={1.5}
      />
    </g>
  );
};

// =====================================================================
// 07-02 自研连接线系统 (老画布 CanvasEditor.old.tsx 移植, 替换 React Flow 默认)
// - PortDot: 自研 div 端口 (取代 React Flow <Handle/>)
// - ConnectionPath: cubic bezier + 箭头
// - SelfDrawnEdge: React Flow 自定义 edge 渲染 (通过 edgeTypes 接管)
// =====================================================================

const PORT_R = 11;  // 端口圆点半径 (跟老画布一致, 默认 subtle 时 22px 直径)

// 自研端口圆点 — 永远可见, 默认 subtle (老画布 06-29 修复风格)
// selected: 高亮 (蓝紫发光 + 缩放 1.4)
// isBeingDraggedTo: 绿光 (有人正拖线过来)
// 默认 subtle: 0.32 opacity, scale 0.65
function PortDot({
  nodeId,
  portId,
  isInput,
  selected,
  isBeingDraggedTo,
  onMouseDown,
}: {
  nodeId: string;
  portId: string;
  isInput: boolean;
  selected: boolean;
  isBeingDraggedTo: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const highlighted = isBeingDraggedTo;
  return (
    <div
      data-role="port"
      data-port-id={portId}
      data-port-node={nodeId}
      data-port-input={isInput ? '1' : '0'}
      data-port-type="default"
      onMouseDown={onMouseDown}
      title={isInput ? '输入' : '输出'}
      style={{
        position: 'absolute',
        ...(isInput ? { left: -PORT_R } : { right: -PORT_R }),
        top: '50%',
        // 07-02 修: 默认 visible (0.7 op + 0.95 scale), 之前 0.32 op + 0.65 scale = 14px 几乎看不见
        transform: `translateY(-50%) scale(${highlighted ? 1.4 : selected ? 1.1 : 0.95})`,
        width: PORT_R * 2,
        height: PORT_R * 2,
        borderRadius: '50%',
        background: highlighted
          ? 'rgba(110,140,214,0.95)'
          : selected
            ? 'rgba(110,140,214,0.55)'
            : '#1A1A1A',
        border: highlighted
          ? '1.5px solid rgba(140,220,160,1)'
          : selected
            ? '1.5px solid rgba(110,140,214,0.85)'
            : '1.5px solid rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '0.9rem',
        fontWeight: 300,
        cursor: isInput ? 'default' : 'grab',
        pointerEvents: 'auto',
        lineHeight: 1,
        zIndex: 10,
        opacity: highlighted || selected ? 1 : 0.7,
        transition: 'opacity 0.15s ease, transform 0.15s ease, background 0.1s ease, border-color 0.1s ease',
        boxShadow: highlighted
          ? '0 0 0 5px rgba(140,220,160,0.18), 0 0 16px rgba(140,220,160,0.55)'
          : selected
            ? '0 0 0 3px rgba(110,140,214,0.25)'
            : '0 0 0 2px rgba(0,0,0,0.4)',
      }}
    >
      +
    </div>
  );
}

// 自研连接线 cubic bezier + 箭头 (移植自 CanvasEditor.old.tsx line 2186-2219)
// dx/dy 自动判断水平/竖直主导, 平滑曲线 (NODE_W * 0.4 最小偏移避免圆弧)
const NODE_W = 300;  // 节点宽 (跟 NodeScaffold mainWidth 一致)
function makeConnectionPath(a: { x: number; y: number }, b: { x: number; y: number }, pending = false) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cp = Math.max(NODE_W * 0.4, Math.abs(dx) * 0.5, Math.abs(dy) * 0.5);
  let path: string;
  if (Math.abs(dx) >= Math.abs(dy)) {
    path = `M ${a.x} ${a.y} C ${a.x + cp} ${a.y}, ${b.x - cp} ${b.y}, ${b.x} ${b.y}`;
  } else {
    path = `M ${a.x} ${a.y} C ${a.x} ${a.y + Math.sign(dy) * cp}, ${b.x} ${b.y - Math.sign(dy) * cp}, ${b.x} ${b.y}`;
  }
  return { path, stroke: pending ? 'rgba(160, 200, 255, 0.9)' : 'rgba(110, 140, 214, 0.85)', strokeWidth: pending ? 2.5 : 2.5, markerEnd: pending ? 'url(#arrow-pending)' : 'url(#arrow)' };
}

// React Flow 自定义 edge 渲染 (通过 edgeTypes 接管默认 bezier)
// React Flow 给的 sourceX/Y/targetX/Y 是世界坐标
function SelfDrawnEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, selected } = props;
  const { path, stroke, strokeWidth, markerEnd } = makeConnectionPath(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY }
  );
  return (
    <g>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(220,230,245,0.7)" />
        </marker>
        <marker id="arrow-pending" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(160,200,255,0.85)" />
        </marker>
      </defs>
      <path
        d={path}
        stroke={selected ? '#6e8cd6' : stroke}
        strokeWidth={selected ? 2.8 : strokeWidth}
        fill="none"
        strokeLinecap="round"
        markerEnd={markerEnd}
      />
    </g>
  );
}

// React Flow edgeTypes 注册 (在 CanvasFlowEditorInner 之前定义)
const SELF_DRAWN_EDGE_TYPES = { selfDrawn: SelfDrawnEdge };

// 07-02 自研候选线 SVG overlay 组件
// 接收 pending state, 渲染从 fromNode port 到鼠标位置的虚线
// SVG 在 canvas-region 内 (绝对定位, 屏幕坐标)
function PendingLineOverlay({ pending }: { pending: {
  fromNode: string;
  fromPort: string;
  fromIsInput: boolean;
  mouseScreenX: number;
  mouseScreenY: number;
  hoveredPort: { nodeId: string; portId: string } | null;
} }) {
  // 找起点 port 的屏幕坐标 (用 DOM PortDot 元素)
  const portEl = document.querySelector(
    `[data-port-node="${pending.fromNode}"][data-port-id="${pending.fromPort}"][data-port-input="${pending.fromIsInput ? '1' : '0'}"]`
  ) as HTMLElement | null;
  if (!portEl) return null;
  const portRect = portEl.getBoundingClientRect();
  // SVG 容器是 data-canvas-region, 起点 = port 中心 - canvas-region 左上角
  const canvasRegion = document.querySelector('[data-canvas-region]') as HTMLElement | null;
  if (!canvasRegion) return null;
  const canvasRect = canvasRegion.getBoundingClientRect();
  const startX = portRect.left + portRect.width / 2 - canvasRect.left;
  const startY = portRect.top + portRect.height / 2 - canvasRect.top;
  const endX = pending.mouseScreenX - canvasRect.left;
  const endY = pending.mouseScreenY - canvasRect.top;
  const { path, stroke, strokeWidth, markerEnd } = makeConnectionPath(
    { x: startX, y: startY },
    { x: endX, y: endY },
    true
  );
  return (
    <svg
      data-pending-line="1"
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 40,
        overflow: 'visible',
      }}
    >
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={pending.hoveredPort ? undefined : '6 4'}
        markerEnd={markerEnd}
      />
    </svg>
  );
}

// =====================================================================
// 07-02 节点交互 context
// 让 6 个节点 (5 个 NodeScaffold + ImageNode) 共享 pending state + onPortMouseDown 回调
// 不传 props 避免每个调用点重复传 (NodeScaffold 内部 useContext 拿)
// =====================================================================
type NodeInteractionCtx = {
  onPortMouseDown: (nodeId: string, portId: string, isInput: boolean, e: React.MouseEvent) => void;
  isBeingDraggedTo: (id: string) => boolean;  // 给定 nodeId, 算它是否被拖线
};

const NodeInteractionContext = createContext<NodeInteractionCtx>({
  onPortMouseDown: () => {},
  isBeingDraggedTo: () => false,
});

// 共享 edge 样式 (bezier + 箭头 + hover 高亮)
//
// 【REVERT 兜底】(07-01 desktop bug 修复时加)
//   旧值 (如果新值出问题, 把下面 3 处改回去):
//     EDGE_STYLE.stroke        : 'rgba(255,255,255,0.55)'   ← 改回这个
//     EDGE_STYLE.strokeWidth   : 2                            ← 改回这个
//     markerEnd.color          : 'rgba(255,255,255,0.55)'   ← 改回这个
//
// 改因: 旧值在 NODE_BG='#1a1a1a' 黑底上对比度太低, desktop Chrome 上 2px 白 0.55
// 视觉上跟"消失"一样 (mobile 因屏幕小、节点稀疏不显眼). 07-01 改跟 ConnectionLine
// 同色蓝紫, 透明度 0.85, 跟拖线中候选线视觉一致, 跟选中态 (#6e8cd6 实色) 有层次区分.
const EDGE_STYLE: React.CSSProperties = {
  stroke: 'rgba(110,140,214,0.85)',
  strokeWidth: 2.5,
};
const EDGE_STYLE_SELECTED: React.CSSProperties = {
  stroke: '#6e8cd6',
  strokeWidth: 2.8,
};

const defaultEdgeOptions = {
  // 07-02: SelfDrawnEdge 自己画箭头, 不再需要 React Flow MarkerType
  type: 'selfDrawn',
  style: EDGE_STYLE,
};

// 初始节点: 07-01 改为空 (打开画布默认空白, 用户自己新建)
// 之前 6 个 demo 节点 (text/image/video/audio/merge/output) + 5 条 demo edge 全部去掉
// 重要: 现有画布的 localStorage state (key: `damai:canvas-v2:r2:${projectId}`) 不受影响,
// 那些有用户工作的画布会从 localStorage 恢复; 只有"全新"或"清过 localStorage"的画布是空的
const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

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

// ---------------------------------------------------------------------
// 06-30: Tapnow 风格节点生成菜单
// 触发: 左键双击空白画布 / 拖拽 handle 到空白画布松开
// ---------------------------------------------------------------------
type MenuMode = 'doubleclick' | 'connect';

const MENU_ITEMS: {
  type: string;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { type: 'text', label: '文本生成', subtitle: '脚本 / 卖点 / 品牌文案', icon: '≡' },
  { type: 'image', label: '图片生成', subtitle: '产品图 / 场景图 / 素材', icon: '▣' },
  { type: 'video-gen', label: '视频生成', subtitle: '动态展示 / 广告片', icon: '▶' },
  { type: 'audio-gen', label: '音频生成', subtitle: '背景音乐 / 配音', icon: '♪' },
  { type: 'merge', label: '合并', subtitle: '多路输入合成成片', icon: '⊕' },
  { type: 'output', label: '成片输出', subtitle: '最终导出', icon: '◉' },
];

function NodeCreationMenu({
  x,
  y,
  mode,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  mode: MenuMode;
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* 遮罩: 点空白关闭菜单 */}
      <div
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'transparent',
        }}
      />
      <div
        data-node-menu="1"
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex: 100,
          minWidth: 220,
          padding: '8px 6px',
          background: 'rgba(20,20,22,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            padding: '6px 10px 10px',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.3px',
          }}
        >
          {mode === 'connect' ? '选择要连接的节点' : '选择节点类型'}
        </div>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.type}
            data-node-menu-item={item.type}
            onClick={() => onSelect(item.type)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 7,
                background: 'rgba(110,140,214,0.12)',
                color: '#6e8cd6',
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }}>
                {item.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// =====================================================================
// 主画布 (Phase 3.5)
// =====================================================================
export default function CanvasFlowEditor({
  projectId,
  template,
}: {
  projectId: string;
  template?: string;
}) {
  return (
    <ReactFlowProvider>
      <CanvasFlowEditorInner projectId={projectId} template={template} />
    </ReactFlowProvider>
  );
}

function CanvasFlowEditorInner({
  projectId,
  template,
}: {
  projectId: string;
  template?: string;
}) {
  // 06-30 修复: 加版本号, 旧版坏数据 (缺 sourceHandle/markerEnd) 不会覆盖新 state
  const storageKey = useMemo(() => `damai:canvas-v2:r2:${projectId}`, [projectId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [credits] = useState(1000);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // 06-30: Tapnow 风格节点生成菜单状态
  const [nodeMenu, setNodeMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    mode: MenuMode;
    sourceNode?: string;
    sourceHandle?: string;
  }>({ show: false, x: 0, y: 0, mode: 'doubleclick' });

  // 07-02: useReactFlow 必须在 handlePortMouseDown 之前 (否则 useCallback dep TDZ)
  const { screenToFlowPosition, zoomIn, zoomOut, setViewport, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(1);

  // 07-02 自研连接线系统 — pending state + window 监听 + findNearest + tryConnect
  //   (替代 React Flow onConnect/onConnectStart/onConnectEnd + connection store)
  type PendingConn = {
    fromNode: string;
    fromPort: string;
    fromIsInput: boolean;
    mouseX: number;       // 世界坐标 (findNearest 用)
    mouseY: number;
    mouseScreenX: number; // 屏幕坐标 (SVG overlay 候选线 用)
    mouseScreenY: number;
    hoveredPort: { nodeId: string; portId: string } | null;
  } | null;
  const [pending, setPending] = useState<PendingConn>(null);

  // PortDot mousedown → 开始拖 (从 NodeInteractionContext 调用)
  const handlePortMouseDown = useCallback((nodeId: string, portId: string, isInput: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setPending({
      fromNode: nodeId,
      fromPort: portId,
      fromIsInput: isInput,
      mouseX: x,
      mouseY: y,
      mouseScreenX: e.clientX,
      mouseScreenY: e.clientY,
      hoveredPort: null,
    });
  }, [screenToFlowPosition]);

  // NodeInteractionContext value (供 NodeScaffold / ImageNode 拿 onPortMouseDown + isBeingDraggedTo)
  const ctxIsBeingDraggedTo = useCallback((id: string) => pending !== null && pending.fromNode !== id, [pending]);
  const ctxValue = useMemo(() => ({
    onPortMouseDown: handlePortMouseDown,
    isBeingDraggedTo: ctxIsBeingDraggedTo,
  }), [handlePortMouseDown, ctxIsBeingDraggedTo]);

  // 自研 findNearest: 用 selector 找所有 PortDot DOM 元素 (data-port-node + data-port-input)
  // 07-02 修: 用**屏幕距离**判断阈值 (30px),不是 world 距离 (节点密集时 30px world 太小)
  //   老画布 30px 是合理的(节点稀疏),但 React Flow 节点通常 300px 宽,30px 屏幕距离 = 真正"接近 port"
  const findNearestPort = useCallback((screenX: number, screenY: number, exceptNodeId: string, isInput: boolean) => {
    let best: { nodeId: string; portId: string; d: number } | null = null;
    const selector = isInput ? '[data-port-input="1"]' : '[data-port-input="0"]';
    const allPorts = document.querySelectorAll(selector);
    for (const portEl of Array.from(allPorts)) {
      const nodeId = portEl.getAttribute('data-port-node');
      const portId = portEl.getAttribute('data-port-id');
      if (!nodeId || !portId || nodeId === exceptNodeId) continue;
      const rect = (portEl as HTMLElement).getBoundingClientRect();
      // 用屏幕坐标距离 (跟用户鼠标位置同空间)
      const portScreenX = rect.left + rect.width / 2;
      const portScreenY = rect.top + rect.height / 2;
      const d = Math.hypot(screenX - portScreenX, screenY - portScreenY);
      if (!best || d < best.d) best = { nodeId, portId, d };
    }
    if (best && best.d <= 60) return { nodeId: best.nodeId, portId: best.portId };  // 07-02: 30 → 60
    return null;
  }, []);

  // 自研 tryConnect: 鼠标松开 → 创建 React Flow Edge (走 selfDrawn type)
  const tryConnect = useCallback((target: { nodeId: string; portId: string }) => {
    if (!pending) return;
    const id = `e${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setEdges((eds) => {
      const newEdge = pending.fromIsInput
        ? { id, source: target.nodeId, sourceHandle: target.portId, target: pending.fromNode, targetHandle: pending.fromPort, type: 'selfDrawn' as const }
        : { id, source: pending.fromNode, sourceHandle: pending.fromPort, target: target.nodeId, targetHandle: target.portId, type: 'selfDrawn' as const };
      const dup = eds.some(e =>
        e.source === newEdge.source && e.target === newEdge.target &&
        e.sourceHandle === newEdge.sourceHandle && e.targetHandle === newEdge.targetHandle
      );
      return dup ? eds : [...eds, newEdge];
    });
    setPending(null);
  }, [pending, setEdges]);

  // 全局 window mousemove + mouseup 监听 (拖线中)
  useEffect(() => {
    if (!pending) return;
    const onMove = (e: MouseEvent) => {
      // 07-02 修: 用屏幕坐标直接给 findNearestPort (世界坐标转换已不需要, getBoundingClientRect 已在屏幕空间)
      const nearest = pending.fromIsInput
        ? findNearestPort(e.clientX, e.clientY, pending.fromNode, false)  // from input → 找 output
        : findNearestPort(e.clientX, e.clientY, pending.fromNode, true);   // from output → 找 input
      // 仍然算世界坐标给 SVG overlay + SelfDrawnEdge
      const { x, y } = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setPending(p => p ? { ...p, mouseX: x, mouseY: y, mouseScreenX: e.clientX, mouseScreenY: e.clientY, hoveredPort: nearest } : null);
    };
    const onUp = (e: MouseEvent) => {
      if (pending.hoveredPort) {
        // 07-02 修: 之前漏调 tryConnect, 这是连接真正创建的入口
        tryConnect(pending.hoveredPort);
      } else {
        // 落在空白画布 → 弹节点菜单 (跟原 onConnectEnd 一样的行为)
        const target = e.target as HTMLElement;
        const onCanvas = target.closest('[data-canvas-region]') !== null;
        if (onCanvas && !target.closest('[data-node-scaffold]')) {
          setNodeMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            mode: 'connect',
            sourceNode: pending.fromNode,
            sourceHandle: pending.fromPort,
          });
        }
      }
      setPending(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pending, findNearestPort, screenToFlowPosition]);

  // 旧 useReactFlow 行 (07-02 移到新代码之前, 防 TDZ)
  // const { screenToFlowPosition, zoomIn, zoomOut, setViewport, getZoom } = useReactFlow();
  // const [zoom, setZoom] = useState(1);

  // 06-30 加: 给子节点更新 data 的回调 (通过 Context 注入)
  const updateNodeData = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  }, [setNodes]);

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
  // 07-01 修: 去掉 measured 字段 (React Flow 缓存的旧尺寸), 强制重测
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const nodesToSave = nodes.map(({ measured, ...rest }: any) => rest);
        localStorage.setItem(storageKey + ':nodes', JSON.stringify(nodesToSave));
        localStorage.setItem(storageKey + ':edges', JSON.stringify(edges));
        setSavedAt(new Date());
      } catch (e) {
        console.warn('localStorage save failed', e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, edges, storageKey]);

  // 06-30: 创建新节点 (带默认数据)
  const createNode = useCallback(
    (type: string, pos: { x: number; y: number }) => {
      const newId = `n${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type,
          position: pos,
          data: { text: type === 'text' ? '新节点' : '' },
        },
      ]);
      return newId;
    },
    [setNodes]
  );

  // 06-30: 从菜单选择节点类型后创建节点
  const handleMenuSelect = useCallback(
    (type: string) => {
      if (!nodeMenu.show) return;
      const flowPos = screenToFlowPosition({ x: nodeMenu.x, y: nodeMenu.y });
      const newId = createNode(type, flowPos);

      // 如果是拖拽连线到空白画布后弹菜单, 自动连一条边
      if (nodeMenu.mode === 'connect' && nodeMenu.sourceNode) {
        const sourceNode = nodeMenu.sourceNode;
        const sourceHandle = nodeMenu.sourceHandle || 'right';
        setEdges((eds) => [
          ...eds,
          {
            id: `e${sourceNode}-${newId}`,
            source: sourceNode,
            sourceHandle,
            target: newId,
            targetHandle: 'left',
            type: 'selfDrawn',  // 07-02: 跟 SelfDrawnEdge 配套
          },
        ]);
      }

      setNodeMenu((m) => ({ ...m, show: false }));
    },
    [nodeMenu, screenToFlowPosition, createNode, setEdges]
  );

  // 07-02: 替代 React Flow handleEdgesChange + onConnect + onConnectStart + onConnectEnd
  // (实现已在 pending state + window 监听段, 这里是空段防 TS 报错,实际逻辑走自研)

  // 06-30: 左键双击空白画布 → 弹节点菜单
  // 注意: ReactFlow 的 onDoubleClick 是节点事件, pane 双击要自己监听 onPaneClick
  const lastPaneClickRef = useRef(0);
  const onPaneClickHandler = useCallback(
    (e: React.MouseEvent) => {
      // 检测双击 (350ms 内两次点击 = 双击)
      const now = Date.now();
      if (now - lastPaneClickRef.current < 350) {
        // 双击: 弹菜单
        setNodeMenu({
          show: true,
          x: e.clientX,
          y: e.clientY,
          mode: 'doubleclick',
        });
        lastPaneClickRef.current = 0;
      } else {
        // 单击: 记录时间 + 取消选中 + 关菜单
        lastPaneClickRef.current = now;
        setEdges((eds) =>
          eds.map((ed) => ({ ...ed, selected: false, style: EDGE_STYLE }))
        );
        setNodeMenu((m) => ({ ...m, show: false }));
      }
    },
    []
  );

  // 阻止右键菜单 (chrome 1:1) — 右键现在用来拖动画布
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 06-30: 左侧 FloatingTools 添加节点 (保留旧入口)
  const handleAdd = useCallback(
    (type: string, screenX: number, screenY: number) => {
      const region = document.querySelector('[data-canvas-region]') as HTMLElement;
      if (!region) return;
      const rect = region.getBoundingClientRect();
      const pos = screenToFlowPosition({
        x: rect.left + screenX,
        y: rect.top + screenY,
      });
      createNode(type, pos);
    },
    [screenToFlowPosition, createNode]
  );

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
        <NodeUpdateContext.Provider value={updateNodeData}>
          <NodeInteractionContext.Provider value={ctxValue}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              // 07-02: 自研连接线 (onConnect/onConnectStart/onConnectEnd 全砍)
              onEdgesChange={onEdgesChange}
              onPaneClick={onPaneClickHandler}
              nodeTypes={nodeTypes}
              edgeTypes={SELF_DRAWN_EDGE_TYPES}  // 07-02: 自研 edge 渲染
              // 06-30: 右键拖动画布, 左键用于选择/拖拽节点
              panOnDrag={[2]}
              fitViewOptions={{ maxZoom: 1, minZoom: 0.3, padding: 0.15 }}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'selfDrawn' }}
              onEdgeClick={(e, edge) => {
                e.stopPropagation();
                setEdges((eds) =>
                  eds.map((ed) => ({
                    ...ed,
                    selected: ed.id === edge.id,
                    style: ed.id === edge.id ? EDGE_STYLE_SELECTED : EDGE_STYLE,
                  }))
                );
              }}
            />
            {/* 07-02 自研候选线 SVG overlay (React Flow 外, 屏幕坐标) */}
            {pending && <PendingLineOverlay pending={pending} />}
          </NodeInteractionContext.Provider>
        </NodeUpdateContext.Provider>
      </div>

      {/* Tapnow 风格节点生成菜单 (双击空白 / 拖线到空白) */}
      {nodeMenu.show && (
        <NodeCreationMenu
          x={nodeMenu.x}
          y={nodeMenu.y}
          mode={nodeMenu.mode}
          onSelect={handleMenuSelect}
          onClose={() => setNodeMenu((m) => ({ ...m, show: false }))}
        />
      )}

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
