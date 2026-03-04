"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
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

type AchievementItem = (typeof ACHIEVEMENTS)[number];
const CARDS_WITH_IMAGES = ACHIEVEMENTS.filter((a) => CARD_IMAGES[a.id]);
const MARQUEE_CARDS = [...CARDS_WITH_IMAGES, ...CARDS_WITH_IMAGES];

// Pick a visually striking card for the initial gacha
const FEATURED_CARD =
  CARDS_WITH_IMAGES.find((a) => a.id === "onboarding-complete") || CARDS_WITH_IMAGES[0];

/* ─── Phase 1: Gacha Card Flip ─────────────────────────────────────────────── */

function GachaPhase({ onRevealComplete }: { onRevealComplete: () => void }) {
  const [phase, setPhase] = useState<"idle" | "burst" | "flipped">("idle");
  const card = FEATURED_CARD;
  const rarity = getRarity(card.points);
  const color = CATEGORY_COLORS[card.category];
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

  const handleFlip = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("burst");
    setTimeout(() => setPhase("flipped"), 400);
  }, [phase]);

  const handleContinue = useCallback(() => {
    onRevealComplete();
  }, [onRevealComplete]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Card */}
      <div onClick={handleFlip} className="relative cursor-pointer" style={{ perspective: "1000px" }}>
        {/* Light burst */}
        {phase === "burst" && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full z-0 animate-[burstPulse_0.6s_ease-out_forwards]"
            style={{ background: `radial-gradient(circle, ${color}60 0%, transparent 70%)` }}
          />
        )}

        <div
          className="relative w-[220px] h-[308px] sm:w-[260px] sm:h-[364px] transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: phase === "flipped" ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Back */}
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
              <Image src="/toki-logo.png" alt="Toki" width={56} height={56} className="opacity-30" />
              <div className="text-[10px] tracking-[0.3em] text-white/20 uppercase">Tap to reveal</div>
            </div>
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ boxShadow: "inset 0 0 60px rgba(34,211,238,0.08)" }}
            />
          </div>

          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              border: `2px solid ${color}`,
              boxShadow: `0 0 30px ${color}40, 0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {CARD_IMAGES[card.id] && (
              <Image src={CARD_IMAGES[card.id]} alt={card.titleEn} fill className="object-cover" sizes="260px" />
            )}
          </div>
        </div>

        {/* Particles */}
        {phase === "flipped" && (
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

      {/* Info after flip */}
      <div
        className={`text-center transition-all duration-500 ${
          phase === "flipped" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="text-sm font-bold text-white mb-1">{card.titleEn}</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}20` }}>
            {rarity.label}
          </span>
          <span
            className="text-xs tracking-wider"
            style={{ background: "linear-gradient(180deg, #fcd34d, #b45309)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            {starsStr}
          </span>
        </div>
        <button
          onClick={handleContinue}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
        >
          See all {CARDS_WITH_IMAGES.length} cards
          <span className="text-lg">&rarr;</span>
        </button>
      </div>

      {/* Tap prompt */}
      {phase === "idle" && (
        <div className="text-sm text-gray-500 animate-pulse">Tap the card to reveal</div>
      )}
    </div>
  );
}

/* ─── Phase 2: Card Wall Marquee ───────────────────────────────────────────── */

function TiltCard({ achievement }: { achievement: AchievementItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[achievement.category];

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setRotation({
      x: -((e.clientY - cy) / (rect.height / 2)) * 12,
      y: ((e.clientX - cx) / (rect.width / 2)) * 12,
    });
    setLight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }, []);

  return (
    <div style={{ perspective: "800px" }}>
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        className="relative transition-transform duration-200 ease-out cursor-pointer"
        style={{
          transform: hovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.08)`
            : "rotateX(0) rotateY(0) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative w-[160px] h-[224px] sm:w-[180px] sm:h-[252px] rounded-xl overflow-hidden"
          style={{
            border: `2px solid ${hovered ? color : "rgba(255,255,255,0.1)"}`,
            boxShadow: hovered
              ? `0 0 24px ${color}30, 0 16px 48px rgba(0,0,0,0.5)`
              : "0 8px 32px rgba(0,0,0,0.4)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          {CARD_IMAGES[achievement.id] && (
            <Image src={CARD_IMAGES[achievement.id]} alt={achievement.titleEn} fill className="object-cover" sizes="180px" />
          )}
          {hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{ background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function WallPhase() {
  return (
    <div className="animate-[fadeIn_0.6s_ease-out]">
      <div className="gtw-container">
        <div className="gtw-track">
          {MARQUEE_CARDS.map((card, i) => (
            <div key={`${card.id}-${i}`} className="gtw-item">
              <TiltCard achievement={card} />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-12 px-4">
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
        >
          Start Your Collection
          <span className="text-lg">&rarr;</span>
        </a>
      </div>

      {/* Edge fade */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function GachaThenWall() {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-25">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-14 px-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 tracking-widest mb-6">
            {CARDS_WITH_IMAGES.length} UNIQUE CARDS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            {revealed ? (
              <>ACHIEVEMENT{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
                  CARDS
                </span>
              </>
            ) : (
              <>COLLECT YOUR{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
                  TOKI CARDS
                </span>
              </>
            )}
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            {revealed ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 font-semibold">Stake</span>.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 font-semibold">Explore</span>.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">Collect</span> them all.
              </>
            ) : (
              <>
                Complete quests to unlock{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">exclusive cards</span>.
              </>
            )}
          </p>
        </div>

        {/* Phase switch */}
        {revealed ? (
          <WallPhase />
        ) : (
          <GachaPhase onRevealComplete={() => setRevealed(true)} />
        )}
      </div>

      <style jsx>{`
        .gtw-container {
          overflow: hidden;
          width: 100%;
          padding: 1rem 0 1.5rem;
        }
        .gtw-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: gtw-scroll 40s linear infinite;
        }
        .gtw-track:hover {
          animation-play-state: paused;
        }
        .gtw-item {
          flex-shrink: 0;
        }
        @keyframes gtw-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
