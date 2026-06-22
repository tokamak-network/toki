/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useStakedTon } from "@/hooks/useStakedTon";
import {
  AGENTS,
  type AgentDef,
  type AgentCategory,
} from "@/lib/agents";
import {
  agentChat,
  loadIssuedKey,
  clearIssuedKey,
  storeAiKey,
  getAiKeyStatus,
  revealAiKey,
  clearAiKeyServer,
  issueAiAccessKey,
  isNativeIssueEnabled,
  getKeyUsage,
  fmtTokens,
  buildSetupSkill,
  AI_DAILY_TOKEN_LIMIT,
  AI_ACCESS_URL,
  AI_ACCESS_DOCS_URL,
  AI_MODELS,
  AiAccessError,
  MIN_TON_AI_ACCESS as MIN_TON,
  type AgentMessage,
  type KeyUsage,
  type Eip1193Provider,
} from "@/lib/aiAccess";

type View = "gallery" | "chat";
const CHIP_CATS: AgentCategory[] = ["research", "onchain", "content"];

// Refined framing (validated against the agent-workspace design + market scan):
// the on-chain / mascot assistant is the HERO. Dev agents (Solidity / code) fit a
// browser chat poorly — they're strongest in the user's own IDE via the issued
// key — so they're kept OUT of the roster entirely; the "Connect" path covers
// coding use. Tiers are cosmetic (collectible-card framing).
const HERO_ID = "toki";
const AGENT_TIER: Record<string, string> = {
  toki: "gold",
  "staking-advisor": "platinum",
  "defi-researcher": "bronze",
  "x-writer": "black",
};
const TIER_BG: Record<string, string> = {
  gold: "/card-bg-gold.png",
  platinum: "/card-bg-platinum.png",
  silver: "/card-bg-silver.png",
  bronze: "/card-bg-bronze.png",
  black: "/card-bg-black.png",
};
const TIER_COLOR: Record<string, string> = {
  gold: "#f5b301",
  platinum: "#7fe3ff",
  silver: "#cbd5e1",
  bronze: "#d39a6a",
  black: "#a78bfa",
};

// AI Access workspace — gacha-roster framing over the existing stake-issued key.
// Views: no key → quest gate (stake-to-unlock + issue/paste) · has key → agent
// ROSTER (hero on-chain assistant + collectible cards) → CHAT. Dev agents route
// to the CONNECT modal (copy key/endpoint/setup-skill into the user's own tools).
export default function AgentWorkspace({ preview = false }: { preview?: boolean } = {}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const a = t.agent;
  const { stakedTon, loading: stakeLoading, wallet, address } = useStakedTon();

  const [hasKey, setHasKey] = useState(false);
  const [keyLastFour, setKeyLastFour] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [view, setView] = useState<View>("gallery");
  const [agent, setAgent] = useState<AgentDef | null>(null);
  const [cat, setCat] = useState<AgentCategory | "all">("all");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [skillCopied, setSkillCopied] = useState(false);
  const [issuing, setIssuing] = useState<"signing" | "issuing" | null>(null);
  const [usage, setUsage] = useState<KeyUsage | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preview && ready && !authenticated) router.push("/");
  }, [preview, ready, authenticated, router]);

  // Resolve key status BEFORE deciding which screen to show — otherwise the gate
  // flashes for users who already hold a key. Migrate any legacy localStorage key
  // into the server vault first. `checkingKey` keeps a spinner up until resolved.
  useEffect(() => {
    if (!preview && (!ready || !authenticated)) return; // auth-gate spinner covers this window
    let cancelled = false;
    (async () => {
      const token = await getAccessToken().catch(() => null);
      if (!token) {
        if (!cancelled) setCheckingKey(false); // preview / no session → fall through to the gate
        return;
      }
      const legacy = loadIssuedKey();
      if (legacy) {
        try {
          await storeAiKey(token, legacy.key, legacy.expiresAt);
        } catch {
          // ignore migration failure
        }
        clearIssuedKey();
      }
      try {
        const s = await getAiKeyStatus(token);
        if (!cancelled) {
          setHasKey(s.hasKey);
          setKeyLastFour(s.lastFour);
        }
      } catch {
        // ignore
      }
      if (!cancelled) setCheckingKey(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [preview, ready, authenticated, getAccessToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Refresh daily usage when the key is present and after each reply.
  useEffect(() => {
    if (!hasKey) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getAccessToken().catch(() => null);
      if (!token) return;
      try {
        const u = await getKeyUsage(token);
        if (!cancelled) setUsage(u);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasKey, messages.length, getAccessToken]);

  const sendText = useCallback(
    async (text: string) => {
      const txt = text.trim();
      if (!txt || !hasKey || busy) return;
      setError(null);
      const next: AgentMessage[] = [...messages, { role: "user", content: txt }];
      setMessages(next);
      setInput("");
      setBusy(true);
      try {
        const token = await getAccessToken();
        if (!token) throw new AiAccessError("No session", 401);
        const reply = await agentChat(
          token,
          next,
          agent ? { system: agent.system, model: agent.model } : undefined,
        );
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch (e) {
        if (e instanceof AiAccessError) {
          // Budget / auth are SOFT — the key is fine, so never kick to the gate.
          if (e.reason === "budget" || e.status === 429) {
            setError(a.errorBudget);
          } else if (e.reason === "auth") {
            setError(a.errorAuth);
          } else if (e.status === 401) {
            // Genuinely dead (expired / revoked / no key) → reset to the gate.
            setError(a.keyExpired);
            setHasKey(false);
            setKeyLastFour(null);
          } else {
            setError(a.errorGeneric);
          }
        } else {
          setError(a.errorGeneric);
        }
      }
      setBusy(false);
    },
    [hasKey, busy, messages, agent, a, getAccessToken],
  );

  const openAgent = (ag: AgentDef) => {
    setAgent(ag);
    setMessages([]);
    setError(null);
    setView("chat");
  };

  const usePastedKey = async () => {
    const v = pasteValue.trim();
    if (!v.startsWith("sk-")) return;
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    try {
      await storeAiKey(token, v, "", address);
      setHasKey(true);
      setKeyLastFour(v.slice(-4));
      setPasteValue("");
    } catch {
      setError(a.issueFailed);
    }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});
  const copyKey = async () => {
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    const key = await revealAiKey(token);
    if (!key) return;
    copy(key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const copySkill = async () => {
    const token = await getAccessToken().catch(() => null);
    if (!token) return;
    const key = await revealAiKey(token);
    if (!key) return;
    copy(buildSetupSkill(key));
    setSkillCopied(true);
    window.setTimeout(() => setSkillCopied(false), 1600);
  };

  const reset = async () => {
    const token = await getAccessToken().catch(() => null);
    if (token) await clearAiKeyServer(token);
    clearIssuedKey();
    setHasKey(false);
    setKeyLastFour(null);
    setMessages([]);
    setAgent(null);
    setView("gallery");
  };

  // Native in-app issuance (delegated SIWE) → store in the server vault.
  const handleIssue = async () => {
    if (!wallet || !address || issuing) return;
    setError(null);
    setIssuing("signing");
    try {
      const provider = (await wallet.getEthereumProvider()) as Eip1193Provider;
      const result = await issueAiAccessKey(provider, address, (phase) => setIssuing(phase));
      const token = await getAccessToken();
      if (token) await storeAiKey(token, result.key, result.expiresAt, address);
      setHasKey(true);
      setKeyLastFour(result.key.slice(-4));
    } catch (e) {
      if (e instanceof AiAccessError) {
        setError(
          e.status === 403 ? a.issueInsufficient : e.status === 409 ? a.issueAlready : a.issueFailed,
        );
      } else {
        setError(a.issueFailed);
      }
    } finally {
      setIssuing(null);
    }
  };

  if (!preview && (!ready || !authenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="text-gray-400">…</div>
      </div>
    );
  }

  // Key status not resolved yet → spinner, so we never flash the gate to a holder.
  if (!preview && checkingKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#070b14]">
        <img src="/characters/toki-ai.png" alt="" className="w-24 h-24 object-contain animate-pulse" />
        <div className="w-7 h-7 rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan animate-spin" />
        <div className="text-[11px] font-bold tracking-[0.2em] text-accent-cyan/70">AI ACCESS</div>
      </div>
    );
  }

  const staked = stakedTon ?? 0;
  const eligible = staked >= MIN_TON;
  const needed = Math.max(0, MIN_TON - staked);
  const pct = Math.max(4, Math.min(100, Math.round((staked / MIN_TON) * 100)));
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const maskedKey = keyLastFour ? `sk-••••••${keyLastFour}` : "sk-••••••";
  const usagePct =
    usage?.maxBudget != null && usage.maxBudget > 0
      ? Math.min(100, Math.round((usage.spend / usage.maxBudget) * 100))
      : null;
  const usageUsedTokens =
    usage?.maxBudget != null && usage.maxBudget > 0
      ? Math.round((usage.spend / usage.maxBudget) * AI_DAILY_TOKEN_LIMIT)
      : null;
  const usageReset = usage?.resetAt
    ? new Date(usage.resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  // Proactive key-health surfacing — show WHY chats would fail before the user tries.
  const overBudget = usage?.maxBudget != null && usage.spend >= usage.maxBudget;
  const keyExpired = usage?.expiresAt ? new Date(usage.expiresAt).getTime() < Date.now() : false;
  const passWarn = keyExpired
    ? a.passWarnExpired
    : usage?.blocked || overBudget
      ? (a.passWarnBudget ?? "{time}").replace("{time}", usageReset ?? "—")
      : null;

  const catLabel = (c: AgentCategory): string =>
    c === "dev" ? a.catDev
    : c === "research" ? a.catResearch
    : c === "onchain" ? a.catOnchain
    : c === "content" ? a.catContent
    : a.catAll;

  // Dev agents (Solidity / code) are excluded from the roster — coding is best
  // done in the user's own IDE with the key (the Connect panel covers that).
  const ROSTER = AGENTS.filter((x) => x.category !== "dev");
  const agents = cat === "all" ? ROSTER : ROSTER.filter((x) => x.category === cat);
  const tierOf = (id: string) => AGENT_TIER[id] ?? "silver";
  const heroAgent = AGENTS.find((x) => x.id === HERO_ID) ?? null;
  const heroVisible = heroAgent && (cat === "all" || cat === heroAgent.category);
  const rosterAgents = agents.filter((x) => x.id !== HERO_ID);

  const hudTitle = !hasKey
    ? "AI ACCESS"
    : view === "chat" && agent
      ? agent.name[locale]
      : a.hudAgents;

  // ── usage bar (shared) ──
  const usageBar = usagePct != null && usage?.maxBudget != null && (
    <div className="ai-usage">
      <div className="ai-usage-top">
        <span>{a.usageLabel}</span>
        <span>
          {usagePct}% · {(a.usageTokens ?? "{used} / {limit}")
            .replace("{used}", fmtTokens(usageUsedTokens ?? 0))
            .replace("{limit}", fmtTokens(AI_DAILY_TOKEN_LIMIT))}
        </span>
      </div>
      <div className="ai-usage-bar">
        <i style={{ width: `${Math.max(2, usagePct)}%` }} />
      </div>
      {usageReset && (
        <div className="ai-usage-reset">{(a.usageReset ?? "{time}").replace("{time}", usageReset)}</div>
      )}
    </div>
  );

  // ── Connect modal (copy → paste into CLI/IDE) ──
  const connectModal = showConnect && (
    <div className="ai-ov" onClick={() => setShowConnect(false)}>
      <div className="ai-ovcard" onClick={(e) => e.stopPropagation()}>
        <button className="ai-ovx" onClick={() => setShowConnect(false)} aria-label="close">×</button>
        <h3 className="ai-ovh">{a.connectCta}</h3>
        <p className="ai-ovintro">{a.connectIntro}</p>
        <div className="ai-ccard">
          <div className="ch">{a.devTitle}</div>
          <p>{a.devDesc}</p>
          <div className="ai-kv">
            <span>{AI_ACCESS_URL}/v1</span>
            <button onClick={() => copy(`${AI_ACCESS_URL}/v1`)}>{a.copy}</button>
          </div>
          <div className="ai-kv">
            <span>{maskedKey}</span>
            <button onClick={copyKey}>{copied ? a.copied : a.copy}</button>
          </div>
          <div className="ai-kv"><span>{AI_MODELS.join(" · ")}</span></div>
          <a className="ai-doclink" href={AI_ACCESS_DOCS_URL} target="_blank" rel="noopener noreferrer">
            {a.docsLink}
          </a>
        </div>
        <div className="ai-ccard alt">
          <div className="ch">{a.aiTitle}</div>
          <p>{a.aiDesc}</p>
          <pre className="ai-skill">{buildSetupSkill(maskedKey)}</pre>
          <button className="ai-skillbtn" onClick={copySkill}>
            {skillCopied ? a.skillCopied : a.skillCopy}
          </button>
        </div>
      </div>
    </div>
  );

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
          {!hasKey || view === "gallery" ? (
            <Link href="/dashboard" className="ai-back">‹ {a.back}</Link>
          ) : (
            <button className="ai-back" onClick={() => setView("gallery")}>‹ {a.backGallery}</button>
          )}
          <span className="ai-htitle">{hudTitle}</span>
          {hasKey ? (
            <span className="ai-status on"><i />{a.statusActive}</span>
          ) : (
            <span className="ai-status off">AI</span>
          )}
        </div>

        {!hasKey ? (
          /* ── LOCKED: quest gate ── */
          <div className="ai-narrow">
            <div className="ai-gate">
              <img className="ai-hero" src="/characters/toki-ai.png" alt="" />
              <div className="ai-quest glass">
                <div className="ai-kicker">{a.gateKicker}</div>
                <h2>{a.gateTitle}</h2>
                <p className="ai-qdesc">
                  {eligible ? a.gateEligibleDesc : a.gateLockedDesc.replace("{min}", String(MIN_TON))}
                </p>
                <div className="ai-prog">
                  <div className="top">
                    <span>{a.gateProgress}</span>
                    <span><b>{stakeLoading ? "…" : fmt(staked)}</b> / {MIN_TON} TON</span>
                  </div>
                  <div className="ai-bar"><i style={{ width: `${pct}%` }} /></div>
                </div>
                {eligible ? (
                  isNativeIssueEnabled ? (
                    <button className="ai-btn" onClick={handleIssue} disabled={!!issuing || !wallet}>
                      {issuing === "signing" ? a.issueSigning : issuing === "issuing" ? a.issuing : `${a.gateGetKeyCta} →`}
                    </button>
                  ) : (
                    <a className="ai-btn" href={AI_ACCESS_URL} target="_blank" rel="noopener noreferrer">
                      {a.gateGetKeyCta} →
                    </a>
                  )
                ) : (
                  <Link className="ai-btn" href="/staking">{a.gateStakeCta.replace("{needed}", fmt(needed))} →</Link>
                )}
                {error && <div className="ai-err" style={{ textAlign: "center" }}>{error}</div>}
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
          </div>
        ) : view === "chat" && agent ? (
          /* ── CHAT with a selected agent ── */
          <div className="ai-narrow ai-chatcol">
            <div className="ai-persona glass">
              <img src={agent.sprite} alt="" />
              <div>
                <div className="pn">{agent.name[locale]}</div>
                <div className="pr">{agent.tagline[locale]}</div>
              </div>
            </div>

            {messages.length === 0 && (
              <div className="ai-starters">
                {agent.starters[locale].map((s) => (
                  <button key={s} onClick={() => sendText(s)}>{s}</button>
                ))}
              </div>
            )}

            <div className="ai-chat" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="ai-row">
                  <img className="ai-av" src={agent.sprite} alt="" />
                  <div className="ai-bub"><div className="ai-nm">{agent.name[locale]}</div>{agent.tagline[locale]}</div>
                </div>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ai-row me"><div className="ai-bub">{m.content}</div></div>
                ) : (
                  <div key={i} className="ai-row">
                    <img className="ai-av" src={agent.sprite} alt="" />
                    <div className="ai-bub"><div className="ai-nm">{agent.name[locale]}</div>{m.content}</div>
                  </div>
                ),
              )}
              {busy && (
                <div className="ai-row">
                  <img className="ai-av" src={agent.sprite} alt="" />
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
                    sendText(input);
                  }
                }}
                rows={1}
                placeholder={a.placeholder}
              />
              <button
                className="ai-send"
                onClick={() => sendText(input)}
                disabled={busy || !input.trim()}
                aria-label={a.send}
              >
                ➤
              </button>
            </div>
          </div>
        ) : (
          /* ── ROSTER (gallery) ── */
          <div className="ai-scrollcol">
            {/* AI pass — leads with the stake→AI value */}
            <div className="ai-pass">
              <div className="ptitle">
                <img src="/toki-logo.png" alt="" />
                {a.passTitle}
              </div>
              <div className="plead">{a.passLead}</div>
              <div className="pkey">
                <code>{maskedKey}</code>
                <button className="ai-mini" onClick={copyKey}>{copied ? a.copied : a.copy}</button>
                <button className="ai-mini" onClick={reset}>{a.clearKey}</button>
              </div>
              {usageBar}
              {passWarn && <div className="ai-passwarn">⚠️ {passWarn}</div>}
              <button className="ai-connect" onClick={() => setShowConnect(true)}>
                ⌘ {a.connectCta}
              </button>
            </div>

            {/* category filter */}
            <div className="ai-cats">
              <button className={cat === "all" ? "on" : ""} onClick={() => setCat("all")}>{a.catAll}</button>
              {CHIP_CATS.map((c) => (
                <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{catLabel(c)}</button>
              ))}
            </div>

            {/* hero — the on-chain assistant */}
            {heroVisible && heroAgent && (
              <button className="ros-hero" onClick={() => openAgent(heroAgent)}>
                <span className="hglow" />
                <img className="hart" src={heroAgent.sprite} alt="" />
                <span className="hmeta">
                  <span className="hbadge">{a.heroBadge}</span>
                  <span className="hnm">{heroAgent.name[locale]}</span>
                  <span className="hsub">{a.heroSub}</span>
                </span>
                <span className="hgo">{a.startChat} →</span>
              </button>
            )}

            {/* roster grid */}
            <div className="ros-grid">
              {rosterAgents.map((ag) => {
                const tier = tierOf(ag.id);
                return (
                  <button
                    key={ag.id}
                    className="ros-card"
                    style={{ ["--rc"]: TIER_COLOR[tier] } as CSSProperties}
                    onClick={() => openAgent(ag)}
                  >
                    <img className="cbg" src={TIER_BG[tier]} alt="" />
                    <span className="cveil" />
                    <span className="crib" style={{ background: TIER_COLOR[tier] }}>
                      {ag.category.toUpperCase()}
                    </span>
                    <img className="cpor" src={ag.sprite} alt="" />
                    <span className="cinfo">
                      <span className="cnm">{ag.name[locale]}</span>
                      <span className="ctg">{ag.tagline[locale]}</span>
                      <span className="cgo">{a.startChat} →</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {connectModal}
    </div>
  );
}

// Embedded game-shell styling — gacha-roster framing (mirrors the public mockups).
const aiCss = `
.ai-screen{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:#070b14;font-family:"Fredoka","Geist",system-ui,sans-serif;color:#eaf6fb}
.ai-bg{position:fixed;inset:0;z-index:0;pointer-events:none}
.ai-bg .img{position:absolute;inset:0;background:url("/backgrounds/hub-bg.jpg") center/cover;opacity:.42}
.ai-bg .scrim{position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 0,rgba(7,13,24,.5),rgba(7,11,20,.93))}
.ai-bg .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(167,139,250,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.05) 1px,transparent 1px);background-size:42px 42px}
.ai-wrap{position:relative;z-index:1;max-width:920px;margin:0 auto;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;padding:16px 16px 20px}
.ai-hud{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.ai-back{display:flex;align-items:center;gap:5px;font-size:13px;color:#cfe0f2;background:rgba(8,24,38,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 13px;font-weight:600;text-decoration:none;cursor:pointer}
.ai-back:hover{background:rgba(8,24,38,.85);color:#fff}
.ai-htitle{font-weight:800;letter-spacing:.16em;font-size:14px;color:#fff;margin-left:2px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-status{margin-left:auto;font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 10px;flex:none}
.ai-status.off{background:#22d3ee;color:#04141d}
.ai-status.on{background:rgba(34,211,238,.16);color:#22d3ee;border:1px solid rgba(34,211,238,.4);display:flex;align-items:center;gap:6px}
.ai-status.on i{width:6px;height:6px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:aiPulse 1.6s ease-in-out infinite}
@keyframes aiPulse{0%,100%{opacity:.4}50%{opacity:1}}
.glass{background:rgba(8,24,38,.62);backdrop-filter:blur(12px);border:1px solid rgba(34,211,238,.28);border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.ai-narrow{flex:1;width:100%;max-width:600px;margin:0 auto;display:flex;flex-direction:column;min-height:0}

/* gate */
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

/* roster scroll column */
.ai-scrollcol{flex:1;overflow-y:auto;padding:2px 2px 4px}

/* AI pass */
.ai-pass{position:relative;overflow:hidden;padding:15px 16px;margin-bottom:14px;background:linear-gradient(135deg,rgba(34,211,238,.2),rgba(167,139,250,.13) 46%,rgba(245,158,11,.12));border:1px solid rgba(34,211,238,.4);border-radius:18px}
.ai-pass::after{content:"";position:absolute;top:-60%;left:-25%;width:55%;height:220%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);pointer-events:none}
.ai-pass .ptitle{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;letter-spacing:.06em;color:#eafdff}
.ai-pass .ptitle img{width:22px;height:22px;object-fit:contain;background:#fff;border-radius:50%;padding:2px}
.ai-pass .plead{font-size:11px;color:#bcd0e6;margin-top:5px}
.ai-pass .pkey{display:flex;align-items:center;gap:7px;margin-top:11px}
.ai-pass .pkey code{flex:1;font-family:ui-monospace,monospace;font-size:12.5px;color:#dffafe;background:rgba(0,0,0,.32);border-radius:9px;padding:9px 11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-mini{font-size:11px;font-weight:700;color:#cfe0f2;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:8px 9px;cursor:pointer;white-space:nowrap}
.ai-mini:hover{background:rgba(255,255,255,.2)}
.ai-usage{margin-top:11px;padding-top:11px;border-top:1px solid rgba(255,255,255,.12)}
.ai-usage-top{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#cfe0f2;margin-bottom:6px;font-weight:600}
.ai-usage-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.ai-usage-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#f59e0b);transition:width .5s ease}
.ai-usage-reset{margin-top:5px;font-size:10px;color:#8fb0c8}
.ai-passwarn{margin-top:11px;font-size:11.5px;font-weight:600;color:#fcd9a0;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:9px 11px;line-height:1.45}
.ai-connect{margin-top:13px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:700;color:#22d3ee;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.35);border-radius:12px;padding:11px;cursor:pointer}
.ai-connect:hover{background:rgba(34,211,238,.2)}

/* category chips */
.ai-cats{display:flex;gap:6px;overflow-x:auto;margin-bottom:14px;padding-bottom:2px}
.ai-cats button{flex:none;font-size:11.5px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);color:#cfe0f2;cursor:pointer}
.ai-cats button.on{background:#22d3ee;color:#04141d;border-color:#22d3ee;font-weight:700}

/* hero card */
.ros-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;margin-bottom:14px;padding:16px;border-radius:18px;border:1px solid rgba(34,211,238,.5);background:linear-gradient(120deg,rgba(34,211,238,.16),rgba(167,139,250,.1) 70%,rgba(8,24,38,.6));box-shadow:0 12px 34px rgba(0,0,0,.45);transition:transform .18s,box-shadow .18s}
.ros-hero:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(0,0,0,.5),0 0 26px rgba(34,211,238,.25)}
.ros-hero .hglow{position:absolute;right:-30px;top:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(rgba(34,211,238,.45),transparent 70%);pointer-events:none}
.ros-hero .hart{width:74px;height:74px;flex:none;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid rgba(34,211,238,.6);background:#0c1116;z-index:1}
.ros-hero .hmeta{flex:1;min-width:0;z-index:1}
.ros-hero .hbadge{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.08em;color:#04141d;background:#22d3ee;border-radius:999px;padding:3px 9px;margin-bottom:5px}
.ros-hero .hnm{display:block;font-size:19px;font-weight:800;color:#fff}
.ros-hero .hsub{display:block;font-size:11.5px;color:#cfe3ec;margin-top:2px;line-height:1.4}
.ros-hero .hgo{flex:none;z-index:1;font-size:12px;font-weight:700;color:#04141d;background:#22d3ee;border-radius:11px;padding:9px 14px;white-space:nowrap}

/* roster grid */
.ros-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width:680px){.ros-grid{grid-template-columns:repeat(2,1fr)}}
.ros-card{position:relative;aspect-ratio:3/4;border-radius:16px;overflow:hidden;cursor:pointer;border:2px solid rgba(255,255,255,.14);background:#0c1116;transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s,border-color .2s}
.ros-card .cbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
.ros-card .cveil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,18,.05) 38%,rgba(6,10,18,.92))}
.ros-card .cpor{position:absolute;top:8%;left:50%;transform:translateX(-50%);width:60%;aspect-ratio:1;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid rgba(255,255,255,.5);background:#0c1116;z-index:2;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.ros-card .crib{position:absolute;top:9px;left:9px;z-index:3;font-size:8.5px;font-weight:800;letter-spacing:.06em;padding:3px 8px;border-radius:999px;color:#05080f}
.ros-card .cide{position:absolute;top:9px;right:9px;z-index:3;font-size:8.5px;font-weight:800;letter-spacing:.04em;color:#fff;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:3px 7px}
.ros-card .cinfo{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:11px 10px 13px;text-align:center}
.ros-card .cnm{display:block;font-size:14px;font-weight:800;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.ros-card .ctg{display:block;font-size:10px;color:#cfe3ec;margin-top:3px;line-height:1.35}
.ros-card .cgo{display:inline-block;margin-top:8px;font-size:10px;font-weight:700;color:#04141d;background:var(--rc,#22d3ee);border-radius:8px;padding:5px 11px}
.ros-card:hover{transform:translateY(-6px) scale(1.02);border-color:var(--rc,#22d3ee);box-shadow:0 20px 44px rgba(0,0,0,.55),0 0 22px var(--rc,rgba(34,211,238,.4))}

/* chat */
.ai-chatcol{flex:1;display:flex;flex-direction:column;min-height:0}
.ai-persona{display:flex;align-items:center;gap:11px;padding:11px 13px;margin-bottom:11px;flex:none}
.ai-persona img{width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid rgba(34,211,238,.5);background:#0c1116;flex:none}
.ai-persona .pn{font-weight:800;font-size:15px;color:#fff}
.ai-persona .pr{font-size:11px;color:#8fd8e6;margin-top:2px}
.ai-connbanner{display:block;width:100%;text-align:left;font-size:12px;color:#dbeafe;background:rgba(167,139,250,.14);border:1px solid rgba(167,139,250,.4);border-radius:12px;padding:10px 12px;margin-bottom:11px;cursor:pointer;flex:none}
.ai-connbanner:hover{background:rgba(167,139,250,.22)}
.ai-starters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;flex:none}
.ai-starters button{font-size:11px;color:#cfe0f2;background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.25);border-radius:999px;padding:6px 11px;cursor:pointer}
.ai-starters button:hover{background:rgba(34,211,238,.2)}
.ai-chat{flex:1;display:flex;flex-direction:column;gap:11px;overflow-y:auto;padding:4px 2px;min-height:120px}
.ai-row{display:flex;gap:8px;align-items:flex-end;max-width:88%}
.ai-row.me{align-self:flex-end;flex-direction:row-reverse}
.ai-av{width:30px;height:30px;border-radius:50%;flex:none;object-fit:cover;object-position:center top;border:1.5px solid rgba(34,211,238,.5);background:#0c1116}
.ai-bub{font-size:13.5px;line-height:1.5;padding:10px 13px;border-radius:16px;white-space:pre-wrap}
.ai-row .ai-bub{background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(34,211,238,.22);border-bottom-left-radius:5px;color:#eaf6fb}
.ai-row.me .ai-bub{background:linear-gradient(135deg,rgba(74,144,217,.5),rgba(34,211,238,.32));border:1px solid rgba(34,211,238,.3);border-bottom-right-radius:5px;color:#fff}
.ai-nm{font-size:10px;font-weight:700;color:#22d3ee;margin-bottom:4px}
.ai-err{margin:6px 2px;font-size:12px;color:#fca5a5}
.ai-inbar{display:flex;gap:8px;align-items:flex-end;margin-top:10px;flex:none}
.ai-field{flex:1;resize:none;font-family:inherit;font-size:13.5px;color:#eaf6fb;background:rgba(8,24,38,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;outline:none;max-height:120px}
.ai-field:focus{border-color:rgba(34,211,238,.5)}
.ai-send{width:46px;height:46px;flex:none;border-radius:13px;border:0;cursor:pointer;color:#04141d;font-size:18px;background:linear-gradient(135deg,#4a90d9,#22d3ee);box-shadow:0 6px 18px rgba(34,211,238,.32)}
.ai-send:disabled{opacity:.4;cursor:default}

/* connect modal */
.ai-ov{position:fixed;inset:0;z-index:60;background:rgba(5,8,15,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px}
.ai-ovcard{width:min(560px,95vw);max-height:86vh;overflow-y:auto;background:rgba(8,16,26,.98);border:1px solid rgba(34,211,238,.35);border-radius:20px;padding:22px;position:relative}
.ai-ovx{position:absolute;top:14px;right:16px;font-size:22px;color:#9fc7d6;background:none;border:0;cursor:pointer}
.ai-ovh{font-size:19px;color:#fff;margin-bottom:4px}
.ai-ovintro{font-size:13px;color:#9fc7d6;margin-bottom:16px}
.ai-ccard{padding:14px 15px;margin-bottom:12px;border-radius:16px;background:rgba(8,24,38,.62);border:1px solid rgba(34,211,238,.24)}
.ai-ccard.alt{border-color:rgba(167,139,250,.42)}
.ai-ccard .ch{font-weight:800;font-size:14px;color:#fff;margin-bottom:6px}
.ai-ccard p{font-size:11.5px;color:#aebfd2;line-height:1.5}
.ai-kv{display:flex;justify-content:space-between;gap:8px;align-items:center;font-family:ui-monospace,monospace;font-size:11px;color:#dffafe;background:rgba(0,0,0,.32);border-radius:9px;padding:8px 10px;margin-top:7px}
.ai-kv span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-kv button{flex:none;font-family:inherit;font-size:10.5px;color:#8fd8e6;background:none;border:0;cursor:pointer;font-weight:700}
.ai-doclink{display:inline-block;margin-top:11px;font-size:12.5px;font-weight:700;color:#22d3ee;text-decoration:none}
.ai-skill{margin-top:9px;background:rgba(0,0,0,.36);border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:11px 12px;font-family:ui-monospace,monospace;font-size:10px;line-height:1.55;color:#cfe6f2;white-space:pre-wrap;max-height:220px;overflow:auto}
.ai-skillbtn{margin-top:10px;width:100%;text-align:center;font-weight:800;font-size:14px;color:#04141d;background:linear-gradient(135deg,#a78bfa,#22d3ee);border:0;border-radius:13px;padding:12px;cursor:pointer}
@media (prefers-reduced-motion:reduce){.ai-hero,.ai-status.on i,.ai-bar i,.ros-card,.ros-hero{animation:none;transition:none}}
`;
