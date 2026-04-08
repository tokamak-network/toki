"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CardNumberInput from "@/components/lottery/CardNumberInput";

/**
 * Lottery landing page — fixed QR code leads here.
 * User enters card number from the physical scratch card.
 * Spring / cherry-blossom theme to match the physical card design.
 */
export default function LotteryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (cardNumber: string) => {
    setLoading(true);
    router.push(`/lottery/claim?code=${cardNumber}`);
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
      }}
    >
      {/* ── Floating cherry-blossom orbs ────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-orb-float-1 absolute rounded-full blur-3xl opacity-40"
          style={{
            width: "400px",
            height: "400px",
            top: "-100px",
            left: "-80px",
            background: "radial-gradient(circle, #fbcfe8 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-orb-float-2 absolute rounded-full blur-3xl opacity-30"
          style={{
            width: "350px",
            height: "350px",
            bottom: "-60px",
            right: "-60px",
            background: "radial-gradient(circle, #f9a8d4 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-orb-float-3 absolute rounded-full blur-2xl opacity-25"
          style={{
            width: "260px",
            height: "260px",
            top: "45%",
            left: "55%",
            background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Cherry-blossom petal particles ──────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
        {/* ── Scattered background petals ──── */}
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "12%", left: "10%", background: "#f9a8d4", boxShadow: "0 0 6px 2px rgba(249,168,212,0.5)", opacity: 0.8 }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "68%", left: "8%", background: "#f472b6", boxShadow: "0 0 6px 2px rgba(244,114,182,0.4)", opacity: 0.6 }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "78%", left: "72%", background: "#fbcfe8", boxShadow: "0 0 4px 1px rgba(251,207,232,0.4)", opacity: 0.7 }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "42%", left: "5%", background: "#f9a8d4", boxShadow: "0 0 4px 1px rgba(249,168,212,0.3)", opacity: 0.5, animationDelay: "2s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "85%", left: "40%", background: "#f472b6", boxShadow: "0 0 7px 2px rgba(244,114,182,0.4)", opacity: 0.6, animationDelay: "3.5s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "58%", left: "22%", background: "#ddd6fe", boxShadow: "0 0 5px 2px rgba(221,214,254,0.4)", opacity: 0.5, animationDelay: "4s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "5px", height: "4px", top: "52%", left: "15%", background: "#fbcfe8", boxShadow: "0 0 5px 2px rgba(251,207,232,0.4)", opacity: 0.55, animationDelay: "1.5s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "6px", height: "5px", top: "90%", left: "28%", background: "#f9a8d4", boxShadow: "0 0 6px 2px rgba(249,168,212,0.4)", opacity: 0.5, animationDelay: "5s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "5px", height: "3px", top: "75%", left: "48%", background: "#fda4af", boxShadow: "0 0 5px 2px rgba(253,164,175,0.3)", opacity: 0.45, animationDelay: "6.5s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "7px", height: "4px", top: "62%", left: "35%", background: "#f472b6", boxShadow: "0 0 6px 2px rgba(244,114,182,0.3)", opacity: 0.5, animationDelay: "2.8s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "92%", left: "18%", background: "#fce7f3", boxShadow: "0 0 4px 1px rgba(252,231,243,0.3)", opacity: 0.4, animationDelay: "7s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "82%", left: "55%", background: "#fbcfe8", boxShadow: "0 0 5px 2px rgba(251,207,232,0.3)", opacity: 0.45, animationDelay: "4.2s" }} />

        {/* ── Dense cherry blossom cluster around Toki (right/top area) ──── */}
        {/* Large petals */}
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "9px", height: "6px", top: "3%", left: "62%", background: "#f9a8d4", boxShadow: "0 0 8px 3px rgba(249,168,212,0.5)", opacity: 0.85 }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "10px", height: "7px", top: "8%", left: "75%", background: "#fbcfe8", boxShadow: "0 0 10px 3px rgba(251,207,232,0.6)", opacity: 0.9 }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "8px", height: "6px", top: "5%", left: "88%", background: "#fda4af", boxShadow: "0 0 8px 3px rgba(253,164,175,0.5)", opacity: 0.8, animationDelay: "0.5s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "9px", height: "5px", top: "15%", left: "70%", background: "#f472b6", boxShadow: "0 0 8px 3px rgba(244,114,182,0.5)", opacity: 0.75, animationDelay: "1s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "11px", height: "7px", top: "12%", left: "82%", background: "#fbcfe8", boxShadow: "0 0 10px 4px rgba(251,207,232,0.5)", opacity: 0.85, animationDelay: "0.3s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "10px", height: "6px", top: "1%", left: "78%", background: "#f9a8d4", boxShadow: "0 0 9px 3px rgba(249,168,212,0.5)", opacity: 0.8, animationDelay: "0.7s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "12px", height: "8px", top: "10%", left: "68%", background: "#fbcfe8", boxShadow: "0 0 12px 4px rgba(251,207,232,0.5)", opacity: 0.7, animationDelay: "1.3s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "9px", height: "6px", top: "18%", left: "92%", background: "#fda4af", boxShadow: "0 0 8px 3px rgba(253,164,175,0.4)", opacity: 0.75, animationDelay: "2.1s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "11px", height: "7px", top: "7%", left: "58%", background: "#f472b6", boxShadow: "0 0 10px 3px rgba(244,114,182,0.4)", opacity: 0.7, animationDelay: "3.3s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "10px", height: "6px", top: "20%", left: "76%", background: "#f9a8d4", boxShadow: "0 0 9px 3px rgba(249,168,212,0.5)", opacity: 0.65, animationDelay: "4.1s" }} />

        {/* Medium petals — mid-right cluster */}
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "18%", left: "58%", background: "#f9a8d4", boxShadow: "0 0 7px 2px rgba(249,168,212,0.4)", opacity: 0.7, animationDelay: "2.5s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "6%", left: "55%", background: "#fce7f3", boxShadow: "0 0 6px 2px rgba(252,231,243,0.5)", opacity: 0.75, animationDelay: "1.8s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "22%", left: "90%", background: "#f9a8d4", boxShadow: "0 0 7px 2px rgba(249,168,212,0.5)", opacity: 0.7, animationDelay: "3s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "7px", height: "4px", top: "10%", left: "95%", background: "#fda4af", boxShadow: "0 0 6px 2px rgba(253,164,175,0.4)", opacity: 0.65, animationDelay: "0.8s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "8px", height: "6px", top: "25%", left: "65%", background: "#fbcfe8", boxShadow: "0 0 8px 2px rgba(251,207,232,0.5)", opacity: 0.8, animationDelay: "2s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "4%", left: "84%", background: "#f472b6", boxShadow: "0 0 7px 2px rgba(244,114,182,0.4)", opacity: 0.65, animationDelay: "5.2s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "14%", left: "63%", background: "#fda4af", boxShadow: "0 0 7px 2px rgba(253,164,175,0.4)", opacity: 0.6, animationDelay: "3.7s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "23%", left: "73%", background: "#fce7f3", boxShadow: "0 0 6px 2px rgba(252,231,243,0.4)", opacity: 0.7, animationDelay: "6.3s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "9%", left: "48%", background: "#fbcfe8", boxShadow: "0 0 7px 2px rgba(251,207,232,0.4)", opacity: 0.6, animationDelay: "4.8s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "27%", left: "87%", background: "#f9a8d4", boxShadow: "0 0 7px 2px rgba(249,168,212,0.4)", opacity: 0.55, animationDelay: "1.6s" }} />

        {/* Small delicate petals — scattered drift */}
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "5px", height: "3px", top: "2%", left: "70%", background: "#fce7f3", boxShadow: "0 0 5px 2px rgba(252,231,243,0.4)", opacity: 0.6, animationDelay: "4.5s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "20%", left: "78%", background: "#f9a8d4", boxShadow: "0 0 4px 1px rgba(249,168,212,0.3)", opacity: 0.55, animationDelay: "3.2s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "5px", height: "4px", top: "28%", left: "85%", background: "#fda4af", boxShadow: "0 0 5px 2px rgba(253,164,175,0.3)", opacity: 0.5, animationDelay: "5s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "16%", left: "50%", background: "#f472b6", boxShadow: "0 0 4px 1px rgba(244,114,182,0.3)", opacity: 0.5, animationDelay: "1.2s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "5px", height: "3px", top: "30%", left: "92%", background: "#fbcfe8", boxShadow: "0 0 5px 1px rgba(251,207,232,0.4)", opacity: 0.6, animationDelay: "2.8s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "1%", left: "52%", background: "#f9a8d4", boxShadow: "0 0 4px 1px rgba(249,168,212,0.3)", opacity: 0.5, animationDelay: "6.8s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "5px", height: "4px", top: "24%", left: "96%", background: "#fce7f3", boxShadow: "0 0 5px 2px rgba(252,231,243,0.3)", opacity: 0.45, animationDelay: "7.2s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "3px", height: "2px", top: "11%", left: "60%", background: "#fbcfe8", boxShadow: "0 0 3px 1px rgba(251,207,232,0.3)", opacity: 0.5, animationDelay: "5.5s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "4px", height: "3px", top: "19%", left: "84%", background: "#fda4af", boxShadow: "0 0 4px 1px rgba(253,164,175,0.3)", opacity: 0.45, animationDelay: "2.3s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "5px", height: "3px", top: "7%", left: "66%", background: "#f472b6", boxShadow: "0 0 5px 1px rgba(244,114,182,0.3)", opacity: 0.55, animationDelay: "8s" }} />

        {/* Trailing petals — drifting from Toki area downward/left */}
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "35%", left: "55%", background: "#f9a8d4", boxShadow: "0 0 6px 2px rgba(249,168,212,0.4)", opacity: 0.55, animationDelay: "4s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "32%", left: "72%", background: "#fbcfe8", boxShadow: "0 0 7px 2px rgba(251,207,232,0.4)", opacity: 0.6, animationDelay: "1.5s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "5px", height: "4px", top: "38%", left: "80%", background: "#fda4af", boxShadow: "0 0 5px 2px rgba(253,164,175,0.3)", opacity: 0.5, animationDelay: "3.8s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "40%", left: "60%", background: "#f472b6", boxShadow: "0 0 7px 2px rgba(244,114,182,0.3)", opacity: 0.45, animationDelay: "5.5s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "45%", left: "88%", background: "#f9a8d4", boxShadow: "0 0 5px 2px rgba(249,168,212,0.3)", opacity: 0.4, animationDelay: "2.2s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "5px", height: "3px", top: "48%", left: "68%", background: "#fce7f3", boxShadow: "0 0 4px 1px rgba(252,231,243,0.3)", opacity: 0.4, animationDelay: "6s" }} />
        <span className="animate-particle-drift-3 absolute block rounded-full" style={{ width: "7px", height: "5px", top: "33%", left: "85%", background: "#f9a8d4", boxShadow: "0 0 6px 2px rgba(249,168,212,0.4)", opacity: 0.5, animationDelay: "7.5s" }} />
        <span className="animate-particle-drift-5 absolute block rounded-full" style={{ width: "6px", height: "4px", top: "42%", left: "75%", background: "#fbcfe8", boxShadow: "0 0 6px 2px rgba(251,207,232,0.3)", opacity: 0.45, animationDelay: "3.2s" }} />
        <span className="animate-particle-drift-1 absolute block rounded-full" style={{ width: "8px", height: "5px", top: "36%", left: "62%", background: "#fda4af", boxShadow: "0 0 7px 2px rgba(253,164,175,0.3)", opacity: 0.5, animationDelay: "4.6s" }} />
        <span className="animate-particle-drift-6 absolute block rounded-full" style={{ width: "5px", height: "4px", top: "50%", left: "78%", background: "#f472b6", boxShadow: "0 0 5px 2px rgba(244,114,182,0.3)", opacity: 0.35, animationDelay: "8.5s" }} />
        <span className="animate-particle-drift-2 absolute block rounded-full" style={{ width: "7px", height: "4px", top: "44%", left: "52%", background: "#fbcfe8", boxShadow: "0 0 6px 2px rgba(251,207,232,0.3)", opacity: 0.4, animationDelay: "5.8s" }} />
        <span className="animate-particle-drift-4 absolute block rounded-full" style={{ width: "6px", height: "5px", top: "47%", left: "95%", background: "#f9a8d4", boxShadow: "0 0 5px 2px rgba(249,168,212,0.3)", opacity: 0.35, animationDelay: "9s" }} />
      </div>

      {/* ── Toki peeking section (owns its layout space) ────────────────── */}
      <div className="relative z-20 w-full flex justify-end items-end pt-6">
        {/* Speech bubble — positioned to the left of Toki */}
        <div className="animate-speech-bounce self-start mt-16 shrink-0" style={{ marginRight: "calc(0.75rem - 55px)" }}>
          <div
            className="relative px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap"
            style={{
              color: "#9d174d",
              background: "linear-gradient(135deg, rgba(251,207,232,0.8) 0%, rgba(252,231,243,0.7) 100%)",
              border: "1px solid rgba(244,114,182,0.4)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 12px rgba(244,114,182,0.2)",
            }}
          >
            카드번호를 알려줘!
            {/* Tail pointing right toward Toki */}
            <span
              className="absolute top-1/2 -translate-y-1/2 -right-[10px]"
              style={{
                display: "block",
                width: 0,
                height: 0,
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderLeft: "10px solid rgba(244,114,182,0.4)",
              }}
            />
          </div>
        </div>
        {/* Toki image — right edge flush with viewport via negative margin */}
        <div className="relative shrink-0" style={{ marginRight: "-6vw" }}>
          <Image
            src="/characters/toki-peeking.png"
            alt="Toki peeking"
            width={500}
            height={444}
            className="drop-shadow-2xl h-auto"
            style={{ width: "65vw", maxWidth: "380px" }}
            priority
          />
          {/* Fade-out gradient at bottom so the cutoff looks natural */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent 0%, #ffe4ec 100%)",
            }}
          />
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center gap-5 px-4 pb-10" style={{ marginTop: "30px" }}>
        <div className="w-full max-w-sm flex flex-col items-center gap-5">

          {/* ── Title ───────────────────────────────────────────────────── */}
          <div className="text-center space-y-1 animate-fade-in">
            <h1
              className="text-3xl font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ec4899 0%, #f472b6 30%, #a855f7 60%, #ec4899 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 4s ease-in-out infinite",
              }}
            >
              TOKI LOTTERY
            </h1>
            <p className="text-xs text-pink-400/70 tracking-widest uppercase font-medium">
              Season 1 — Cherry Blossom
            </p>
          </div>

          {/* ── Physical card preview ────────────────────────────────────── */}
          <div
            className="animate-holo-tilt relative w-full rounded-2xl overflow-hidden"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 8px 40px rgba(244,114,182,0.2), 0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Image
              src="/lottery-card-preview.png"
              alt="Toki Lucky Lottery Card"
              width={600}
              height={400}
              className="w-full h-auto"
            />
            {/* Shimmer overlay */}
            <div
              className="animate-holo-shine absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.2) 30%, rgba(251,207,232,0.12) 40%, rgba(196,181,253,0.08) 50%, transparent 60%)",
                backgroundSize: "200% 200%",
              }}
            />
          </div>

          {/* ── Glassmorphism input card ─────────────────────────────────── */}
          <div
            className="animate-border-glow-pink w-full rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(252,231,243,0.5) 100%)",
              border: "1px solid rgba(244,114,182,0.3)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 4px 24px rgba(244,114,182,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <CardNumberInput onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* ── Footer guide ─────────────────────────────────────────────── */}
          <div className="relative z-20 w-full space-y-3 animate-fade-in">
            {/* Card number location hint */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(244,114,182,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Mini card diagram */}
              <div
                className="flex-shrink-0 w-10 h-7 rounded relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                  border: "1px solid rgba(244,114,182,0.3)",
                }}
              >
                {/* Scratch area indicator */}
                <div
                  className="absolute bottom-0.5 left-0.5 right-0.5 h-2 rounded-sm"
                  style={{
                    background: "repeating-linear-gradient(90deg, rgba(236,72,153,0.35) 0px, rgba(236,72,153,0.35) 2px, rgba(236,72,153,0.12) 2px, rgba(236,72,153,0.12) 4px)",
                    border: "1px solid rgba(236,72,153,0.3)",
                  }}
                />
                {/* Arrow */}
                <div
                  className="absolute right-[-6px] bottom-[3px] text-[8px] text-pink-500"
                  style={{ lineHeight: 1 }}
                >
                  ←
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-snug">
                <span className="text-pink-600 font-semibold">스크래치 아래</span>에 카드번호가 있어요
              </p>
            </div>

            {/* Powered by */}
            <div className="flex items-center justify-center gap-1.5">
              <Image
                src="/toki-logo.png"
                alt="Tokamak Network"
                width={16}
                height={16}
                className="flex-shrink-0 opacity-50"
              />
              <p className="text-[10px] text-pink-400/60 tracking-wider uppercase font-medium">
                Powered by Tokamak Network
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
