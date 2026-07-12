import { type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { BaseNode } from "./BaseNode";
import { useNodeUpdater } from "../useNodeUpdater";
import { NodePopover } from "../NodePopover";
import type { FlowNode } from "../types";
import { generate } from "../api/mockGenerate";

type Props = NodeProps<FlowNode> & {
  isActive: boolean;
  onActivate: (e: React.MouseEvent) => void;
};

export function TextNode({ id, data, isActive, onActivate }: Props) {
  const update = useNodeUpdater(id);
  const [progress, setProgress] = useState(0);
  const isRunning = data.status === "running";
  const output = data.output;
  const hasOutput = output.kind === "image";

  async function run() {
    if (data.prompt.trim().length === 0 || isRunning) return;
    update({ status: "running", output: { kind: "empty" }, errorMsg: undefined });
    setProgress(0);
    try {
      const { output } = await generate("text", { prompt: data.prompt, quantity: data.quantity || 1, onProgress: setProgress });
      update({ status: "success", output });
    } catch (e: any) {
      update({ status: "error", errorMsg: e?.message ?? "failed" });
    }
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => {
      const f = input.files && input.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => update({ inputImage: String(reader.result || "") });
      reader.readAsDataURL(f);
    };
    input.click();
  }

  const preview = hasOutput ? (
    <img src={output.kind === "image" ? output.src : ""} alt="" className="dm-node-bare-media" />
  ) : isRunning ? (
    <div className="dm-node-bare-running"><div className="dm-shimmer" /><div className="dm-node-bare-progress">{progress}%</div></div>
  ) : data.inputImage ? (
    <img src={data.inputImage} alt="" className="dm-node-bare-media" />
  ) : (
    <div className="dm-node-bare-placeholder"><div className="dm-node-bare-placeholder-hint">点击输入描述生成文案</div></div>
  );

  return (
    <BaseNode status={data.status} progress={progress} needInput={false} isActive={isActive}
      label="文本" variant="text" onUpload={pickFile} onActivate={onActivate}
      popover={<NodePopover kind="text" data={data} isActive={true} onChange={(p) => update(p)} onRun={run}
        onUpload={pickFile} onClose={() => onActivate({ stopPropagation: () => {} } as unknown as React.MouseEvent)} />}>
      {preview}
    </BaseNode>
  );
}