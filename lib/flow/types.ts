import type { Node, Edge } from "@xyflow/react";

/** 4 种节点类型 */
export type NodeKind = "text" | "image" | "video" | "audio";

export const NODE_KINDS: { kind: NodeKind; title: string; desc: string; icon: string }[] = [
  { kind: "text",  title: "文本",  desc: "脚本 / 广告词 / 品牌文案",  icon: "T" },
  { kind: "image", title: "图片",  desc: "文生图 / 图生图",            icon: "I" },
  { kind: "video", title: "视频",  desc: "图生视频 / 文生视频",        icon: "V" },
  { kind: "audio", title: "音频",  desc: "音乐 / 声音复刻 / TTS",     icon: "A" },
];

export type NodeStatus = "idle" | "running" | "success" | "error";

export type ImageData = { kind: "image"; src: string };
export type VideoData = { kind: "video"; src: string };
export type AudioData = { kind: "audio"; src: string };
export type OutputData = ImageData | VideoData | AudioData | { kind: "empty" };

/** 节点数据 */
export type FlowNodeData = {
  kind: NodeKind;
  title: string;
  prompt: string;
  inputImage: string | null;
  output: OutputData;
  status: NodeStatus;
  errorMsg?: string;
  quantity?: number;
  [key: string]: unknown;
};

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;