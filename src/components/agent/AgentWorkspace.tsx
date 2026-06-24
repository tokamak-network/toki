/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useStakedTon } from "@/hooks/useStakedTon";
import TokiLoader from "@/components/common/TokiLoader";
import { useGoDashboard } from "@/components/transitions/TransitionProvider";
import { AGENTS, type AgentDef } from "@/lib/agents";
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
  AI_DAILY_BUDGET_USD,
  AI_ACCESS_URL,
  AI_ACCESS_LLM_BASE,
  AI_ACCESS_DOCS_URL,
  AI_MODELS,
  AiAccessError,
  MIN_TON_AI_ACCESS as MIN_TON,
  type AgentMessage,
  type KeyUsage,
  type Eip1193Provider,
} from "@/lib/aiAccess";
import { SITE_URL } from "@/constants/seo";

// One Toki, several lenses — each "mode" just swaps the system prompt + starters
// (same model). Dev agents (Solidity / code) are intentionally excluded: coding
// belongs in the user's own IDE via the Connect panel, not an in-browser chat.
const MODE_IDS = ["toki", "staking-advisor", "defi-researcher", "x-writer"];
const MODES: AgentDef[] = MODE_IDS.map((id) => AGENTS.find((x) => x.id === id)).filter(
  (x): x is AgentDef => !!x,
);
const MODE_LABEL: Record<string, { ko: string; en: string }> = {
  toki: { ko: "토키", en: "Toki" },
  "staking-advisor": { ko: "스테이킹", en: "Staking" },
  "defi-researcher": { ko: "리서치", en: "Research" },
  "x-writer": { ko: "작가", en: "Writer" },
};

// Typewriter + dialogue bar cloned from the staking / get-ton VN frame so the key
// gate matches those screens (left Toki · bottom dialogue · right quest panel).
function useTypewriter(text: string, speed = 24) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);
  return { displayed, done, skip };
}

function GateDialogue({ text }: { text: string }) {
  const { displayed, done, skip } = useTypewriter(text);
  return (
    <div className="cursor-pointer select-none w-full" onClick={() => !done && skip()}>
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6 h-[160px] sm:h-[176px] flex flex-col">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 mb-3 self-start">
          <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
        </div>
        <p className="text-gray-100 text-base sm:text-lg leading-relaxed flex-1">
          {displayed}
          {!done && <span className="inline-block w-0.5 h-5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />}
        </p>
      </div>
    </div>
  );
}

// AI Access workspace over the stake-issued key. No key → quest gate. Has key →
// "Ask Toki": one assistant with mode chips (lenses that swap the system prompt) +
// the holographic AI ACCESS PASS. Coding tools connect via the CONNECT modal.
export default function AgentWorkspace({ preview = false }: { preview?: boolean } = {}) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const a = t.agent;
  const goDashboard = useGoDashboard();
  const { stakedTon, loading: stakeLoading, wallet, address } = useStakedTon();

  const [hasKey, setHasKey] = useState(false);
  const [keyLastFour, setKeyLastFour] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [agent, setAgent] = useState<AgentDef>(
    () => AGENTS.find((x) => x.id === "toki") ?? AGENTS[0],
  );
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [skillCopied, setSkillCopied] = useState(false);
  const [issuing, setIssuing] = useState<"signing" | "issuing" | null>(null);
  const [usage, setUsage] = useState<KeyUsage | null>(null);
  // Usage fetch lifecycle so the pass card never shows a permanent "loading…".
  const [usageState, setUsageState] = useState<"loading" | "ok" | "error">("loading");
  // Key rejected by the LLM server (revoked/expired). Non-destructive: the vault
  // row is KEPT (survives a transient api2 blip + audit trail); we only show the
  // recovery state. Cleared on a successful call or explicit reset/re-issue.
  const [keyRejected, setKeyRejected] = useState(false);
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

  // Flag the key as rejected by the LLM server WITHOUT deleting it from the vault.
  // Non-destructive: the record stays (so a transient api2 blip doesn't wipe a good
  // key, and the audit trail survives); the UI shows a "rejected → rotate on site"
  // recovery state. The user clears it explicitly via "Reset key" / re-issue. Only
  // call on a GENUINE rejection (revoked/expired), never on soft failures.
  const markKeyRejected = useCallback(() => {
    setKeyRejected(true);
    setUsage(null);
    setUsageState("error");
  }, []);

  // Refresh daily usage when the key is present and after each reply. Surfaces a
  // real state (loading | ok | error) so the card never sticks on "loading…",
  // and self-heals when the key is rejected.
  useEffect(() => {
    if (!hasKey) {
      setUsage(null);
      setUsageState("loading");
      return;
    }
    let cancelled = false;
    setUsageState("loading");
    (async () => {
      const token = await getAccessToken().catch(() => null);
      if (!token) {
        if (!cancelled) setUsageState("error");
        return;
      }
      try {
        const u = await getKeyUsage(token);
        if (!cancelled) {
          setUsage(u);
          setUsageState("ok");
          setKeyRejected(false); // key works again (e.g., api2 restored)
        }
      } catch (e) {
        if (cancelled) return;
        setUsage(null);
        setUsageState("error");
        // A genuinely dead key → flag it (non-destructive) + show recovery path.
        if (
          e instanceof AiAccessError &&
          e.status === 401 &&
          (e.reason === "revoked" || e.reason === "expired")
        ) {
          setError(a.keyExpired);
          markKeyRejected();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasKey, messages.length, getAccessToken, markKeyRejected, a]);

  const sendText = useCallback(
    async (text: string) => {
      const txt = text.trim();
      if (!txt || !hasKey || keyRejected || busy) return;
      setError(null);
      const next: AgentMessage[] = [...messages, { role: "user", content: txt }];
      setMessages(next);
      setInput("");
      setBusy(true);
      try {
        const token = await getAccessToken();
        // reason "auth" → a transient session miss must NOT delete a good key.
        if (!token) throw new AiAccessError("No session", 401, "auth");
        const reply = await agentChat(
          token,
          next,
          agent ? { system: agent.system, model: agent.model } : undefined,
        );
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        setKeyRejected(false); // a working reply clears any prior rejected state
      } catch (e) {
        if (e instanceof AiAccessError) {
          // Budget / auth are SOFT — the key is fine, so never kick to the gate.
          if (e.reason === "budget" || e.status === 429) {
            setError(a.errorBudget);
          } else if (e.reason === "auth") {
            setError(a.errorAuth);
          } else if (e.status === 401) {
            // Genuinely dead (expired / revoked / no key) → flag rejected (keep the
            // vault record) and show the recovery path.
            setError(a.keyExpired);
            markKeyRejected();
          } else {
            setError(a.errorGeneric);
          }
        } else {
          setError(a.errorGeneric);
        }
      }
      setBusy(false);
    },
    [hasKey, busy, messages, agent, a, getAccessToken, markKeyRejected, keyRejected],
  );

  // Switch lens — keep the conversation; an empty chat shows the new mode's starters.
  const setMode = (m: AgentDef) => {
    setAgent(m);
    setError(null);
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
      setKeyRejected(false);
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
    setKeyRejected(false);
    setMessages([]);
    setAgent(MODES[0]);
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
      setKeyRejected(false);
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
    return <TokiLoader label="AI ACCESS" />;
  }

  const staked = stakedTon ?? 0;
  const eligible = staked >= MIN_TON;
  const needed = Math.max(0, MIN_TON - staked);
  const pct = Math.max(4, Math.min(100, Math.round((staked / MIN_TON) * 100)));
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const maskedKey = keyLastFour ? `sk-••••••${keyLastFour}` : "sk-••••••";
  // Daily spend cap (USD): the key's own max_budget, else the documented $1.00/day
  // (≈ 1M tokens) so usage still renders when the key omits maxBudget.
  const spendUsd = usage?.spend ?? 0;
  const dailyBudgetUsd = usage?.maxBudget ?? (usage ? AI_DAILY_BUDGET_USD : null);
  const usagePct =
    dailyBudgetUsd != null && dailyBudgetUsd > 0
      ? Math.min(100, Math.round((spendUsd / dailyBudgetUsd) * 100))
      : null;
  const usageUsedTokens =
    dailyBudgetUsd != null && dailyBudgetUsd > 0
      ? Math.round((spendUsd / dailyBudgetUsd) * AI_DAILY_TOKEN_LIMIT)
      : null;
  const usageReset = usage?.resetAt
    ? new Date(usage.resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  // Pass hero stat — tokens left in today's budget (or the full cap if unknown).
  const usageKnown = usageUsedTokens != null;
  const tokensLeft = usageKnown
    ? Math.max(0, AI_DAILY_TOKEN_LIMIT - (usageUsedTokens ?? 0))
    : AI_DAILY_TOKEN_LIMIT;
  const pctLeft = usagePct != null ? Math.max(0, 100 - usagePct) : null;
  // Proactive key-health surfacing — show WHY chats would fail before the user tries.
  const overBudget = usage?.maxBudget != null && usage.spend >= usage.maxBudget;
  const keyExpired = usage?.expiresAt ? new Date(usage.expiresAt).getTime() < Date.now() : false;
  const passWarn = keyExpired
    ? a.passWarnExpired
    : usage?.blocked || overBudget
      ? (a.passWarnBudget ?? "{time}").replace("{time}", usageReset ?? "—")
      : null;

  const hudTitle = !hasKey ? "AI ACCESS" : "ASK TOKI";

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
            <span>{AI_ACCESS_LLM_BASE}/v1</span>
            <button onClick={() => copy(`${AI_ACCESS_LLM_BASE}/v1`)}>{a.copy}</button>
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
        <div className="ai-ccard">
          <div className="ch">{a.mcpTitle}</div>
          <p>{a.mcpDesc}</p>
          <div className="ai-kv">
            <span>{`claude mcp add --transport http toki ${SITE_URL}/api/mcp`}</span>
            <button onClick={() => copy(`claude mcp add --transport http toki ${SITE_URL}/api/mcp`)}>{a.copy}</button>
          </div>
          <div className="ai-kv">
            <span>{`${SITE_URL}/api/mcp`}</span>
            <button onClick={() => copy(`${SITE_URL}/api/mcp`)}>{a.copy}</button>
          </div>
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

  // ── KEY GATE — staking-style VN frame: Toki (left) explains, UNLOCK QUEST (right) ──
  if (!hasKey) {
    const gateDlg = eligible
      ? a.gateDlgEligible
      : (a.gateDlgLocked ?? "").replace("{min}", String(MIN_TON)).replace("{needed}", fmt(needed));
    const cta =
      "block w-full rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan py-3 text-center text-sm font-bold text-[#04141d] shadow-lg shadow-accent-cyan/30 transition hover:brightness-110";
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/backgrounds/staking-dawn.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30" />

        <Link
          href="/dashboard"
          onClick={goDashboard}
          className="absolute left-4 top-20 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-md transition-colors hover:text-accent-cyan"
        >
          ‹ {a.back}
        </Link>

        {/* mid: Toki (left 40%) + UNLOCK QUEST panel (right 60%) */}
        <div className="absolute inset-x-0 top-16 bottom-[176px] z-10 flex items-center justify-center">
          <div className="max-w-3xl w-full mx-auto flex items-end h-full">
            {/* Left: Toki — identical sizing to the staking / get-ton VN frame.
                The `flex justify-center` wrapper + `overflow-visible` keep the
                character at its intrinsic w-[28rem] (it overflows the 40% column);
                without them it shrinks to the column width and renders ~66% size. */}
            <div className="hidden md:flex w-[40%] items-end justify-center">
              <div className="flex justify-center z-10">
                <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] aspect-[3/4] overflow-visible">
                  <div className="absolute inset-[15%] bottom-0 rounded-full blur-3xl -z-10 animate-pulse opacity-40" style={{ backgroundColor: "rgba(34,211,238,0.4)" }} />
                  <img src="/characters/toki-welcome.png" alt="Toki" className="relative z-10 w-full h-full object-contain object-bottom drop-shadow-2xl" />
                </div>
              </div>
            </div>

            <div className="w-full md:w-[60%] flex items-end justify-center pb-4 px-4 md:px-0">
              <div className="w-full max-w-sm animate-slide-up">
                <div className="bg-black/55 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                  <div className="text-[11px] font-bold tracking-[0.22em] text-accent-cyan">{a.gateKicker}</div>
                  <h2 className="mt-1.5 mb-1 text-xl font-extrabold text-white">{a.gateTitle}</h2>
                  <p className="mb-4 text-[13px] leading-relaxed text-gray-300">
                    {eligible ? a.gateEligibleDesc : a.gateLockedDesc.replace("{min}", String(MIN_TON))}
                  </p>
                  <div className="mb-2 flex items-baseline justify-between text-[11.5px] font-semibold text-gray-200">
                    <span>{a.gateProgress}</span>
                    <span><b className="text-accent-amber">{stakeLoading ? "…" : fmt(staked)}</b> / {MIN_TON} TON</span>
                  </div>
                  <div className="mb-4 h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-amber shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="group relative">
                    {eligible ? (
                      isNativeIssueEnabled ? (
                        <button onClick={handleIssue} disabled={!!issuing || !wallet} className={`${cta} disabled:opacity-50`}>
                          {issuing === "signing" ? a.issueSigning : issuing === "issuing" ? a.issuing : `${a.gateGetKeyCta} →`}
                        </button>
                      ) : (
                        <a href={AI_ACCESS_URL} target="_blank" rel="noopener noreferrer" className={cta}>
                          {a.gateGetKeyCta} →
                        </a>
                      )
                    ) : (
                      <Link href="/staking" className={cta}>
                        {a.gateStakeCta.replace("{needed}", fmt(needed))} →
                      </Link>
                    )}
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-center text-[11px] leading-snug text-gray-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      {eligible ? a.tipIssue : (a.tipStake ?? "").replace("{min}", String(MIN_TON))}
                    </span>
                  </div>
                  {error && <div className="mt-2 text-center text-xs text-red-400">{error}</div>}
                  <a href={AI_ACCESS_URL} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-[11.5px] text-accent-sky hover:underline">
                    {a.manageOnSite} ↗
                  </a>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-[11.5px] text-gray-400">{a.pasteKeyLabel}</label>
                    <div className="flex gap-2">
                      <input
                        value={pasteValue}
                        onChange={(e) => setPasteValue(e.target.value)}
                        placeholder="sk-litellm-…"
                        className="flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 font-mono text-[13px] text-cyan-50 outline-none focus:border-accent-cyan/50"
                      />
                      <div className="group relative flex-none">
                        <button onClick={usePastedKey} className="h-full rounded-xl border border-white/15 bg-white/10 px-4 text-[12.5px] font-bold text-gray-200 hover:bg-white/15">
                          {a.pasteKeyCta}
                        </button>
                        <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[240px] rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-[11px] leading-snug text-gray-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                          {a.tipPaste}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* bottom: Toki dialogue */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="max-w-3xl mx-auto">
            <GateDialogue text={gateDlg} />
          </div>
        </div>
      </div>
    );
  }

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
          <Link href="/dashboard" onClick={goDashboard} className="ai-back">‹ {a.back}</Link>
          <span className="ai-htitle">{hudTitle}</span>
          <span className="ai-status on"><i />{a.statusActive}</span>
        </div>

        {/* ── ASK TOKI — one assistant, mode lenses ── */}
        <div className="ai-uni">
            {/* AI ACCESS PASS — holographic credential */}
            <div className="ai-pass">
              <span className="ap-grid" />
              <span className="ap-holo" />
              <div className="ap-body">
                <div className="ap-top">
                  <span className="ap-brand"><span className="ap-d" />AI ACCESS PASS</span>
                  <span className="ap-chip"><i />ACTIVE</span>
                </div>

                <div className="ap-mid">
                  <div className="ap-cred">
                    <span className="ap-clbl">CREDENTIAL</span>
                    <code className="ap-key">{maskedKey}</code>
                    <div className="ap-cbtns">
                      <button className="ai-mini" onClick={copyKey}>{copied ? a.copied : a.copy}</button>
                      <button className="ai-mini" onClick={reset}>{a.clearKey}</button>
                    </div>
                  </div>
                  <div className="ap-stat">
                    <div className="ap-num">{pctLeft != null ? `${pctLeft}%` : fmtTokens(tokensLeft)}</div>
                    <div className="ap-nlbl">{pctLeft != null ? "LEFT TODAY" : "DAILY BUDGET"}</div>
                  </div>
                </div>

                {/* Daily token usage — always shown: how much used vs the 1M cap, and how much is left. */}
                <div className="ap-bar"><i style={{ width: `${usagePct ?? 0}%` }} /></div>
                <div className="ap-urow">
                  <span>
                    {usageKnown ? fmtTokens(usageUsedTokens ?? 0) : "—"} / {fmtTokens(AI_DAILY_TOKEN_LIMIT)} used
                  </span>
                  <span>
                    {usageKnown
                      ? `${fmtTokens(tokensLeft)} left${usageReset ? ` · resets ${usageReset}` : ""}`
                      : usageState === "loading"
                        ? "checking usage…"
                        : a.usageUnavailable}
                  </span>
                </div>

                {keyRejected ? (
                  <div className="ai-passwarn">
                    ⚠️ {a.keyExpired}{" "}
                    <a
                      href={AI_ACCESS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7fe9ff", fontWeight: 700, textDecoration: "underline" }}
                    >
                      {a.manageOnSite} ↗
                    </a>
                  </div>
                ) : (
                  passWarn && <div className="ai-passwarn">⚠️ {passWarn}</div>
                )}

                <div className="ap-foot">
                  <span className="ap-models">{AI_MODELS.join(" · ")}</span>
                  <span className="ap-net">STAKE-FUNDED · ETH MAINNET</span>
                </div>

                <button className="ai-connect" onClick={() => setShowConnect(true)}>
                  ⌘ {a.connectCta}
                </button>
              </div>
            </div>

            {/* mode chips — same Toki, different lens */}
            <div className="ai-modes">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className={agent.id === m.id ? "on" : ""}
                  onClick={() => setMode(m)}
                >
                  <img src={m.sprite} alt="" />
                  {MODE_LABEL[m.id]?.[locale] ?? m.name[locale]}
                </button>
              ))}
            </div>

            {/* chat */}
            <div className="ai-chat" ref={scrollRef}>
              {messages.length === 0 ? (
                <>
                  <div className="ai-row">
                    <img className="ai-av" src={agent.sprite} alt="" />
                    <div className="ai-bub"><div className="ai-nm">{agent.name[locale]}</div>{agent.tagline[locale]}</div>
                  </div>
                  <div className="ai-starters">
                    {agent.starters[locale].map((s) => (
                      <button key={s} onClick={() => sendText(s)}>{s}</button>
                    ))}
                  </div>
                </>
              ) : (
                messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="ai-row me"><div className="ai-bub">{m.content}</div></div>
                  ) : (
                    <div key={i} className="ai-row">
                      <img className="ai-av" src={agent.sprite} alt="" />
                      <div className="ai-bub"><div className="ai-nm">{agent.name[locale]}</div>{m.content}</div>
                    </div>
                  ),
                )
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
.ai-wrap{position:relative;z-index:1;max-width:920px;margin:0 auto;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;padding:80px 16px 20px}
.ai-hud{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.ai-back{display:flex;align-items:center;gap:5px;font-size:13px;color:#cfe0f2;background:rgba(8,24,38,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 13px;font-weight:600;text-decoration:none;cursor:pointer}
.ai-back:hover{background:rgba(8,24,38,.85);color:#fff}
.ai-htitle{font-weight:800;letter-spacing:.16em;font-size:14px;color:#fff;margin-left:2px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-status{margin-left:auto;font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 10px;flex:none}
.ai-status.on{background:rgba(34,211,238,.16);color:#22d3ee;border:1px solid rgba(34,211,238,.4);display:flex;align-items:center;gap:6px}
.ai-status.on i{width:6px;height:6px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;animation:aiPulse 1.6s ease-in-out infinite}
@keyframes aiPulse{0%,100%{opacity:.4}50%{opacity:1}}
/* Ask-Toki unified surface: pass + mode chips + chat + input, one column */
.ai-uni{flex:1;width:100%;max-width:600px;margin:0 auto;display:flex;flex-direction:column;min-height:0}
.ai-modes{display:flex;gap:7px;overflow-x:auto;margin:0 0 12px;padding-bottom:2px;flex:none}
.ai-modes button{flex:none;display:flex;align-items:center;gap:7px;font:inherit;font-size:12px;font-weight:600;color:#cfe0f2;background:rgba(8,24,38,.55);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:4px 13px 4px 4px;cursor:pointer;transition:background .15s,border-color .15s}
.ai-modes button img{width:24px;height:24px;border-radius:50%;object-fit:cover;object-position:center top;border:1.5px solid rgba(34,211,238,.4);background:#0c1116}
.ai-modes button:hover{background:rgba(8,24,38,.85)}
.ai-modes button.on{background:rgba(34,211,238,.16);border-color:#22d3ee;color:#fff}
.ai-modes button.on img{border-color:#22d3ee}

/* AI pass — holographic credential card (Toki Passport tone) */
.ai-pass{position:relative;overflow:hidden;flex:none;margin-bottom:16px;border-radius:20px;color:#eaf6fb;background:radial-gradient(120% 90% at 88% 0,rgba(34,211,238,.22),transparent 55%),radial-gradient(90% 80% at 0 100%,rgba(167,139,250,.16),transparent 55%),linear-gradient(160deg,#101a2e,#0a0f1c 72%);border:1px solid rgba(34,211,238,.45);box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.04),0 0 36px rgba(34,211,238,.18)}
.ai-pass .ap-grid{position:absolute;inset:0;z-index:0;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:30px 30px}
.ai-pass .ap-holo{position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:screen;opacity:.5;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.16) 44%,rgba(127,233,255,.13) 50%,rgba(167,139,250,.18) 56%,transparent 72%);background-size:260% 100%;animation:apHolo 7s ease-in-out infinite}
@keyframes apHolo{0%,100%{background-position:0 0}50%{background-position:100% 0}}
.ap-body{position:relative;z-index:2;padding:16px 17px 14px}
.ap-top{display:flex;align-items:center;justify-content:space-between}
.ap-brand{display:flex;align-items:center;gap:8px;font-family:"Baloo 2","Fredoka",sans-serif;font-weight:800;font-size:11px;letter-spacing:.2em;color:#cfe0f2}
.ap-d{width:14px;height:14px;border-radius:4px;background:linear-gradient(135deg,#22d3ee,#a78bfa);transform:rotate(45deg);box-shadow:0 0 10px rgba(34,211,238,.6)}
.ap-chip{display:flex;align-items:center;gap:6px;font-family:"Anton",sans-serif;font-size:12px;letter-spacing:.08em;color:#04141d;background:linear-gradient(135deg,#7fe3ff,#22d3ee);padding:5px 11px;border-radius:999px;box-shadow:0 4px 14px rgba(34,211,238,.4)}
.ap-chip i{width:6px;height:6px;border-radius:50%;background:#04141d;animation:aiPulse 1.6s ease-in-out infinite}
.ap-mid{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:15px}
.ap-cred{min-width:0;flex:1}
.ap-clbl{display:block;font-size:9px;letter-spacing:.22em;color:#7fb6c4;font-weight:700;margin-bottom:6px}
.ap-key{display:block;font-family:ui-monospace,monospace;font-size:13px;letter-spacing:.06em;color:#dffafe;background:rgba(0,0,0,.34);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:9px 11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ap-cbtns{display:flex;gap:6px;margin-top:7px}
.ap-stat{text-align:right;flex:none}
.ap-num{font-family:"Anton",sans-serif;font-size:clamp(32px,9vw,46px);line-height:.84;color:#fff;letter-spacing:-.01em;text-shadow:0 3px 22px rgba(34,211,238,.45)}
.ap-nlbl{font-size:8.5px;letter-spacing:.14em;color:#a78bfa;font-weight:700;margin-top:5px}
.ai-mini{font-size:11px;font-weight:700;color:#cfe0f2;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:8px 9px;cursor:pointer;white-space:nowrap}
.ai-mini:hover{background:rgba(255,255,255,.2)}
.ap-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.1);margin-top:14px}
.ap-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#a78bfa,#f59e0b);box-shadow:0 0 12px rgba(34,211,238,.5);transition:width .5s ease}
.ap-urow{display:flex;justify-content:space-between;font-size:10px;color:#9fc7d6;margin-top:6px;font-weight:600;letter-spacing:.03em}
.ap-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);font-size:9px;letter-spacing:.06em}
.ap-models{font-family:ui-monospace,monospace;color:#9fb4cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ap-net{flex:none;color:#7fb6c4;font-weight:700}
.ai-passwarn{margin-top:11px;font-size:11.5px;font-weight:600;color:#fcd9a0;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:9px 11px;line-height:1.45}
.ai-connect{margin-top:13px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:700;color:#22d3ee;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.35);border-radius:12px;padding:11px;cursor:pointer}
.ai-connect:hover{background:rgba(34,211,238,.2)}

/* chat */
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
@media (prefers-reduced-motion:reduce){.ai-status.on i,.ap-holo{animation:none}}
`;
