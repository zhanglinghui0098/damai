import { useReactFlow } from "@xyflow/react";
import type { FlowNode, FlowNodeData } from "./types";

export function useNodeUpdater(id: string) {
  const { setNodes } = useReactFlow<FlowNode>();
  return (partial: Partial<FlowNodeData>) => {
    setNodes((arr) =>
      arr.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...partial } } : n
      )
    );
  };
}