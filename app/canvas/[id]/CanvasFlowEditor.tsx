'use client';

import { useCallback, useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
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
  type ConnectionLineComponent,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
  type OnConnectStart,
  type OnConnectEnd,
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

// 输入端口 (左) — 07-01 修复: 拖动半径更大 + 偏移更稳,
//   之前 width:16 top:'50%' 节点大时 距光标远, 用户拖不动
function LeftHandle({ selected }: { selected?: boolean }) {
  return (
    <Handle
      type="source"
      id="left"
      position={Position.Left}
      isConnectableStart={true}
      isConnectableEnd={true}
      style={{
        background: PORT_BG,
        width: 20,
        height: 20,
        left: -10,
        top: '50%',
        transform: 'translateY(-50%)',
        border: selected ? '2px solid #fff' : '1.5px solid rgba(0,0,0,0.4)',
        zIndex: 10,
        cursor: 'crosshair',
        boxShadow: '0 0 0 3px rgba(110,140,214,0.25)',
      }}
    />
  );
}

// 输出端口 (右)
function RightHandle({ selected }: { selected?: boolean }) {
  return (
    <Handle
      type="source"
      id="right"
      position={Position.Right}
      isConnectableStart={true}
      isConnectableEnd={true}
      style={{
        background: PORT_BG,
        width: 20,
        height: 20,
        right: -10,
        top: '50%',
        transform: 'translateY(-50%)',
        border: selected ? '2px solid #fff' : '1.5px solid rgba(0,0,0,0.4)',
        zIndex: 10,
        cursor: 'crosshair',
        boxShadow: '0 0 0 3px rgba(110,140,214,0.25)',
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

// 共享: 节点外壳 (统一包装: handle + header + body)
function NodeShell({
  type,
  selected,
  hasInput = true,
  hasOutput = true,
  children,
}: {
  type: string;
  selected?: boolean;
  hasInput?: boolean;
  hasOutput?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      ...baseNodeStyle,
      borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER,
      borderWidth: selected ? 2 : 1,
    }}>
      {hasInput && <LeftHandle selected={selected} />}
      {hasOutput && <RightHandle selected={selected} />}
      <div style={headerStyle}>
        <NodeIcon type={type} />
        {TYPE_LABELS[type]}
      </div>
      {children}
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
};
function TextNode({ data, selected, id }: NodeProps<Node<TextNodeData>>) {
  const update = useNodeUpdate();
  const model = data.model || 'deepseek';
  const modelInfo = AI_MODELS.text.find((m) => m.id === model) || AI_MODELS.text[0];
  const quantity = data.quantity || 1;
  return (
    <NodeShell type="text" selected={selected}>
      <div style={bodyStyle}>
        <NodeTextarea
          value={data.prompt || ''}
          onChange={(v) => update(id, { prompt: v, text: v })}
          placeholder="讲讲这款现代极简三人沙发…"
          rows={3}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <ModelChip
            models={AI_MODELS.text}
            value={model}
            onChange={(v) => update(id, { model: v })}
          />
          <ChipRow
            options={[1, 2, 4]}
            value={quantity}
            onChange={(v) => update(id, { quantity: Number(v) })}
            prefix="×"
          />
        </div>
        <RunButton
          cost={modelInfo.cost * quantity}
          status={data.status}
          onRun={() => update(id, { status: 'running' })}
        />
      </div>
    </NodeShell>
  );
}

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
    <NodeShell type="image" selected={selected}>
      {/* ============== Section A: 图片区 (始终显示) ============== */}
      <div
        data-image-area="1"
        onClick={(e) => e.stopPropagation()}  // 阻止冒泡到 pane (让节点保持选中)
        style={{
          padding: '8px 10px 10px',
        }}
      >
        {/* 07-01: i2i 模式提示 (上游接了 image 节点) */}
        {isI2I && (
          <div
            data-i2i-badge="1"
            style={{
              fontSize: 10,
              color: '#6e8cd6',
              background: 'rgba(110,140,214,0.12)',
              border: '1px solid rgba(110,140,214,0.4)',
              borderRadius: 3,
              padding: '2px 6px',
              marginBottom: 6,
              display: 'inline-block',
              fontWeight: 500,
            }}
            title={`将使用 ${upstreamUrls.length} 张上游图作为 i2i 参考`}
          >
            🔗 i2i 模式 · {upstreamUrls.length} 张参考图
          </div>
        )}

        {/* 顶部: 标签 + 上传按钮 (参考截图) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🖼</span> Image
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(110,140,214,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            title="本地图片上传, 作为参考图 (i2i 上游)"
          >
            <span style={{ fontSize: 12 }}>↑</span> 上传
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

        {/* 图片 / 占位框 (固定高度 180, 跟参考截图一致) */}
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt=""
            style={{
              width: '100%',
              height: 180,
              objectFit: 'contain',
              borderRadius: 6,
              display: 'block',
              background: 'rgba(0,0,0,0.3)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: 180,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
            fontSize: 11,
          }}>
            {isI2I ? '🔗 i2i 模式 (用上游图当参考)' : '待生成 / 上传图片'}
          </div>
        )}
      </div>

      {/* ============== Section B: 操作台 (仅 selected 时弹出) ============== */}
      {selected && (
        <div
          data-op-panel="1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            padding: '10px 10px 10px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '0 0 8px 8px',
          }}
        >
          {/* 工具行: 灯泡 + 加号 (左) | 展开 (右) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={(e) => e.stopPropagation()}
                title="AI 优化提示词 (TODO)"
                style={{
                  width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >✨</button>
              <button
                onClick={(e) => e.stopPropagation()}
                title="预设 (TODO)"
                style={{
                  width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >+</button>
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              title="全屏展开 (TODO)"
              style={{
                width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >↗</button>
          </div>

          {/* prompt textarea */}
          <NodeTextarea
            value={data.prompt || ''}
            onChange={(v) => update(id, { prompt: v })}
            placeholder="描述任何你想要生成的内容"
            rows={3}
          />

          {/* 工具行: 模型 + 比例 + 画质 + 数量 + 麦克风 + cost + run */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 8,
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
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>
              ◆{modelInfo.cost * quantity}
            </span>
          </div>

          {data.errorMsg && (
            <div style={{ fontSize: 10, color: '#ff6b6b', marginTop: 4 }}>⚠ {data.errorMsg}</div>
          )}

          <RunButton
            cost={modelInfo.cost * quantity}
            status={data.status}
            onRun={onRun}
          />
        </div>
      )}
    </NodeShell>
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
};
function VideoGenNode({ data, selected, id }: NodeProps<Node<VideoGenData>>) {
  const update = useNodeUpdate();
  const model = data.model || 'seedance';
  const modelInfo = AI_MODELS['video-gen'].find((m) => m.id === model) || AI_MODELS['video-gen'][0];
  const mode = data.mode || '首尾帧';
  const aspect = data.aspect || '自适应';
  const duration = data.duration || 5;
  const audio = data.audio || '静音';
  const quantity = data.quantity || 1;
  return (
    <NodeShell type="video-gen" selected={selected}>
      <div style={{ ...bodyStyle, maxHeight: 260, overflow: 'visible' }}>
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <video src={data.url} controls style={{ width: '100%', borderRadius: 4, display: 'block', marginBottom: 8 }} />
        ) : data.status === 'running' ? (
          <div style={{
            height: 90,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6e8cd6',
            border: '1px dashed rgba(110,140,214,0.5)',
            marginBottom: 8,
            animation: 'damaiRunPulse 1.1s ease-in-out infinite',
            fontSize: 11,
          }}>
            生成中…
          </div>
        ) : (
          <div style={{
            height: 90,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
            marginBottom: 8,
            fontSize: 11,
          }}>
            待生成视频
          </div>
        )}
        <NodeTextarea
          value={data.prompt || ''}
          onChange={(v) => update(id, { prompt: v })}
          placeholder="镜头缓慢推近, 描述房间全景走位…"
          rows={2}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <ModelChip
            models={AI_MODELS['video-gen']}
            value={model}
            onChange={(v) => update(id, { model: v })}
          />
          <ChipRow
            options={['首尾帧', '参考图片']}
            value={mode}
            onChange={(v) => update(id, { mode: v as any })}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <ChipRow
            options={ASPECTS.slice(0, 4)}
            value={aspect}
            onChange={(v) => update(id, { aspect: String(v) })}
          />
          <ChipRow
            options={DURATIONS.slice(0, 5)}
            value={duration}
            onChange={(v) => update(id, { duration: Number(v) })}
            prefix=""
          />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <ChipRow
            options={['开启', '静音']}
            value={audio}
            onChange={(v) => update(id, { audio: v as any })}
          />
          <ChipRow
            options={[1, 2, 4]}
            value={quantity}
            onChange={(v) => update(id, { quantity: Number(v) })}
            prefix="×"
          />
        </div>
        <RunButton
          cost={modelInfo.cost * quantity * (duration / 5)}
          status={data.status}
          onRun={() => update(id, { status: 'running' })}
        />
      </div>
    </NodeShell>
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
};
function AudioGenNode({ data, selected, id }: NodeProps<Node<AudioGenData>>) {
  const update = useNodeUpdate();
  const model = data.model || 'music2';
  const modelInfo = AI_MODELS['audio-gen'].find((m) => m.id === model) || AI_MODELS['audio-gen'][0];
  const audioType = data.audioType || '纯音乐';
  return (
    <NodeShell type="audio-gen" selected={selected}>
      <div style={bodyStyle}>
        {data.url ? (
          <audio src={data.url} controls style={{ width: '100%', marginBottom: 8 }} />
        ) : data.status === 'running' ? (
          <div style={{
            height: 50,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6e8cd6',
            border: '1px dashed rgba(110,140,214,0.5)',
            marginBottom: 8,
            fontSize: 11,
            animation: 'damaiRunPulse 1.1s ease-in-out infinite',
          }}>
            生成中…
          </div>
        ) : (
          <div style={{
            height: 50,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
            marginBottom: 8,
            fontSize: 11,
          }}>
            待生成音频
          </div>
        )}
        <NodeTextarea
          value={data.prompt || ''}
          onChange={(v) => update(id, { prompt: v })}
          placeholder="轻柔钢琴 + 雨声白噪音, 适合家居展示…"
          rows={2}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <ModelChip
            models={AI_MODELS['audio-gen']}
            value={model}
            onChange={(v) => update(id, { model: v })}
          />
        </div>
        <div style={{ marginTop: 6 }}>
          <ChipRow
            options={['音乐', '歌词', '自适应', '纯音乐']}
            value={audioType}
            onChange={(v) => update(id, { audioType: v as any })}
          />
        </div>
        <RunButton
          cost={modelInfo.cost}
          status={data.status}
          onRun={() => update(id, { status: 'running' })}
        />
      </div>
    </NodeShell>
  );
}

// ---------------------------------------------------------------------
// 5. MergeNode (06-30 重设计: NodeShell + 输入数 chip)
// ---------------------------------------------------------------------
type MergeData = { inputs?: number; label?: string };
function MergeNode({ data, selected, id }: NodeProps<Node<MergeData>>) {
  const update = useNodeUpdate();
  const inputCount = data.inputs || 2;
  return (
    <div style={{
      ...baseNodeStyle,
      borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER,
      borderWidth: selected ? 2 : 1,
    }}>
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="source"
          position={Position.Left}
          id={`in-${i}`}
          isConnectableStart={true}
          isConnectableEnd={true}
          style={{
            background: PORT_BG,
            width: 14, height: 14,
            top: `${30 + i * 25}%`,
            border: selected ? '2px solid #fff' : '1px solid rgba(0,0,0,0.3)',
            zIndex: 10,
            cursor: 'crosshair',
          }}
        />
      ))}
      <RightHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="merge" />
        {TYPE_LABELS.merge}
      </div>
      <div style={bodyStyle}>
        <div style={{
          height: 50,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          border: '1px dashed rgba(110,140,214,0.3)',
          marginBottom: 8,
          fontSize: 11,
        }}>
          合并多路输入
        </div>
        <ChipRow
          options={[2, 3, 4]}
          value={inputCount}
          onChange={(v) => update(id, { inputs: Number(v) })}
          prefix=""
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// 6. OutputNode (06-30 重设计: 只有 input, 显示成片)
// ---------------------------------------------------------------------
type OutputData = { url?: string; status?: 'idle' | 'running' | 'done'; label?: string };
function OutputNode({ data, selected }: NodeProps<Node<OutputData>>) {
  return (
    <div style={{
      ...baseNodeStyle,
      borderColor: selected ? NODE_BORDER_SELECTED : NODE_BORDER,
      borderWidth: selected ? 2 : 1,
      minWidth: 220,
    }}>
      <LeftHandle selected={selected} />
      <div style={headerStyle}>
        <NodeIcon type="output" />
        {TYPE_LABELS.output}
      </div>
      <div style={bodyStyle}>
        {data.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <video src={data.url} controls style={{ width: '100%', borderRadius: 4, display: 'block' }} />
        ) : data.status === 'running' ? (
          <div style={{
            height: 100, borderRadius: 4,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6e8cd6',
            border: '1px dashed rgba(110,140,214,0.5)',
            animation: 'damaiRunPulse 1.1s ease-in-out infinite',
            fontSize: 11,
          }}>
            合成中…
          </div>
        ) : (
          <div style={{
            height: 100, borderRadius: 4,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            border: '1px dashed rgba(110,140,214,0.3)',
            fontSize: 11,
          }}>
            待合成成片
          </div>
        )}
      </div>
    </div>
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

// 共享 edge 样式 (bezier + 箭头 + hover 高亮)
const EDGE_STYLE: React.CSSProperties = {
  stroke: 'rgba(255,255,255,0.55)',
  strokeWidth: 2,
};
const EDGE_STYLE_SELECTED: React.CSSProperties = {
  stroke: '#6e8cd6',
  strokeWidth: 2.8,
};

const defaultEdgeOptions = {
  type: 'bezier',
  style: EDGE_STYLE,
  // 箭头: 末端三角, 跟连线同色
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: 'rgba(255,255,255,0.55)',
  },
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

  // 拖拽连线状态: 从哪个节点/handle 开始, 是否已成功连上
  const connectionStartRef = useRef<{ nodeId: string; handleId?: string } | null>(null);
  const connectionConnectedRef = useRef(false);

  const { screenToFlowPosition, zoomIn, zoomOut, setViewport, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(1);

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
            type: 'bezier',
            style: EDGE_STYLE,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
              color: 'rgba(255,255,255,0.55)',
            },
          },
        ]);
      }

      setNodeMenu((m) => ({ ...m, show: false }));
    },
    [nodeMenu, screenToFlowPosition, createNode, setEdges]
  );

  // 07-01 重写: 屏蔽 React Flow 内部 emit 的 add/remove/replace change,
  //  只接受 select/dimensions/position 等用户输入变化
  //  (防止 onConnect 加的边被 React Flow 内部 store 算成 "add change",
  //   再次推到 onEdgesChange 让我们再加一次 → 视觉上变成 "拖完线消失")
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const filtered = changes.filter((c) => {
        if (c.type === 'add' || c.type === 'remove' || c.type === 'replace') {
          console.log('[damai] handleEdgesChange: filter', c.type, c.id);
          return false;
        }
        return true;
      });
      if (filtered.length > 0) onEdgesChange(filtered);
    },
    [onEdgesChange]
  );

  // 06-30: 连到已有节点 (常规 onConnect)
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      connectionConnectedRef.current = true;
      console.log('[damai] onConnect:', connection);
      setEdges((eds) => {
        // 去重: 同 source/target + handle 组合不再添加
        const duplicate = eds.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle &&
            e.targetHandle === connection.targetHandle
        );
        if (duplicate) {
          console.log('[damai] onConnect: duplicate, skipped');
          return eds;
        }
        return addEdge(
          {
            ...connection,
            type: 'bezier',
            style: EDGE_STYLE,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
              color: 'rgba(255,255,255,0.55)',
            },
          },
          eds
        );
      });
    },
    [setEdges]
  );

  // 06-30: 拖拽连线开始 (记录起点, 用于空白画布弹菜单)
  const onConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      if (!params.nodeId) return;
      const handleId = (params.handleId as string | undefined) || undefined;
      connectionStartRef.current = { nodeId: params.nodeId, handleId };
      connectionConnectedRef.current = false;
    },
    []
  );

  // 06-30: 拖拽连线结束. 如果没连到目标(onConnect 没触发), 说明落在空白画布, 弹节点菜单
  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const start = connectionStartRef.current;
      if (!start || connectionConnectedRef.current) {
        connectionStartRef.current = null;
        return;
      }

      // 菜单显示在鼠标松开位置
      setNodeMenu({
        show: true,
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
        mode: 'connect',
        sourceNode: start.nodeId,
        sourceHandle: start.handleId,
      });
      connectionStartRef.current = null;
    },
    []
  );

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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            // 07-01: 用 handleEdgesChange 替代 onEdgesChange, 屏蔽 React Flow 内部 add/remove/replace
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onPaneClick={onPaneClickHandler}
            nodeTypes={nodeTypes}
            connectionLineComponent={ConnectionLine}
            // 06-30: loose 模式让 source/target handle 都能拉出线
            connectionMode={ConnectionMode.Loose}
            // 拖拽连线时显示有效/无效反馈
            connectionRadius={30}
            // 06-30: 右键拖动画布, 左键用于选择/拖拽节点/拉连线
            // React Flow 类型: panOnDrag 支持 number[] 表示允许拖动画布的鼠标按键 (2=右键)
            panOnDrag={[2]}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={defaultEdgeOptions}
            // 选中 edge 时高亮
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
