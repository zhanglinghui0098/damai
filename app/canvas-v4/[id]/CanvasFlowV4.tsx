"use client";

import {
  ReactFlow,
  Background,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Edge,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FloatingTools } from "@/lib/flow/FloatingTools";
import { ZoomControls } from "@/lib/flow/ZoomControls";
import { nodeTypes } from "@/lib/flow/nodes";
import { NODE_KINDS, type NodeKind, type FlowNode, type FlowNodeData } from "@/lib/flow/types";

function newNodeId() {
  return `n_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function makeDefaults(kind: NodeKind): FlowNodeData {
  const meta = NODE_KINDS.find((k) => k.kind === kind);
  if (!meta) throw new Error("unknown kind: " + kind);
  return {
    kind,
    title: meta.title,
    prompt: "",
    inputImage: null,
    output: { kind: "empty" },
    status: "idle",
  };
}

function CanvasFlowV4Inner({ projectId }: { projectId: string }) {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // localStorage key 带 projectId
  const storageKey = useMemo(() => `damai:canvas-v4:${projectId}`, [projectId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey + ":nodes");
      if (raw) setNodes(JSON.parse(raw));
      const rawE = localStorage.getItem(storageKey + ":edges");
      if (rawE) setEdges(JSON.parse(rawE));
    } catch (e) {
      console.warn("[canvas-v4] load failed", e);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey + ":nodes", JSON.stringify(nodes));
        localStorage.setItem(storageKey + ":edges", JSON.stringify(edges));
        setSavedAt(new Date());
      } catch (e) {
        console.warn("[canvas-v4] save failed", e);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, storageKey, hydrated]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((arr) => applyNodeChanges(changes, arr) as FlowNode[]),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((arr) => applyEdgeChanges(changes, arr)),
    []
  );
  const onConnect = useCallback(
    (conn: any) => setEdges((arr) => addEdge({ ...conn, type: "default", animated: false }, arr)),
    []
  );

  const wrappedNodeTypes = useMemo(() => {
    const wrapped: Record<string, any> = {};
    for (const [k, Comp] of Object.entries(nodeTypes)) {
      wrapped[k] = (props: any) => (
        <Comp
          {...props}
          isActive={activeNodeId === props.id}
          onActivate={(e: React.MouseEvent) => {
            e.stopPropagation();
            setActiveNodeId((cur) => (cur === props.id ? null : props.id));
          }}
        />
      );
    }
    return wrapped;
  }, [activeNodeId]);

  const onAdd = useCallback(
    (kind: NodeKind, e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: FlowNode = {
        id: newNodeId(),
        type: kind,
        position: { x: pos.x - 120, y: pos.y - 20 },
        data: makeDefaults(kind),
      };
      setNodes((arr) => [...arr, newNode]);
      setActiveNodeId(newNode.id);
    },
    [screenToFlowPosition]
  );

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveNodeId(null);
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        const selectedIds = new Set(
          nodes.filter((n) => n.selected).map((n) => n.id)
        );
        if (selectedIds.size === 0) return;
        setNodes((arr) => arr.filter((n) => !selectedIds.has(n.id)));
        setEdges((arr) =>
          arr.filter(
            (e2) => !selectedIds.has(e2.source) && !selectedIds.has(e2.target)
          )
        );
        setActiveNodeId(null);
      }
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nodes]);

  const counts = useMemo(() => {
    const running = nodes.filter((n) => n.data.status === "running").length;
    return { total: nodes.length, running };
  }, [nodes]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={wrappedNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_e, node) => setActiveNodeId(node.id)}
        onPaneClick={() => setActiveNodeId(null)}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "default" }}
        deleteKeyCode={null}
      >
        <Background gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <MiniMap
          pannable
          zoomable
          nodeColor={() => "#6e8cd6"}
          nodeStrokeColor="#0a0a0b"
          maskColor="rgba(110,140,214,0.12)"
        />
      </ReactFlow>

      <FloatingTools onAdd={onAdd} />
      <ZoomControls />

      <div className="dm-topbar">
        <div className="dm-topbar-title">大脉 · 无限画布 v4</div>
        <div className="dm-topbar-spacer" />
        <div className="dm-topbar-status">
          <div
            className="dm-topbar-dot"
            style={{
              background: counts.running > 0 ? "var(--accent)" : "var(--ok)",
            }}
          />
          <span>
            {counts.total} 节点
            {counts.running > 0 ? ` · ${counts.running} 运行中` : ""}
            {savedAt ? ` · 已保存 ${formatTime(savedAt)}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function CanvasFlowV4({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlowV4Inner projectId={projectId} />
    </ReactFlowProvider>
  );
}