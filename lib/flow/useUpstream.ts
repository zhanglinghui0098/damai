import { useReactFlow } from "@xyflow/react";
import type { FlowNode } from "./types";

export function useUpstreamImage(id: string): string | null {
  const { getNodes, getEdges } = useReactFlow<FlowNode>();
  const edges = getEdges();
  const nodes = getNodes();

  const incoming = edges.find((e) => e.target === id && (e.targetHandle ?? "in") === "in");
  if (!incoming) return null;

  const src = nodes.find((n) => n.id === incoming.source);
  if (!src) return null;
  const out = src.data.output;
  if (!out) return null;
  if (out.kind === "image" || out.kind === "video") return out.src;
  return null;
}