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

const CARDS_WITH_IMAGES = ACHIEVEMENTS.filter((a) => CARD_IMAGES[a.id]);
// Split into two rows, offset by half for visual variety
const MID = Math.ceil(CARDS_WITH_IMAGES.length / 2);
const ROW1_BASE = CARDS_WITH_IMAGES.slice(0, MID);
const ROW2_BASE = CARDS_WITH_IMAGES.slice(MID);
// Duplicate for seamless infinite loop
const ROW1_CARDS = [...ROW1_BASE, ...ROW1_BASE];
const ROW2_CARDS = [...ROW2_BASE, ...ROW2_BASE];

/* ─── Single Card with 3D Tilt ─────────────────────────────────────────────── */

function TiltCard({ achievement }: { achievement: (typeof ACHIEVEMENTS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const color = CATEGORY_COLORS[achievement.category];
  const rarity = getRarity(achievement.points);
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

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
            <Image
              src={CARD_IMAGES[achievement.id]}
              alt={achievement.titleEn}
              fill
              className="object-cover"
              sizes="180px"
            />
          )}

          {/* Light reflection */}
          {hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              }}
            />
          )}
        </div>

        {/* Info on hover */}
        <div
          className={`absolute -bottom-14 left-0 right-0 text-center transition-all duration-300 ${
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="text-xs font-bold text-white truncate">{achievement.titleEn}</div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              className="text-[9px] font-bold tracking-wider"
              style={{ color }}
            >
              {rarity.label}
            </span>
            <span
              className="text-[9px]"
              style={{
                background: "linear-gradient(180deg, #fcd34d, #b45309)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {starsStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Marquee Section ──────────────────────────────────────────────────────── */

export default function FloatingCardWall() {
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
            COMMON &middot; UNCOMMON &middot; RARE &middot; EPIC &middot; LEGENDARY
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            ACHIEVEMENT{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
              CARDS
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 font-semibold">Stake</span>.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 font-semibold">Explore</span>.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">Collect</span> them all.
          </p>
        </div>

        {/* Row 1: right to left */}
        <div className="cardwall-container">
          <div className="cardwall-track">
            {ROW1_CARDS.map((card, i) => (
              <div key={`r1-${card.id}-${i}`} className="cardwall-item">
                <TiltCard achievement={card} />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: left to right (reverse) */}
        <div className="cardwall-container cardwall-container-row2">
          <div className="cardwall-track-reverse">
            {ROW2_CARDS.map((card, i) => (
              <div key={`r2-${card.id}-${i}`} className="cardwall-item">
                <TiltCard achievement={card} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 px-4">
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
          >
            Start Your Collection
            <span className="text-lg">&rarr;</span>
          </a>
        </div>
      </div>

      {/* Edge fade */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

      <style jsx>{`
        .cardwall-container {
          overflow: hidden;
          width: 100%;
          padding: 0.5rem 0;
        }
        .cardwall-container-row2 {
          margin-top: 1.5rem;
        }
        .cardwall-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: cardwall-scroll 35s linear infinite;
        }
        .cardwall-track:hover {
          animation-play-state: paused;
        }
        .cardwall-track-reverse {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: cardwall-scroll-reverse 38s linear infinite;
        }
        .cardwall-track-reverse:hover {
          animation-play-state: paused;
        }
        .cardwall-item {
          flex-shrink: 0;
        }
        @keyframes cardwall-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes cardwall-scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
