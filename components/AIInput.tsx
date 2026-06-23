"use client";

import { useState } from "react";

interface AIInputProps {
  /** default = hero 大尺寸 (avatar 在外, 64px body + 48px avatar); compact = 顶部搜索条 (48px + 36px) */
  variant?: "default" | "compact";
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: (value: string) => void;
  onUploadClick?: () => void;
}

/**
 * AIInput v4 — 头像 Siri 光环 + 蓝紫光斑 + 眨眼
 * - 头像 (渐变球 + 双眼) **外置** 在 body 左侧 (不在 input 内)
 * - 头像外环绕一圈 conic-gradient 旋转高光 (Siri 风) — mask-composite 实现
 * - 头像双层 radial-gradient 光斑呼吸明灭
 * - 头像本体呼吸 + 6s 随机眨
 * - 边框: 静态 1px 蓝紫 (focused 时所有动画加速)
 */
export default function AIInput({
  variant = "default",
  placeholder = "试试说: 生成一个赛博朋克风格的沙发广告视频",
  disabled = false,
  onSubmit,
  onUploadClick,
}: AIInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const v = value.trim();
    if (v && !disabled) onSubmit?.(v);
  };

  return (
    <div
      className={`ai-input ${variant} ${focused ? "is-focused" : ""}`}
    >
      {/* 头像 (外置, 左侧) — Siri 光环 + 双层光斑 + 渐变球 + 双眼 */}
      <div className="ai-input-avatar-wrap">
        <div className="ai-input-glow-2" />
        <div className="ai-input-glow" />
        <div className="ai-input-avatar">
          <div className="ai-eye left" />
          <div className="ai-eye right" />
        </div>
      </div>

      {/* 输入框主体 (右) — + 按钮 + input + GO 按钮 */}
      <div className="ai-input-body">
        <button
          className="ai-input-upload"
          aria-label="添加素材"
          type="button"
          onClick={onUploadClick}
          disabled={disabled}
        >
          +
        </button>

        <input
          className="ai-input-text"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <button
          className="ai-input-go"
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
        >
          GO ↗
        </button>
      </div>
    </div>
  );
}
