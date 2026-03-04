"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { StakingData } from "@/lib/staking";

interface StakingPreviewClientProps {
  data: StakingData | null;
}


/* ─── Variant A: Revenue Simulator ───────────────────────────────────────── */

function SimulatorVariant({ data, show }: { data: StakingData; show: boolean }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(1_000_000);
  const apr = data.apr / 100;

  const earn1m = Math.round(amount * apr / 12);
  const earn6m = Math.round(amount * apr / 2);
  const earn1y = Math.round(amount * apr);

  const reaction =
    amount < 500_000 ? t.statsCard.simReaction1 :
    amount < 3_000_000 ? t.statsCard.simReaction2 :
    t.statsCard.simReaction3;

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="relative rounded-2xl border border-accent-cyan/20 bg-gradient-to-br from-cyan-500/5 via-[var(--background)] to-blue-500/5 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-blue">
            {t.statsCard.simTitle}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t.statsCard.simSubtitle}</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Toki */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-2xl" />
                <Image src="/toki-proud.png" alt="Toki" width={120} height={120} className="relative z-10 drop-shadow-[0_0_20px_rgba(34,211,238,0.25)]" />
              </div>
              <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-3 max-w-[200px]">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/40 border-l border-t border-white/10 rotate-45" />
                <p className="text-xs text-gray-300 text-center leading-relaxed">{reaction}</p>
              </div>
            </div>

            {/* Slider + results */}
            <div className="flex-1 w-full space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">{t.statsCard.simInvest}</span>
                  <span className="text-lg font-bold text-white font-mono-num">{fmt(amount)} KRW</span>
                </div>
                <input
                  type="range"
                  min={100_000} max={10_000_000} step={100_000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-accent-cyan"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100K</span><span>10M</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t.statsCard.sim1m, val: earn1m, color: "text-accent-cyan" },
                  { label: t.statsCard.sim6m, val: earn6m, color: "text-accent-blue" },
                  { label: t.statsCard.sim1y, val: earn1y, color: "text-accent-amber" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className={`text-xl font-bold font-mono-num ${item.color}`}>
                      +{fmt(item.val)}
                    </div>
                    <div className="text-[10px] text-gray-500">KRW</div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-500">{t.statsCard.simDisclaimer.replace("{apr}", data.apr.toFixed(1))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Variant B: Bank vs Toki ────────────────────────────────────────────── */

function BankVsVariant({ data, show }: { data: StakingData; show: boolean }) {
  const { t } = useTranslation();
  const bankRate = 0.035;
  const tokiRate = data.apr / 100;
  const amount = 1_000_000;
  const bankEarn = Math.round(amount * bankRate);
  const tokiEarn = Math.round(amount * tokiRate);
  const multiplier = (tokiRate / bankRate).toFixed(0);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (show) setTimeout(() => setAnimated(true), 300);
  }, [show]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="relative rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/5 via-[var(--background)] to-blue-500/5 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
            {t.statsCard.vsTitle}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t.statsCard.vsSubtitle}</p>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-center text-sm text-gray-400 mb-6">
            {t.statsCard.vsIfYouPut.replace("{amount}", "1,000,000 KRW")}
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Bank */}
            <div className="flex-1 p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center">
                <div className="text-3xl mb-2">🏦</div>
                <div className="text-sm font-semibold text-gray-300">{t.statsCard.vsBank}</div>
                <div className="text-xs text-gray-500 mb-4">{t.statsCard.vsBankRate}</div>
                <div className="h-2 rounded-full bg-white/10 mb-2 overflow-hidden">
                  <div className={`h-full rounded-full bg-gray-500 transition-all duration-1000 ease-out`}
                    style={{ width: animated ? `${(bankRate / tokiRate) * 100}%` : "0%" }} />
                </div>
                <div className="text-2xl font-bold text-gray-400 font-mono-num">+{fmt(bankEarn)}</div>
                <div className="text-xs text-gray-500">KRW</div>
              </div>
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-black">
                VS
              </div>
            </div>

            {/* Toki */}
            <div className="flex-1 p-5 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 ring-1 ring-accent-cyan/10">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-accent-cyan">{t.statsCard.vsToki}</div>
                <div className="text-xs text-gray-500 mb-4">{t.statsCard.vsTokiRate.replace("{apr}", data.apr.toFixed(1))}</div>
                <div className="h-2 rounded-full bg-white/10 mb-2 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-1000 ease-out delay-200`}
                    style={{ width: animated ? "100%" : "0%" }} />
                </div>
                <div className="text-2xl font-bold text-accent-cyan font-mono-num">+{fmt(tokiEarn)}</div>
                <div className="text-xs text-gray-500">KRW</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-bold">
              {t.statsCard.vsResult.replace("{x}", multiplier)}
            </span>
          </div>

          {/* Toki */}
          <div className="flex items-center gap-3 mt-6">
            <Image src="/toki-proud.png" alt="Toki" width={48} height={48} className="drop-shadow-lg" />
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 px-3 py-2">
              <p className="text-xs text-gray-300">{t.statsCard.vsTokiReaction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Variant C: Live Counter ────────────────────────────────────────────── */

function LiveCounterVariant({ data, show }: { data: StakingData; show: boolean }) {
  const { t } = useTranslation();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const perBlock = data.seigPerBlockRaw;

  useEffect(() => {
    if (!show) return;
    // Simulate accumulating rewards and block timer
    const base = data.totalStakedRaw * 0.001; // fake starting total rewards
    setTotalRewards(base);

    const interval = setInterval(() => {
      setSecondsAgo((s) => {
        if (s >= 12) {
          setTotalRewards((prev) => prev + perBlock);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="relative rounded-2xl border border-green-400/20 bg-gradient-to-br from-green-500/5 via-[var(--background)] to-cyan-500/5 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
            {t.statsCard.liveTitle}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t.statsCard.liveSubtitle}</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Main counter */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">{t.statsCard.liveTotalRewards}</div>
            <div className="text-4xl sm:text-5xl font-black font-mono-num text-green-400 tabular-nums">
              {fmt(totalRewards)} <span className="text-2xl text-green-400/60">TON</span>
            </div>
          </div>

          {/* Timer + per block */}
          <div className="flex justify-center gap-6">
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
              <div className="text-xs text-gray-500 mb-1">{t.statsCard.liveLastReward}</div>
              <div className="text-xl font-bold font-mono-num text-white">
                {t.statsCard.liveSecondsAgo.replace("{s}", String(secondsAgo))}
              </div>
              {/* Progress to next block */}
              <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsAgo / 12) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
              <div className="text-xs text-gray-500 mb-1">{t.statsCard.livePerBlock}</div>
              <div className="text-xl font-bold font-mono-num text-accent-cyan">
                {data.seigPerBlock} <span className="text-xs text-gray-500">TON</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {data.operatorCount}+ {t.statsCard.liveStakers}
              </div>
            </div>
          </div>

          {/* Toki */}
          <div className="flex items-center gap-3">
            <Image src="/toki-proud.png" alt="Toki" width={48} height={48} className="drop-shadow-lg" />
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 px-3 py-2">
              <p className="text-xs text-gray-300">{t.statsCard.liveTokiReaction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Variant D: 3-Line Summary ──────────────────────────────────────────── */

function SummaryVariant({ data, show }: { data: StakingData; show: boolean }) {
  const { t } = useTranslation();

  const items = [
    { icon: "💰", title: t.statsCard.summaryApr.replace("{apr}", data.apr.toFixed(0)), desc: t.statsCard.summaryAprDesc, color: "text-amber-400", delay: 200 },
    { icon: "⏱", title: t.statsCard.summaryReward, desc: t.statsCard.summaryRewardDesc, color: "text-accent-cyan", delay: 400 },
    { icon: "🔒", title: t.statsCard.summarySafe, desc: t.statsCard.summarySafeDesc, color: "text-blue-400", delay: 600 },
    { icon: "🚀", title: t.statsCard.summaryEasy, desc: t.statsCard.summaryEasyDesc, color: "text-green-400", delay: 800 },
  ];

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 via-[var(--background)] to-purple-500/5 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-cyan">
            {t.statsCard.summaryTitle}
          </h2>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Toki */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent-blue/10 blur-2xl" />
                <Image src="/toki-proud.png" alt="Toki" width={120} height={120} className="relative z-10 drop-shadow-[0_0_20px_rgba(74,144,217,0.25)]" />
              </div>
              <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-3 max-w-[200px]">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/40 border-l border-t border-white/10 rotate-45" />
                <p className="text-xs text-gray-300 text-center leading-relaxed">{t.statsCard.summaryTokiReaction}</p>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 space-y-4 w-full">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 transition-all duration-500 ${
                    show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${item.delay}ms` }}
                >
                  <div className="text-2xl w-10 h-10 flex items-center justify-center">{item.icon}</div>
                  <div className="flex-1">
                    <div className={`text-base font-bold ${item.color}`}>{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VS Effect Sub-components ──────────────────────────────────────────── */

type VsStyle = "race" | "bars" | "timeline" | "gauge";

const VS_STYLE_LABELS: Record<VsStyle, string> = {
  race: "A: Counting Race",
  bars: "B: Vertical Bars",
  timeline: "C: Timeline Graph",
  gauge: "D: Gauge Meter",
};

/* --- A: Counting Race --- */
function VsCountingRace({
  tokiEarn, animated, exchangeLabel, exchangeDesc, tokiLabel, tokiDesc, aprStr, perYear,
}: {
  tokiEarn: number; animated: boolean;
  exchangeLabel: string; exchangeDesc: string; tokiLabel: string; tokiDesc: string; aprStr: string; perYear: string;
}) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const target = tokiEarn;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setDisplayVal(current);
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [animated, tokiEarn]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="flex gap-3">
      {/* Exchange */}
      <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">{exchangeLabel}</div>
          <div className="text-[10px] text-gray-600 mb-4">{exchangeDesc}</div>
          <div className="text-3xl font-black text-gray-600 font-mono-num py-4">0</div>
          <div className="text-[10px] text-gray-600">TON {perYear}</div>
        </div>
      </div>

      {/* VS */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs font-black">VS</div>
      </div>

      {/* Toki */}
      <div className="flex-1 p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 ring-1 ring-accent-cyan/10">
        <div className="text-center">
          <div className="text-xs text-accent-cyan font-semibold mb-1">{tokiLabel}</div>
          <div className="text-[10px] text-gray-500 mb-4">{tokiDesc.replace("{apr}", aprStr)}</div>
          <div className="text-3xl font-black text-accent-cyan font-mono-num py-4 tabular-nums">
            +{fmt(animated ? displayVal : 0)}
          </div>
          <div className="text-[10px] text-gray-500">TON {perYear}</div>
        </div>
      </div>
    </div>
  );
}

/* --- CSS Launch Pad --- */
function LaunchPad({ broken }: { broken?: boolean }) {
  const color = broken ? "rgba(107,114,128,0.4)" : "rgba(34,211,238,0.3)";
  const border = broken ? "rgba(107,114,128,0.3)" : "rgba(34,211,238,0.2)";
  return (
    <div className="relative w-full">
      {/* Platform top */}
      <div className="h-[6px] rounded-t-sm" style={{ background: color, borderTop: `1px solid ${border}` }} />
      {/* Support legs */}
      <div className="flex justify-between px-[15%]">
        <div className="w-[3px] h-3" style={{ background: color }} />
        <div className="w-[3px] h-3" style={{ background: color }} />
      </div>
      {/* Base */}
      <div className="h-[3px] rounded-b-sm mx-[10%]" style={{ background: color }} />
      {/* Ground glow for Toki side */}
      {!broken && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-accent-cyan/10 blur-md rounded-full" />
      )}
    </div>
  );
}

/* --- CSS Rocket (kept as fallback, not currently used) --- */
function _CssRocket({ broken, size = 44 }: { broken?: boolean; size?: number }) {
  const s = size;
  if (broken) {
    return (
      <div className="relative" style={{ width: s * 1.1, height: s * 1.3 }}>
        <div className="rotate-[20deg] origin-bottom-center" style={{ width: "100%", height: "100%" }}>
          {/* Body */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-t-full"
            style={{ width: s * 0.4, height: s * 0.8, background: "linear-gradient(to top, #4b5563, #6b7280, #9ca3af)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          {/* Nose */}
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ width: s * 0.28, height: s * 0.28, top: s * 0.08, background: "#6b7280" }}
          />
          {/* Cracks */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ width: 1.5, height: s * 0.35, top: s * 0.3, background: "rgba(0,0,0,0.5)", transform: "rotate(12deg)" }} />
          <div className="absolute" style={{ left: "38%", width: 1, height: s * 0.2, top: s * 0.45, background: "rgba(0,0,0,0.3)", transform: "rotate(-8deg)" }} />
          {/* Bent fin */}
          <div className="absolute bottom-0" style={{ left: s * 0.12, width: s * 0.14, height: s * 0.22, background: "#4b5563", borderRadius: "0 0 0 3px", transform: "skewX(18deg)" }} />
        </div>
        {/* Smoke puffs from broken rocket */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="absolute rounded-full bg-gray-500/30"
            style={{
              width: 5 + i * 4, height: 5 + i * 4,
              bottom: -2 - i * 2, left: `${30 + i * 10}%`,
              animation: `brokenSmoke ${1.5 + i * 0.3}s ease-out infinite`,
              animationDelay: `${i * 300}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: s, height: s * 1.6 }}>
      {/* Body */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[18%] rounded-t-full"
        style={{ width: s * 0.42, height: s * 0.8, background: "linear-gradient(135deg, #22d3ee, #4a90d9, #22d3ee)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 0 14px rgba(34,211,238,0.35)" }}
      />
      {/* Nose */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 rounded-full"
        style={{ width: s * 0.28, height: s * 0.28, background: "linear-gradient(to bottom, #60a5fa, #22d3ee)", boxShadow: "0 0 10px rgba(34,211,238,0.5)" }}
      />
      {/* Window */}
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: s * 0.16, height: s * 0.16, top: s * 0.3, background: "radial-gradient(circle at 30% 30%, #e0f2fe, #0ea5e9)", border: "1.5px solid rgba(255,255,255,0.5)" }}
      />
      {/* Fins */}
      <div className="absolute" style={{ left: s * 0.08, bottom: s * 0.12, width: s * 0.16, height: s * 0.26, background: "linear-gradient(to right, #4a90d9, #22d3ee)", borderRadius: "0 0 0 5px", transform: "skewX(-10deg)" }} />
      <div className="absolute" style={{ right: s * 0.08, bottom: s * 0.12, width: s * 0.16, height: s * 0.26, background: "linear-gradient(to left, #4a90d9, #22d3ee)", borderRadius: "0 0 5px 0", transform: "skewX(10deg)" }} />
      {/* Flame */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
        <div className="flex flex-col items-center" style={{ animation: "rocketFlame 0.25s ease-in-out infinite alternate" }}>
          <div className="rounded-b-full" style={{ width: s * 0.22, height: s * 0.22, background: "linear-gradient(to bottom, #fbbf24, #f59e0b, #ef4444, transparent)" }} />
          <div className="rounded-b-full -mt-1.5" style={{ width: s * 0.13, height: s * 0.18, background: "linear-gradient(to bottom, #fef3c7, #fbbf24, transparent)" }} />
        </div>
      </div>
    </div>
  );
}

/* --- B: Rocket Launch Pad + Coin Particles --- */
function VsVerticalBars({
  tokiEarn, animated, exchangeLabel, exchangeDesc, tokiLabel, tokiDesc, aprStr, perYear,
}: {
  tokiEarn: number; animated: boolean;
  exchangeLabel: string; exchangeDesc: string; tokiLabel: string; tokiDesc: string; aprStr: string; perYear: string;
}) {
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; type: "coin" | "sparkle"; drift: number; delay: number }[]>([]);
  const [exhaust, setExhaust] = useState<{ id: number; x: number; size: number }[]>([]);
  const nextId = useRef(0);
  const exhaustId = useRef(0);
  const launchHeight = 78; // percent from bottom where rocket ends up

  useEffect(() => {
    if (!animated) return;
    const coinInterval = setInterval(() => {
      setParticles((prev) => {
        const id = nextId.current++;
        const isCoin = id % 3 !== 2;
        return [...prev, {
          id, x: 5 + Math.random() * 90,
          size: isCoin ? (20 + Math.random() * 14) : (12 + Math.random() * 10),
          type: isCoin ? "coin" as const : "sparkle" as const,
          drift: -25 + Math.random() * 50, delay: Math.random() * 200,
        }].slice(-12);
      });
    }, 350);
    const exhaustInterval = setInterval(() => {
      setExhaust((prev) => [...prev, {
        id: exhaustId.current++,
        x: 35 + Math.random() * 30,
        size: 10 + Math.random() * 16,
      }].slice(-10));
    }, 200);
    return () => { clearInterval(coinInterval); clearInterval(exhaustInterval); };
  }, [animated]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="relative pt-16">
      <div className="flex gap-3 sm:gap-6 items-end justify-center">

        {/* ── Exchange side: broken rocket on pad ── */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
          <div className="text-xs text-gray-500">{exchangeLabel}</div>
          <div className="text-[10px] text-gray-600">{exchangeDesc}</div>
          <div className="relative w-full h-[240px]" style={{ overflow: "visible" }}>
            {/* Sky / background area */}
            <div className="absolute inset-0 rounded-xl bg-white/[0.02] border border-white/[0.06]" />

            {/* Launch pad at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-2">
              <LaunchPad broken />
            </div>

            {/* Toki with broken rocket */}
            <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2">
              <Image
                src="/toki-rocket-broken.png" alt="Broken rocket"
                width={100} height={100}
                className="drop-shadow-md" style={{ filter: "brightness(0.75) saturate(0.7)" }}
              />
            </div>

            {/* Zzz */}
            <div className="absolute top-[15%] right-[12%] text-gray-600/30 text-xs font-bold animate-pulse">
              z<span className="text-sm">z</span><span className="text-base">Z</span>
            </div>

            {/* Stars (dim) */}
            {[{ t: 8, l: 15 }, { t: 18, l: 72 }, { t: 30, l: 40 }].map((p, i) => (
              <div key={i} className="absolute w-1 h-1 rounded-full bg-gray-700" style={{ top: `${p.t}%`, left: `${p.l}%` }} />
            ))}
          </div>
          <div className="text-xl font-black text-gray-600 font-mono-num">+0</div>
          <div className="text-[10px] text-gray-600">TON {perYear}</div>
        </div>

        {/* ── VS ── */}
        <div className="pb-32 shrink-0">
          <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            VS
          </div>
        </div>

        {/* ── Toki side: rocket launching from pad ── */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px] relative">
          <div className="text-xs text-accent-cyan font-semibold">{tokiLabel}</div>
          <div className="text-[10px] text-gray-500">{tokiDesc.replace("{apr}", aprStr)}</div>
          <div className="relative w-full h-[240px]" style={{ overflow: "visible" }}>
            {/* Sky area with subtle gradient */}
            <div className="absolute inset-0 rounded-xl border border-accent-cyan/10"
              style={{ background: "linear-gradient(to top, rgba(34,211,238,0.03), transparent 60%)" }}
            />

            {/* Launch pad at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-2">
              <LaunchPad />
            </div>

            {/* Exhaust trail — from pad upward to rocket position */}
            <div
              className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[30%] rounded-t-full transition-all ease-out"
              style={{
                height: animated ? `${launchHeight - 5}%` : "0%",
                transitionDuration: "1.6s",
                background: "linear-gradient(to top, rgba(251,191,36,0.25), rgba(249,115,22,0.15), rgba(34,211,238,0.05), transparent)",
              }}
            />
            {/* Exhaust center glow */}
            <div
              className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[14%] rounded-t-full transition-all ease-out"
              style={{
                height: animated ? `${launchHeight - 10}%` : "0%",
                transitionDuration: "1.6s",
                transitionDelay: "0.1s",
                background: "linear-gradient(to top, rgba(251,191,36,0.4), rgba(251,191,36,0.1), transparent)",
                boxShadow: "0 0 20px rgba(251,191,36,0.15)",
              }}
            />

            {/* Pad explosion smoke on launch */}
            {animated && exhaust.map((e) => (
              <div
                key={e.id}
                className="absolute pointer-events-none rounded-full"
                style={{
                  left: `${e.x}%`, bottom: "3%",
                  width: e.size, height: e.size,
                  background: "radial-gradient(circle, rgba(251,191,36,0.25), rgba(156,163,175,0.15), transparent)",
                  animation: "padSmoke 2s ease-out forwards",
                }}
              />
            ))}

            {/* Toki on rocket launching upward */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-20 transition-all ease-out pointer-events-none"
              style={{
                bottom: animated ? `${launchHeight}%` : "6%",
                transitionDuration: "1.6s",
                transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.3, 1)",
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 -m-4 rounded-full bg-accent-cyan/20 blur-xl" />
                <Image
                  src="/toki-rocket.png" alt="Toki on rocket"
                  width={100} height={100}
                  className="relative drop-shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                />
              </div>
            </div>

            {/* Coin particles from rocket area */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${p.x}%`,
                  bottom: `${launchHeight - 8}%`,
                  animation: `comboFloatUp 2.2s ease-out ${p.delay}ms forwards`,
                  transform: `translateX(${p.drift}px)`,
                }}
              >
                {p.type === "coin" ? (
                  <div className="drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                    style={{ width: p.size, height: p.size }}>
                    <Image src="/toki-logo.png" alt="TON" width={p.size} height={p.size} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="text-accent-cyan font-black"
                    style={{ fontSize: p.size, textShadow: "0 0 8px rgba(34,211,238,0.8)" }}>✦</div>
                )}
              </div>
            ))}

            {/* Stars (bright) */}
            {[{ t: 5, l: 20 }, { t: 12, l: 75 }, { t: 22, l: 45 }, { t: 8, l: 55 }].map((p, i) => (
              <div key={i} className="absolute w-1 h-1 rounded-full bg-accent-cyan/30 animate-pulse"
                style={{ top: `${p.t}%`, left: `${p.l}%`, animationDelay: `${i * 500}ms` }} />
            ))}
          </div>
          <div className="text-xl font-black text-accent-cyan font-mono-num">+{fmt(tokiEarn)}</div>
          <div className="text-[10px] text-gray-500">TON {perYear}</div>
        </div>
      </div>
    </div>
  );
}

/* --- C: Timeline Graph (SVG line chart) --- */
function VsTimelineGraph({
  tokiEarn, animated, exchangeLabel, tokiLabel, aprStr, perYear,
}: {
  tokiEarn: number; animated: boolean;
  exchangeLabel: string; tokiLabel: string; aprStr: string; perYear: string;
}) {
  const fmt = (n: number) => n.toLocaleString();
  // Generate 12 monthly data points
  const months = Array.from({ length: 13 }, (_, i) => i);
  const tokiPoints = months.map((m) => ({
    month: m,
    value: Math.round(tokiEarn * (m / 12)),
  }));
  // SVG dimensions
  const w = 400, h = 140, px = 40, py = 10;
  const chartW = w - px * 2, chartH = h - py * 2;
  const maxVal = tokiEarn || 1;

  const tokiPath = tokiPoints
    .map((p, i) => {
      const x = px + (i / 12) * chartW;
      // slight curve using exponential for compounding effect
      const ratio = p.value / maxVal;
      const y = h - py - ratio * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const exchangePath = `M ${px} ${h - py} L ${px + chartW} ${h - py}`;

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-gray-500" />
          <span className="text-gray-500">{exchangeLabel} (0%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-accent-cyan" />
          <span className="text-accent-cyan">{tokiLabel} (~{aprStr}%)</span>
        </div>
      </div>

      <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <line key={r} x1={px} y1={h - py - r * chartH} x2={px + chartW} y2={h - py - r * chartH}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {/* Month labels */}
          {[0, 3, 6, 9, 12].map((m) => (
            <text key={m} x={px + (m / 12) * chartW} y={h - 1} textAnchor="middle"
              className="fill-gray-600 text-[9px]">{m}m</text>
          ))}
          {/* Exchange line (flat) */}
          <path d={exchangePath} fill="none" stroke="rgba(156,163,175,0.4)" strokeWidth="2" strokeDasharray="4 4" />
          {/* Toki line (animated) */}
          <path
            d={tokiPath} fill="none" stroke="rgb(34,211,238)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={animated ? "animate-draw-line" : ""}
            style={{
              strokeDasharray: 600,
              strokeDashoffset: animated ? 0 : 600,
              transition: "stroke-dashoffset 2s ease-out",
            }}
          />
          {/* Toki area fill */}
          <path
            d={`${tokiPath} L ${px + chartW} ${h - py} L ${px} ${h - py} Z`}
            fill="url(#areaGradient)"
            className={`transition-opacity duration-1000 delay-500 ${animated ? "opacity-100" : "opacity-0"}`}
          />
          {/* End point dot */}
          <circle
            cx={px + chartW} cy={h - py - chartH}
            r="4" fill="rgb(34,211,238)"
            className={`transition-opacity duration-500 delay-1000 ${animated ? "opacity-100" : "opacity-0"}`}
          />
          {/* End value label */}
          <text
            x={px + chartW - 5} y={h - py - chartH - 10} textAnchor="end"
            className={`fill-accent-cyan text-[10px] font-bold transition-opacity duration-500 delay-1500 ${animated ? "opacity-100" : "opacity-0"}`}
          >
            +{fmt(tokiEarn)} TON
          </text>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="text-center text-xs text-gray-500">
        12 months &middot; +{fmt(tokiEarn)} TON {perYear}
      </div>
    </div>
  );
}

/* --- D: Circular Gauge / Speedometer --- */
function VsGaugeMeter({
  tokiEarn, animated, exchangeLabel, tokiLabel, aprStr, perYear, aprNum,
}: {
  tokiEarn: number; animated: boolean;
  exchangeLabel: string; tokiLabel: string; aprStr: string; perYear: string; aprNum: number;
}) {
  const fmt = (n: number) => n.toLocaleString();
  // Gauge params: 180 degree arc
  const r = 60, cx = 70, cy = 75;
  const circumference = Math.PI * r;
  // Exchange: 0%, Toki: clamp to max 50% APR for visual
  const tokiRatio = Math.min(aprNum / 50, 1);

  return (
    <div className="flex gap-4 justify-center">
      {/* Exchange gauge */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-gray-500">{exchangeLabel}</div>
        <svg viewBox="0 0 140 90" className="w-[160px] h-auto">
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round"
          />
          {/* Value arc (0) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="rgba(107,114,128,0.4)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`0 ${circumference}`}
          />
          {/* Center text */}
          <text x={cx} y={cy - 10} textAnchor="middle" className="fill-gray-500 text-[22px] font-black">0%</text>
          <text x={cx} y={cy + 6} textAnchor="middle" className="fill-gray-600 text-[8px]">APR</text>
        </svg>
        <div className="text-sm font-bold text-gray-500 font-mono-num">+0 TON</div>
        <div className="text-[10px] text-gray-600">{perYear}</div>
      </div>

      {/* VS */}
      <div className="flex items-center pt-8">
        <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-black">VS</div>
      </div>

      {/* Toki gauge */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-accent-cyan font-semibold">{tokiLabel}</div>
        <svg viewBox="0 0 140 90" className="w-[160px] h-auto">
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round"
          />
          {/* Glow filter */}
          <defs>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Value arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="rgb(34,211,238)" strokeWidth="10" strokeLinecap="round"
            filter="url(#gaugeGlow)"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animated ? circumference * (1 - tokiRatio) : circumference}
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
          />
          {/* Center text */}
          <text x={cx} y={cy - 10} textAnchor="middle" className="fill-accent-cyan text-[22px] font-black">
            {aprStr}%
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" className="fill-gray-500 text-[8px]">APR</text>
        </svg>
        <div className="text-sm font-bold text-accent-cyan font-mono-num">+{fmt(tokiEarn)} TON</div>
        <div className="text-[10px] text-gray-500">{perYear}</div>
      </div>
    </div>
  );
}

/* ─── Variant Combo: Control Panel + Rocket Launch ──────────────────────── */

function CombinedVariant({ data, show }: { data: StakingData; show: boolean }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(1000);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [accumulated, setAccumulated] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; type: "coin" | "sparkle"; drift: number }[]>([]);
  const [exhaust, setExhaust] = useState<{ id: number; x: number; size: number; dx: number; delay: number; opacity: number; dur: number }[]>([]);
  const nextId = useRef(0);
  const exhaustId = useRef(0);
  const [vsCountUp, setVsCountUp] = useState(0);
  const apr = data.apr / 100;

  // Per-user seigniorage (single source of truth for all earnings)
  const userSeigPerBlock = data.totalStakedRaw > 0
    ? (amount / data.totalStakedRaw) * data.seigPerBlockRaw : 0;
  const BLOCKS_PER_DAY = 7200;
  const userSeigPerDay = userSeigPerBlock * BLOCKS_PER_DAY;

  const tokiEarn1y = Math.round(userSeigPerDay * 365);

  // Rocket height: 10% at min (100 TON), 68% at max (100K TON)
  // Capped so character + speech bubble stays within container
  const rocketHeight = 10 + (amount / 100_000) * 58;
  const isMaxAmount = amount >= 100_000;

  // Toki speech bubble state machine: idle → updated → nudge cycle
  type TokiState = "idle" | "updated" | "nudge";
  const [tokiState, setTokiState] = useState<TokiState>("idle");
  const [nudgeIndex, setNudgeIndex] = useState(0);
  const lastInteraction = useRef(Date.now());
  const hasInteracted = useRef(false);

  const nudgeLines = [
    t.statsCard.comboTokiNudge1,
    t.statsCard.comboTokiNudge2,
    t.statsCard.comboTokiNudge3,
    t.statsCard.comboTokiNudge4,
  ];

  const tokiBubbleText = tokiState === "idle"
    ? t.statsCard.comboTokiIdle
    : tokiState === "updated"
    ? (tokiEarn1y < 500 ? t.statsCard.comboTokiGainSmall
      : tokiEarn1y < 5000 ? t.statsCard.comboTokiGainMid
      : t.statsCard.comboTokiGainBig)
    : nudgeLines[nudgeIndex % nudgeLines.length];

  // On amount change → "updated" state
  useEffect(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      // skip first render
      return;
    }
    setTokiState("updated");
    lastInteraction.current = Date.now();
  }, [amount]);

  // Nudge timer: after 8s of no interaction, cycle nudge messages
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 8000 && hasInteracted.current) {
        setTokiState("nudge");
        setNudgeIndex((i) => i + 1);
        lastInteraction.current = Date.now(); // reset so next nudge comes after 8s
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [show]);

  // Reset accumulated on amount change
  useEffect(() => { setAccumulated(0); }, [amount]);

  // VS count-up animation
  useEffect(() => {
    if (!show) return;
    setVsCountUp(0);
    const target = tokiEarn1y;
    if (target <= 0) return;
    const steps = 40;
    const stepTime = 30;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      // ease-out: fast start, slow end
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setVsCountUp(Math.round(target * progress));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [show, tokiEarn1y]);

  // Block timer + accumulation
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setSecondsAgo((s) => {
        if (s >= 12) {
          setAccumulated((prev) => prev + userSeigPerBlock);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, userSeigPerBlock]);

  // Particles
  useEffect(() => {
    if (!show) return;
    const coinInterval = setInterval(() => {
      setParticles((prev) => {
        const id = nextId.current++;
        const isCoin = id % 3 !== 2;
        return [...prev, {
          id, x: 10 + Math.random() * 80,
          size: isCoin ? (18 + Math.random() * 14) : (10 + Math.random() * 8),
          type: isCoin ? "coin" as const : "sparkle" as const,
          drift: -20 + Math.random() * 40,
        }].slice(-10);
      });
    }, 400);
    const exhaustInterval = setInterval(() => {
      setExhaust((prev) => {
        const batch = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => ({
          id: exhaustId.current++,
          x: 20 + Math.random() * 60,
          size: 20 + Math.random() * 30,
          dx: -50 + Math.random() * 100,
          delay: Math.random() * 0.2,
          opacity: 0.5 + Math.random() * 0.35,
          dur: 2.2 + Math.random() * 1.2,
        }));
        return [...prev, ...batch].slice(-30);
      });
    }, 150);
    return () => { clearInterval(coinInterval); clearInterval(exhaustInterval); };
  }, [show]);

  const fmt = (n: number) => n.toLocaleString();
  const fmtSmall = (n: number) => {
    if (n === 0) return "0";
    if (n >= 1) return n.toFixed(2);
    if (n >= 0.01) return n.toFixed(4);
    const s = n.toFixed(10);
    const match = s.match(/^0\.(0*)/);
    const zeros = match ? match[1].length : 0;
    if (zeros <= 1) return n.toFixed(4);
    return n.toFixed(zeros + 3);
  };

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #0d0f24 100%)",
          border: "3px solid #1a1a3a",
          boxShadow: "0 0 30px rgba(34,211,238,0.08), inset 0 0 60px rgba(0,0,0,0.5)",
        }}>

        {/* ── Arcade Marquee Header ── */}
        <div className="relative px-4 py-2.5 flex items-center justify-between overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #1a0a30 0%, #0f0a20 100%)",
            borderBottom: "2px solid #2a1a4a",
          }}>
          {/* Marquee neon glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #22d3ee, #f59e0b, #22d3ee, transparent)" }} />
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: "0 0 6px #ef4444" }} />
              <div className="w-2 h-2 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 6px #facc15" }} />
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ade80" }} />
            </div>
            <span className="text-xs font-mono font-black uppercase tracking-[0.2em]"
              style={{ color: "#22d3ee", textShadow: "0 0 10px rgba(34,211,238,0.6), 0 0 20px rgba(34,211,238,0.3)" }}>
              TOKI PROFIT SIMULATOR
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-400/80"
              style={{ textShadow: "0 0 6px rgba(251,191,36,0.4)" }}>
              APR {data.apr.toFixed(1)}%
            </span>
          </div>
          {/* CRT scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none terminal-scanlines opacity-30" />
        </div>

        <div className="flex flex-col md:flex-row">

          {/* ── LEFT: Arcade Control Panel ── */}
          <div className="flex-1 p-4 md:p-5 space-y-3.5 md:border-r border-purple-900/40 relative">
            {/* CRT scanlines on control panel */}
            <div className="absolute inset-0 pointer-events-none terminal-scanlines opacity-10" />

            {/* ─ POWER LEVER (TON Amount slider) ─ */}
            <div className="rounded-lg p-3.5 relative"
              style={{
                background: "linear-gradient(135deg, rgba(15,10,35,0.9), rgba(10,8,25,0.95))",
                border: "2px solid #2a1a4a",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400"
                  style={{ textShadow: "0 0 8px rgba(168,85,247,0.4)" }}>
                  ⚡ {t.statsCard.comboSliderLabel}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmt(amount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const n = Math.min(Math.max(Number(raw) || 0, 0), 100_000);
                      setAmount(n);
                    }}
                    onBlur={() => {
                      if (amount < 100) setAmount(100);
                    }}
                    className="w-20 text-right text-lg font-black font-mono-num tabular-nums bg-transparent border-b border-cyan-400/30 focus:border-cyan-400 outline-none transition-colors"
                    style={{ color: "#22d3ee", textShadow: "0 0 12px rgba(34,211,238,0.5)" }}
                  />
                  <span className="text-[10px] text-cyan-400/50 font-mono">TON</span>
                </div>
              </div>
              <input
                type="range" min={100} max={100_000} step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                style={{ background: "linear-gradient(90deg, #1a0a30, #2a1a4a)" }}
              />
              <div className="flex justify-between text-[9px] text-purple-500/60 font-mono mt-1">
                <span>MIN 100</span><span>MAX 100,000</span>
              </div>
              {/* Power bar — segmented arcade style */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[9px] text-amber-400 font-mono font-bold"
                  style={{ textShadow: "0 0 6px rgba(251,191,36,0.4)" }}>PWR</span>
                <div className="flex-1 flex gap-[2px]">
                  {Array.from({ length: 20 }, (_, i) => {
                    const filled = i < Math.round((amount / 100_000) * 20);
                    const color = i < 8 ? "#22d3ee" : i < 14 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={i} className="flex-1 h-2 rounded-[1px] transition-all duration-200"
                        style={{
                          background: filled ? color : "rgba(255,255,255,0.04)",
                          boxShadow: filled ? `0 0 4px ${color}60` : "none",
                        }} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─ SCORE DISPLAY (Earnings) ─ */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: t.statsCard.comboEstDaily, value: userSeigPerDay, glow: "#22d3ee" },
                { label: t.statsCard.comboEstMonthly, value: userSeigPerDay * 30, glow: "#a855f7" },
                { label: t.statsCard.comboEstYearly, value: userSeigPerDay * 365, glow: "#f59e0b" },
              ].map((g) => (
                <div key={g.label} className="rounded-md p-2 text-center relative overflow-hidden"
                  style={{
                    background: "rgba(10,8,25,0.8)",
                    border: `1.5px solid ${g.glow}25`,
                    boxShadow: `inset 0 0 12px ${g.glow}08`,
                  }}>
                  <div className="text-[8px] font-mono font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: `${g.glow}90` }}>{g.label}</div>
                  <div className="text-sm font-black font-mono-num tabular-nums"
                    style={{ color: g.glow, textShadow: `0 0 8px ${g.glow}60` }}>
                    ~{fmtSmall(g.value)} <span className="text-[9px] font-bold" style={{ color: `${g.glow}cc` }}>TON</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ─ VS BATTLE SCREEN ─ */}
            <div className="rounded-lg p-3 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(10,8,25,0.9), rgba(15,10,30,0.95))",
                border: "2px solid #f59e0b30",
                boxShadow: "inset 0 0 30px rgba(245,158,11,0.05), 0 0 20px rgba(245,158,11,0.08)",
              }}>
              {/* Battle header */}
              <div className="text-center mb-2.5">
                <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-amber-400/70"
                  style={{ textShadow: "0 0 8px rgba(245,158,11,0.3)" }}>
                  BATTLE RESULT
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 1P — Exchange (B: muted, small) */}
                <div className="flex-1 text-center py-2 rounded-md"
                  style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div className="text-[8px] text-red-400/50 font-mono font-bold uppercase mb-1">1P · {t.statsCard.comboExchange}</div>
                  <div className="text-sm font-black text-red-400/30 font-mono-num"
                    style={{ textShadow: "0 0 6px rgba(239,68,68,0.1)" }}>+0</div>
                  <div className="text-[8px] text-red-400/20 font-mono">TON / year</div>
                  {/* D: Empty progress bar */}
                  <div className="mt-1.5 mx-2 h-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: "0%", background: "#ef4444" }} />
                  </div>
                  <div className="text-[7px] text-red-400/25 font-mono mt-0.5">LOSE</div>
                </div>

                {/* VS badge */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 relative"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                    color: "white",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    boxShadow: "0 0 16px rgba(245,158,11,0.4), 0 0 30px rgba(245,158,11,0.15)",
                  }}>
                  VS
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-lg animate-ping opacity-20"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", animationDuration: "2s" }} />
                </div>

                {/* 2P — Toki (B: bright, bigger + C: winner badge + D: full bar + E: TON/year) */}
                <div className="flex-1 text-center py-2 rounded-md relative"
                  style={{
                    background: "rgba(34,211,238,0.06)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    boxShadow: "inset 0 0 16px rgba(34,211,238,0.05), 0 0 12px rgba(34,211,238,0.08)",
                  }}>
                  {/* C: Winner badge */}
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[6px] font-mono font-black uppercase"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                      color: "#1a0a00",
                      boxShadow: "0 0 8px rgba(245,158,11,0.5)",
                      letterSpacing: "0.1em",
                    }}>
                    WIN
                  </div>
                  {/* C: Star particles — behind text */}
                  {[...Array(6)].map((_, i) => (
                    <span key={i} className="absolute text-[8px] animate-pulse pointer-events-none select-none z-0"
                      style={{
                        color: "#f59e0b",
                        top: `${10 + Math.sin(i * 1.2) * 30}%`,
                        left: `${10 + (i * 16) % 85}%`,
                        animationDelay: `${i * 300}ms`,
                        animationDuration: `${1.5 + i * 0.3}s`,
                        opacity: 0.3,
                        textShadow: "0 0 4px rgba(245,158,11,0.5)",
                      }}>
                      ★
                    </span>
                  ))}
                  <div className="relative z-10 text-[8px] text-cyan-400/80 font-mono font-bold uppercase mb-1">2P · {t.statsCard.comboToki}</div>
                  {/* A: Count-up animation */}
                  <div className="relative z-10 text-lg font-black font-mono-num"
                    style={{ color: "#22d3ee", textShadow: "0 0 14px rgba(34,211,238,0.5), 0 0 30px rgba(34,211,238,0.2)" }}>
                    +{fmt(vsCountUp)}
                  </div>
                  {/* E: TON/year label */}
                  <div className="relative z-10 text-[9px] font-mono font-bold" style={{ color: "rgba(34,211,238,0.7)" }}>TON / year</div>
                  {/* D: Full progress bar */}
                  <div className="relative z-10 mt-1.5 mx-2 h-1.5 rounded-full" style={{ background: "rgba(34,211,238,0.1)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((vsCountUp / Math.max(tokiEarn1y, 1)) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #22d3ee, #06b6d4)",
                        boxShadow: "0 0 8px rgba(34,211,238,0.4)",
                      }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─ LIVE COUNTER (Coin feed) ─ */}
            <div className="rounded-md p-2.5 relative overflow-hidden"
              style={{
                background: "rgba(10,8,25,0.8)",
                border: "1.5px solid #4ade8025",
              }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: "rgba(74,222,128,0.2)", animationDuration: "2s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ade80" }} />
                </div>
                <span className="text-[9px] text-green-400 font-mono font-bold uppercase tracking-wide"
                  style={{ textShadow: "0 0 8px rgba(74,222,128,0.3)" }}>LIVE</span>
                <span className="ml-auto text-sm font-black font-mono-num tabular-nums"
                  style={{ color: "#4ade80", textShadow: "0 0 10px rgba(74,222,128,0.5)" }}>
                  +{fmtSmall(accumulated)} <span className="text-[8px] text-green-400/40">TON</span>
                </span>
              </div>
              {/* Segmented progress like arcade loading bar */}
              <div className="flex gap-[2px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="flex-1 h-1.5 rounded-[1px] transition-all duration-300"
                    style={{
                      background: i < secondsAgo ? "#4ade80" : "rgba(255,255,255,0.04)",
                      boxShadow: i < secondsAgo ? "0 0 4px rgba(74,222,128,0.4)" : "none",
                    }} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-green-400/30 font-mono">BLOCK</span>
                <span className="text-[8px] text-green-400/50 font-mono">{secondsAgo}/12s</span>
              </div>
            </div>

            {/* ─ STAKING CTA ─ */}
            <Link href="/staking"
              className="block w-full text-center py-2.5 rounded-lg font-mono font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                color: "#0a0a1a",
                boxShadow: "0 0 20px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                textShadow: "0 1px 0 rgba(255,255,255,0.15)",
              }}>
              {t.hero.startStaking} →
            </Link>
          </div>

          {/* ── RIGHT: Launch Scene ── */}
          <div className="w-full md:w-[240px] lg:w-[280px] shrink-0 relative" style={{ minHeight: 360, overflow: "visible" }}>
            {/* Space background */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(6,12,30,1) 5%, rgba(6,12,40,0.95) 30%, rgba(10,15,50,0.9))" }}
            />

            {/* Stars */}
            {[{t:5,l:20},{t:10,l:70},{t:18,l:45},{t:25,l:15},{t:12,l:85},{t:30,l:60},{t:8,l:35}].map((s, i) => (
              <div key={i} className="absolute w-[2px] h-[2px] rounded-full bg-white/20 animate-pulse"
                style={{ top: `${s.t}%`, left: `${s.l}%`, animationDelay: `${i * 400}ms`, animationDuration: `${2 + i * 0.5}s` }} />
            ))}

            {/* Exhaust trail — gradient, top extends behind rocket (z-[6] < z-20) */}
            <div
              className="absolute w-[30%] rounded-t-full transition-all ease-out z-[6]"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "8%",
                height: `${Math.max(rocketHeight + 5, 0)}%`,
                transitionDuration: "0.8s",
                background: "linear-gradient(to top, rgba(245,158,11,0.2), rgba(34,211,238,0.12) 50%, rgba(74,144,217,0.06) 80%, transparent)",
                filter: "blur(5px)",
              }}
            />
            <div
              className="absolute w-[14%] rounded-t-full transition-all ease-out z-[6]"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "8%",
                height: `${Math.max(rocketHeight + 3, 0)}%`,
                transitionDuration: "0.8s",
                transitionDelay: "50ms",
                background: "linear-gradient(to top, rgba(245,158,11,0.35), rgba(34,211,238,0.18) 50%, rgba(74,144,217,0.06) 80%, transparent)",
                boxShadow: "0 0 14px rgba(34,211,238,0.1)",
              }}
            />

            {/* Unified launch site (tower + ground + base) — tower trunk centered */}
            <div className="absolute bottom-[0%] left-[50%] w-[65%] z-[5]" style={{ transform: "translateX(-36%)" }}>
              <Image src="/toki-launchsite.png" alt="Launch site" width={750} height={903}
                className="w-full h-auto drop-shadow-[0_0_16px_rgba(34,211,238,0.12)] opacity-90" />
            </div>

            {/* Billowing launch smoke — above the base, z-[6] so it renders over the ground */}
            {exhaust.map((e) => {
              const colorMix = (e.id % 3);
              const core = colorMix === 0
                ? `rgba(34,211,238,${e.opacity * 0.7})`
                : colorMix === 1
                ? `rgba(74,144,217,${e.opacity * 0.7})`
                : `rgba(245,158,11,${e.opacity * 0.6})`;
              const mid = colorMix === 0
                ? `rgba(34,211,238,${e.opacity * 0.3})`
                : colorMix === 1
                ? `rgba(74,144,217,${e.opacity * 0.3})`
                : `rgba(245,158,11,${e.opacity * 0.25})`;
              return (
                <div key={e.id} className="absolute pointer-events-none z-[6]"
                  style={{ left: `${e.x}%`, bottom: "8%", transform: `translateX(${e.dx}px)` }}>
                  <div className="rounded-full"
                    style={{
                      width: e.size, height: e.size,
                      background: `radial-gradient(circle, ${core}, ${mid}, transparent)`,
                      animation: `launchBillow ${e.dur}s ease-out forwards`,
                      animationDelay: `${e.delay}s`,
                      filter: "blur(3px)",
                    }}
                  />
                </div>
              );
            })}

            {/* Toki speech bubble — centered in launch scene, independent of rocket */}
            <div className="absolute z-30 pointer-events-none whitespace-nowrap"
              style={{
                left: "50%",
                transform: "translateX(-50%) translateY(-95px)",
                bottom: `${rocketHeight + 12}%`,
                transition: "bottom 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}>
              <div className="relative px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold animate-bounce"
                style={{
                  animationDuration: "3s",
                  background: "rgba(10,8,25,0.9)",
                  border: "1.5px solid rgba(34,211,238,0.3)",
                  color: "#22d3ee",
                  boxShadow: "0 0 12px rgba(34,211,238,0.15)",
                  textShadow: "0 0 6px rgba(34,211,238,0.4)",
                }}>
                {tokiBubbleText}
                {/* Tail */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                  style={{ background: "rgba(10,8,25,0.9)", borderRight: "1.5px solid rgba(34,211,238,0.3)", borderBottom: "1.5px solid rgba(34,211,238,0.3)" }} />
              </div>
            </div>

            {/* Toki on rocket — dynamic height, 20px right offset */}
            <div
              className="absolute z-20 transition-all pointer-events-none"
              style={{
                left: "50%",
                transform: "translateX(calc(-50% + 20px))",
                bottom: `${rocketHeight}%`,
                transitionDuration: "0.8s",
                transitionTimingFunction: "cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 -m-4 rounded-full bg-accent-cyan/15 blur-xl" />
                <Image src="/toki-rocket.png" alt="Toki on rocket" width={120} height={120}
                  className="relative drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" />

                {/* Rocket exhaust — rich billowing cloud smoke */}
                <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: "calc(50% - 20px)", top: "calc(75% + 15px)", transform: "translateX(-50%)" }}>
                  {/* Inner bright core — white hot */}
                  <div className="w-5 rounded-b-full"
                    style={{
                      height: Math.max(20, (amount / 100_000) * 55),
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(34,211,238,0.6), rgba(74,144,217,0.25), transparent)",
                      animation: "rocketFlame 0.1s ease-in-out infinite alternate",
                      filter: "blur(1px)",
                    }} />
                  {/* Wide outer plume — cyan glow */}
                  <div className="absolute top-0 w-16 rounded-b-full"
                    style={{
                      height: Math.max(30, (amount / 100_000) * 70),
                      background: "linear-gradient(to bottom, rgba(34,211,238,0.4), rgba(74,144,217,0.2), rgba(245,158,11,0.08), transparent)",
                      animation: "rocketFlame 0.15s ease-in-out infinite alternate-reverse",
                      filter: "blur(5px)",
                    }} />
                  {/* Extra wide ambient glow */}
                  <div className="absolute top-2 w-24 rounded-b-full"
                    style={{
                      height: Math.max(40, (amount / 100_000) * 80),
                      background: "linear-gradient(to bottom, rgba(34,211,238,0.15), rgba(74,144,217,0.08), transparent)",
                      animation: "rocketFlame 0.2s ease-in-out infinite alternate",
                      filter: "blur(10px)",
                    }} />
                  {/* Dense smoke puffs — left cascade (8 layers) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const colorSets = [
                      ["34,211,238", "34,211,238"],
                      ["74,144,217", "74,144,217"],
                      ["245,158,11", "245,158,11"],
                      ["34,211,238", "74,144,217"],
                      ["245,158,11", "34,211,238"],
                      ["74,144,217", "245,158,11"],
                      ["34,211,238", "245,158,11"],
                      ["74,144,217", "34,211,238"],
                    ];
                    const colors = colorSets[i];
                    return (
                      <div key={`l${i}`} className="absolute rounded-full"
                        style={{
                          top: 2 + i * 8,
                          left: `calc(50% - ${14 + i * 10}px)`,
                          width: 18 + i * 12,
                          height: 18 + i * 12,
                          background: `radial-gradient(circle, rgba(${colors[0]},${0.4 - i * 0.035}), rgba(${colors[1]},${0.15 - i * 0.013}), transparent)`,
                          animation: `rocketSmoke ${0.7 + i * 0.25}s ease-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                          filter: `blur(${3 + i * 1.2}px)`,
                        }} />
                    );
                  })}
                  {/* Dense smoke puffs — right cascade (8 layers) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const colorSets = [
                      ["245,158,11", "245,158,11"],
                      ["34,211,238", "34,211,238"],
                      ["74,144,217", "74,144,217"],
                      ["245,158,11", "34,211,238"],
                      ["34,211,238", "74,144,217"],
                      ["74,144,217", "245,158,11"],
                      ["245,158,11", "74,144,217"],
                      ["34,211,238", "245,158,11"],
                    ];
                    const colors = colorSets[i];
                    return (
                      <div key={`r${i}`} className="absolute rounded-full"
                        style={{
                          top: 2 + i * 8,
                          left: `calc(50% + ${6 + i * 8}px)`,
                          width: 18 + i * 12,
                          height: 18 + i * 12,
                          background: `radial-gradient(circle, rgba(${colors[0]},${0.4 - i * 0.035}), rgba(${colors[1]},${0.15 - i * 0.013}), transparent)`,
                          animation: `rocketSmoke ${0.8 + i * 0.22}s ease-out infinite`,
                          animationDelay: `${0.05 + i * 0.11}s`,
                          filter: `blur(${3 + i * 1.2}px)`,
                        }} />
                    );
                  })}
                  {/* Bottom mushroom cloud — extra wide base puffs */}
                  {[0, 1, 2, 3].map((i) => {
                    const colors = [
                      ["34,211,238", "74,144,217"],
                      ["245,158,11", "34,211,238"],
                      ["74,144,217", "245,158,11"],
                      ["34,211,238", "245,158,11"],
                    ][i];
                    return (
                      <div key={`b${i}`} className="absolute rounded-full"
                        style={{
                          top: 50 + i * 14,
                          left: `calc(50% + ${-50 + i * 25}px)`,
                          width: 40 + i * 15,
                          height: 30 + i * 10,
                          background: `radial-gradient(ellipse, rgba(${colors[0]},${0.25 - i * 0.04}), rgba(${colors[1]},${0.1 - i * 0.02}), transparent)`,
                          animation: `rocketSmoke ${1.2 + i * 0.4}s ease-out infinite`,
                          animationDelay: `${i * 0.15}s`,
                          filter: `blur(${6 + i * 2}px)`,
                        }} />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coin particles */}
            {particles.map((p) => (
              <div key={p.id} className="absolute pointer-events-none z-10"
                style={{
                  left: `${p.x}%`, bottom: `${rocketHeight - 5}%`,
                  animation: `comboFloatUp 2.2s ease-out forwards`,
                  transform: `translateX(${p.drift}px)`,
                }}>
                {p.type === "coin" ? (
                  <div className="drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" style={{ width: p.size, height: p.size }}>
                    <Image src="/toki-logo.png" alt="TON" width={p.size} height={p.size} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="text-accent-cyan font-black" style={{ fontSize: p.size, textShadow: "0 0 6px rgba(34,211,238,0.7)" }}>✦</div>
                )}
              </div>
            ))}

            {/* Altitude indicator on right edge */}
            <div className="absolute right-2 top-[10%] bottom-[10%] w-[3px] rounded-full bg-white/[0.04]">
              <div
                className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-amber-400/40 to-accent-cyan/40 transition-all duration-800"
                style={{ height: `${(rocketHeight / 68) * 100}%`, transitionDuration: "0.8s" }}
              />
            </div>
            <div className="absolute right-1 text-[7px] font-mono text-gray-600" style={{ top: "8%" }}>MAX</div>
            <div className="absolute right-1 text-[7px] font-mono text-gray-600" style={{ bottom: "9%" }}>PAD</div>

            {/* Fireworks at max amount */}
            {isMaxAmount && (
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {/* Burst particles radiating from center */}
                {Array.from({ length: 16 }, (_, i) => {
                  const angle = (i / 16) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const dist = 60 + (i % 3) * 25;
                  const dx = Math.cos(rad) * dist;
                  const dy = Math.sin(rad) * dist;
                  const colors = ["#22d3ee", "#f59e0b", "#a855f7", "#ef4444", "#4ade80", "#fbbf24"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={`fw-${i}`} className="absolute rounded-full"
                      style={{
                        width: 4 + (i % 3) * 2,
                        height: 4 + (i % 3) * 2,
                        background: color,
                        boxShadow: `0 0 8px ${color}, 0 0 16px ${color}80`,
                        left: "50%",
                        top: "30%",
                        animation: `fireworkBurst 1.8s ease-out infinite`,
                        animationDelay: `${(i % 4) * 0.15}s`,
                        // @ts-expect-error CSS custom properties
                        "--fw-dx": `${dx}px`,
                        "--fw-dy": `${dy}px`,
                      }} />
                  );
                })}
                {/* Sparkle streaks */}
                {Array.from({ length: 8 }, (_, i) => {
                  const colors = ["#fbbf24", "#22d3ee", "#a855f7", "#f59e0b"];
                  return (
                    <div key={`sp-${i}`} className="absolute text-sm pointer-events-none select-none"
                      style={{
                        left: `${15 + (i * 11) % 75}%`,
                        top: `${10 + (i * 13) % 50}%`,
                        color: colors[i % colors.length],
                        animation: `fireworkSparkle 1.2s ease-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                        textShadow: `0 0 6px ${colors[i % colors.length]}`,
                      }}>
                      ✦
                    </div>
                  );
                })}
                {/* "MAX POWER!" text */}
                <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[11px] font-mono font-black uppercase tracking-[0.2em]"
                  style={{
                    color: "#fbbf24",
                    textShadow: "0 0 10px rgba(251,191,36,0.6), 0 0 20px rgba(251,191,36,0.3)",
                    animation: "fireworkSparkle 1s ease-in-out infinite",
                  }}>
                  MAX POWER!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function StakingPreviewClient({ data }: StakingPreviewClientProps) {
  const { t } = useTranslation();
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowCard(true); },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center text-gray-500">
          {t.stakingPreview.failedToLoad}
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto" ref={cardRef}>
        {/* Section Header */}
        <div className="text-center mb-14 px-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 tracking-widest mb-6">
            {t.stakingPreview.arcadeTag}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            {t.stakingPreview.arcadeTitle}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
              {t.stakingPreview.arcadeTitleAccent}
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            {t.stakingPreview.arcadeSubtitle}
          </p>
        </div>

        <CombinedVariant data={data} show={showCard} />
      </div>
    </section>
  );
}
