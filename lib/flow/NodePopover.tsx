import { useState, useEffect } from "react";
import type { FlowNodeData, NodeKind } from "./types";

type Props = {
  kind: NodeKind;
  data: FlowNodeData;
  isActive: boolean;
  onChange: (partial: Partial<FlowNodeData>) => void;
  onRun: () => void;
  onUpload: (dataUrl: string) => void;
  onClose: () => void;
};

// ---- 模型 & 积分 ----
const MODELS: Record<NodeKind, { id: string; label: string; cost: number }[]> = {
  text: [
    { id: "deepseek", label: "DeepSeek V3", cost: 2 },
    { id: "gemini",  label: "Gemini 2.5",  cost: 4 },
    { id: "claude",  label: "Claude 4.5",  cost: 4 },
  ],
  image: [
    { id: "jimeng", label: "即梦",         cost: 8 },
    { id: "nano",   label: "Nano Banana", cost: 12 },
  ],
  video: [
    { id: "seedance", label: "Seedance 2.0", cost: 8 },
    { id: "wan",      label: "Wan 2.6",      cost: 12 },
    { id: "kling",    label: "可灵",         cost: 16 },
  ],
  audio: [
    { id: "music2", label: "MiniMax Music", cost: 25 },
    { id: "tts",    label: "MiniMax TTS",   cost: 6 },
  ],
};

const IMAGE_RATIOS = [
  { v: "1:1", label: "1:1" }, { v: "9:16", label: "9:16" },
  { v: "16:9", label: "16:9" }, { v: "3:4", label: "3:4" }, { v: "4:3", label: "4:3" },
];
const IMAGE_QUALITIES = ["1K", "2K", "4K"];
const IMAGE_STYLES = ["电影感", "写实", "动漫", "油画", "水彩", "3D 渲染", "黑白"];

const VIDEO_RATIOS = [
  { v: "16:9", label: "16:9" }, { v: "9:16", label: "9:16" },
  { v: "1:1", label: "1:1" }, { v: "4:3", label: "4:3" }, { v: "3:4", label: "3:4" },
];
const VIDEO_QUALITIES = ["720p", "1080p", "4K"];
const VIDEO_MODES = ["首尾帧", "参考"];
const VIDEO_DURATIONS = [3, 5, 8, 10, 15];

const AUDIO_TYPES = [
  { v: "auto", label: "自适应" },
  { v: "music", label: "音乐" },
  { v: "clone", label: "声音复刻" },
];

export function NodePopover({ kind, data, isActive, onChange, onRun, onUpload, onClose: _onClose }: Props) {
  const [pane, setPane] = useState<null | string>(null);
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    if (!isActive) { setPane(null); setModelOpen(false); }
  }, [isActive]);

  if (!isActive) return null;

  const isRunning = data.status === "running";
  const canRun = data.prompt.trim().length > 0 && !isRunning;
  const quantity = (data.quantity as number) || 1;

  const modelId = (data.model as string) || MODELS[kind][0].id;
  const modelInfo = MODELS[kind].find((m) => m.id === modelId) || MODELS[kind][0];
  const credits = modelInfo.cost * quantity;

  function pickFile(accept: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => onUpload(String(reader.result || ""));
      reader.readAsDataURL(f);
    };
    input.click();
  }

  const s = (key: string, fallback: string) => (data[key] as string) || fallback;

  // ---- 参数 chips (按 kind 不同) ----
  function renderParamChips() {
    const chips: React.ReactNode[] = [];

    // Model
    chips.push(
      <button key="model" className={"dm-popover-chip" + (modelOpen ? " active" : "")}
        onClick={(e) => { e.stopPropagation(); setModelOpen(!modelOpen); setPane(null); }}>
        {modelInfo.label}
      </button>
    );
    chips.push(<span key="sep-model" className="dm-popover-sep" />);

    if (kind === "text") {
      chips.push(
        <button key="voice" className="dm-popover-chip" title="语音输入"
          onClick={(e) => e.stopPropagation()}>
          <span className="dm-icon-mic" />
        </button>
      );
      chips.push(<span key="sep-voice" className="dm-popover-sep" />);
      chips.push(
        <button key="qty" className={"dm-popover-chip" + (pane === "qty" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "qty" ? null : "qty"); setModelOpen(false); }}>
          {quantity}×
        </button>
      );
    }

    if (kind === "image") {
      const ratio = s("ratio", "16:9");
      const quality = s("quality", "2K");
      chips.push(
        <button key="rq" className={"dm-popover-chip" + (pane === "rq" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "rq" ? null : "rq"); setModelOpen(false); }}>
          {ratio} · {quality}
        </button>
      );
      chips.push(<span key="sep-rq" className="dm-popover-sep" />);
      chips.push(
        <button key="style" className={"dm-popover-chip" + (pane === "style" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "style" ? null : "style"); setModelOpen(false); }}>
          风格
        </button>
      );
      chips.push(<span key="sep-style" className="dm-popover-sep" />);
      chips.push(
        <button key="qty" className={"dm-popover-chip" + (pane === "qty" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "qty" ? null : "qty"); setModelOpen(false); }}>
          {quantity}×
        </button>
      );
    }

    if (kind === "video") {
      const mode = s("videoMode", "参考");
      chips.push(
        <button key="mode" className={"dm-popover-chip" + (pane === "mode" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "mode" ? null : "mode"); setModelOpen(false); }}>
          {mode}
        </button>
      );
      chips.push(<span key="sep-mode" className="dm-popover-sep" />);
      const vq = s("videoQuality", "1080p");
      chips.push(
        <button key="vq" className={"dm-popover-chip" + (pane === "vq" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "vq" ? null : "vq"); setModelOpen(false); }}>
          {vq}
        </button>
      );
      chips.push(<span key="sep-vq" className="dm-popover-sep" />);
      const dur = (data.duration as number) || 5;
      chips.push(
        <button key="dur" className={"dm-popover-chip" + (pane === "dur" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "dur" ? null : "dur"); setModelOpen(false); }}>
          {dur}秒
        </button>
      );
      chips.push(<span key="sep-dur" className="dm-popover-sep" />);
      const vr = s("videoRatio", "16:9");
      chips.push(
        <button key="vr" className={"dm-popover-chip" + (pane === "vr" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "vr" ? null : "vr"); setModelOpen(false); }}>
          {vr}
        </button>
      );
      chips.push(<span key="sep-vr" className="dm-popover-sep" />);
      chips.push(
        <button key="voice" className="dm-popover-chip" title="语音输入"
          onClick={(e) => e.stopPropagation()}>
          <span className="dm-icon-mic" />
        </button>
      );
    }

    if (kind === "audio") {
      const at = s("audioType", "自适应");
      chips.push(
        <button key="at" className={"dm-popover-chip" + (pane === "at" ? " active" : "")}
          onClick={(e) => { e.stopPropagation(); setPane(pane === "at" ? null : "at"); setModelOpen(false); }}>
          {at}
        </button>
      );
    }

    return chips;
  }

  // ---- 子面板 ----
  function renderSubpane() {
    if (modelOpen) {
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">模型</div>
          <div className="dm-popover-subpane-col">
            {MODELS[kind].map((m) => (
              <button key={m.id}
                className={"dm-popover-subpane-row-btn" + (m.id === modelId ? " active" : "")}
                onClick={() => { onChange({ model: m.id }); setModelOpen(false); }}>
                <span style={{ flex: 1 }}>{m.label}</span>
                <span style={{ opacity: 0.5 }}>{m.cost}积分</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (pane === "qty") {
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">生成数量</div>
          <div className="dm-popover-subpane-row">
            {[1, 2, 4].map((n) => (
              <button key={n} className={"dm-popover-subpane-pill" + (n === quantity ? " active" : "")}
                onClick={() => onChange({ quantity: n })}>{n}×</button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "image" && pane === "rq") {
      const ratio = s("ratio", "16:9");
      const quality = s("quality", "2K");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-section">
            <div className="dm-popover-subpane-label">画质</div>
            <div className="dm-popover-subpane-row">
              {IMAGE_QUALITIES.map((q) => (
                <button key={q} className={"dm-popover-subpane-pill" + (q === quality ? " active" : "")}
                  onClick={() => onChange({ quality: q })}>{q}</button>
              ))}
            </div>
          </div>
          <div className="dm-popover-subpane-section">
            <div className="dm-popover-subpane-label">比例</div>
            <div className="dm-popover-subpane-grid">
              {IMAGE_RATIOS.map((r) => (
                <button key={r.v} className={"dm-popover-subpane-cell" + (r.v === ratio ? " active" : "")}
                  onClick={() => onChange({ ratio: r.v })}>
                  <span className={"dm-ratio-icon dm-ratio-" + r.v.replace(":", "x")} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (kind === "image" && pane === "style") {
      const style = s("style", "电影感");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">风格</div>
          <div className="dm-popover-subpane-col">
            {IMAGE_STYLES.map((st) => (
              <button key={st} className={"dm-popover-subpane-row-btn" + (st === style ? " active" : "")}
                onClick={() => onChange({ style: st })}>{st}</button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "video" && pane === "mode") {
      const mode = s("videoMode", "参考");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">生成方式</div>
          <div className="dm-popover-subpane-row">
            {VIDEO_MODES.map((m) => (
              <button key={m} className={"dm-popover-subpane-pill" + (m === mode ? " active" : "")}
                onClick={() => onChange({ videoMode: m })}>{m}</button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "video" && pane === "vq") {
      const vq = s("videoQuality", "1080p");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">清晰度</div>
          <div className="dm-popover-subpane-row">
            {VIDEO_QUALITIES.map((q) => (
              <button key={q} className={"dm-popover-subpane-pill" + (q === vq ? " active" : "")}
                onClick={() => onChange({ videoQuality: q })}>{q}</button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "video" && pane === "dur") {
      const dur = (data.duration as number) || 5;
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">时长</div>
          <div className="dm-popover-subpane-row">
            {VIDEO_DURATIONS.map((d) => (
              <button key={d} className={"dm-popover-subpane-pill" + (d === dur ? " active" : "")}
                onClick={() => onChange({ duration: d })}>{d}秒</button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "video" && pane === "vr") {
      const vr = s("videoRatio", "16:9");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">比例</div>
          <div className="dm-popover-subpane-grid">
            {VIDEO_RATIOS.map((r) => (
              <button key={r.v} className={"dm-popover-subpane-cell" + (r.v === vr ? " active" : "")}
                onClick={() => onChange({ videoRatio: r.v })}>
                <span className={"dm-ratio-icon dm-ratio-" + r.v.replace(":", "x")} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (kind === "audio" && pane === "at") {
      const at = s("audioType", "自适应");
      return (
        <div className="dm-popover-subpane" onClick={(e) => e.stopPropagation()}>
          <div className="dm-popover-subpane-label">音频类型</div>
          <div className="dm-popover-subpane-col">
            {AUDIO_TYPES.map((t) => (
              <button key={t.v} className={"dm-popover-subpane-row-btn" + (t.v === at ? " active" : "")}
                onClick={() => {
                  onChange({ audioType: t.v });
                  if (t.v === "clone") pickFile("audio/*");
                }}>
                <span style={{ flex: 1 }}>{t.label}</span>
                {t.v === "clone" && <span style={{ opacity: 0.5 }}>上传</span>}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="dm-popover"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      data-popover="1">
      <div className="dm-popover-panel">
        {/* 参考按钮 + 工具 */}
        <div className="dm-popover-tools">
          <button className="dm-popover-tool" title="添加参考" onClick={(e) => e.stopPropagation()}>+</button>
        </div>

        {/* 文本输入 */}
        <textarea
          className="dm-popover-textarea"
          placeholder="描述任何你想要生成的内容"
          value={data.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          disabled={isRunning}
          autoFocus
        />

        {/* 参数栏 */}
        <div className="dm-popover-params">
          {renderParamChips()}
          {/* 积分 + 生成按钮 */}
          <span className="dm-popover-credits" title="消耗积分">
            <span className="dm-credits-dot" />
            {credits}
          </span>
          <button
            className={"dm-popover-submit" + (canRun ? "" : " disabled")}
            disabled={!canRun}
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            title="生成"
          >
            ↑
          </button>
        </div>

        {renderSubpane()}
      </div>
    </div>
  );
}