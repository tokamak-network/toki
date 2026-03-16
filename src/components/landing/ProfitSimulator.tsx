"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { StakingData } from "@/lib/staking";

interface ProfitSimulatorProps {
  data: StakingData;
  show?: boolean;
  onClose?: () => void;
}

export default function ProfitSimulator({ data, show = true, onClose }: ProfitSimulatorProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(1000);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [accumulated, setAccumulated] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; type: "coin" | "sparkle"; drift: number }[]>([]);
  const [exhaust, setExhaust] = useState<{ id: number; x: number; size: number; dx: number; delay: number; opacity: number; dur: number }[]>([]);
  const nextId = useRef(0);
  const exhaustId = useRef(0);
  const [vsCountUp, setVsCountUp] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _apr = data.apr / 100;

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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 relative self-center"
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

            {/* ─ STAKING CTA or Close ─ */}
            {onClose ? (
              <button
                onClick={onClose}
                className="block w-full text-center py-2.5 rounded-lg font-mono font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}>
                ← {t.onboarding.closeVideo}
              </button>
            ) : (
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
            )}
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
