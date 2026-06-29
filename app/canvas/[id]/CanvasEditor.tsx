"use client";
const WS_RE = /\s/;

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

// =====================================================================
// Types
// =====================================================================
type PortType = "text" | "image" | "video" | "audio";
type NodeType = "text" | "image" | "video-gen" | "audio-gen" | "merge" | "output";
type NodeStatus = "idle" | "running" | "done" | "error";

type Port = { id: string; label: string; type: PortType };
type CanvasNode = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: Record<string, any>;
  inputs: Port[];
  outputs: Port[];
  status: NodeStatus;
};
type Edge = { id: string; fromNode: string; fromPort: string; toNode: string; toPort: string };

type ModelOpt = { id: string; cost: number };
type NodeSpec = {
  label: string;
  iconChar: string;
  color: string;
  models: ModelOpt[];
  aspects?: string[];
  qualities?: string[];
  hasVoiceInput?: boolean;
  hasMode?: boolean;
  durationsPreset?: number[];
  durationRange?: [number, number];
  hasAudioToggle?: boolean;
  audioTypes?: string[];
  inputs: Port[];
  outputs: Port[];
  defaultData: Record<string, any>;
};

// =====================================================================
// 节点规格 (TapNow 风格: 数据驱动, UI 自动生成)
// =====================================================================
const NODE_SPECS: Record<NodeType, NodeSpec> = {
  text: {
    label: "文本",
    iconChar: "≡",
    color: "#a1a1aa",
    models: [
      { id: "DeepSeek V4 Pro", cost: 1 },
      { id: "Minimax", cost: 1 },
      { id: "Gemini", cost: 4 },
    ],
    hasVoiceInput: true,
    inputs: [],
    outputs: [{ id: "out", label: "text", type: "text" }],
    defaultData: { model: "DeepSeek V4 Pro", quantity: 1, prompt: "", voiceInput: false },
  },
  image: {
    label: "图片",
    iconChar: "▣",
    color: "#a1a1aa",
    // 2026-06-25: 只留 1 个 Ark 真实可用的模型 (UI 显示名 = Ark 模型名, 不做映射)
    // 之前 ["即梦", "Nano Banana Pro"] 都是 UI 别名, Ark 端 404
    models: [
      { id: "doubao-seedream-5-0-260128", cost: 12 },
    ],
    aspects: ["自适应", "1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "5:4", "4:5", "21:9"],
    qualities: ["1K", "2K", "4K"],
    hasVoiceInput: true,
    // 2026-06-25 04:xx: 加 input 端口 (接上游 image 节点的 outputUrl 当参考图)
    inputs: [{ id: "in", label: "素材", type: "image" }],
    outputs: [{ id: "out", label: "image", type: "image" }],
    defaultData: { model: "doubao-seedream-5-0-260128", aspect: "16:9", quality: "4K", quantity: 4, prompt: "", voiceInput: false, uploadedUrls: [] as string[], webSearch: false },
  },
  "video-gen": {
    label: "视频",
    iconChar: "▷",
    color: "#a1a1aa",
    models: [
      { id: "Seedance 2.0", cost: 8 },
      { id: "Clean", cost: 12 },
    ],
    hasMode: true,
    aspects: ["自适应", "16:9", "9:16", "1:1"],
    qualities: ["720P", "1080P"],
    hasAudioToggle: true,
    hasVoiceInput: true,
    inputs: [
      { id: "in", label: "素材", type: "image" },
    ],
    outputs: [{ id: "out", label: "video", type: "video" }],
    defaultData: {
      model: "Seedance 2.0",
      mode: "首尾帧",
      aspect: "自适应",
      quality: "720P",
      duration: 5,
      audio: "静音",
      quantity: 1,
      prompt: "",
      voiceInput: false,
    },
  },
  "audio-gen": {
    label: "音频",
    iconChar: "♪",
    color: "#a1a1aa",
    models: [{ id: "Minimax Music 2.6", cost: 25 }],
    audioTypes: ["音乐", "歌词", "自适应", "纯音乐"],
    hasVoiceInput: true,
    inputs: [],
    outputs: [{ id: "out", label: "audio", type: "audio" }],
    defaultData: { model: "Minimax Music 2.6", audioType: "纯音乐", prompt: "", voiceInput: false },
  },
  merge: {
    label: "合并",
    iconChar: "⊕",
    color: "#71717a",
    models: [],
    inputs: [{ id: "in", label: "素材", type: "video" }],
    outputs: [{ id: "out", label: "video", type: "video" }],
    defaultData: { label: "合并" },
  },
  output: {
    label: "成片",
    iconChar: "◉",
    color: "#71717a",
    models: [],
    inputs: [{ id: "in", label: "素材", type: "video" }],
    outputs: [],
    defaultData: { label: "成片" },
  },
};

// 全局动画 keyframes (呼吸 + 入场缩放)
const DAMAI_KEYFRAMES = `
@keyframes damaiPortBreath {
  0%   { transform: scale(1); box-shadow: 0 0 0 3px rgba(110,140,214,0.10); }
  100% { transform: scale(1.18); box-shadow: 0 0 0 6px rgba(110,140,214,0.18); }
}
@keyframes damaiPickerIn {
  0%   { opacity: 0; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}
/* 2026-06-25 09:xx: 运行按钮蓝色脉冲闪烁 (node.status === "running") */
@keyframes damaiRunPulse {
  0%   { transform: scale(1);    box-shadow: 0 4px 12px rgba(110,140,214,0.4); }
  50%  { transform: scale(1.18); box-shadow: 0 4px 20px rgba(110,140,214,0.85); }
  100% { transform: scale(1);    box-shadow: 0 4px 12px rgba(110,140,214,0.4); }
}
/* 06-26: 上传栏入场 — 操作框从上方滑入 (translateY -16px → 0, opacity 0 → 1) */
@keyframes damaiUploadBarIn {
  0%   { opacity: 0; transform: translateY(-16px); }
  100% { opacity: 1; transform: translateY(0); }
}
/* 06-26: 上传按钮入场 — 从下方弹入 (translateY 10px → 0, scale 0.85 → 1), 跟操作框形成上下对向动画 */
@keyframes damaiUploadBtnIn {
  0%   { opacity: 0; transform: translateY(10px) scale(0.85); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
`;

// 节点尺寸常量 (TapNow 风格: 圆角卡片 + 居中大图标)
const NODE_W = 280;
const NODE_HEADER_H = 36;
const NODE_BODY_H = 200;
const PORT_R = 14;
const PORT_GAP = 36;

function nodeHeight(n: CanvasNode) {
  const maxPorts = Math.max(n.inputs.length, n.outputs.length, 1);
  return NODE_HEADER_H + Math.max(NODE_BODY_H, maxPorts * PORT_GAP + 24);
}

function portPos(n: CanvasNode, port: Port, isInput: boolean) {
  const list = isInput ? n.inputs : n.outputs;
  const idx = list.findIndex((p) => p.id === port.id);
  const total = list.length;
  const startY = NODE_HEADER_H + 16;
  const span = NODE_BODY_H - 32;
  const spacing = total > 1 ? span / (total - 1) : 0;
  return {
    x: isInput ? n.x : n.x + NODE_W,
    y: n.y + startY + (total === 1 ? span / 2 : idx * spacing),
  };
}

// =====================================================================
// 模板预置 (5 套) - 适配 TapNow 风格节点尺寸
// =====================================================================
function _mkNode(id: string, type: NodeType, x: number, y: number, data: Record<string, any>, inputs: Port[], outputs: Port[]): CanvasNode {
  return { id, type, x, y, data, inputs, outputs, status: "idle" };
}
function _mkEdge(id: string, from: string, fromPort: string, to: string, toPort: string): Edge {
  return { id, fromNode: from, fromPort, toNode: to, toPort };
}
const _tOut: Port[] = [{ id: "out", label: "text", type: "text" }];
const _iIn: Port[] = [{ id: "in", label: "素材", type: "image" }];
const _iOut: Port[] = [{ id: "out", label: "image", type: "image" }];
const _vgIn: Port[] = [
  { id: "in", label: "素材", type: "image" },
];
const _vgOut: Port[] = [{ id: "out", label: "video", type: "video" }];
const _agOut: Port[] = [{ id: "out", label: "audio", type: "audio" }];
const _mgIn: Port[] = [{ id: "in", label: "素材", type: "video" }];
const _mgOut: Port[] = [{ id: "out", label: "video", type: "video" }];
const _opIn: Port[] = [{ id: "in", label: "素材", type: "video" }];

function templateStarter(id: string): { nodes: CanvasNode[]; edges: Edge[] } | null {
  switch (id) {
    case "boss":
      return {
        nodes: [
          _mkNode("b1", "text", 80, 280, { ...NODE_SPECS.text.defaultData, prompt: "老板出镜解说什么是 AI 视频工厂" }, [], _tOut),
          _mkNode("b2", "video-gen", 440, 280, { ...NODE_SPECS["video-gen"].defaultData, mode: "首尾帧", duration: 15 }, _vgIn, _vgOut),
          _mkNode("b3", "output", 800, 280, { ...NODE_SPECS.output.defaultData }, _opIn, []),
        ],
        edges: [_mkEdge("be1", "b1", "out", "b2", "in")],
      };
    case "case":
      return {
        nodes: [
          _mkNode("c1", "text", 80, 160, { ...NODE_SPECS.text.defaultData, prompt: "客户证言文案" }, [], _tOut),
          // 06-26: 修复 image 节点 inputs=[] 导致无法接收上游连线（图生图断路）
          _mkNode("c2", "image", 80, 360, { ...NODE_SPECS.image.defaultData, prompt: "客户家实景照片" }, _iIn, _iOut),
          _mkNode("c3", "video-gen", 440, 240, { ...NODE_SPECS["video-gen"].defaultData, mode: "参考图片", duration: 8 }, _vgIn, _vgOut),
          _mkNode("c4", "audio-gen", 440, 460, { ...NODE_SPECS["audio-gen"].defaultData, prompt: "客户讲述购买体验" }, [], _agOut),
          _mkNode("c5", "merge", 800, 320, { ...NODE_SPECS.merge.defaultData }, _mgIn, _mgOut),
          _mkNode("c6", "output", 1140, 320, { ...NODE_SPECS.output.defaultData }, _opIn, []),
        ],
        edges: [
          _mkEdge("ce1", "c1", "out", "c3", "in"),
          // 06-26: 补上 image→video-gen 连线（图生图/图生视频）
          _mkEdge("ce2", "c2", "out", "c3", "in"),
          _mkEdge("ce3", "c3", "out", "c5", "in"),
          _mkEdge("ce5", "c5", "out", "c6", "in"),
        ],
      };
    case "promo":
      return {
        nodes: [
          _mkNode("p1", "text", 80, 280, { ...NODE_SPECS.text.defaultData, prompt: "促销活动文案" }, [], _tOut),
          _mkNode("p2", "video-gen", 440, 280, { ...NODE_SPECS["video-gen"].defaultData, mode: "参考图片", duration: 12 }, _vgIn, _vgOut),
          _mkNode("p3", "output", 800, 280, { ...NODE_SPECS.output.defaultData }, _opIn, []),
        ],
        edges: [_mkEdge("pe1", "p1", "out", "p2", "in")],
      };
    case "holiday":
      return {
        nodes: [
          _mkNode("h1", "text", 80, 280, { ...NODE_SPECS.text.defaultData, prompt: "节日促销文案" }, [], _tOut),
          _mkNode("h2", "video-gen", 440, 280, { ...NODE_SPECS["video-gen"].defaultData, mode: "参考图片", duration: 12, audio: "开启" }, _vgIn, _vgOut),
          _mkNode("h3", "output", 800, 280, { ...NODE_SPECS.output.defaultData }, _opIn, []),
        ],
        edges: [_mkEdge("he1", "h1", "out", "h2", "in")],
      };
    case "product":
      return {
        nodes: [
          _mkNode("d1", "text", 80, 160, { ...NODE_SPECS.text.defaultData, prompt: "产品文案" }, [], _tOut),
          // 06-26: 修复 image 节点 inputs=[] 导致无法接收上游连线（图生图断路）
          _mkNode("d2", "image", 80, 360, { ...NODE_SPECS.image.defaultData, prompt: "产品图" }, _iIn, _iOut),
          _mkNode("d3", "video-gen", 440, 240, { ...NODE_SPECS["video-gen"].defaultData, mode: "参考图片", duration: 10 }, _vgIn, _vgOut),
          _mkNode("d4", "output", 800, 240, { ...NODE_SPECS.output.defaultData }, _opIn, []),
        ],
        edges: [
          _mkEdge("de1", "d1", "out", "d3", "in"),
          // 06-26: 补上 image→video-gen 连线（图生图/图生视频）
          _mkEdge("de2", "d2", "out", "d3", "in"),
        ],
      };
    default:
      return null;
  }
}

// =====================================================================
// 主组件
// =====================================================================
export default function CanvasEditor({
  projectId,
  template,
}: {
  projectId: string;
  template?: string;
}) {
  // ---------- state ----------
  // ⚠️ 不能在 useState lazy initializer 里读 localStorage / 应用 template:
  //    SSR 时 typeof window === "undefined" → return []
  //    Client hydration 时读 localStorage → 返回保存的 nodes
  //    两边不一致 → React hydration failed error
  //    修复: 初始值统一 [], mount 后用 useEffect 加载 (见下方自动保存之前)
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 06-26: ref 保持 nodes/edges 最新值，避免 runOneNode 等异步函数读取 stale closure
  const nodesRef = useRef<CanvasNode[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  // 每次 render 同步 ref（不触发重渲染，但保证 async 回调读到最新）
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ fromNode: string; fromPort: string; mouseX: number; mouseY: number } | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [zoom, setZoom] = useState(1);
  const [credits] = useState(3532);
  const [scroll, setScroll] = useState({ left: 0, top: 0 });
  const [panning, setPanning] = useState(false);
  const [doubleClickMenu, setDoubleClickMenu] = useState<{
    screenX: number; screenY: number; canvasX: number; canvasY: number;
  } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dragTargetInput, setDragTargetInput] = useState<{ nodeId: string; portId: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  // 记录鼠标在画布上的世界坐标 (FloatingTools / addNode 用) — 用 ref 避免每次 mousemove 都 re-render
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startScrollLeft: number; startScrollTop: number } | null>(null);
  const router = useRouter();
  const goHome = () => router.push("/");
  const goAgent = () => router.push("/?focus=agent");

  // ---------- mount: 从 localStorage 加载 / 应用 template (避免 hydration 不匹配) ----------
  useEffect(() => {
    // 优先从 localStorage 恢复 (避免 useState lazy initializer 在 client 与 SSR 不一致)
    let loaded = false;
    try {
      const rawN = localStorage.getItem(`damai.canvas.${projectId}`);
      if (rawN) {
        setNodes(JSON.parse(rawN));
        loaded = true;
      }
    } catch {}
    try {
      const rawE = localStorage.getItem(`damai.canvas.${projectId}.edges`);
      if (rawE) {
        setEdges(JSON.parse(rawE));
        loaded = true;
      }
    } catch {}
    // localStorage 没数据 + 有 template → 应用模板启动
    if (!loaded && template) {
      const tpl = templateStarter(template);
      if (tpl) {
        setNodes(tpl.nodes);
        setEdges(tpl.edges);
      }
    }
  }, [projectId, template]);

  // 06-26: 初始滚动到画布中心, 四周都有 4000px+ 平移空间
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const PAD = 4000;
    c.scrollLeft = (2400 + 2 * PAD - c.clientWidth) / 2;
    c.scrollTop  = (1600 + 2 * PAD - c.clientHeight) / 2;
  }, []);

  // ---------- 自动保存 (500ms debounce) ----------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`damai.canvas.${projectId}`, JSON.stringify(nodes));
        localStorage.setItem(`damai.canvas.${projectId}.edges`, JSON.stringify(edges));
        const idx = JSON.parse(localStorage.getItem("damai.canvas.index") || "[]");
        const filtered = idx.filter((x: any) => x.id !== projectId);
        filtered.unshift({ id: projectId, ts: Date.now() });
        localStorage.setItem("damai.canvas.index", JSON.stringify(filtered.slice(0, 50)));
        setSavedAt(new Date());
      } catch (e) {
        console.warn("save failed", e);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, projectId]);

  // ---------- 全局键盘 ----------
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setPending(null);
      }
      if (e.key === "Delete" && selectedId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setNodes((arr) => arr.filter((n) => n.id !== selectedId));
        setEdges((arr) => arr.filter((e2) => e2.fromNode !== selectedId && e2.toNode !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId]);

  // ---------- 鼠标全局 ----------
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const c = canvasRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      if (dragRef.current) {
        const { id, offX, offY } = dragRef.current;
        const x = (e.clientX - r.left + c.scrollLeft) / zoom - offX;
        const y = (e.clientY - r.top + c.scrollTop) / zoom - offY;
        setNodes((arr) => arr.map((n) => (n.id === id ? { ...n, x, y } : n)));
      }
      if (panRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        c.scrollLeft = panRef.current.startScrollLeft - dx;
        c.scrollTop = panRef.current.startScrollTop - dy;
      }
      if (pending) {
        const mx = (e.clientX - r.left + c.scrollLeft) / zoom;
        const my = (e.clientY - r.top + c.scrollTop) / zoom;
        setPending({ ...pending, mouseX: mx, mouseY: my });
        // 计算最近的输入端口 (高亮提示)
        const nearest = findNearestInput(mx, my, pending.fromNode);
        setDragTargetInput((prev) => {
          if (!prev && !nearest) return null;
          if (prev && nearest && prev.nodeId === nearest.nodeId && prev.portId === nearest.portId) return prev;
          return nearest;
        });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      panRef.current = null;
      setPanning(false);
      if (pending) {
        if (dragTargetInput) {
          tryConnect(dragTargetInput);
        } else {
          setPending(null);
        }
      }
      setDragTargetInput(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pending, zoom]);

  // ---------- 双击菜单: ESC 关闭 + 画布外点击关闭 ----------
  useEffect(() => {
    if (!doubleClickMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDoubleClickMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-double-click-menu]")) return;
      setDoubleClickMenu(null);
    };
    window.addEventListener("keydown", onKey);
    // 推迟一帧再加 mousedown, 避免当前双击事件冒泡立刻关掉
    const t = setTimeout(() => {
      window.addEventListener("mousedown", onDown);
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      window.removeEventListener("mousedown", onDown);
    };
  }, [doubleClickMenu]);

  // ---------- 添加节点 ----------
  function addNode(type: NodeType, x?: number, y?: number) {
    const spec = NODE_SPECS[type];
    const id = `n${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    // 定位策略 (06-29 17:00 改):
    //   1. 显式坐标 (双击空白) → 用 x,y
    //   2. 否则 → 视口中心 (永远可见, 不像 lastMouseRef 可能在 toolbar 位置导致跑画外)
    //   3. canvas 不在 → 兜底 240, 240
    // 修复前: lastMouseRef 优先级 = toolbar 的世界坐标 (off-screen, "不知道那个地方" 的元凶)
    let px: number;
    let py: number;
    if (x != null && y != null) {
      // 显式坐标 (双击空白) — 已经过 NODE_W/2 + 30 偏移, 直接用
      px = x;
      py = y;
    } else if (canvasRef.current) {
      // 视口中心 (toolbar 点击触发, 永远在用户视线内)
      const c = canvasRef.current;
      const r = c.getBoundingClientRect();
      px = (r.width / 2 - c.scrollLeft) / zoom - NODE_W / 2;
      py = (r.height / 2 - c.scrollTop) / zoom - 30;
    } else {
      // 极端兜底
      px = 240;
      py = 240;
    }
    setNodes((arr) => [
      ...arr,
      {
        id, type, x: px, y: py,
        data: { ...spec.defaultData },
        inputs: spec.inputs.map((p) => ({ ...p })),
        outputs: spec.outputs.map((p) => ({ ...p })),
        status: "idle",
      },
    ]);
    setSelectedId(id);
  }

  // ---------- 节点拖动 ----------
  function startDrag(e: React.MouseEvent, n: CanvasNode) {
    e.stopPropagation();
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const offX = (e.clientX - r.left + c.scrollLeft) / zoom - n.x;
    const offY = (e.clientY - r.top + c.scrollTop) / zoom - n.y;
    dragRef.current = { id: n.id, offX, offY };
    setSelectedId(n.id);
  }

  // ---------- 端口连线 (拖拽模式) ----------
  function onPortMouseDown(e: React.MouseEvent, port: Port, isInput: boolean, node: CanvasNode) {
    if (isInput) return; // 输入端口不能作为连线起点
    e.stopPropagation();
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    setPending({
      fromNode: node.id,
      fromPort: port.id,
      mouseX: (e.clientX - r.left + c.scrollLeft) / zoom,
      mouseY: (e.clientY - r.top + c.scrollTop) / zoom,
    });
  }

  // 给定世界坐标, 找出最近的输入端口 (限本画布除源节点外的所有节点)
  function findNearestInput(worldX: number, worldY: number, exceptNodeId: string): { nodeId: string; portId: string } | null {
    let best: { nodeId: string; portId: string; d: number } | null = null;
    for (const n of nodes) {
      if (n.id === exceptNodeId) continue;
      for (const p of n.inputs) {
        const pos = portPos(n, p, true);
        const dx = pos.x - worldX;
        const dy = pos.y - worldY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (!best || d < best.d) best = { nodeId: n.id, portId: p.id, d };
      }
    }
    if (best && best.d <= PORT_R * 2 + 8) return { nodeId: best.nodeId, portId: best.portId };
    return null;
  }

  // 试图把 pending 连到目标输入端口 (类型校验同 v3)
  function tryConnect(target: { nodeId: string; portId: string }) {
    if (!pending) return;
    const fromNode = nodes.find((n) => n.id === pending.fromNode);
    if (!fromNode) { setPending(null); return; }
    const fromPort = fromNode.outputs.find((p) => p.id === pending.fromPort);
    if (!fromPort) { setPending(null); return; }
    const targetNode = nodes.find((n) => n.id === target.nodeId);
    const targetPort = targetNode?.inputs.find((p) => p.id === target.portId);
    if (!targetPort) { setPending(null); return; }
    if (fromPort.type !== targetPort.type) {
      alert(`端口类型不匹配: ${fromPort.type} → ${targetPort.type}`);
      setPending(null);
      return;
    }
    const id = `e${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    setEdges((arr) => [
      ...arr,
      { id, fromNode: pending.fromNode, fromPort: pending.fromPort, toNode: target.nodeId, toPort: target.portId },
    ]);
    setPending(null);
  }

  // ---------- 单节点运行 ----------
  // image 节点 → POST /api/canvas/run-image (真实 Ark 调用)
  // 其他 type (text/video-gen/audio-gen/merge/output) → mock
  // 2026-06-25: 补回 API 调用 + 错误处理 (Canvas 06-23 误覆盖回 v3 后恢复)
  async function runOneNode(nodeId: string) {
    // 06-26: 用 ref 读最新值，避免异步 fetch 期间 state 已过期的 stale closure 问题
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const target = currentNodes.find((n) => n.id === nodeId);
    if (!target) return;

    setNodes((arr) =>
      arr.map((n) => (n.id === nodeId ? { ...n, status: "running" as NodeStatus } : n))
    );

    try {
      if (target.type === "image") {
        // 收集 upstream image referenceUrls (上游 image 节点的输出图 → 图生图)
        const refEdges = currentEdges.filter((e) => e.toNode === nodeId);
        const referenceUrls: string[] = [];
        // 06-26: 相对路径转绝对 URL (origin + path), 让服务端 fetch + Ark 都能拉到图
        // 之前传 `/canvas-output/xxx.jpeg` 是相对路径, Node fetch() 解析不了, 静默 fallback 后 Ark 也拿不到
        // ⚠️ 必须提到 refEdges loop 外 — line 599 的 uploadedUrls 分支也要用
        const toAbs = (u?: string) =>
          !u ? null : u.startsWith("/") ? `${window.location.origin}${u}` : u;
        for (const e of refEdges) {
          const fromNode = currentNodes.find((n) => n.id === e.fromNode);
          // 优先用用户在 overlay 选中的图, 而不是默认 outputUrl
          const outUrl = toAbs(fromNode?.data?.selectedOutputUrl || fromNode?.data?.outputUrl);
          if (outUrl) referenceUrls.push(outUrl);
        }
        // 06-26: 也加入用户上传的本地参考图 (node.data.uploadedUrls)
        if (target.data.uploadedUrls?.length) {
          for (const u of target.data.uploadedUrls) {
            const abs = toAbs(u);
            if (abs) referenceUrls.push(abs);
          }
        }
        console.log("[damai] image node", nodeId, "referenceUrls:", referenceUrls);

        const res = await fetch("/api/canvas/run-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: target.data.prompt || "",
            model: target.data.model,
            aspect: target.data.aspect,
            quality: target.data.quality,
            quantity: target.data.quantity ?? 1,
            referenceUrls: referenceUrls.length ? referenceUrls : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "生成失败");

        setNodes((arr) =>
          arr.map((n) => (n.id === nodeId ? {
            ...n,
            status: "done" as NodeStatus,
            data: {
              ...n.data,
              outputUrl: data.outputUrl,
              outputUrls: data.outputUrls || [data.outputUrl],
              selectedOutputUrl: data.outputUrl, // 默认选第一张
              errorMsg: undefined,               // 清掉旧错误
              // 06-26: 记录本次是否使用了参考图（供 UI 展示图生图标识）
              refCount: referenceUrls.length,
            },
          } : n))
        );
        return;
      }

      // 其他 type: 保持 mock (1500ms 后 done)
      await new Promise<void>((r) => setTimeout(r, 1500));
      setNodes((arr) =>
        arr.map((n) => (n.id === nodeId ? { ...n, status: "done" as NodeStatus } : n))
      );
    } catch (e: any) {
      console.error("[runOneNode]", nodeId, e);
      setNodes((arr) =>
        arr.map((n) => (n.id === nodeId ? {
          ...n,
          status: "error" as NodeStatus,
          data: { ...n.data, errorMsg: e?.message || "生成失败" },
        } : n))
      );
    }
  }

  // ---------- 提示词优化 (mock) ----------
  // 2026-06-25: 加回 stub (HEAD 里被 TEMPORARILY DISABLED 注释掉, 但 onOptimizePrompt 还在调)
  async function optimizePrompt(_nodeId: string, currentPrompt: string) {
    // TODO: 接真实 LLM 优化 (当前是占位)
    return currentPrompt;
  }

  const selected = nodes.find((n) => n.id === selectedId) || null;

  // 06-26: 修复 upstreamNodes — 原来被硬编码为空数组 (TEST stub)，导致 @引用和图生图反馈全部失效
  // 根据 edges 找到当前选中节点的所有上游节点（供 PropertiesPanel 的 @提及 + 图生图参考图展示）
  const upstreamNodes: { id: string; label: string; type: NodeType; refUrl?: string }[] = useMemo(() => {
    if (!selectedId) return [];
    const incomingEdges = edges.filter((e) => e.toNode === selectedId);
    return incomingEdges
      .map((e) => {
        const fromNode = nodes.find((n) => n.id === e.fromNode);
        if (!fromNode) return null;
        const spec = NODE_SPECS[fromNode.type as NodeType];
        // 携带上游节点的输出图 URL（用于图生图预览）
        const refUrl = fromNode?.data?.selectedOutputUrl || fromNode?.data?.outputUrl;
        return { id: fromNode.id, label: `${spec.label} #${fromNode.id.slice(0, 4)}`, type: fromNode.type as NodeType, refUrl };
      })
      .filter(Boolean) as { id: string; label: string; type: NodeType; refUrl?: string }[];
  }, [selectedId, nodes, edges]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DAMAI_KEYFRAMES }} />
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "#0a0a0a",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          overflow: "hidden",
        }}
      >
      <TopBar credits={credits} savedAt={savedAt} nodeCount={nodes.length} edgeCount={edges.length} onTitleClick={goHome} />

      {/* 画布 */}
      <div
        ref={canvasRef}
        onMouseMove={(e) => {
          const c = canvasRef.current;
          if (!c) return;
          const r = c.getBoundingClientRect();
          lastMouseRef.current = {
            x: (e.clientX - r.left + c.scrollLeft) / zoom,
            y: (e.clientY - r.top + c.scrollTop) / zoom,
          };
        }}
        onScroll={() => {
          const c = canvasRef.current;
          if (!c) return;
          setScroll({ left: c.scrollLeft, top: c.scrollTop });
        }}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("[data-canvas-node]")) return;
          if (t.closest("[data-properties-panel]")) return;
          if (t.closest("[data-floating-tools]")) return;
          if (t.closest("[data-zoom-controls]")) return;
          if (t.closest("[data-text-toolbar]")) return;
          if (t.closest("[data-top-bar]")) return;
          if (t.closest("[data-logo]")) return;
          setSelectedId(null);
          setPending(null);
        }}
        onDoubleClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("[data-canvas-node]")) return;
          if (t.closest("[data-properties-panel]")) return;
          if (t.closest("[data-floating-tools]")) return;
          if (t.closest("[data-zoom-controls]")) return;
          if (t.closest("[data-text-toolbar]")) return;
          if (t.closest("[data-top-bar]")) return;
          if (t.closest("[data-logo]")) return;
          if (t.closest("[data-double-click-menu]")) return;
          const c = canvasRef.current;
          if (!c) return;
          const r = c.getBoundingClientRect();
          // 缩放 + scroll 还原: 双击点 = 画布坐标
          const canvasX = (e.clientX - r.left + c.scrollLeft) / zoom - NODE_W / 2;
          const canvasY = (e.clientY - r.top + c.scrollTop) / zoom - 30;
          setDoubleClickMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            canvasX,
            canvasY,
          });
        }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          // 右键 = 平移画布视角
          if (e.button !== 2) return;
          const t = e.target as HTMLElement;
          if (t.closest("[data-canvas-node]")) return;
          if (t.closest("[data-properties-panel]")) return;
          if (t.closest("[data-floating-tools]")) return;
          if (t.closest("[data-zoom-controls]")) return;
          if (t.closest("[data-text-toolbar]")) return;
          if (t.closest("[data-top-bar]")) return;
          if (t.closest("[data-logo]")) return;
          const c = canvasRef.current;
          if (!c) return;
          panRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startScrollLeft: c.scrollLeft,
            startScrollTop: c.scrollTop,
          };
          setPanning(true);
        }}
        style={{
          position: "absolute",
          top: 56, left: 0, right: 0, bottom: 0,
          overflow: "auto",
          cursor: panning ? "grabbing" : "default",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 2400,
            height: 1600,
            margin: "4000px",  // 06-26: 给画布 4000px 各方向平移空间 → 解决"往上/左拖卡死", 看起来像无限画布
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            // 06-29 17:00 改: SVG 尺寸从 2400x1600 扩到 10400x9600, 覆盖整个世界坐标
            // (parent div 有 margin 4000px, 世界坐标范围 -4000 到 6400 / -4000 到 5600)
            // 修复前 SVG 只覆盖 0-2400 / 0-1600, 节点在 margin 内就连线看不见
            style={{ position: "absolute", top: -4000, left: -4000, pointerEvents: "none" }}
            width={10400}
            height={9600}
          >
            {edges.map((e) => {
              const from = nodes.find((n) => n.id === e.fromNode);
              const to = nodes.find((n) => n.id === e.toNode);
              if (!from || !to) return null;
              const fp = from.outputs.find((p) => p.id === e.fromPort);
              const tp = to.inputs.find((p) => p.id === e.toPort);
              if (!fp || !tp) return null;
              return <ConnectionPath key={e.id} a={portPos(from, fp, false)} b={portPos(to, tp, true)} />;
            })}
            {pending && (() => {
              const from = nodes.find((n) => n.id === pending.fromNode);
              if (!from) return null;
              const fp = from.outputs.find((p) => p.id === pending.fromPort);
              if (!fp) return null;
              return <ConnectionPath a={portPos(from, fp, false)} b={{ x: pending.mouseX, y: pending.mouseY }} pending />;
            })()}
          </svg>

          {nodes.map((n) => {
            // 06-26: 计算每个节点的入边数量（用于图生图 badge 显示）
            const incomingCount = edges.filter((e) => e.toNode === n.id).length;
            return (
            <NodeView
              key={n.id}
              node={n}
              selected={selectedId === n.id}
              hovered={hoveredNodeId === n.id}
              dragTargetInput={dragTargetInput}
              incomingCount={incomingCount}
              onMouseDown={(e) => startDrag(e, n)}
              onMouseEnter={() => setHoveredNodeId(n.id)}
              onMouseLeave={() => setHoveredNodeId((id) => (id === n.id ? null : id))}
              onPortMouseDown={(e, p, isInput) => onPortMouseDown(e, p, isInput, n)}
              onRun={() => runOneNode(n.id)}
              onUpdate={(data) => setNodes((arr) => arr.map((nn) => (nn.id === n.id ? { ...nn, data } : nn)))}
              onPickImage={(idx) => {
                const urls: string[] = n.data.outputUrls?.length
                  ? n.data.outputUrls
                  : n.data.outputUrl
                    ? [n.data.outputUrl]
                    : [];
                const url = urls[idx] || n.data.outputUrl;
                setNodes((arr) => arr.map((nn) => {
                  if (nn.id !== n.id) return nn;
                  return {
                    ...nn,
                    data: { ...nn.data, selectedIdx: idx, outputUrl: url, selectedOutputUrl: url },
                  };
                }));
              }}
            />
            );
          })}
        </div>
      </div>

      {doubleClickMenu && (
        <DoubleClickNodeMenu
          screenX={doubleClickMenu.screenX}
          screenY={doubleClickMenu.screenY}
          onPick={(type) => {
            addNode(type, doubleClickMenu.canvasX, doubleClickMenu.canvasY);
            setDoubleClickMenu(null);
          }}
          onClose={() => setDoubleClickMenu(null)}
        />
      )}

      {selected && (
        <PropertiesPanel
          node={selected}
          zoom={zoom}
          scroll={scroll}
          upstreamNodes={upstreamNodes}
          onChange={(data) =>
            setNodes((arr) => arr.map((n) => (n.id === selected.id ? { ...n, data } : n)))
          }
          onRun={() => runOneNode(selected.id)}
          onOptimizePrompt={() => optimizePrompt(selected.id, selected.data.prompt || "")}
        />
      )}

      {selected && selected.type === "text" && (
        <TextToolbar
          node={selected}
          zoom={zoom}
          scroll={scroll}
          onFormat={(k) => {
            const fmt = (selected.data.formats as string[]) || [];
            setNodes((arr) =>
              arr.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, formats: [...fmt, k] } } : n))
            );
          }}
        />
      )}

      <FloatingTools onAdd={addNode} />

      <ZoomControls zoom={zoom} setZoom={setZoom} />

      <div
        data-logo="1"
        onClick={goAgent}
        title="打开大脉 AI 助手"
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          width: 36, height: 36,
          borderRadius: 18,
          background: "linear-gradient(135deg, #6e8cd6, #5a7fbf)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "0.875rem",
          fontWeight: 700,
          cursor: "pointer",
          zIndex: 40,
        }}
      >
        脉
      </div>
    </div>
    </>
  );
}

// =====================================================================
// 顶部状态条
// =====================================================================
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
    ? savedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";
  return (
    <div
      data-top-bar="1"
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 50,
      }}
    >
      <div
        onClick={onTitleClick}
        title="返回首页"
        style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }}
      >
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>
          大脉
        </div>
        <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>
          {savedAt ? `已保存到云端 · ${timeStr}` : "编辑中…"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          data-top-bar="1"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 980,
            fontSize: "0.8125rem",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>◆</span>
          <span>{credits.toLocaleString()}</span>
        </div>
        <button
          data-top-bar="1"
          style={{
            padding: "6px 14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 980,
            color: "#fff",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          社区
        </button>
        <button
          data-top-bar="1"
          style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            borderRadius: "50%",
            color: "#fff",
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⤴
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// 左侧浮动工具栏
// =====================================================================
function FloatingTools({ onAdd }: { onAdd: (type: NodeType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      data-floating-tools="1"
      style={{
        position: "absolute",
        left: 16,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 6,
        background: "rgba(20,20,22,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        backdropFilter: "blur(20px)",
        zIndex: 40,
      }}
    >
      <div style={{ position: "relative" }}>
        <button
          data-floating-tools="1"
          onClick={() => setOpen(!open)}
          style={{
            width: 32, height: 32,
            background: open ? "rgba(255,255,255,0.1)" : "transparent",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: "1.125rem",
            fontWeight: 300,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
        {open && (
          <div
            data-floating-tools="1"
            style={{
              position: "absolute",
              left: "calc(100% + 8px)",
              top: 0,
              minWidth: 180,
              padding: 6,
              background: "rgba(20,20,22,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              backdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {(Object.keys(NODE_SPECS) as NodeType[]).map((type) => (
              <button
                key={type}
                data-floating-tools="1"
                onClick={() => { onAdd(type); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: "0.8125rem",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 16, opacity: 0.6, fontSize: "0.875rem" }}>
                  {NODE_SPECS[type].iconChar}
                </span>
                <span>{NODE_SPECS[type].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <FloatingBtn>📁</FloatingBtn>
      <FloatingBtn>📋</FloatingBtn>
      <FloatingBtn>💬</FloatingBtn>
      <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.1)", margin: "4px auto" }} />
      <FloatingBtn>N</FloatingBtn>
    </div>
  );
}

function FloatingBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      data-floating-tools="1"
      style={{
        width: 32, height: 32,
        background: "transparent",
        border: "none",
        borderRadius: 8,
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.875rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

// =====================================================================
// 左下角缩放 + 网格切换
// =====================================================================
function ZoomControls({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) {
  return (
    <div
      data-zoom-controls="1"
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: 4,
        background: "rgba(20,20,22,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        backdropFilter: "blur(20px)",
        zIndex: 40,
      }}
    >
      <ZoomBtn>▦</ZoomBtn>
      <ZoomBtn>⌗</ZoomBtn>
      <input
        data-zoom-controls="1"
        type="range"
        min={25}
        max={200}
        value={Math.round(zoom * 100)}
        onChange={(e) => setZoom(Number(e.target.value) / 100)}
        style={{
          width: 80,
          accentColor: "#6e8cd6",
          margin: "0 4px",
        }}
      />
      <span data-zoom-controls="1" style={{
        fontSize: "0.6875rem",
        color: "rgba(255,255,255,0.5)",
        minWidth: 32,
        textAlign: "center",
      }}>
        {Math.round(zoom * 100)}%
      </span>
      <ZoomBtn>?</ZoomBtn>
    </div>
  );
}

function ZoomBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      data-zoom-controls="1"
      style={{
        width: 28, height: 28,
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.5)",
        fontSize: "0.75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

// =====================================================================
// 节点视图 (TapNow 风格: 圆角卡片 + 居中大图标 + 边缘端口)
// =====================================================================
function NodeView({
  node,
  selected,
  hovered,
  dragTargetInput,
  incomingCount = 0,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onPortMouseDown,
  onRun,
  onUpdate,
  onPickImage,
}: {
  node: CanvasNode;
  selected: boolean;
  hovered: boolean;
  dragTargetInput: { nodeId: string; portId: string } | null;
  incomingCount?: number;  // 06-26: 上游连线数量（图生图 badge）
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPortMouseDown: (e: React.MouseEvent, p: Port, isInput: boolean) => void;
  onRun?: () => void;
  onUpdate?: (data: Record<string, any>) => void;
  // 2026-06-25 04:xx: 选图回调 (image 节点点 overlay 中某图触发)
  onPickImage?: (idx: number) => void;
}) {
  const spec = NODE_SPECS[node.type];
  const h = nodeHeight(node);
  const isAI = node.type !== "merge" && node.type !== "output";
  // 2026-06-25 04:xx: image 节点走"裸图无外框" TapNow 风格
  const isImage = node.type === "image";
  // 选图 overlay 状态 (image 节点本地 state)
  const [picking, setPicking] = useState(false);
  const imgs: string[] =
    node.data.outputUrls?.length
      ? node.data.outputUrls
      : node.data.outputUrl
        ? [node.data.outputUrl]
        : [];
  const qty = Number(node.data.quantity) || 1;

  return (
    <div
      data-canvas-node="1"
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: h,
        // 2026-06-25 04:xx: image 节点走"裸图无外框" TapNow 风格
        // 其他节点保持原深色圆角卡片 (06-25 16:xx: 底色 → #1A1A1A 中性灰)
        background: isImage ? "transparent" : "#1A1A1A",
        border: isImage
          ? "none"
          : selected
            ? "1.5px solid rgba(110,140,214,0.7)"
            : "1px solid rgba(255,255,255,0.08)",
        borderRadius: isImage ? 0 : 16,
        boxShadow: isImage
          ? "none"
          : selected
            ? "0 0 0 1px rgba(110,140,214,0.2), 0 8px 32px rgba(0,0,0,0.5)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "grab",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      {/* 顶部 label: image 节点不渲染 (TapNow 风格: 裸图无 header) */}
      {!isImage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: NODE_HEADER_H,
            padding: "0 12px",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.02em",
            position: "relative",
          }}
        >
          <span style={{ fontSize: "0.875rem", opacity: 0.7 }}>{spec.iconChar}</span>
          <span>{spec.label}</span>
          {node.status === "running" && <StatusPill color="#0071e3">运行中</StatusPill>}
          {node.status === "done" && <StatusPill color="#10b981">完成</StatusPill>}
          {node.status === "error" && <StatusPill color="#c75d2c">错误</StatusPill>}
        </div>
      )}

      {/* 06-26: image 节点顶部上传按钮栏 — 始终占位 32px, 避免选中时图片抖动 */}
      {isImage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              visibility: selected ? "visible" : "hidden",
              animation: selected ? "damaiUploadBarIn 0.22s ease-out forwards" : "none",
            }}
          >
            <label
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
                animation: "damaiUploadBtnIn 0.25s 0.06s ease-out forwards",
                opacity: 0,
              }}
          >
            <span style={{ fontSize: "0.875rem" }}>⬆</span>
            <span>上传</span>
            {((node.data.uploadedUrls as string[])?.length || 0) > 0 && (
              <span
                style={{
                  marginLeft: 2,
                  padding: "0px 5px",
                  borderRadius: 999,
                  background: "rgba(110,140,214,0.15)",
                  color: "#6e8cd6",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                }}
              >
                {(node.data.uploadedUrls as string[]).length}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={async (ev) => {
                const files = ev.currentTarget.files;
                if (!files || files.length === 0) return;
                const newUrls: string[] = [...(node.data.uploadedUrls || [])];
                for (let i = 0; i < files.length; i++) {
                  const f = files[i];
                  const fd = new FormData();
                  fd.append("file", f);
                  try {
                    const res = await fetch("/api/canvas/upload", { method: "POST", body: fd });
                    const json = await res.json();
                    if (json.ok) newUrls.push(json.url);
                    else console.warn("[upload] 上传失败:", json.error);
                  } catch (err) {
                    console.warn("[upload] 网络错误:", err);
                  }
                }
                onUpdate?.({ uploadedUrls: newUrls });
                ev.currentTarget.value = "";
              }}
            />
          </label>
          </div>
        </div>
      )}

      {/* 中间区域: image 节点显示真实生成图, 其他显示 icon */}
      <div
        style={{
          flex: 1,
          position: "relative",
          padding: isImage ? 0 : 8,
          overflow: "hidden",
        }}
      >
        {isImage && imgs.length > 0 ? (
          // 主图容器: position relative + zIndex 2, 确保在背景堆叠层上面
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgs[Number(node.data.selectedIdx) || 0]}
              alt="output"
              draggable={false}
              style={{
                maxHeight: 220,
                maxWidth: "100%",
                objectFit: "contain",
                borderRadius: 4,
                display: "block",
              }}
            />
          </div>
        ) : isImage ? (
          // 2026-06-25 09:xx: 没出图前 — 占位虚线方框 + 大图 icon + 等待文字
          <div
            style={{
              width: NODE_W - 4,
              height: 200,
              margin: 2,
              border: "2px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <ImageIcon />
            <div style={{ marginTop: 8, fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
              {node.status === "running" ? "生成中..." : "等待生成"}
            </div>
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NodeIconPlaceholder type={node.type} />
          </div>
        )}

        {/* 06-26: 多图半透明错开堆叠效果 — 真实图片内容作为背景图, 半透明叠放在主图后面
            参考效果: 像 iPhone 选图界面的叠纸牌风格, 每张往右下错位 + 轻微旋转 + 半透明
            - 常显 (不需要 hover), 生成多张后立即可见
            - 用真实图片 (不是色块), 增强内容感
            - 越往后越透明, 最多显示 3 张背景图  */}
        {isImage && imgs.length >= 2 && (() => {
          const aspect = node.data.aspect || "16:9";
          const [aw, ah] = aspect.split(":").map(Number);
          // 背景图尺寸略小于主图 (主图 maxHeight 220, 背景图 210)
          const tileH = 210;
          const tileW = Math.round(tileH * (aw / ah));
          const selectedIdx = Number(node.data.selectedIdx) || 0;
          // 收集除主图外的其他图片 (最多3张背景层)
          const bgImgs = imgs
            .map((url, i) => ({ url, i }))
            .filter(({ i }) => i !== selectedIdx)
            .slice(0, 3)
            .reverse(); // 最深层先渲染, 浅层后渲染压在上面, 主图最顶

          return (
            <div
              style={{
                position: "absolute",
                left: 0, right: 0, top: 0, bottom: 0,
                pointerEvents: "none",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {bgImgs.map(({ url, i }, renderIdx) => {
                // reverse 后 renderIdx 0 = 最深层, 所以 depthIdx = bgImgs.length-1-renderIdx
                // depthIdx 0 = 离主图最近 (旋转最小, 最清晰)
                const depthIdx = bgImgs.length - 1 - renderIdx;
                // 参考图效果: 扇形展开 — 绕底部中心旋转, 每层固定步进角度
                const step = 4; // 每层旋转步进 4°
                const angle = (depthIdx + 1) * step; // 4° / 8° / 12°，统一向右倾斜
                const opacity = ([0.60, 0.38, 0.22] as number[])[depthIdx] ?? 0.15;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      width: tileW,
                      height: tileH,
                      borderRadius: 8,
                      overflow: "hidden",
                      // 绕底部中心点旋转 (transform-origin: center bottom)
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "center bottom",
                      opacity,
                      zIndex: 0,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* 2026-06-25 04:xx: image 节点多张时右上角 "× N" 浮 chip, 点 chip 弹全屏 overlay 选图 */}
        {isImage && qty > 1 && imgs.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setPicking(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="选图"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 5,
              padding: "2px 8px",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 999,
              color: "#fff",
              fontSize: "0.6875rem",
              fontWeight: 500,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            × {qty}
          </button>
        )}

        {/* 06-26: 图生图 badge — image 节点有上游连线时左上角显示 */}
        {isImage && incomingCount > 0 && (
          <div
            title={`已连接 ${incomingCount} 个上游参考源 · 运行后将启用图生图模式`}
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              zIndex: 5,
              padding: "2px 8px",
              background: "rgba(110,140,214,0.2)",
              border: "1px solid rgba(110,140,214,0.35)",
              borderRadius: 999,
              color: "#6e8cd6",
              fontSize: "0.625rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 3,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              letterSpacing: "0.02em",
            }}
          >
            <span>🔗</span>
            <span>图生图</span>
            {incomingCount > 1 && <span style={{ opacity: 0.7 }}>×{incomingCount}</span>}
          </div>
        )}
      </div>

      {/* 端口层 (绝对定位在卡片边缘) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {node.inputs.map((p) => {
          const hl = dragTargetInput?.nodeId === node.id && dragTargetInput?.portId === p.id;
          // 统一 hover 才显示端口, 包括 image 节点的输入端口
          return (
            <PortDot
              key={p.id}
              port={p}
              node={node}
              isInput
              visible={hovered}
              highlighted={hl}
              onMouseDown={(e) => onPortMouseDown(e, p, true)}
            />
          );
        })}
        {node.outputs.map((p) => (
          <PortDot
            key={p.id}
            port={p}
            node={node}
            isInput={false}
            // 2026-06-25 09:xx: 撤回永远显示, 改回 hover 才显示
            visible={hovered}
            highlighted={false}
            onMouseDown={(e) => onPortMouseDown(e, p, false)}
          />
        ))}
      </div>

      {/* 右下角运行按钮 (AI 节点)
          2026-06-25 09:xx: image 节点永远显示 (不只 hover), running 时蓝色闪烁, 出图后消失 */}
      {onRun && isAI && !(isImage && imgs.length > 0) && (
        <button
          data-run-node="1"
          onClick={(e) => { e.stopPropagation(); onRun(); }}
          title="运行此节点"
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 32, height: 32,
            borderRadius: 16,
            background: node.status === "running"
              ? "rgba(110,140,214,0.3)"
              : "linear-gradient(135deg, #6e8cd6, #5a7fbf)",
            border: "none",
            color: "#fff",
            fontSize: "0.75rem",
            cursor: node.status === "running" ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(110,140,214,0.4)",
            // 2026-06-25 09:xx: image 节点永远显示; running 时蓝色脉冲闪烁
            opacity: isImage || node.status === "running" ? 1 : (hovered ? 1 : 0),
            animation: node.status === "running" ? "damaiRunPulse 1.1s ease-in-out infinite" : "none",
          }}
        >
          ▶
        </button>
      )}

      {/* 2026-06-25 04:xx: image 节点多张时全屏选图 overlay (点 chip 触发) */}
      {isImage && picking && imgs.length > 1 && (
        <div
          onClick={(e) => {
            // 点空白处关闭
            if (e.target === e.currentTarget) setPicking(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              padding: 24,
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            {imgs.map((url, idx) => {
              const isSel = Number(node.data.selectedIdx) === idx;
              return (
                <div
                  key={url + idx}
                  onClick={() => {
                    onPickImage?.(idx);
                    setPicking(false);
                  }}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: isSel
                      ? "3px solid #6e8cd6"
                      : "1px solid rgba(255,255,255,0.15)",
                    boxShadow: isSel
                      ? "0 0 0 2px rgba(110,140,214,0.4)"
                      : "0 4px 16px rgba(0,0,0,0.5)",
                    transition: "all 0.15s",
                    background: "#000",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`选图 ${idx + 1}`}
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* 关闭按钮 */}
          <button
            onClick={() => setPicking(false)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontSize: "1.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      marginLeft: 8,
      fontSize: "0.6rem",
      padding: "1px 6px",
      borderRadius: 4,
      background: color,
      color: "#fff",
      fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

function NodeIconPlaceholder({ type }: { type: NodeType }) {
  const base: React.CSSProperties = {
    color: "rgba(255,255,255,0.18)",
    lineHeight: 1,
  };
  switch (type) {
    case "text":
      return <div style={{ ...base, fontSize: "3rem", fontWeight: 300 }}>≡</div>;
    case "image":
      return <ImageIcon />;
    case "video-gen":
      return <VideoIcon />;
    case "audio-gen":
      return <AudioIcon />;
    case "merge":
      return <div style={{ ...base, fontSize: "3rem" }}>⊕</div>;
    case "output":
      return <div style={{ ...base, fontSize: "3rem" }}>◉</div>;
    default:
      return null;
  }
}

// 节点内图片网格: 1 张大图 / 2 张 1×2 / 3-4 张 2×2
// 2026-06-25: image 节点跑完后, 中间区域显示真实生成图, 多张时点击选图
function NodeImageGrid({
  urls,
  selectedUrl,
  onSelect,
}: {
  urls: string[];
  selectedUrl?: string;
  onSelect: (url: string) => void;
}) {
  if (urls.length === 0) return null;
  // 1 张: 1 列; 2-4 张: 2 列 (2 张 → 1×2, 3-4 张 → 2×2)
  const cols = urls.length === 1 ? 1 : 2;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 4,
        width: "100%",
        height: "100%",
      }}
    >
      {urls.map((url, i) => {
        const isSelected = url === selectedUrl;
        return (
          <div
            key={url + i}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(url);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: 6,
              overflow: "hidden",
              border: isSelected
                ? "2px solid #6e8cd6"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isSelected ? "0 0 0 1px rgba(110,140,214,0.3)" : "none",
              transition: "all 0.15s",
              background: "#000",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`output ${i + 1}`}
              loading="lazy"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "rgba(255,255,255,0.18)" }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "rgba(255,255,255,0.18)" }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polygon points="10,9 16,12 10,15" fill="currentColor" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "rgba(255,255,255,0.18)" }}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

// 端口圆点 (灵动风格: hover 时浮现 + 呼吸动画 + 拖拽光标)
function PortDot({
  port,
  node,
  isInput,
  visible,
  highlighted,
  onMouseDown,
}: {
  port: Port;
  node: CanvasNode;
  isInput: boolean;
  visible: boolean;
  highlighted: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const pos = portPos(node, port, isInput);
  // 输入端口只接拖拽, 不主动拖出 → 不需要 grab cursor
  const baseCursor = isInput ? "default" : "grab";
  return (
    <div
      data-role="port"
      data-port-id={port.id}
      data-port-node={node.id}
      data-port-input={isInput ? "1" : "0"}
      data-port-type={port.type}
      onMouseDown={onMouseDown}
      title={port.label}
      style={{
        position: "absolute",
        left: pos.x - node.x - PORT_R,
        top: pos.y - node.y - PORT_R,
        width: PORT_R * 2,
        height: PORT_R * 2,
        borderRadius: "50%",
        background: highlighted
          ? "rgba(110,140,214,0.95)"
          : "#1A1A1A",
        border: highlighted
          ? "1.5px solid rgba(140,220,160,1)"
          : "1.5px solid rgba(255,255,255,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: highlighted ? "#fff" : "rgba(255,255,255,0.9)",
        fontSize: "1rem",
        fontWeight: 200,
        cursor: baseCursor,
        pointerEvents: "auto",
        lineHeight: 1,
        zIndex: 3,
        opacity: visible || highlighted ? 1 : 0,
        transform: highlighted
          ? "scale(1.4)"
          : visible ? "scale(1)" : "scale(0.65)",
        transition: "opacity 0.2s ease, transform 0.2s ease, background 0.18s ease, border-color 0.18s ease",
        animation: visible && !highlighted ? "damaiPortBreath 1.6s ease-in-out infinite alternate" : "none",
        boxShadow: highlighted
          ? "0 0 0 5px rgba(140,220,160,0.18), 0 0 16px rgba(140,220,160,0.55)"
          : visible ? "0 0 0 3px rgba(255,255,255,0.06)" : "none",
      }}
    >
      +
    </div>
  );
}

// =====================================================================
// 文本节点浮动工具条 (选中 Text 节点时, 出现在节点上方)
// =====================================================================
function TextToolbar({
  node,
  zoom,
  scroll,
  onFormat,
}: {
  node: CanvasNode;
  zoom: number;
  scroll: { left: number; top: number };
  onFormat: (kind: string) => void;
}) {
  // 计算位置: 节点正上方居中
  const nh = nodeHeight(node);
  const panelWidth = 480;
  // 06-26 修复: position:fixed 是 viewport 相对, 需减去 scroll + 加 INNER_MARGIN(4000) + CANVAS_TOP(56)
  const left = (node.x + NODE_W / 2) * zoom - scroll.left + 4000 - panelWidth / 2;
  const top = node.y * zoom - scroll.top + 4056 - 60;

  return (
    <div
      data-text-toolbar="1"
      style={{
        position: "fixed",
        left: Math.max(20, left),
        top: Math.max(80, top),
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "6px 8px",
        background: "rgba(20,20,22,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 980,
        backdropFilter: "blur(20px)",
        zIndex: 60,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <ToolbarBtn onClick={() => onFormat("color")}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#fff" }} />
      </ToolbarBtn>
      <ToolbarDivider />
      <ToolbarBtn onClick={() => onFormat("h1")}>H1</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("h2")}>H2</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("h3")}>H3</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("quote")}>¶</ToolbarBtn>
      <ToolbarDivider />
      <ToolbarBtn onClick={() => onFormat("bold")}><b>B</b></ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("italic")}><i>I</i></ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("align-left")}>≡</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("align-center")}>≡</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("align-right")}>≡</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("divider")}>—</ToolbarBtn>
      <ToolbarDivider />
      <ToolbarBtn onClick={() => onFormat("copy")}>📋</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("select")}>⇲</ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat("expand")}>↗</ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      data-text-toolbar="1"
      onClick={onClick}
      style={{
        minWidth: 28,
        height: 28,
        padding: "0 6px",
        background: "transparent",
        border: "none",
        borderRadius: 6,
        color: "rgba(255,255,255,0.7)",
        fontSize: "0.75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      data-text-toolbar="1"
      style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 4px" }}
    />
  );
}

// =====================================================================
// 连接线 (贝塞尔)
// =====================================================================
function ConnectionPath({
  a,
  b,
  pending,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  pending?: boolean;
}) {
  const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
  const path = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  return (
    <path
      d={path}
      stroke={pending ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.5)"}
      strokeWidth={1.5}
      strokeDasharray={pending ? "4 3" : "none"}
      fill="none"
    />
  );
}

// =====================================================================
// 双击画布空白处弹出的节点类型选择菜单
// =====================================================================
function DoubleClickNodeMenu({
  screenX,
  screenY,
  onPick,
  onClose,
}: {
  screenX: number;
  screenY: number;
  onPick: (type: NodeType) => void;
  onClose: () => void;
}) {
  // 边距防止贴边
  const PAD = 8;
  const W = 200;
  const H = 290;
  const left = Math.min(window.innerWidth - W - PAD, Math.max(PAD, screenX));
  const top = Math.min(window.innerHeight - H - PAD, Math.max(PAD, screenY));
  return (
    <div
      data-double-click-menu="1"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left,
        top,
        minWidth: W,
        padding: 6,
        background: "rgba(20,20,22,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: "6px 10px 8px",
          fontSize: "0.6875rem",
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        选择节点类型
      </div>
      {(Object.keys(NODE_SPECS) as NodeType[]).map((type) => (
        <button
          key={type}
          data-double-click-menu="1"
          onClick={() => onPick(type)}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            background: "transparent",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: "0.8125rem",
            textAlign: "left",
            cursor: "pointer",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <span
            style={{
              width: 20,
              height: 20,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              background: `${NODE_SPECS[type].color}22`,
              color: NODE_SPECS[type].color,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {NODE_SPECS[type].iconChar}
          </span>
          <span>{NODE_SPECS[type].label}</span>
        </button>
      ))}
    </div>
  );
}

// =====================================================================
// 属性面板 (选中节点时, 浮在节点正下方, 全宽)
// =====================================================================
function PropertiesPanel({
  node,
  zoom,
  scroll,
  upstreamNodes,
  onChange,
  onRun,
  onOptimizePrompt,
}: {
  node: CanvasNode;
  zoom: number;
  scroll: { left: number; top: number };
  upstreamNodes: { id: string; label: string; type: NodeType; refUrl?: string }[];
  onChange: (data: Record<string, any>) => void;
  onRun: () => void;
  onOptimizePrompt: () => void;
}) {
  const spec = NODE_SPECS[node.type];
  const d = node.data;
  const isAI = spec.models.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionPicker, setMentionPicker] = useState<{
    query: string;
    atPos: number;
    cursor: number;
    taRect: { left: number; bottom: number };
    filtered: { id: string; label: string; type: NodeType }[];
    activeIdx: number;
  } | null>(null);

  // 06-26: 比例/画质/联网搜索 合并弹窗状态
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
  const imageSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const [imageButtonRect, setImageButtonRect] = useState<DOMRect | null>(null);
  const toggleImageSettings = () => {
    if (!imageSettingsOpen && imageSettingsButtonRef.current) {
      setImageButtonRect(imageSettingsButtonRef.current.getBoundingClientRect());
    }
    setImageSettingsOpen(v => !v);
  };
  // 点外面 / Esc 关弹窗
  useEffect(() => {
    if (!imageSettingsOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (imageSettingsButtonRef.current?.contains(t)) return;
      const popup = document.querySelector("[data-image-settings-popup]");
      if (popup?.contains(t)) return;
      setImageSettingsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setImageSettingsOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [imageSettingsOpen]);
  // 换节点关弹窗
  useEffect(() => { setImageSettingsOpen(false); }, [node.id]);

  // 从光标往前找 @ 提及,只有 @ 前是空白或开头才算
  function detectMention(value: string, cursor: number): { atPos: number; query: string } | null {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = value[i];
      if (ch === "@") {
        if (i === 0 || WS_RE.test(value[i - 1])) {
          return { atPos: i, query: value.slice(i + 1, cursor) };
        }
        return null;
      }
      if (WS_RE.test(ch)) return null;
    }
    return null;
  }

  function handlePromptChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ta = e.target;
    const newVal = ta.value;
    onChange({ ...d, prompt: newVal });
    const cursor = ta.selectionStart || 0;
    const m = detectMention(newVal, cursor);
    if (m && upstreamNodes.length > 0) {
      const rect = ta.getBoundingClientRect();
      const filtered = upstreamNodes.filter(
        (n) => !m.query || n.label.toLowerCase().includes(m.query.toLowerCase())
      );
      if (filtered.length > 0) {
        setMentionPicker({
          query: m.query,
          atPos: m.atPos,
          cursor,
          taRect: { left: rect.left, bottom: rect.bottom },
          filtered,
          activeIdx: 0,
        });
        return;
      }
    }
    setMentionPicker(null);
  }

  function pickMention(upstream: { id: string; label: string }) {
    if (!mentionPicker || !textareaRef.current) return;
    const ta = textareaRef.current;
    const val = ta.value;
    const token = `@[${upstream.label}]`;
    const newVal = val.slice(0, mentionPicker.atPos) + token + val.slice(mentionPicker.cursor);
    onChange({ ...d, prompt: newVal });
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = mentionPicker.atPos + token.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    });
    setMentionPicker(null);
  }

  // 键盘导航 (↑↓ Enter Esc)
  useEffect(() => {
    if (!mentionPicker) return;
    const handler = (e: KeyboardEvent) => {
      if (!mentionPicker) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionPicker((p) => p ? { ...p, activeIdx: (p.activeIdx + 1) % p.filtered.length } : null);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionPicker((p) => p ? { ...p, activeIdx: (p.activeIdx - 1 + p.filtered.length) % p.filtered.length } : null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const choice = mentionPicker.filtered[mentionPicker.activeIdx];
        if (choice) pickMention(choice);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMentionPicker(null);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [mentionPicker]);

  // 位置: 节点正下方居中
  const nh = nodeHeight(node);
  const panelWidth = 720;
  // 06-26 修复: position:fixed 是 viewport 相对, 需减去 scroll + 加 INNER_MARGIN(4000) + CANVAS_TOP(56)
  const left = (node.x + NODE_W / 2) * zoom - scroll.left + 4000 - panelWidth / 2;
  const top = (node.y + nh) * zoom - scroll.top + 4056 + 24;

  // 当前模型
  const currentModel = d.model || (spec.models[0]?.id ?? "");
  const modelInfo = spec.models.find((m) => m.id === currentModel) || spec.models[0] || { cost: 0 };
  const quantity = Number(d.quantity) || 1;
  const totalCost = modelInfo.cost * quantity;

  function setField(k: string, v: any) {
    onChange({ ...d, [k]: v });
  }

  // 视频模式
  const isVideo = node.type === "video-gen";
  const mode = (d.mode as string) || "首尾帧";

  return (
    <div
      data-properties-panel="1"
      style={{
        position: "fixed",
        left: Math.max(20, left),
        top: Math.max(80, top),
        width: panelWidth,
        background: "rgba(20,20,22,0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* 顶部 tab 按钮区 */}
      {isAI && (
        <div
          data-properties-panel="1"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "12px 12px 0",
          }}
        >
          <PanelTab icon="💡" title="思考" />
          <PanelTab icon={spec.iconChar} title={spec.label} active />
          {isVideo && <PanelTab icon="⇄" title="转换" />}
          <PanelTab icon="+" title="添加" />
          <div style={{ flex: 1 }} />
          <button
            data-properties-panel="1"
            style={{
              width: 28, height: 28,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="展开"
          >
            ↗
          </button>
        </div>
      )}

      {/* 描述输入区 */}
      {isAI && (
        <div data-properties-panel="1" style={{ padding: "8px 16px 0" }}>
          <textarea
            data-properties-panel="1"
            ref={textareaRef}
            value={d.prompt || ""}
            onChange={handlePromptChange}
            onKeyDown={(e) => {
              if (mentionPicker && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) {
                e.preventDefault();
              }
            }}
            placeholder={
              node.type === "text"
                ? "描述你想要生成的内容"
                : node.type === "image"
                  ? "描述任何你想要生成的内容，按 @ 引用素材，/ 呼出指令"
                  : node.type === "video-gen"
                    ? "描述任何你想要生成的内容"
                    : "描述你想要生成的任何内容"
            }
            rows={2}
            style={{
              width: "100%",
              padding: 0,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.9)",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              minHeight: 52,
              lineHeight: 1.5,
            }}
          />

          {/* @ 提及 picker — 仅当上游有节点且 textarea 输入 @ 时显示 */}
          {mentionPicker && (
            <div
              data-properties-panel="1"
              style={{
                position: "fixed",
                top: mentionPicker.taRect.bottom + 6,
                left: mentionPicker.taRect.left,
                zIndex: 10000,
                background: "rgba(20,20,22,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: 6,
                minWidth: 260,
                maxWidth: 360,
                maxHeight: 240,
                overflowY: "auto",
                backdropFilter: "blur(12px)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                animation: "damaiPickerIn 120ms ease-out",
              }}
            >
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "rgba(255,255,255,0.45)",
                  padding: "4px 8px 6px",
                  letterSpacing: "0.04em",
                }}
              >
                引用上游节点 · {mentionPicker.filtered.length} 项
              </div>
              {mentionPicker.filtered.map((n, i) => {
                const spec = NODE_SPECS[n.type];
                const active = i === mentionPicker.activeIdx;
                return (
                  <button
                    key={n.id}
                    data-properties-panel="1"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickMention(n)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: active ? "rgba(255,255,255,0.1)" : "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.875rem",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: "1rem", opacity: 0.7, minWidth: 22, textAlign: "center" }}>
                      {spec?.iconChar || "📎"}
                    </span>
                    <span style={{ flex: 1 }}>{n.label}</span>
                    <span style={{ opacity: 0.35, fontSize: "0.6875rem" }}>
                      Enter
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 06-26: 图生图参考图展示 — 当 image 节点有上游连线时显示 */}
          {(node.type === "image" && (upstreamNodes.length > 0 || (node.data.uploadedUrls as string[])?.length > 0)) && (() => {
            // 过滤出有输出图的参考源 (上游节点)
            const refThumbnails = upstreamNodes.filter((u) => u.refUrl);
            // 用户上传的本地参考图
            const uploadedRefs: { id: string; label: string; url: string }[] =
              ((node.data.uploadedUrls as string[]) || []).map((u, i) => ({
                id: `upload_${i}`,
                label: `上传 ${(u.split("/").pop() || "").slice(0, 10)}`,
                url: u,
              }));
            const allRefs = [...refThumbnails.map(r => ({ id: r.id, label: r.label, url: r.refUrl } as const)), ...uploadedRefs];
            if (allRefs.length === 0) return null;
            return (
              <div
                data-properties-panel="1"
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  background: "rgba(110,140,214,0.08)",
                  border: "1px solid rgba(110,140,214,0.18)",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.75rem", color: "#6e8cd6", fontWeight: 600 }}>🔗 图生图模式</span>
                  <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>
                    已关联 {allRefs.length} 个参考源 · 生成时将参考上游图片特征
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {allRefs.map((ref) => (
                    <div
                      key={ref.id}
                      style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ref.url}
                        alt={ref.label}
                        draggable={false}
                        style={{
                          width: 72,
                          height: 72 * (node.data.aspect === "9:16" ? 1.5 : node.data.aspect === "16:9" ? 0.56 : 0.75),
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.12)",
                          opacity: 0.85,
                        }}
                      />
                      <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ref.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 翻译/优化提示词按钮 */}
          {(node.type === "image" || node.type === "video-gen" || node.type === "audio-gen") && (
            <button
              data-properties-panel="1"
              onClick={onOptimizePrompt}
              style={{
                marginTop: 8,
                padding: "6px 10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: "0.875rem" }}>✨</span>
              <span>翻译 / 优化提示词</span>
            </button>
          )}
        </div>
      )}

      {/* 参数 chips 区 */}
      {isAI && (
        <div
          data-properties-panel="1"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "12px 16px 4px",
          }}
        >
          {/* 模型 */}
          <ChipDropdown
            options={spec.models.map((m) => m.id)}
            value={currentModel}
            onChange={(v) => setField("model", v)}
            prefix="✦"
            highlight
          />

          {/* 视频模式 */}
          {isVideo && (
            <ChipGroup
              options={["首尾帧", "参考图片"]}
              value={mode}
              onChange={(v) => setField("mode", v)}
            />
          )}

          {/* 06-26: image 节点用新弹窗 (比例 + 清晰度 + 联网搜索 合并) */}
          {node.type === "image" && spec.aspects && spec.qualities && (
            <button
              ref={imageSettingsButtonRef}
              data-properties-panel="1"
              onClick={(e) => { e.stopPropagation(); toggleImageSettings(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: imageSettingsOpen ? "rgba(110,140,214,0.12)" : "rgba(255,255,255,0.06)",
                border: imageSettingsOpen ? "1px solid rgba(110,140,214,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999,
                fontSize: "0.8125rem",
                color: "#fff", cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ opacity: 0.6 }}>▭</span>
              <span>{(d.aspect || "16:9")} · {d.quality || spec.qualities[0]}</span>
            </button>
          )}
          {/* video-gen / audio-gen 等保持原 ChipDropdown */}
          {node.type !== "image" && spec.aspects && (
            <ChipDropdown
              options={mode === "首尾帧" ? ["自适应"] : spec.aspects}
              value={d.aspect || "自适应"}
              onChange={(v) => setField("aspect", v)}
              prefix="▭"
            />
          )}
          {node.type !== "image" && spec.qualities && (
            <ChipDropdown
              options={spec.qualities}
              value={d.quality || spec.qualities[0]}
              onChange={(v) => setField("quality", v)}
              prefix="◉"
            />
          )}
          {/* 弹窗 (position:fixed 跳出 panel overflow:hidden) */}
          {imageSettingsOpen && imageButtonRect && (
            <ImageSettingsPopup
              anchorRect={imageButtonRect}
              aspect={d.aspect || "16:9"}
              quality={d.quality || spec.qualities?.[0]}
              qualities={spec.qualities}
              onAspectChange={(v) => setField("aspect", v)}
              onQualityChange={(v) => setField("quality", v)}
              webSearch={!!d.webSearch}
              onWebSearchChange={(v) => setField("webSearch", v)}
              onClose={() => setImageSettingsOpen(false)}
            />
          )}

          {/* 时长 */}
          {isVideo && mode === "首尾帧" && (
            <ChipGroup
              options={[5, 10, 15].map((n) => `${n}s`)}
              value={`${d.duration || 5}s`}
              onChange={(v) => setField("duration", Number(v.replace("s", "")))}
            />
          )}
          {isVideo && mode === "参考图片" && (
            <DurationSlider
              min={4}
              max={15}
              value={Number(d.duration) || 8}
              onChange={(v) => setField("duration", v)}
            />
          )}

          {/* 音频开关 (video) */}
          {isVideo && spec.hasAudioToggle && (
            <ChipGroup
              options={["开启", "静音"]}
              value={d.audio || "静音"}
              onChange={(v) => setField("audio", v)}
              prefix="♪"
            />
          )}

          {/* 音频类型 (audio) */}
          {node.type === "audio-gen" && spec.audioTypes && (
            <ChipGroup
              options={spec.audioTypes}
              value={d.audioType || "纯音乐"}
              onChange={(v) => setField("audioType", v)}
            />
          )}
        </div>
      )}

      {/* 底部操作条 */}
      <div
        data-properties-panel="1"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px 14px",
          borderTop: isAI ? "1px solid rgba(255,255,255,0.06)" : "none",
          marginTop: isAI ? 8 : 0,
        }}
      >
        {isAI ? (
          <>
            {/* 语音输入 */}
            {spec.hasVoiceInput && (
              <VoiceButton
                active={!!d.voiceInput}
                onClick={() => setField("voiceInput", !d.voiceInput)}
              />
            )}

            <div style={{ flex: 1 }} />

            {/* 数量选择 */}
            <ChipGroup
              options={["1×", "2×", "4×"]}
              value={`${quantity}×`}
              onChange={(v) => setField("quantity", Number(v.replace("×", "")))}
            />

            {/* 积分显示 */}
            <div
              data-properties-panel="1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 980,
                fontSize: "0.75rem",
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ opacity: 0.7 }}>◆</span>
              <span>{totalCost}</span>
            </div>

            {/* 运行按钮 */}
            <button
              data-properties-panel="1"
              onClick={onRun}
              disabled={node.status === "running"}
              style={{
                width: 36, height: 36,
                background: node.status === "running"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.95)",
                border: "none",
                borderRadius: "50%",
                color: node.status === "running" ? "#fff" : "#0a0a0a",
                fontSize: "0.9375rem",
                cursor: node.status === "running" ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↑
            </button>
          </>
        ) : (
          <div
            data-properties-panel="1"
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.5)",
              padding: "8px 0",
            }}
          >
            {node.type === "merge" ? "合并节点 · 无配置" : "输出节点 · 无配置"}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// 06-26: 图片生成设置弹窗 (画质 + 比例 + 联网搜索, 参考 TapNow 设计)
// =====================================================================
const RATIO_OPTIONS: { v: string; w?: number; h?: number; isAdaptive?: boolean }[] = [
  { v: "自适应", isAdaptive: true },
  { v: "1:1", w: 1, h: 1 }, { v: "9:16", w: 9, h: 16 }, { v: "16:9", w: 16, h: 9 },
  { v: "3:4", w: 3, h: 4 }, { v: "4:3", w: 4, h: 3 },
  { v: "3:2", w: 3, h: 2 }, { v: "2:3", w: 2, h: 3 },
  { v: "5:4", w: 5, h: 4 }, { v: "4:5", w: 4, h: 5 }, { v: "21:9", w: 21, h: 9 },
];

function ImageSettingsPopup({
  anchorRect, aspect, quality, qualities,
  onAspectChange, onQualityChange,
  webSearch, onWebSearchChange, onClose,
}: {
  anchorRect: DOMRect;
  aspect: string;
  quality: string;
  qualities?: string[];
  onAspectChange: (v: string) => void;
  onQualityChange: (v: string) => void;
  webSearch: boolean;
  onWebSearchChange: (v: boolean) => void;
  onClose: () => void;
}) {
  // 06-26: 用 portal 挂到 body — 逃出 panel 的 backdrop-filter containing block
  // (panel 有 backdropFilter:blur, 会让内部 position:fixed 子元素相对 panel 定位)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // 06-26: 智能 flip — 按钮靠视口底部时, 弹窗翻到按钮下方避免被裁
  const popupRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"above" | "below">("above");
  useLayoutEffect(() => {
    if (!popupRef.current) return;
    const h = popupRef.current.offsetHeight;
    const spaceAbove = anchorRect.top - 8;
    const spaceBelow = window.innerHeight - anchorRect.bottom - 8;
    if (spaceAbove >= h) setPlacement("above");
    else if (spaceBelow >= h) setPlacement("below");
    else setPlacement(spaceAbove > spaceBelow ? "above" : "below");
  }, [anchorRect.top, anchorRect.bottom]);
  const popTop = placement === "above" ? anchorRect.top : anchorRect.bottom;
  const popTransform = placement === "above"
    ? "translateY(calc(-100% - 8px))"
    : "translateY(8px)";
  if (!mounted) return null;
  const popup = (
    <div
      ref={popupRef}
      data-image-settings-popup="1"
      style={{
        position: "fixed",
        left: Math.max(8, anchorRect.left),
        top: popTop,
        width: 320,
        transform: popTransform,
        background: "rgba(20,20,22,0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 16,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        zIndex: 100,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <PopupSectionLabel>画质</PopupSectionLabel>
      <PillGroup options={qualities} value={quality}
        onChange={(v) => { onQualityChange(v); onClose(); }} />

      <PopupSectionLabel style={{ marginTop: 16 }}>比例</PopupSectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {RATIO_OPTIONS.map((r) => (
          <RatioButton key={r.v} ratio={r} active={aspect === r.v}
            onClick={() => { onAspectChange(r.v); onClose(); }} />
        ))}
      </div>

      <PopupSectionLabel style={{ marginTop: 16 }}>联网搜索</PopupSectionLabel>
      <PillGroup options={["ON", "OFF"]} value={webSearch ? "ON" : "OFF"}
        onChange={(v) => { onWebSearchChange(v === "ON"); onClose(); }} />
    </div>
  );
  return createPortal(popup, document.body);
}

function PopupSectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", marginBottom: 8, ...style }}>{children}</div>;
}

function PillGroup({ options = [], value, onChange }: { options?: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: 4 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <button key={o} data-properties-panel="1" onClick={() => onChange(o)} style={{
            flex: 1, padding: "6px 0", border: "none", borderRadius: 999,
            background: active ? "rgba(255,255,255,0.12)" : "transparent",
            color: active ? "#fff" : "rgba(255,255,255,0.55)",
            fontSize: "0.8125rem", fontWeight: active ? 500 : 400,
            cursor: "pointer", transition: "all 0.15s ease",
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function RatioButton({ ratio, active, onClick }: {
  ratio: { v: string; w?: number; h?: number; isAdaptive?: boolean };
  active: boolean; onClick: () => void;
}) {
  const MAX = 22;
  let iconW = MAX, iconH = MAX;
  if (!ratio.isAdaptive && ratio.w && ratio.h) {
    if (ratio.w >= ratio.h) { iconW = MAX; iconH = MAX * ratio.h / ratio.w; }
    else { iconH = MAX; iconW = MAX * ratio.w / ratio.h; }
  }
  return (
    <button data-properties-panel="1" onClick={onClick} style={{
      padding: "8px 0", border: "none", borderRadius: 8,
      background: active ? "rgba(110,140,214,0.2)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.7)",
      cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      transition: "all 0.15s ease",
    }}>
      <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ratio.isAdaptive ? (
          <span style={{ fontSize: 16, lineHeight: 1 }}>⛶</span>
        ) : (
          <div style={{
            width: iconW, height: iconH,
            border: `1.5px solid ${active ? "#fff" : "currentColor"}`,
            borderRadius: 2,
          }} />
        )}
      </div>
      <div style={{ fontSize: "0.6875rem" }}>{ratio.v}</div>
    </button>
  );
}

// =====================================================================
// 属性面板子组件
// =====================================================================
function PanelTab({ icon, active, title }: { icon: string; active?: boolean; title?: string }) {
  return (
    <button
      data-properties-panel="1"
      title={title}
      style={{
        width: 36, height: 36,
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        border: "none",
        borderRadius: 10,
        color: active ? "#fff" : "rgba(255,255,255,0.5)",
        fontSize: "1rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </button>
  );
}

function Chip({ label, onClick, highlight, prefix }: { label: string; onClick?: () => void; highlight?: boolean; prefix?: string }) {
  return (
    <div
      data-properties-panel="1"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        background: highlight ? "rgba(110,140,214,0.12)" : "rgba(255,255,255,0.06)",
        border: highlight ? "1px solid rgba(110,140,214,0.3)" : "1px solid transparent",
        borderRadius: 8,
        fontSize: "0.75rem",
        color: highlight ? "#fff" : "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {prefix && <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{prefix}</span>}
      <span>{label}</span>
    </div>
  );
}

function ChipDropdown({
  options,
  value,
  onChange,
  prefix,
  highlight,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div data-properties-panel="1" style={{ position: "relative" }}>
      <button
        data-properties-panel="1"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          background: highlight ? "rgba(110,140,214,0.12)" : "rgba(255,255,255,0.06)",
          border: highlight ? "1px solid rgba(110,140,214,0.3)" : "1px solid transparent",
          borderRadius: 8,
          fontSize: "0.75rem",
          color: highlight ? "#fff" : "rgba(255,255,255,0.85)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {prefix && <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{prefix}</span>}
        <span>{value}</span>
        <span style={{ opacity: 0.5, fontSize: "0.625rem", marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <div
          data-properties-panel="1"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            minWidth: 160,
            maxHeight: 280,
            overflowY: "auto",
            background: "rgba(20,20,22,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: 4,
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              data-properties-panel="1"
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                background: opt === value ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: "0.75rem",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
  prefix,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div
      data-properties-panel="1"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: 2,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 8,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          data-properties-panel="1"
          onClick={() => onChange(opt)}
          style={{
            padding: "4px 10px",
            background: opt === value ? "rgba(255,255,255,0.12)" : "transparent",
            border: "none",
            borderRadius: 6,
            color: opt === value ? "#fff" : "rgba(255,255,255,0.55)",
            fontSize: "0.75rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function VoiceButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      data-properties-panel="1"
      onClick={onClick}
      title="语音输入"
      style={{
        width: 32, height: 32,
        background: active ? "rgba(110,140,214,0.2)" : "transparent",
        border: "none",
        borderRadius: "50%",
        color: active ? "#6e8cd6" : "rgba(255,255,255,0.5)",
        fontSize: "0.875rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      🎤
    </button>
  );
}

function DurationSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      data-properties-panel="1"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)" }}>{min}s</span>
      <input
        data-properties-panel="1"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 80,
          accentColor: "#6e8cd6",
        }}
      />
      <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)" }}>{max}s</span>
      <span style={{
        fontSize: "0.75rem",
        color: "#fff",
        fontWeight: 500,
        minWidth: 28,
        textAlign: "right",
      }}>
        {value}s
      </span>
    </div>
  );
}
