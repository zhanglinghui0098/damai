import { Handle, Position } from "@xyflow/react";
import type { NodeStatus } from "../types";

const STATUS_LABEL: Record<NodeStatus, string> = {
  idle: "待运行",
  running: "生成中",
  success: "完成",
  error: "失败",
};

export type BaseNodeProps = {
  status: NodeStatus;
  progress: number;
  needInput: boolean;
  isActive: boolean;
  label: string;
  variant: "text" | "image" | "video" | "audio";
  onUpload: (e: React.MouseEvent) => void;
  onActivate: (e: React.MouseEvent) => void;
  popover?: React.ReactNode;
  children: React.ReactNode;
};

function CenterIcon({ variant }: { variant: string }) {
  if (variant === "text") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 7h16M9 7v13M15 7v13" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "image") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === "video") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="M17 10l4-2v8l-4-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // audio — music note
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18V6l10-2v12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

export function BaseNode({
  status,
  progress,
  needInput,
  isActive,
  label,
  variant,
  onUpload,
  onActivate,
  popover,
  children,
}: BaseNodeProps) {
  return (
    <div className={"dm-node-bare variant-" + variant + (isActive ? " active" : "")} data-status={status}>
      {isActive && (
        <button
          className="dm-node-bare-upload"
          onClick={(e) => { e.stopPropagation(); onUpload(e); }}
          title="上传本地文件"
          data-popover="1"
        >
          <span className="dm-icon-upload">↑</span>
          <span>上传</span>
        </button>
      )}

      <div className="dm-node-bare-label">
        <span className={"dm-node-bare-icon variant-" + variant} />
        <span>{label}</span>
        <span className={"dm-node-bare-status " + status}>
          {status === "running" ? progress + "%" : STATUS_LABEL[status]}
        </span>
      </div>

      <div className="dm-node-bare-preview" onClick={onActivate}>
        <div className={"dm-node-bare-center-icon variant-" + variant}>
          <CenterIcon variant={variant} />
        </div>
        {children}
      </div>

      {needInput && (
        <Handle type="target" position={Position.Left} id="in"
          className="dm-handle dm-handle-left" isConnectable />
      )}
      <Handle type="source" position={Position.Right} id="out"
        className="dm-handle dm-handle-right" isConnectable />

      {isActive && popover && (
        <div className="dm-node-bare-popover-wrap" onClick={(e) => e.stopPropagation()}>
          {popover}
        </div>
      )}
    </div>
  );
}