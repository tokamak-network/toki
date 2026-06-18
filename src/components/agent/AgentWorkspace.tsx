/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useStakedTon } from "@/hooks/useStakedTon";
import {
  agentChat,
  loadIssuedKey,
  saveIssuedKey,
  clearIssuedKey,
  issueAiAccessKey,
  isNativeIssueEnabled,
  getKeyUsage,
  AiAccessError,
  AI_ACCESS_URL,
  MIN_TON_AI_ACCESS as MIN_TON,
  type AgentMessage,
  type KeyUsage,
  type Eip1193Provider,
} from "@/lib/aiAccess";

// Stage 1 MVP agentic chat, reskinned to the hub's mobile-game tone:
//  • no key  → a "quest gate" (stake-to-unlock progress + issue/paste key)
//  • has key → a holographic ACCESS PASS + a "chat with Toki" thread
// All key/chat logic is unchanged; only the shell + layout are game-styled.
export default function AgentWorkspace() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { t } = useTranslation();
  const a = t.agent;
  const { stakedTon, loading: stakeLoading, wallet, address } = useStakedTon();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [issuing, setIssuing] = useState<"signing" | "issuing" | null>(null);
  const [usage, setUsage] = useState<KeyUsage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  useEffect(() => {
    const stored = loadIssuedKey();
    if (stored) setApiKey(stored.key);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Refresh the daily budget usage when the key changes and after each reply.
  useEffect(() => {
    if (!apiKey) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    getKeyUsage(apiKey)
      .then((u) => !cancelled && setUsage(u))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiKey, messages.length]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !apiKey || busy) return;
    setError(null);
    const next: AgentMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await agentChat(apiKey, next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e instanceof AiAccessError && e.status === 401) {
        setError(a.keyExpired);
        clearIssuedKey();
        setApiKey(null);
      } else {
        setError(a.errorGeneric);
      }
    }
    setBusy(false);
  }, [input, apiKey, busy, messages, a]);

  const usePastedKey = () => {
    const v = pasteValue.trim();
    if (!v.startsWith("sk-")) return;
    saveIssuedKey({ key: v, expiresAt: "" });
    setApiKey(v);
    setPasteValue("");
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard?.writeText(apiKey).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const reset = () => {
    clearIssuedKey();
    setApiKey(null);
    setMessages([]);
  };

  // Native in-app issuance (delegated SIWE) — one click → sign → key auto-set.
  // Active only when NEXT_PUBLIC_AI_ACCESS_BASE points at a deployment exposing
  // /api/keys/issue-delegated (tokamak-ai-access PR #1). Until then the eligible
  // CTA falls back to the external AI Access site.
  const handleIssue = async () => {
    if (!wallet || !address || issuing) return;
    setError(null);
    setIssuing("signing");
    try {
      const provider = (await wallet.getEthereumProvider()) as Eip1193Provider;
      const result = await issueAiAccessKey(provider, address, (phase) =>
        setIssuing(phase),
      );
      saveIssuedKey(result);
      setApiKey(result.key);
    } catch (e) {
      if (e instanceof AiAccessError) {
        setError(
          e.status === 403
            ? a.issueInsufficient
            : e.status === 409
              ? a.issueAlready
              : a.issueFailed,
        );
      } else {
        setError(a.issueFailed);
      }
    } finally {
      setIssuing(null);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="text-gray-400">…</div>
      </div>
    );
  }

  const staked = stakedTon ?? 0;
  const eligible = staked >= MIN_TON;
  const needed = Math.max(0, MIN_TON - staked);
  const pct = Math.max(4, Math.min(100, Math.round((staked / MIN_TON) * 100)));
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const maskKey = (k: string) =>
    k.length > 12 ? `${k.slice(0, 7)}••••••${k.slice(-3)}` : k;
  const usagePct =
    usage?.maxBudget != null && usage.maxBudget > 0
      ? Math.min(100, Math.round((usage.spend / usage.maxBudget) * 100))
      : null;
  const usageReset = usage?.resetAt
    ? new Date(usage.resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="ai-screen">
      <style>{aiCss}</style>

      <div className="ai-bg" aria-hidden="true">
        <div className="img" />
        <div className="scrim" />
        <div className="grid" />
      </div>

      <div className="ai-wrap">
        {/* HUD top bar */}
        <div className="ai-hud">
          <Link href="/dashboard" className="ai-back">‹ {a.back}</Link>
          <span className="ai-htitle">AI ACCESS</span>
          {apiKey ? (
            <span className="ai-status on"><i />{a.statusActive}</span>
          ) : (
            <span className="ai-status off">AI</span>
          )}
        </div>

        {!apiKey ? (
          /* ── LOCKED: quest gate ── */
          <div className="ai-gate">
            <img className="ai-hero" src="/characters/toki-ai.png" alt="" />
            <div className="ai-quest glass">
              <div className="ai-kicker">{a.gateKicker}</div>
              <h2>{a.gateTitle}</h2>
              <p className="ai-qdesc">
                {eligible
                  ? a.gateEligibleDesc
                  : a.gateLockedDesc.replace("{min}", String(MIN_TON))}
              </p>

              <div className="ai-prog">
                <div className="top">
                  <span>{a.gateProgress}</span>
                  <span>
                    <b>{stakeLoading ? "…" : fmt(staked)}</b> / {MIN_TON} TON
                  </span>
                </div>
                <div className="ai-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>

              {eligible ? (
                isNativeIssueEnabled ? (
                  <button
                    className="ai-btn"
                    onClick={handleIssue}
                    disabled={!!issuing || !wallet}
                  >
                    {issuing === "signing"
                      ? a.issueSigning
                      : issuing === "issuing"
                        ? a.issuing
                        : `${a.gateGetKeyCta} →`}
                  </button>
                ) : (
                  <a className="ai-btn" href={AI_ACCESS_URL} target="_blank" rel="noopener noreferrer">
                    {a.gateGetKeyCta} →
                  </a>
                )
              ) : (
                <Link className="ai-btn" href="/staking">
                  {a.gateStakeCta.replace("{needed}", fmt(needed))} →
                </Link>
              )}

              {error && (
                <div className="ai-err" style={{ textAlign: "center" }}>{error}</div>
              )}

              <div className="ai-paste">
                <label>{a.pasteKeyLabel}</label>
                <div className="row">
                  <input
                    className="ai-input"
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    placeholder="sk-litellm-…"
                  />
                  <button className="ai-use" onClick={usePastedKey}>{a.pasteKeyCta}</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── UNLOCKED: access pass + Toki chat ── */
          <>
            <div className="ai-pass">
              <div className="ptitle">
                <img src="/toki-logo.png" alt="" />
                {a.passTitle}
              </div>
              <div className="pkey">
                <code>{maskKey(apiKey)}</code>
                <button className="ai-mini" onClick={copyKey}>{copied ? a.copied : a.copy}</button>
                <button className="ai-mini" onClick={reset}>{a.clearKey}</button>
              </div>
              <div className="pmeta">
                {a.passStatus} <b>{a.statusActive}</b>
                {!stakeLoading && ` · ${a.stakedLabel} ${fmt(staked)} TON`}
              </div>
              {usagePct != null && usage?.maxBudget != null && (
                <div className="ai-usage">
                  <div className="ai-usage-top">
                    <span>{a.usageLabel}</span>
                    <span>
                      {usagePct}% · ${usage.spend.toFixed(3)} / ${usage.maxBudget.toFixed(2)}
                    </span>
                  </div>
                  <div className="ai-usage-bar">
                    <i style={{ width: `${Math.max(2, usagePct)}%` }} />
                  </div>
                  {usageReset && (
                    <div className="ai-usage-reset">
                      {a.usageReset.replace("{time}", usageReset)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ai-chat" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="ai-row">
                  <img className="ai-av" src="/toki-icon.png" alt="" />
                  <div className="ai-bub"><div className="ai-nm">Toki</div>{a.greeting}</div>
                </div>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ai-row me">
                    <div className="ai-bub">{m.content}</div>
                  </div>
                ) : (
                  <div key={i} className="ai-row">
                    <img className="ai-av" src="/toki-icon.png" alt="" />
                    <div className="ai-bub"><div className="ai-nm">Toki</div>{m.content}</div>
                  </div>
                ),
              )}
              {busy && (
                <div className="ai-row">
                  <img className="ai-av" src="/toki-icon.png" alt="" />
                  <div className="ai-bub">{a.thinking}</div>
                </div>
              )}
            </div>

            {error && <div className="ai-err">{error}</div>}

            <div className="ai-inbar">
              <textarea
                className="ai-field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={a.placeholder}
              />
              <button className="ai-send" onClick={send} disabled={busy || !input.trim()} aria-label={a.send}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Embedded game-shell styling (mirrors the hub tokens; see public/ai-access-mockup.html).
const aiCss = `
.ai-screen{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:#070b14;font-family:"Fredoka","Geist",system-ui,sans-serif;color:#eaf6fb}
.ai-bg{position:fixed;inset:0;z-index:0;pointer-events:none}
.ai-bg .img{position:absolute;inset:0;background:url("/backgrounds/hub-bg.jpg") center/cover;opacity:.5}
.ai-bg .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,13,24,.55),rgba(7,11,20,.93))}
.ai-bg .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(34,211,238,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.05) 1px,transparent 1px);background-size:40px 40px}
.ai-wrap{position:relative;z-index:1;max-width:560px;margin:0 auto;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;padding:16px 16px 20px}
.ai-hud{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.ai-back{display:flex;align-items:center;gap:5px;font-size:13px;color:#cfe0f2;background:rgba(8,24,38,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 13px;font-weight:600;text-decoration:none}
.ai-back:hover{background:rgba(8,24,38,.85);color:#fff}
.ai-htitle{font-weight:800;letter-spacing:.16em;font-size:14px;color:#fff;margin-left:2px}
.ai-status{margin-left:auto;font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 10px}
.ai-status.off{background:#22d3ee;color:#04141d}
.ai-status.on{background:rgba(34,211,238,.16);color:#22d3ee;border:1px solid rgba(34,211,238,.4);display:flex;align-items:center;gap:6px}
.ai-status.on i{width:6px;height:6px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:aiPulse 1.6s ease-in-out infinite}
@keyframes aiPulse{0%,100%{opacity:.4}50%{opacity:1}}
.glass{background:rgba(8,24,38,.62);backdrop-filter:blur(12px);border:1px solid rgba(34,211,238,.28);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.ai-gate{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;position:relative;padding-top:120px}
.ai-hero{position:absolute;top:0;left:50%;transform:translateX(-50%);width:min(190px,46%);z-index:1;filter:drop-shadow(0 12px 26px rgba(0,0,0,.5));animation:aiFloat 5s ease-in-out infinite}
@keyframes aiFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3%)}}
.ai-quest{position:relative;z-index:2;width:100%;padding:20px 18px 18px;text-align:center;margin-bottom:10px}
.ai-kicker{font-size:11px;letter-spacing:.22em;color:#22d3ee;font-weight:700}
.ai-quest h2{font-weight:800;font-size:21px;margin:7px 0 5px;color:#fff}
.ai-qdesc{font-size:13px;color:#bcd0e6;line-height:1.55;margin-bottom:16px}
.ai-prog{margin-bottom:16px}
.ai-prog .top{display:flex;justify-content:space-between;font-size:11.5px;color:#cfe0f2;margin-bottom:7px;font-weight:600}
.ai-prog .top b{color:#f59e0b}
.ai-bar{height:12px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.ai-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#f59e0b);box-shadow:0 0 12px rgba(34,211,238,.5);transition:width .6s ease}
.ai-btn{display:block;width:100%;font-weight:800;font-size:15px;color:#04141d;text-align:center;background:linear-gradient(135deg,#4a90d9,#22d3ee);border:0;border-radius:14px;padding:13px;cursor:pointer;box-shadow:0 8px 22px rgba(34,211,238,.32);text-decoration:none}
.ai-btn:hover{filter:brightness(1.06)}
.ai-paste{margin-top:14px;width:100%}
.ai-paste label{display:block;font-size:11.5px;color:#8fb0c8;margin-bottom:6px;text-align:left}
.ai-paste .row{display:flex;gap:8px}
.ai-input{flex:1;font-family:ui-monospace,monospace;font-size:13px;color:#dffafe;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:10px 12px;outline:none}
.ai-input:focus{border-color:rgba(34,211,238,.5)}
.ai-use{font-size:12.5px;font-weight:700;color:#cfe0f2;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:0 14px;cursor:pointer}
.ai-use:hover{background:rgba(255,255,255,.16)}
.ai-pass{position:relative;overflow:hidden;padding:15px 16px;margin-bottom:12px;background:linear-gradient(135deg,rgba(34,211,238,.2),rgba(167,139,250,.13) 46%,rgba(245,158,11,.12));border:1px solid rgba(34,211,238,.4);border-radius:18px}
.ai-pass::after{content:"";position:absolute;top:-60%;left:-25%;width:55%;height:220%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);pointer-events:none}
.ai-pass .ptitle{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;letter-spacing:.06em;color:#eafdff}
.ai-pass .ptitle img{width:22px;height:22px;object-fit:contain;background:#fff;border-radius:50%;padding:2px}
.ai-pass .pkey{display:flex;align-items:center;gap:7px;margin-top:12px}
.ai-pass .pkey code{flex:1;font-family:ui-monospace,monospace;font-size:12.5px;color:#dffafe;background:rgba(0,0,0,.32);border-radius:9px;padding:9px 11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-mini{font-size:11px;font-weight:700;color:#cfe0f2;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:8px 9px;cursor:pointer;white-space:nowrap}
.ai-mini:hover{background:rgba(255,255,255,.2)}
.ai-pass .pmeta{margin-top:11px;font-size:11px;color:#bcd0e6}
.ai-pass .pmeta b{color:#22d3ee}
.ai-usage{margin-top:11px;padding-top:11px;border-top:1px solid rgba(255,255,255,.12)}
.ai-usage-top{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#cfe0f2;margin-bottom:6px;font-weight:600}
.ai-usage-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.ai-usage-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#f59e0b);transition:width .5s ease}
.ai-usage-reset{margin-top:5px;font-size:10px;color:#8fb0c8}
.ai-chat{flex:1;display:flex;flex-direction:column;gap:11px;overflow-y:auto;padding:4px 2px;min-height:120px}
.ai-row{display:flex;gap:8px;align-items:flex-end;max-width:88%}
.ai-row.me{align-self:flex-end;flex-direction:row-reverse}
.ai-av{width:30px;height:30px;border-radius:50%;flex:none;object-fit:cover;object-position:center top;border:1.5px solid rgba(34,211,238,.5);background:#0c1116}
.ai-bub{font-size:13.5px;line-height:1.5;padding:10px 13px;border-radius:16px;white-space:pre-wrap}
.ai-row .ai-bub{background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(34,211,238,.22);border-bottom-left-radius:5px;color:#eaf6fb}
.ai-row.me .ai-bub{background:linear-gradient(135deg,rgba(74,144,217,.5),rgba(34,211,238,.32));border:1px solid rgba(34,211,238,.3);border-bottom-right-radius:5px;color:#fff}
.ai-nm{font-size:10px;font-weight:700;color:#22d3ee;margin-bottom:4px}
.ai-err{margin:6px 2px;font-size:12px;color:#fca5a5}
.ai-inbar{display:flex;gap:8px;align-items:flex-end;margin-top:10px}
.ai-field{flex:1;resize:none;font-family:inherit;font-size:13.5px;color:#eaf6fb;background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;outline:none;max-height:120px}
.ai-field:focus{border-color:rgba(34,211,238,.5)}
.ai-send{width:46px;height:46px;flex:none;border-radius:13px;border:0;cursor:pointer;color:#04141d;font-size:18px;background:linear-gradient(135deg,#4a90d9,#22d3ee);box-shadow:0 6px 18px rgba(34,211,238,.32)}
.ai-send:disabled{opacity:.4;cursor:default}
@media (prefers-reduced-motion:reduce){.ai-hero,.ai-status.on i,.ai-bar i{animation:none;transition:none}}
`;
