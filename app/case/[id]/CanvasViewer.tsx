"use client";

import Link from "next/link";

type PortType = "text" | "image" | "video" | "audio";
type Port = { id: string; label: string; type: PortType };
type VNode = {
  id: string; type: string; x: number; y: number;
  data: Record<string, any>;
  inputs: Port[]; outputs: Port[];
};
type VEdge = { id: string; fromNode: string; fromPort: string; toNode: string; toPort: string };

const NODE_DEF: Record<string, { label: string; color: string }> = {
  text: { label: "文本输入", color: "#6e6e73" },
  image: { label: "图片输入", color: "#6e6e73" },
  "video-gen": { label: "AI 视频生成", color: "#0071e3" },
  "audio-gen": { label: "AI 音频生成", color: "#c75d2c" },
  merge: { label: "合并音视频", color: "#1d1d1f" },
  output: { label: "成片输出", color: "#1d1d1f" },
};

const W = 200;
const PR = 6;
const PG = 26;

function nodeH(n: VNode) {
  return 36 + Math.max(n.inputs.length, n.outputs.length, 1) * PG + 8;
}
function portXY(n: VNode, p: Port, isIn: boolean) {
  const list = isIn ? n.inputs : n.outputs;
  const i = list.findIndex((pp) => pp.id === p.id);
  return { x: isIn ? n.x : n.x + W, y: n.y + 36 + i * PG + PG / 2 };
}

export default function CanvasViewer({
  nodes,
  edges,
}: {
  nodes: VNode[];
  edges: VEdge[];
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "#fbfbfd",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        borderRadius: 16,
        border: "1px solid var(--border-light)",
        overflow: "hidden",
        minHeight: 460,
      }}
    >
      <div style={{ position: "relative", width: 1200, height: 520 }}>
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          {edges.map((e) => {
            const f = nodes.find((n) => n.id === e.fromNode);
            const t = nodes.find((n) => n.id === e.toNode);
            if (!f || !t) return null;
            const fp = f.outputs.find((p) => p.id === e.fromPort);
            const tp = t.inputs.find((p) => p.id === e.toPort);
            if (!fp || !tp) return null;
            const a = portXY(f, fp, false);
            const b = portXY(t, tp, true);
            const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
            return (
              <path
                key={e.id}
                d={`M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`}
                stroke="#1d1d1f"
                strokeWidth="1.5"
                fill="none"
                opacity="0.85"
              />
            );
          })}
        </svg>
        {nodes.map((n) => (
          <NodeView key={n.id} n={n} />
        ))}
      </div>
      <div
        style={{
          position: "absolute", bottom: 12, right: 12,
          fontSize: "0.7rem",
          color: "var(--text-tertiary)",
          background: "rgba(255,255,255,0.85)",
          padding: "4px 10px",
          borderRadius: 980,
          backdropFilter: "blur(8px)",
        }}
      >
        只读模式 — 复制后可编辑
      </div>
    </div>
  );
}

function NodeView({ n }: { n: VNode }) {
  const def = NODE_DEF[n.type] || { label: n.type, color: "#6e6e73" };
  const h = nodeH(n);
  return (
    <div
      style={{
        position: "absolute",
        left: n.x, top: n.y, width: W,
        background: "#fff",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: def.color }} />
        <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text)" }}>{def.label}</div>
      </div>
      <div style={{ position: "relative", minHeight: h - 36 - 8, padding: `${PG / 2}px 0` }}>
        {n.inputs.map((p, i) => (
          <PortView key={p.id} port={p} y={i * PG + PG / 2} isIn />
        ))}
        {n.outputs.map((p, i) => (
          <PortView key={p.id} port={p} y={i * PG + PG / 2} isIn={false} />
        ))}
      </div>
    </div>
  );
}

function PortView({ port, y, isIn }: { port: Port; y: number; isIn: boolean }) {
  return (
    <div
      style={{
        position: "absolute", top: y, left: 0, right: 0, height: PG,
        display: "flex", alignItems: "center",
        justifyContent: isIn ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6,
          flexDirection: isIn ? "row" : "row-reverse",
          paddingLeft: isIn ? 0 : 0,
          paddingRight: isIn ? 12 : 12,
        }}
      >
        <div
          style={{
            width: PR * 2, height: PR * 2, borderRadius: "50%",
            background: "#fff", border: `2px solid ${portColor(port.type)}`,
            marginLeft: isIn ? -PR : 0,
            marginRight: isIn ? 0 : -PR,
          }}
        />
        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{port.label}</span>
      </div>
    </div>
  );
}

function portColor(t: PortType) {
  return ({ text: "#6e6e73", image: "#6e6e73", video: "#0071e3", audio: "#c75d2c" } as const)[t];
}

// =====================================================================
// 示例画布 (案例 c1: 现代极简三人沙发 30s)
// =====================================================================
export const DEMO_NODES: VNode[] = [
  {
    id: "n1", type: "text", x: 60, y: 60,
    data: { label: "现代极简三人沙发, 奶油风, 30s 场景" },
    inputs: [], outputs: [{ id: "out", label: "文本", type: "text" }],
  },
  {
    id: "n2", type: "image", x: 60, y: 220,
    data: { label: "主图 (奶油色三人位)" },
    inputs: [], outputs: [{ id: "out", label: "图片", type: "image" }],
  },
  {
    id: "n3", type: "video-gen", x: 360, y: 100,
    data: { prompt: "现代极简客厅, 沙发入画, 暖色光, 30s 缓慢推镜" },
    inputs: [
      { id: "text", label: "提示词", type: "text" },
      { id: "image", label: "主图", type: "image" },
    ],
    outputs: [{ id: "video", label: "视频", type: "video" }],
  },
  {
    id: "n4", type: "audio-gen", x: 360, y: 320,
    data: { prompt: "温暖, 极简, 30s 配乐" },
    inputs: [{ id: "text", label: "提示词", type: "text" }],
    outputs: [{ id: "audio", label: "音频", type: "audio" }],
  },
  {
    id: "n5", type: "merge", x: 660, y: 200,
    data: {},
    inputs: [
      { id: "video", label: "视频", type: "video" },
      { id: "audio", label: "音频", type: "audio" },
    ],
    outputs: [{ id: "out", label: "视频", type: "video" }],
  },
  {
    id: "n6", type: "output", x: 940, y: 200,
    data: {},
    inputs: [{ id: "video", label: "视频", type: "video" }],
    outputs: [],
  },
];

export const DEMO_EDGES: VEdge[] = [
  { id: "e1", fromNode: "n1", fromPort: "out", toNode: "n3", toPort: "text" },
  { id: "e2", fromNode: "n2", fromPort: "out", toNode: "n3", toPort: "image" },
  { id: "e3", fromNode: "n3", fromPort: "video", toNode: "n5", toPort: "video" },
  { id: "e4", fromNode: "n4", fromPort: "audio", toNode: "n5", toPort: "audio" },
  { id: "e5", fromNode: "n5", fromPort: "out", toNode: "n6", toPort: "video" },
];