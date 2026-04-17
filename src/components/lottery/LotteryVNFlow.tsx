"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { QRCodeSVG } from "qrcode.react";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";
import { fetchStakingData } from "@/lib/staking";
import { trackEvent } from "@/lib/analytics";
import CardNumberInput from "@/components/lottery/CardNumberInput";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LotteryVNFlowProps {
  cardNumber: string;
  tier: PrizeTier;
  prizeAmount: number;
  onChooseReward: (choice: "discount" | "ton") => Promise<{ txHash?: string; showMission?: boolean }>;
  txHash?: string | null;
  walletAddress?: string | null;
  loading?: boolean;
  /** True when the user has just retried with a second card after a first bust. */
  isRetry?: boolean;
}

type Phase =
  | "promo"
  | "prize_reveal"
  | "bust_reveal"
  | "bust_retry_input"
  | "choice"
  | "discount_result"
  | "ton_result"
  | "done";

// ─── Promotion hashtag ────────────────────────────────────────────────────────

const PROMO_HASHTAG = "#tokamaknetwork #더그린";

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 32) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ─── Dialogue + mood per phase ────────────────────────────────────────────────

function getPhaseData(
  phase: Phase,
  prize: (typeof PRIZE_TIERS)[PrizeTier],
  isRetry = false,
): { text: string; mood: string } {
  switch (phase) {
    case "promo":
      return {
        text:
          "TON은 토카막 네트워크의 토큰이야! 2017년부터 이더리움 위에서 꾸준히 개발해온 블록체인 프로젝트로, 국내 4대 거래소에 모두 상장된 검증된 프로젝트야~ 8년 넘게 살아남은 프로젝트는 많지 않거든! 🙌",
        mood: "proud",
      };
    case "prize_reveal":
      return {
        text: `와아~ 카드 확인했어! ${prize.label} 당첨됐네! 🎉`,
        mood: "excited",
      };
    case "bust_reveal":
      return isRetry
        ? {
            text:
              "두 번 연속 꽝이라니… 😢 그래도 잔맥 한 잔은 보장할게! 🍺 바 스태프에게 이 화면 보여주면 돼.",
            mood: "worried",
          }
        : {
            text:
              "아쉽다… 이번엔 꽝이야 😢 SNS 포스팅을 스태프에게 보여주면 카드 한 장 더 받을 수 있어!",
            mood: "worried",
          };
    case "bust_retry_input":
      return {
        text: "새 카드 받았어? 번호 입력해줘~ 이번엔 당첨이길!",
        mood: "cheer",
      };
    case "choice":
      return {
        text: `${prize.label} 어떻게 받을래? 선택해줘~`,
        mood: "cheer",
      };
    case "discount_result":
      return {
        text: "짜잔~ QR 코드야! 바 스탭에게 보여줘! 😎",
        mood: "proud",
      };
    case "ton_result":
      return {
        text: `🎉 ${prize.label} 전송 완료! TON을 스테이킹하면 보상이 자동으로 쌓여~ 한번 해볼래?`,
        mood: "celebrate",
      };
    case "done":
      return { text: "나중에 toki.tokamak.network에서 또 만나~ 👋", mood: "wink" };
  }
}

// ─── Exchange list (real TOKAMAK trading pages) ──────────────────────────────

const EXCHANGES = [
  { name: "Upbit",   url: "https://www.upbit.com/exchange?code=CRIX.UPBIT.KRW-TOKAMAK", domain: "upbit.com",     color: "#093687" },
  { name: "Bithumb", url: "https://www.bithumb.com/react/trade/order/TOKAMAK-KRW",      domain: "bithumb.com",   color: "#f28a00" },
  { name: "Coinone", url: "https://coinone.co.kr/exchange/trade/tokamak/krw",           domain: "coinone.co.kr", color: "#0060b8" },
  { name: "GOPAX",   url: "https://www.gopax.co.kr/exchange/tokamak-krw",               domain: "gopax.co.kr",   color: "#00a3ff" },
];

// ─── Tier visual presets ──────────────────────────────────────────────────────

const TIER_VISUAL: Record<
  PrizeTier,
  {
    emoji: string;
    tag: string;
    gradient: string;
    border: string;
    glow: string;
    emojiGlow: string;
    confettiPalette: string[];
  }
> = {
  bust: {
    emoji: "🌸",
    tag: "꽝",
    gradient: "linear-gradient(90deg,#94a3b8,#cbd5e1,#94a3b8)",
    border: "rgba(148,163,184,0.35)",
    glow: "0 0 24px rgba(148,163,184,0.18), inset 0 1px 0 rgba(255,255,255,0.55)",
    emojiGlow: "drop-shadow(0 0 6px rgba(148,163,184,0.4))",
    confettiPalette: [],
  },
  basic: {
    emoji: "🎊",
    tag: "🎊 당첨!",
    gradient: "linear-gradient(90deg,#ec4899,#fb7185,#ec4899)",
    border: "rgba(244,114,182,0.4)",
    glow:
      "0 0 36px rgba(244,114,182,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
    emojiGlow: "drop-shadow(0 0 10px rgba(244,114,182,0.55))",
    confettiPalette: ["#f9a8d4", "#fbcfe8", "#f472b6", "#fda4af", "#ffffff", "#fce7f3"],
  },
  normal: {
    emoji: "🎁",
    tag: "🎁 당첨! 축하해~",
    gradient: "linear-gradient(90deg,#ec4899,#d946ef,#a855f7)",
    border: "rgba(217,70,239,0.5)",
    glow:
      "0 0 44px rgba(217,70,239,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
    emojiGlow: "drop-shadow(0 0 12px rgba(217,70,239,0.65))",
    confettiPalette: ["#e879f9", "#d946ef", "#f472b6", "#a855f7", "#ffffff", "#fbcfe8"],
  },
  lucky: {
    emoji: "🌟",
    tag: "🌟 LUCKY · 행운 당첨!",
    gradient: "linear-gradient(90deg,#a855f7,#d946ef,#ec4899,#fb923c)",
    border: "rgba(168,85,247,0.5)",
    glow:
      "0 0 50px rgba(168,85,247,0.32), inset 0 1px 0 rgba(255,255,255,0.7)",
    emojiGlow: "drop-shadow(0 0 14px rgba(168,85,247,0.7))",
    confettiPalette: ["#a855f7", "#d946ef", "#f472b6", "#fbbf24", "#fda4af", "#ffffff"],
  },
  jackpot: {
    emoji: "👑",
    tag: "🏆 JACKPOT · 대박 당첨!",
    gradient: "linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)",
    border: "rgba(245,158,11,0.5)",
    glow:
      "0 0 50px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.7)",
    emojiGlow: "drop-shadow(0 0 14px rgba(245,158,11,0.8))",
    confettiPalette: ["#f59e0b", "#fbbf24", "#fcd34d", "#f9a8d4", "#ffffff", "#f97316"],
  },
};

// ─── Confetti particles (prize reveal) ────────────────────────────────────────

const STAR_CLIP =
  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";

function Confetti({ tier }: { tier: PrizeTier }) {
  const { confettiPalette: colors } = TIER_VISUAL[tier];

  const COUNT = 36;
  const particles = Array.from({ length: COUNT }, (_, i) => {
    const kind = i % 4; // 0,1,2 = star, 3 = dot  (3/4 stars, 1/4 dots)
    const isStar = kind !== 3;
    return {
      color: colors[i % colors.length],
      left: `${2 + (i * 13) % 96}%`,
      delay: `${((i * 0.07) % 1.8).toFixed(2)}s`,
      size: isStar ? (i % 3 === 0 ? 11 : i % 3 === 1 ? 9 : 7) : 4,
      duration: `${1.7 + (i % 5) * 0.25}s`,
      isStar,
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isStar ? undefined : "50%",
            clipPath: p.isStar ? STAR_CLIP : undefined,
            filter: p.isStar ? `drop-shadow(0 0 3px ${p.color})` : undefined,
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationFillMode: "forwards",
          }}
        />
      ))}
    </div>
  );
}

// ─── Panel components ────────────────────────────────────────────────────────

function useTokamakKrwPrice() {
  const [krw, setKrw] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/price/tokamak")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.krw === "number") setKrw(d.krw);
      })
      .catch(() => {
        /* ignore — keep KRW hidden on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return krw;
}

function PrizeRevealPanel({ prize, tier }: { prize: (typeof PRIZE_TIERS)[PrizeTier]; tier: PrizeTier }) {
  const v = TIER_VISUAL[tier];
  const krwPrice = useTokamakKrwPrice();
  const krwValue = krwPrice !== null ? Math.round(prize.amount * krwPrice) : null;

  const isPremium = tier === "lucky" || tier === "jackpot";
  const bg =
    tier === "jackpot"
      ? "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(254,243,199,0.55) 50%, rgba(252,231,243,0.5) 100%)"
      : tier === "lucky"
      ? "linear-gradient(160deg, rgba(255,255,255,0.88) 0%, rgba(243,232,255,0.5) 50%, rgba(252,231,243,0.55) 100%)"
      : tier === "normal"
      ? "linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(250,232,255,0.5) 50%, rgba(252,231,243,0.6) 100%)"
      : "linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(252,231,243,0.55) 60%, rgba(255,228,236,0.55) 100%)";

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div
        className="relative rounded-3xl p-6 overflow-hidden border"
        style={{
          background: bg,
          borderColor: v.border,
          boxShadow: v.glow,
        }}
      >
        <Confetti tier={tier} />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <div
            className="text-6xl"
            style={{
              filter: v.emojiGlow,
              animation: "float 2.5s ease-in-out infinite",
            }}
          >
            {v.emoji}
          </div>
          <p className="text-[11px] font-bold text-pink-700/70 tracking-[0.25em] uppercase">{v.tag}</p>
          <p
            className="text-5xl sm:text-6xl font-black tracking-tight"
            style={{
              background: v.gradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: isPremium
                ? "drop-shadow(0 2px 8px rgba(168,85,247,0.35))"
                : "drop-shadow(0 2px 8px rgba(244,114,182,0.3))",
            }}
          >
            {prize.label}
          </p>
          {krwValue !== null && (
            <p className="text-sm font-bold text-pink-900/70 tracking-tight">
              ≈ {krwValue.toLocaleString("ko-KR")}원
              <span className="text-[10px] text-pink-900/40 font-medium ml-1.5">(실시간, 업비트 기준)</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HashtagBlock() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_HASHTAG);
      setCopied(true);
      trackEvent("lottery_hashtag_copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard API unavailable — stay idle */
    }
  };
  return (
    <div
      className="rounded-2xl p-3.5 border relative"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(252,231,243,0.6) 100%)",
        borderColor: "rgba(244,114,182,0.4)",
        boxShadow: "0 4px 16px rgba(244,114,182,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      <p className="text-[10px] font-bold text-pink-500 tracking-[0.15em] uppercase mb-1.5">Copy &amp; Post</p>
      <div className="flex items-center gap-2">
        <p className="flex-1 font-mono text-sm sm:text-base font-bold text-pink-950 break-all select-all">
          {PROMO_HASHTAG}
        </p>
        <button
          onClick={copy}
          className="shrink-0 px-3 py-2 rounded-xl font-bold text-xs text-white transition-all hover:scale-[1.04] active:scale-95"
          style={{
            background: copied
              ? "linear-gradient(135deg,#10b981,#34d399)"
              : "linear-gradient(135deg,#ec4899,#a855f7)",
            boxShadow: copied
              ? "0 4px 14px rgba(16,185,129,0.35)"
              : "0 4px 14px rgba(236,72,153,0.3)",
          }}
        >
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}

function PromoPanel() {
  const [apr, setApr] = useState<number | null>(null);
  useEffect(() => {
    fetchStakingData()
      .then((d) => setApr(d.apr))
      .catch(() => setApr(null));
  }, []);

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div
        className="rounded-3xl p-5 sm:p-6 border space-y-5"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(252,231,243,0.58) 100%)",
          borderColor: "rgba(244,114,182,0.3)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(244,114,182,0.12), inset 0 1px 0 rgba(255,255,255,0.65)",
        }}
      >
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-pink-500 tracking-[0.2em] uppercase">Tokamak Network</p>
          <p className="text-xl font-black text-pink-950 leading-tight">
            이더리움 위의 검증된
            <br />
            블록체인 프로젝트
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { big: "8", unit: "년+", desc: "지속 개발\n(2017~)" },
            { big: "66", unit: "+", desc: "생태계\n프로젝트" },
            { big: apr !== null ? `~${apr.toFixed(1)}` : "·", unit: "%", desc: "스테이킹\nAPR" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl px-2 py-2.5 text-center border"
              style={{ background: "rgba(255,255,255,0.55)", borderColor: "rgba(244,114,182,0.2)" }}
            >
              <p className="text-lg font-black text-pink-600 leading-none">
                {s.big}
                <span className="text-xs text-pink-400 font-bold">{s.unit}</span>
              </p>
              <p className="text-[10px] text-pink-900/55 font-semibold mt-1 leading-tight whitespace-pre-line">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-pink-900/70 text-center">
            국내 4대 거래소에서 TON 시세 보기
          </p>
          <div className="grid grid-cols-4 gap-2">
            {EXCHANGES.map((ex) => (
              <a
                key={ex.name}
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all hover:scale-[1.05] hover:-translate-y-0.5 active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  borderColor: "rgba(244,114,182,0.22)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border"
                  style={{ borderColor: `${ex.color}33`, boxShadow: `0 2px 8px ${ex.color}22` }}
                >
                  <ExchangeIcon domain={ex.domain} name={ex.name} color={ex.color} />
                </div>
                <span className="text-[10px] text-pink-900/70 font-semibold group-hover:text-pink-700">
                  {ex.name}
                </span>
                <svg className="w-2.5 h-2.5 text-pink-400/60 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-pink-900/50 text-center leading-relaxed">
          실체 있는 프로젝트만 상장 심사를 통과해.
          <br />
          스테이킹 · DeFi · AI · 게임 — 토카막 생태계는 계속 자라고 있어~
        </p>
      </div>
    </div>
  );
}

function ExchangeIcon({ domain, name, color }: { domain: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{ color, fontWeight: 900, fontSize: 14 }}>{name[0]}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={name}
      className="w-7 h-7 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function BustPanel({ isRetry }: { isRetry: boolean }) {
  return (
    <div className="w-full max-w-md animate-fade-in-up space-y-4">
      {/* Main bust card */}
      <div
        className="relative rounded-3xl p-6 overflow-hidden border"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(241,245,249,0.55) 60%, rgba(252,231,243,0.4) 100%)",
          borderColor: "rgba(148,163,184,0.35)",
          boxShadow: "0 0 24px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="text-5xl opacity-80"
            style={{
              filter: "drop-shadow(0 0 6px rgba(148,163,184,0.45))",
              animation: "float 3.5s ease-in-out infinite",
            }}
          >
            🌸
          </div>
          <p className="text-[11px] font-bold text-slate-500 tracking-[0.25em] uppercase">Better Luck Next Time</p>
          <p className="text-4xl font-black tracking-tight text-slate-500">꽝</p>
          <p className="text-xs text-slate-600/80 font-semibold leading-relaxed max-w-[280px]">
            {isRetry ? (
              <>
                두 번 연속 꽝이라니… 😢
                <br />
                대신 <span className="text-amber-600 font-black">잔맥 한 잔</span>은 보장할게!
              </>
            ) : (
              <>
                아쉽지만 이번 카드는 꽝이야…
                <br />
                하지만 빈손으로는 안 보내!
              </>
            )}
          </p>
        </div>
      </div>

      {/* First bust → Share & Win section (hashtag + staff flow) */}
      {!isRetry && (
        <div
          className="rounded-2xl p-4 border space-y-3"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(252,231,243,0.55) 100%)",
            borderColor: "rgba(244,114,182,0.35)",
            boxShadow: "0 4px 20px rgba(244,114,182,0.12)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                 style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)", boxShadow: "0 3px 10px rgba(236,72,153,0.3)" }}>
              🎁
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-black text-pink-500 tracking-[0.2em] uppercase">Share &amp; Win</p>
              <p className="text-sm font-black text-pink-950 leading-tight whitespace-nowrap">카드 한 장 더 받는 법</p>
            </div>
            <div className="flex-1 flex justify-center">
              <span
                className="text-xs font-black text-amber-700 whitespace-nowrap px-2.5 py-1 rounded-full border"
                style={{
                  background: "linear-gradient(135deg, rgba(254,243,199,0.95), rgba(255,237,213,0.85))",
                  borderColor: "rgba(245,158,11,0.5)",
                  boxShadow: "0 1px 4px rgba(245,158,11,0.15)",
                }}
              >
                또 꽝이어도 🍺 보장
              </span>
            </div>
          </div>

          <ol className="space-y-2 text-xs text-pink-900/80 font-medium leading-snug">
            <li className="flex gap-2">
              <span className="text-pink-500 font-black shrink-0">1.</span>
              <span>복사한 해시태그로 SNS에 포스팅</span>
            </li>
            <li className="flex gap-2">
              <span className="text-pink-500 font-black shrink-0">2.</span>
              <span>포스팅 화면을 보여주기</span>
            </li>
            <li className="flex gap-2">
              <span className="text-pink-500 font-black shrink-0">3.</span>
              <span>확인 후 새 카드 한 장 지급 받기</span>
            </li>
          </ol>

          <HashtagBlock />
        </div>
      )}

      {/* Retry bust → Consolation beer banner only */}
      {isRetry && (
        <div
          className="rounded-2xl p-4 border flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(254,243,199,0.78) 0%, rgba(255,237,213,0.65) 100%)",
            borderColor: "rgba(245,158,11,0.5)",
            boxShadow: "0 4px 22px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
            style={{
              background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
              boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
            }}
          >
            🍺
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-700 tracking-[0.2em] uppercase">참여 감사상</p>
            <p className="text-base font-black text-pink-950">잔맥 한 잔 보장!</p>
            <p className="text-[11px] text-amber-800/80 font-semibold mt-0.5">바 스태프에게 이 화면을 보여주세요</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BustRetryInputPanel({ onSubmit, loading }: { onSubmit: (cardNumber: string) => void; loading: boolean }) {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div
        className="rounded-3xl p-5 sm:p-6 border space-y-4"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(252,231,243,0.55) 100%)",
          borderColor: "rgba(244,114,182,0.35)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(244,114,182,0.14), inset 0 1px 0 rgba(255,255,255,0.65)",
        }}
      >
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-pink-500 tracking-[0.2em] uppercase">Second Chance</p>
          <p className="text-lg font-black text-pink-950 leading-tight">새 카드 번호 입력</p>
          <p className="text-xs text-pink-900/60 font-medium">
            바에서 받은 새 카드의 번호를 입력해주세요
          </p>
        </div>
        <CardNumberInput onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
}

function ChoicePanel({
  prize,
  loading,
  onChoose,
}: {
  prize: (typeof PRIZE_TIERS)[PrizeTier];
  loading: boolean;
  onChoose: (choice: "discount" | "ton") => void;
}) {
  return (
    <div className="w-full max-w-md animate-fade-in-up space-y-3">
      <button
        onClick={() => onChoose("discount")}
        disabled={loading}
        className="group w-full p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(254,243,199,0.5) 100%)",
          border: "1px solid rgba(245,158,11,0.35)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300/50 flex items-center justify-center text-2xl shrink-0">
            🍺
          </div>
          <div className="flex-1">
            <p className="font-black text-pink-950 text-sm leading-snug">바에서 할인 받기</p>
            <p className="text-[11px] text-pink-900/55 mt-0.5 leading-relaxed">
              오늘 이 바에서 {prize.label} 가치만큼 할인
            </p>
          </div>
          <span className="text-amber-500 font-bold text-xl">›</span>
        </div>
      </button>
      <button
        onClick={() => onChoose("ton")}
        disabled
        aria-disabled="true"
        className="group w-full p-4 rounded-2xl text-left transition-all duration-200 cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, rgba(248,250,252,0.7) 0%, rgba(241,245,249,0.5) 100%)",
          border: "1px dashed rgba(148,163,184,0.45)",
          backdropFilter: "blur(12px)",
          opacity: 0.7,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300/50 flex items-center justify-center text-2xl shrink-0 grayscale">
            💎
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-500 text-sm leading-snug">내 지갑으로 받기</p>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-slate-200 text-slate-600">
                준비 중
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {prize.label}을 내 지갑으로 전송 (곧 오픈)
            </p>
          </div>
          <span className="text-slate-400 font-bold text-xl">·</span>
        </div>
      </button>
    </div>
  );
}

function DiscountResultPanel({
  qrData,
  prize,
  cardNumber,
}: {
  qrData: string;
  prize: (typeof PRIZE_TIERS)[PrizeTier];
  cardNumber: string;
}) {
  const now = new Date();
  const expiry = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 23:59까지`;

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div
        className="rounded-3xl overflow-hidden border"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(254,243,199,0.45) 100%)",
          borderColor: "rgba(245,158,11,0.35)",
          boxShadow: "0 0 28px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl p-3 shadow-lg">
            <QRCodeSVG value={qrData} size={160} level="M" includeMargin={false} />
          </div>
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-pink-200/40">
              <span className="text-pink-900/60 font-semibold">할인 금액</span>
              <span className="text-amber-600 font-black text-base">{prize.label}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-pink-200/40">
              <span className="text-pink-900/60 font-semibold">카드 번호</span>
              <span className="font-mono text-pink-950/80">{cardNumber}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-pink-900/60 font-semibold">유효기간</span>
              <span className="text-pink-950/80">{expiry}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TonResultPanel({
  address,
  hash,
  prize,
}: {
  address: string | null | undefined;
  hash: string | null | undefined;
  prize: (typeof PRIZE_TIERS)[PrizeTier];
}) {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div
        className="rounded-3xl overflow-hidden border"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(209,250,229,0.5) 100%)",
          borderColor: "rgba(16,185,129,0.4)",
          boxShadow: "0 0 30px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xl font-black text-emerald-600"
              style={{ boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}
            >
              ✓
            </div>
            <div>
              <p className="text-[11px] text-emerald-600/80 font-bold tracking-wider uppercase">전송 완료</p>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">{prize.label}</p>
            </div>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-emerald-400/40 via-emerald-300/20 to-transparent" />
          <div className="space-y-2.5 text-xs">
            {address && (
              <div>
                <span className="text-pink-900/50 font-semibold">내 지갑 주소</span>
                <p className="font-mono text-pink-950/80 mt-0.5 break-all text-[11px] leading-relaxed">{address}</p>
              </div>
            )}
            {hash && (
              <div>
                <span className="text-pink-900/50 font-semibold">트랜잭션 해시</span>
                <p className="font-mono text-pink-950/80 mt-0.5 break-all text-[11px] leading-relaxed">{hash}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main flow ────────────────────────────────────────────────────────────────

export default function LotteryVNFlow({
  cardNumber,
  tier,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prizeAmount,
  onChooseReward,
  txHash,
  walletAddress,
  loading = false,
  isRetry = false,
}: LotteryVNFlowProps) {
  const prize = PRIZE_TIERS[tier];
  const { user } = usePrivy();

  // On retry (2nd card after a bust) skip the Tokamak promo and jump
  // straight to the result — user has already seen the intro.
  const initialPhase: Phase = isRetry
    ? tier === "bust"
      ? "bust_reveal"
      : "prize_reveal"
    : "promo";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [resultData, setResultData] = useState<{
    txHash?: string | null;
    showMission?: boolean;
    choice?: "discount" | "ton";
  }>({});

  const addr = user?.wallet?.address ?? walletAddress ?? null;
  const { text: dialogueText, mood } = getPhaseData(phase, prize, isRetry);
  const { displayed, done, skip } = useTypewriter(dialogueText);

  // ─── Analytics: fire GA4 event on every phase transition ────────────────
  useEffect(() => {
    trackEvent("lottery_step", { step: phase, tier });
  }, [phase, tier]);

  const handleChoice = useCallback(
    async (choice: "discount" | "ton") => {
      if (choiceLoading) return;
      trackEvent("lottery_choice", { choice, tier });
      setChoiceLoading(true);
      try {
        const result = await onChooseReward(choice);
        setResultData({ ...result, choice });
        setPhase(choice === "discount" ? "discount_result" : "ton_result");
        trackEvent("lottery_complete", { choice, tier, show_mission: !!result?.showMission });
      } catch {
        trackEvent("lottery_choice_error", { choice, tier });
        // error surfaces via `loading`/`error` props upstream; stay in choice phase
      } finally {
        setChoiceLoading(false);
      }
    },
    [choiceLoading, onChooseReward, tier],
  );

  const qrData =
    typeof window !== "undefined"
      ? `${window.location.origin}/lottery/redeem?card=${encodeURIComponent(cardNumber)}`
      : "";

  // ─── Render content panel per phase ────────────────────────────────────────
  const panel = (() => {
    switch (phase) {
      case "promo":
        return <PromoPanel />;
      case "prize_reveal":
        return <PrizeRevealPanel prize={prize} tier={tier} />;
      case "bust_reveal":
        return <BustPanel isRetry={isRetry} />;
      case "bust_retry_input":
        return (
          <BustRetryInputPanel
            loading={retryLoading}
            onSubmit={(newCard) => {
              setRetryLoading(true);
              trackEvent("lottery_bust_retry_submit", { from: cardNumber });
              // Hard navigation: router.push would keep the old useLottery
              // state (cardNumber, tier, step) in memory and never re-run
              // claimCard, leaving the page stuck. A full page load rebuilds
              // the state machine from scratch for the new card.
              window.location.href = `/lottery/claim?code=${encodeURIComponent(newCard)}&retry=1`;
            }}
          />
        );
      case "choice":
        return <ChoicePanel prize={prize} loading={choiceLoading} onChoose={handleChoice} />;
      case "discount_result":
        return <DiscountResultPanel qrData={qrData} prize={prize} cardNumber={cardNumber} />;
      case "ton_result":
        return <TonResultPanel address={addr} hash={resultData.txHash ?? txHash} prize={prize} />;
      case "done":
        return null;
    }
  })();

  // ─── Render action button per phase ────────────────────────────────────────
  const action = (() => {
    switch (phase) {
      case "promo":
        return (
          <button
            onClick={() => setPhase(tier === "bust" ? "bust_reveal" : "prize_reveal")}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)",
            }}
          >
            결과 보러 가기 →
          </button>
        );

      case "prize_reveal":
        return (
          <button
            onClick={() => setPhase("choice")}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)",
            }}
          >
            당첨금 선택하러 가기 →
          </button>
        );

      case "bust_reveal":
        if (isRetry) return null;
        return (
          <button
            onClick={() => setPhase("bust_retry_input")}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)",
            }}
          >
            새 카드 받으셨나요? 번호 입력 →
          </button>
        );

      case "ton_result":
        return resultData.showMission ? (
          <a
            href="/mission"
            className="block w-full py-3.5 rounded-2xl font-bold text-base text-center text-gray-900 hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}
          >
            🎁 미션 완료하면 카드 한 장 더!
          </a>
        ) : (
          <a
            href="/staking"
            className="block w-full py-3.5 rounded-2xl font-bold text-base text-center text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              boxShadow: "0 4px 20px rgba(236,72,153,0.3)",
            }}
          >
            스테이킹하러 가기 →
          </a>
        );

      default:
        return null;
    }
  })();

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
        }}
      />
      <Image
        src="/backgrounds/lottery-chat.png"
        alt=""
        fill
        className="object-cover opacity-25 -z-10"
        priority
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(255,255,255,0.5) 100%)" }}
      />

      {/* Floating orbs */}
      <div
        className="absolute top-[6%] left-[8%] w-72 h-72 rounded-full blur-[90px] -z-10 animate-orb-float-1"
        style={{ background: "rgba(251,207,232,0.45)" }}
      />
      <div
        className="absolute top-[40%] right-[4%] w-80 h-80 rounded-full blur-[100px] -z-10 animate-orb-float-2"
        style={{ background: "rgba(249,168,212,0.32)" }}
      />
      <div
        className="absolute bottom-[10%] left-[35%] w-64 h-64 rounded-full blur-[80px] -z-10 animate-orb-float-3"
        style={{ background: "rgba(196,181,253,0.28)" }}
      />

      {/* Header */}
      <header
        className="relative z-10 px-5 pt-4 pb-3 flex items-center gap-3 backdrop-blur-md shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(252,231,243,0.45) 100%)",
          borderBottom: "1px solid rgba(244,114,182,0.18)",
        }}
      >
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full overflow-hidden"
            style={{ boxShadow: "0 0 0 2px rgba(244,114,182,0.45), 0 0 16px rgba(244,114,182,0.2)" }}
          >
            <Image
              src="/characters/toki-welcome.png"
              alt="Toki"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold tracking-wide text-pink-950">토키</p>
          <p className="text-[11px] font-medium text-emerald-500">온라인</p>
        </div>
        <div className="text-[11px] px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-700 font-semibold font-mono">
          {cardNumber}
        </div>
      </header>

      {/* Scene — content panel centered */}
      <section className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0">
        <div className="w-full flex justify-center">{panel}</div>
      </section>

      {/* Bottom: action button + dialogue box */}
      <div className="relative z-20 shrink-0">
        {action && <div className="px-4 sm:px-6 pb-2 max-w-xl mx-auto">{action}</div>}
        {loading && !action && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-pink-500 animate-pulse">처리 중...</span>
          </div>
        )}

        <div
          className="backdrop-blur-xl border-t border-pink-300/40 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(252,231,243,0.75) 100%)" }}
          onClick={() => !done && skip()}
        >
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/40">
                <span className="text-pink-700 font-bold text-sm tracking-wide">토키</span>
                <span className="text-xs text-pink-500/70">{mood}</span>
              </div>
              {!done && <span className="text-[10px] text-pink-400/70 ml-auto">탭하여 빠르게 보기 ›</span>}
            </div>
            <p className="text-pink-950 text-sm sm:text-base leading-relaxed min-h-[3.2em]">
              {displayed}
              {!done && (
                <span className="inline-block w-0.5 h-4 bg-pink-500 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

