"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ACHIEVEMENTS } from "@/lib/achievements";

const CARD_IMAGES: Record<string, string> = {
  "onboarding-wallet": "/cards/onboarding-wallet.png",
  "onboarding-bridge": "/cards/onboarding-bridge.png",
  "onboarding-exchange": "/cards/onboarding-exchange.png",
  "onboarding-ton": "/cards/onboarding-ton.png",
  "onboarding-complete": "/cards/onboarding-complete.png",
  "stake-first": "/cards/stake-first.png",
  "stake-10": "/cards/stake-10.png",
  "stake-100": "/cards/stake-100.png",
  "stake-gasless": "/cards/stake-gasless.png",
  "stake-delegation": "/cards/stake-delegation.png",
  "unstake-first": "/cards/unstake-first.png",
  "explore-visit": "/cards/explore-visit.png",
  "explore-click": "/cards/explore-click.png",
  "explore-all-categories": "/cards/explore-all-categories.png",
  "chat-start": "/cards/chat-start.png",
  "chat-dialogue-10": "/cards/chat-dialogue-10.png",
  "chat-freetext": "/cards/chat-freetext.png",
  "power-user": "/cards/power-user.png",
};

const CATEGORY_COLORS: Record<string, string> = {
  onboarding: "#22c55e",
  staking: "#f59e0b",
  explore: "#3b82f6",
  social: "#a855f7",
  special: "#ef4444",
};

function getRarity(points: number) {
  if (points >= 1000) return { stars: 5, label: "LEGENDARY" };
  if (points >= 500) return { stars: 4, label: "EPIC" };
  if (points >= 250) return { stars: 3, label: "RARE" };
  if (points >= 150) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

// Only show cards that have images
const CARDS_WITH_IMAGES = ACHIEVEMENTS.filter((a) => CARD_IMAGES[a.id]);

export default function CardPackOpening() {
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "burst" | "flipped">("idle");

  const current = CARDS_WITH_IMAGES[currentIndex];
  const rarity = getRarity(current.points);
  const color = CATEGORY_COLORS[current.category];
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

  const handleFlip = useCallback(() => {
    if (flipped) {
      // Reset and go to next card
      setFlipped(false);
      setPhase("idle");
      setCurrentIndex((i) => (i + 1) % CARDS_WITH_IMAGES.length);
      return;
    }
    setPhase("burst");
    setTimeout(() => {
      setFlipped(true);
      setPhase("flipped");
    }, 400);
  }, [flipped]);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 tracking-widest mb-6">
            {CARDS_WITH_IMAGES.length} UNIQUE CARDS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            COLLECT YOUR{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
              TOKI CARDS
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 font-semibold">Stake</span>.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 font-semibold">Explore</span>.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">Collect</span> them all.
          </p>
        </div>

        {/* Card area */}
        <div className="flex flex-col items-center gap-8">
          <div
            onClick={handleFlip}
            className="relative cursor-pointer"
            style={{ perspective: "1000px" }}
          >
            {/* Light burst */}
            {phase === "burst" && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full z-0 animate-[burstPulse_0.6s_ease-out_forwards]"
                style={{
                  background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
                }}
              />
            )}

            {/* Card flip container */}
            <div
              className="relative w-[220px] h-[308px] sm:w-[260px] sm:h-[364px] transition-transform duration-700 ease-out"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Card back */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  border: "2px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 0 40px rgba(34,211,238,0.15), 0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Image
                    src="/toki-logo.png"
                    alt="Toki"
                    width={56}
                    height={56}
                    className="opacity-30"
                  />
                  <div className="text-[10px] tracking-[0.3em] text-white/20 uppercase">
                    Tap to reveal
                  </div>
                </div>
                <div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: "inset 0 0 60px rgba(34,211,238,0.08)" }}
                />
              </div>

              {/* Card front */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 30px ${color}40, 0 20px 60px rgba(0,0,0,0.5)`,
                }}
              >
                {CARD_IMAGES[current.id] && (
                  <Image
                    src={CARD_IMAGES[current.id]}
                    alt={current.titleEn}
                    fill
                    className="object-cover"
                    sizes="260px"
                  />
                )}
              </div>
            </div>

            {/* Floating particles when flipped */}
            {flipped && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute animate-[floatUp_2s_ease-out_forwards] opacity-0 text-accent-amber"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      bottom: "20%",
                      fontSize: `${10 + Math.random() * 8}px`,
                      animationDelay: `${Math.random() * 0.8}s`,
                    }}
                  >
                    {"\u2605"}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info below card */}
          <div
            className={`text-center transition-all duration-500 ${
              flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="text-sm font-bold text-white mb-1">{current.titleEn}</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded"
                style={{ color, backgroundColor: `${color}20` }}
              >
                {rarity.label}
              </span>
              <span
                className="text-xs tracking-wider"
                style={{
                  background: "linear-gradient(180deg, #fcd34d, #b45309)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {starsStr}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {flipped ? "Tap card for next" : ""}
            </div>
          </div>

          {/* Prompt when not flipped */}
          <div
            className={`text-center transition-all duration-300 ${
              !flipped ? "opacity-100" : "opacity-0 h-0"
            }`}
          >
            <div className="text-sm text-gray-500 animate-pulse">
              Tap the card to reveal
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Stake TON to start unlocking cards
            </p>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
            >
              Start Staking
              <span className="text-lg">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
