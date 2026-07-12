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

export function AudioNode({ id, data, isActive, onActivate }: Props) {
  const update = useNodeUpdater(id);
  const [progress, setProgress] = useState(0);
  const isRunning = data.status === "running";
  const hasOutput = data.output.kind === "audio";

  async function run() {
    if (data.prompt.trim().length === 0 || isRunning) return;
    update({ status: "running", output: { kind: "empty" }, errorMsg: undefined });
    setProgress(0);
    try {
      const { output } = await generate("audio", { prompt: data.prompt, quantity: data.quantity || 1, onProgress: setProgress });
      update({ status: "success", output });
    } catch (e: any) {
      update({ status: "error", errorMsg: e?.message ?? "failed" });
    }
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "audio/*";
    input.onchange = () => {
      const f = input.files && input.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => update({ inputImage: String(reader.result || "") });
      reader.readAsDataURL(f);
    };
    input.click();
  }

  const preview = hasOutput ? (
    <div className="dm-node-bare-audio-result">
      <div className="dm-node-bare-waveform">
        {[...Array(32)].map((_, i) => (
          <span key={i} style={{ height: `${20 + Math.abs(Math.sin(i * 0.5)) * 60}%` }} />
        ))}
      </div>
      <div className="dm-node-bare-audio-badge">AUDIO</div>
    </div>
  ) : isRunning ? (
    <div className="dm-node-bare-running"><div className="dm-shimmer" /><div className="dm-node-bare-progress">{progress}%</div></div>
  ) : (
    <div className="dm-node-bare-placeholder"><div className="dm-node-bare-placeholder-hint">点击输入描述生成音频</div></div>
  );

  return (
    <BaseNode status={data.status} progress={progress} needInput={false} isActive={isActive}
      label="音频" variant="audio" onUpload={pickFile} onActivate={onActivate}
      popover={<NodePopover kind="audio" data={data} isActive={true} onChange={(p) => update(p)} onRun={run}
        onUpload={pickFile} onClose={() => onActivate({ stopPropagation: () => {} } as unknown as React.MouseEvent)} />}>
      {preview}
    </BaseNode>
  );
}