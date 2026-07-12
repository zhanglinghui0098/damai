import { type NodeProps } from "@xyflow/react";
import { useState, useCallback } from "react";
import { BaseNode } from "./BaseNode";
import { useNodeUpdater } from "../useNodeUpdater";
import { useUpstreamImage } from "../useUpstream";
import { NodePopover } from "../NodePopover";
import type { FlowNode } from "../types";

type Props = NodeProps<FlowNode> & {
  isActive: boolean;
  onActivate: (e: React.MouseEvent) => void;
};

export function ImageNode({ id, data, isActive, onActivate }: Props) {
  const update = useNodeUpdater(id);
  const upstream = useUpstreamImage(id);
  const [progress, setProgress] = useState(0);
  const isRunning = data.status === "running";
  const output = data.output;
  const hasOutput = output.kind === "image" || output.kind === "video";
  const outputSrc = hasOutput ? output.src : "";
  const refImage = data.inputImage || upstream;

  const onRun = useCallback(async () => {
    if (data.prompt.trim().length === 0 || isRunning) return;
    update({ status: "running", output: { kind: "empty" }, errorMsg: undefined });
    setProgress(0);

    // 模拟进度
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 200);

    try {
      const res = await fetch('/api/canvas/run-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt || '',
          model: (data.model as string) || undefined,
          aspect: (data.ratio as string) || undefined,
          quality: (data.quality as string) || undefined,
          quantity: data.quantity || 1,
          referenceUrls: refImage ? [refImage] : undefined,
        }),
      });
      const json = await res.json();
      clearInterval(timer);

      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }

      update({
        status: "success",
        output: { kind: "image", src: json.outputUrl },
      });
      setProgress(100);
    } catch (e: any) {
      clearInterval(timer);
      console.error('[ImageNode run]', id, e);
      update({ status: "error", errorMsg: e?.message || "生成失败" });
    }
  }, [id, data.prompt, data.status, data.model, data.ratio, data.quality, data.quantity, refImage, update]);

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
    <img src={outputSrc} alt="" className="dm-node-bare-media" />
  ) : isRunning ? (
    <div className="dm-node-bare-running"><div className="dm-shimmer" /><div className="dm-node-bare-progress">{progress}%</div></div>
  ) : refImage ? (
    <img src={refImage} alt="" className="dm-node-bare-media" />
  ) : (
    <div className="dm-node-bare-placeholder"><div className="dm-node-bare-placeholder-hint">点击输入描述或上传图片</div></div>
  );

  return (
    <BaseNode status={data.status} progress={progress} needInput={true} isActive={isActive}
      label="图片" variant="image" onUpload={pickFile} onActivate={onActivate}
      popover={<NodePopover kind="image" data={data} isActive={true} onChange={(p) => update(p)} onRun={onRun}
        onUpload={pickFile} onClose={() => onActivate({ stopPropagation: () => {} } as unknown as React.MouseEvent)} />}>
      {preview}
    </BaseNode>
  );
}