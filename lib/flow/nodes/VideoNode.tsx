import { type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { BaseNode } from "./BaseNode";
import { useNodeUpdater } from "../useNodeUpdater";
import { useUpstreamImage } from "../useUpstream";
import { NodePopover } from "../NodePopover";
import type { FlowNode } from "../types";
import { generate } from "../api/mockGenerate";

type Props = NodeProps<FlowNode> & {
  isActive: boolean;
  onActivate: (e: React.MouseEvent) => void;
};

export function VideoNode({ id, data, isActive, onActivate }: Props) {
  const update = useNodeUpdater(id);
  const upstream = useUpstreamImage(id);
  const [progress, setProgress] = useState(0);
  const isRunning = data.status === "running";
  const output = data.output;
  const hasOutput = output.kind === "video" || output.kind === "image";
  const outputSrc = hasOutput ? output.src : "";
  const refImage = data.inputImage || upstream;

  async function run() {
    if (data.prompt.trim().length === 0 || isRunning) return;
    update({ status: "running", output: { kind: "empty" }, errorMsg: undefined });
    setProgress(0);
    try {
      const { output } = await generate("video", { prompt: data.prompt, inputImage: refImage, quantity: data.quantity || 1, onProgress: setProgress });
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
    <div className="dm-node-bare-media">
      <img src={outputSrc} alt="" />
      <div className="dm-node-bare-video-badge">VIDEO</div>
    </div>
  ) : isRunning ? (
    <div className="dm-node-bare-running"><div className="dm-shimmer" /><div className="dm-node-bare-progress">{progress}%</div></div>
  ) : refImage ? (
    <img src={refImage} alt="" className="dm-node-bare-media" />
  ) : (
    <div className="dm-node-bare-placeholder"><div className="dm-node-bare-placeholder-hint">请连接上游或上传图片</div></div>
  );

  return (
    <BaseNode status={data.status} progress={progress} needInput={true} isActive={isActive}
      label="视频" variant="video" onUpload={pickFile} onActivate={onActivate}
      popover={<NodePopover kind="video" data={data} isActive={true} onChange={(p) => update(p)} onRun={run}
        onUpload={pickFile} onClose={() => onActivate({ stopPropagation: () => {} } as unknown as React.MouseEvent)} />}>
      {preview}
    </BaseNode>
  );
}