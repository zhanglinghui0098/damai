"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

// 事件名 — SiteNav / Hero 派发 "auth:open" 触发此 modal
export const AUTH_OPEN_EVENT = "damai:auth:open";
export const AUTH_CLOSE_EVENT = "damai:auth:close";

type Mode = "phone" | "wechat";
type Stage = "phone" | "code";

export default function LoginModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("phone");
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const search = useSearchParams();
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // 监听派发事件
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setError(null);
    };
    const onClose = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener(AUTH_OPEN_EVENT, onOpen);
    window.addEventListener(AUTH_CLOSE_EVENT, onClose);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(AUTH_OPEN_EVENT, onOpen);
      window.removeEventListener(AUTH_CLOSE_EVENT, onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [open]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const phoneValid = /^1[3-9]\d{9}$/.test(phone);

  async function sendCode() {
    if (!phoneValid || sending || countdown > 0) return;
    setSending(true);
    setError(null);
    setDevHint(null);
    try {
      const resp = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const map: Record<string, string> = {
          invalid_phone: "手机号格式不对",
          phone_rate_1m: "1 分钟内只能发 1 次,请稍等",
          phone_rate_1h: "1 小时内发太多次了,稍后再试",
          ip_rate_1m: "请求太频繁,请稍等",
          send_failed: "发送失败,稍后重试",
        };
        setError(map[data.error] ?? "发送失败");
        return;
      }
      setDevHint(data.devCode ? `开发模式: 验证码 = ${data.devCode}` : null);
      setStage("code");
      setCountdown(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError("网络错误,请重试");
    } finally {
      setSending(false);
    }
  }

  async function submitCode(joined: string) {
    if (verifying) return;
    setVerifying(true);
    setError(null);
    // from: 当前 URL (登录后跳回)
    const from = search.get("from") || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard");
    try {
      const resp = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: joined, from }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const map: Record<string, string> = {
          invalid_code: "验证码格式不对",
          no_code: "请先获取验证码",
          expired: "验证码已过期,请重新获取",
          wrong: "验证码错误",
          too_many: "错误次数过多,请重新获取",
        };
        setError(map[data.error] ?? "验证失败");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => codeRefs.current[0]?.focus(), 50);
        return;
      }
      // 成功 → 关闭 modal + 跳回 from
      setOpen(false);
      // 重置 stage 等下次开
      setStage("phone");
      setCode(["", "", "", "", "", ""]);
      // 跳 from (server side 也支持)
      const redirectTo = data.redirect || from;
      if (redirectTo && redirectTo.startsWith("/")) {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch {
      setError("网络错误,请重试");
    } finally {
      setVerifying(false);
    }
  }

  function onCodeChange(idx: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = ch;
    setCode(next);
    if (ch && idx < 5) codeRefs.current[idx + 1]?.focus();
    const joined = next.join("");
    if (joined.length === 6 && next.every((d) => d)) submitCode(joined);
  }

  function onCodeKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  function onCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = text.split("").concat(Array(6 - text.length).fill(""));
    setCode(next);
    if (text.length === 6) submitCode(text);
    else codeRefs.current[text.length]?.focus();
  }

  if (!open) return null;

  const modal = (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.18s ease-out",
      }}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "2rem 1.75rem 1.5rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(110,140,214,0.08)",
          animation: "scaleIn 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "hidden",
        }}
      >
        {/* 顶部点缀线 — 沿用大脉蓝紫 (截图参考用黄绿, 我们延续) */}
        <div
          style={{
            width: 32,
            height: 3,
            background: "var(--accent)",
            borderRadius: 2,
            marginBottom: "1.25rem",
          }}
        />

        {/* 右上角关闭 X */}
        <button
          onClick={() => setOpen(false)}
          aria-label="关闭"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 5L15 15M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* 标题 */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>
          登录
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0.5rem 0 1.5rem" }}>
          连接灵感，驱动生成
        </p>

        {mode === "phone" ? (
          <>
            {stage === "phone" ? (
              <>
                <Label>账号</Label>
                <PhoneInput value={phone} onChange={setPhone} />
                <div style={{ height: 16 }} />
                <CTA onClick={sendCode} disabled={!phoneValid || sending}>
                  {sending ? "发送中..." : "获取验证码"}
                </CTA>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    margin: "0 0 1rem",
                  }}
                >
                  验证码已发到{" "}
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>
                    {phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("phone");
                      setCode(["", "", "", "", "", ""]);
                      setError(null);
                    }}
                    style={{
                      marginLeft: 8,
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      padding: 0,
                    }}
                  >
                    改号
                  </button>
                </p>
                <CodeInputs
                  code={code}
                  refs={codeRefs}
                  onChange={onCodeChange}
                  onKeyDown={onCodeKeyDown}
                  onPaste={onCodePaste}
                  disabled={verifying}
                />
                <div style={{ height: 8 }} />
                {countdown > 0 ? (
                  <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                    {countdown} 秒后可重新发送
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sending}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "0.875rem",
                      cursor: sending ? "default" : "pointer",
                      padding: "0.5rem 0",
                    }}
                  >
                    {sending ? "发送中..." : "没收到? 重新发送"}
                  </button>
                )}
                {devHint && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.75rem",
                      color: "#fbbf24",
                      background: "rgba(251,191,36,0.1)",
                      borderRadius: 8,
                      padding: "0.5rem",
                      margin: "0.5rem 0 0",
                    }}
                  >
                    {devHint}
                  </p>
                )}
              </>
            )}

            {error && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.8125rem",
                  color: "#ef4444",
                  margin: "0.75rem 0 0",
                }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "1.25rem 0 1rem",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
                OR
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <SecondaryButton onClick={() => setMode("wechat")}>微信扫码登录</SecondaryButton>
              <SecondaryButton disabled>密码登录</SecondaryButton>
            </div>
          </>
        ) : (
          <WechatMode onBack={() => { setMode("phone"); setError(null); }} />
        )}

        <p
          style={{
            margin: "1.25rem 0 0",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
          }}
        >
          登录即代表同意
          <a href="/about" style={{ color: "var(--accent)", textDecoration: "none", margin: "0 4px" }}>
            用户服务协议
          </a>
          和
          <a href="/about" style={{ color: "var(--accent)", textDecoration: "none", margin: "0 4px" }}>
            隐私政策
          </a>
        </p>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

// =================== sub components ===================

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.8125rem",
        color: "var(--text-secondary)",
        marginBottom: 8,
        fontWeight: 500,
      }}
    >
      {children}
    </label>
  );
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-gray)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "0 0.875rem",
        height: 48,
        gap: 8,
        transition: "border-color 0.18s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>+86</span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={11}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder="请输入手机号"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize: "0.9375rem",
        }}
      />
    </div>
  );
}

function CodeInputs({
  code,
  refs,
  onChange,
  onKeyDown,
  onPaste,
  disabled,
}: {
  code: string[];
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", maxWidth: "100%", overflow: "hidden" }}>
      {code.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          disabled={disabled}
          style={{
            width: 44,
            height: 52,
            minWidth: 36,
            flex: "0 0 auto",
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: 600,
            background: "var(--bg-gray)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text)",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
      ))}
    </div>
  );
}

function CTA({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 48,
        background: disabled ? "var(--bg-gray)" : "var(--accent)",
        color: disabled ? "var(--text-tertiary)" : "#0A0A0B",
        fontSize: "0.9375rem",
        fontWeight: 600,
        border: "none",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.18s, background 0.18s",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 44,
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 10,
        color: disabled ? "var(--text-tertiary)" : "var(--text)",
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s, border-color 0.18s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--bg-gray)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function WechatMode({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
      {/* 占位二维码 — 真接入前显示 */}
      <div
        style={{
          width: 180,
          height: 180,
          margin: "0 auto 1rem",
          background: "var(--bg-gray)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* SVG 占位二维码 — 9 宫格伪二维码 */}
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ opacity: 0.4 }}>
          {Array.from({ length: 49 }).map((_, i) => {
            const x = (i % 7) * 20;
            const y = Math.floor(i / 7) * 20;
            // 伪随机填充一些格子
            const filled = (i * 37 + 13) % 5 < 2;
            return filled ? (
              <rect key={i} x={x + 2} y={y + 2} width="16" height="16" fill="var(--text)" rx="2" />
            ) : null;
          })}
        </svg>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--text)", margin: "0 0 0.5rem" }}>
        请用微信扫描二维码登录
      </p>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: "0 0 1rem" }}>
        微信扫码登录待接入, 暂不可用
      </p>

      <button
        type="button"
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--accent)",
          fontSize: "0.875rem",
          cursor: "pointer",
          padding: "0.5rem 1rem",
        }}
      >
        ← 返回手机号登录
      </button>
    </div>
  );
}
