"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// /login 全屏深色版 — middleware 拦截未登录访问时跳转过来
// 跟 LoginModal 同样的视觉, 但因为是独立页面没有 backdrop
// 主流程: 用户在主页点"登录"会触发 LoginModal (不跳这个页)

type Mode = "phone" | "wechat";
type Stage = "phone" | "code";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/dashboard";

  const [mode, setMode] = useState<Mode>("phone");
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phoneValid = /^1[3-9]\d{9}$/.test(phone);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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
      router.replace(data.redirect || from);
      router.refresh();
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

  return (
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 0.5rem",  // 07-10 fix v3: 再减小 mobile padding (1.25→1, 0.75→0.5)
        background: "var(--bg)",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 320,  // 07-10 fix v3: 360 → 320 (适配 320px 极窄屏)
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "1.5rem 1rem 1.25rem",  // 07-10 fix v3: 再减小 (1.5→1.5, 1.25→1)
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          boxSizing: "border-box",
        }}
      >
        {/* 顶部点缀线 — 蓝紫 (延续我们风格) */}
        <div
          style={{
            width: 32,
            height: 3,
            background: "var(--accent)",
            borderRadius: 2,
            marginBottom: "1.25rem",
          }}
        />

        {/* 标题 */}
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          登录
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            margin: "0.5rem 0 1.5rem",
          }}
        >
          连接灵感，驱动生成
        </p>

        {mode === "phone" ? (
          <>
            {stage === "phone" ? (
              <>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                    fontWeight: 500,
                  }}
                >
                  账号
                </label>
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
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>+86</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
                <div style={{ height: 16 }} />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={!phoneValid || sending}
                  style={{
                    width: "100%",
                    height: 48,
                    background: !phoneValid || sending ? "var(--bg-gray)" : "var(--accent)",
                    color: !phoneValid || sending ? "var(--text-tertiary)" : "#0A0A0B",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: 10,
                    cursor: !phoneValid || sending ? "not-allowed" : "pointer",
                    opacity: !phoneValid || sending ? 0.6 : 1,
                  }}
                >
                  {sending ? "发送中..." : "获取验证码"}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 1rem" }}>
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      size={1}  // 07-10 fix v3: 防 input 默认 size=20 intrinsic min-width 撑出 grid
                      maxLength={1}
                      value={d}
                      onChange={(e) => onCodeChange(i, e.target.value)}
                      onKeyDown={(e) => onCodeKeyDown(i, e)}
                      onPaste={onCodePaste}
                      disabled={verifying}
                      style={{
                        width: "100%",
                        minWidth: 0, /* v5.9: 防 6 个格子撑出登录卡 (grid 6 等分) */
                        height: 48,
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        background: "var(--bg-gray)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text)",
                        outline: "none",
                        boxSizing: "border-box",  // 07-10 fix: padding 不撑破 width 100%
                        padding: 0,  // 重置浏览器默认 padding
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  ))}
                </div>
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
              <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#ef4444", margin: "0.75rem 0 0" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.25rem 0 1rem" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                onClick={() => setMode("wechat")}
                style={{
                  height: 44,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                微信扫码登录
              </button>
              <button
                type="button"
                disabled
                style={{
                  height: 44,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text-tertiary)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "not-allowed",
                }}
              >
                密码登录
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
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
              }}
            >
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ opacity: 0.4 }}>
                {Array.from({ length: 49 }).map((_, i) => {
                  const x = (i % 7) * 20;
                  const y = Math.floor(i / 7) * 20;
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
              onClick={() => {
                setMode("phone");
                setError(null);
              }}
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
}

// 外层 LoginPage — Suspense 包裹 LoginForm 因其用了 useSearchParams (Next.js 14 SSG 要求)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "calc(100vh - 200px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "0.875rem",
      }}>
        加载中…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
