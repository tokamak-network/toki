"use client";

import { useState, useRef, useCallback, type MouseEvent } from "react";
import Image from "next/image";
import type { Achievement, AchievementCategory } from "@/lib/achievements";

// ─── Card Image Map ──────────────────────────────────────────────────────────
// Maps achievement IDs to card image paths in /public/cards/
const CARD_IMAGES: Record<string, string> = {
  "onboarding-wallet": "/cards/onboarding-wallet.png",
  "onboarding-bridge": "/cards/onboarding-bridge.png",
  "onboarding-exchange": "/cards/onboarding-exchange.png",
  "onboarding-ton": "/cards/onboarding-ton.png",
  "onboarding-complete": "/cards/onboarding-complete.png",
  "stake-first": "/cards/stake-first.png",
};

// ─── Category Styles ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<AchievementCategory, { border: string; bg: string; glow: string; text: string }> = {
  onboarding: { border: "#22c55e", bg: "from-green-900/40 to-green-800/20", glow: "rgba(34,197,94,0.3)", text: "text-green-400" },
  staking:    { border: "#f59e0b", bg: "from-amber-900/40 to-yellow-800/20", glow: "rgba(245,158,11,0.3)", text: "text-amber-400" },
  explore:    { border: "#3b82f6", bg: "from-blue-900/40 to-blue-800/20", glow: "rgba(59,130,246,0.3)", text: "text-blue-400" },
  social:     { border: "#a855f7", bg: "from-purple-900/40 to-purple-800/20", glow: "rgba(168,85,247,0.3)", text: "text-purple-400" },
  special:    { border: "#f59e0b", bg: "from-amber-900/30 to-rose-900/20", glow: "rgba(245,158,11,0.4)", text: "text-amber-300" },
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  onboarding: "ONBOARDING",
  staking: "STAKING",
  explore: "EXPLORE",
  social: "SOCIAL",
  special: "SPECIAL",
};

// ─── Rarity from points ───────────────────────────────────────────────────────

function getRarity(points: number): { stars: number; label: string } {
  if (points >= 1000) return { stars: 5, label: "LEGENDARY" };
  if (points >= 500) return { stars: 4, label: "EPIC" };
  if (points >= 250) return { stars: 3, label: "RARE" };
  if (points >= 150) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  title: string;
  isNew?: boolean;
  onClick?: () => void;
}

export default function AchievementCard({ achievement, unlocked, title, isNew, onClick }: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !unlocked) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 12;
    const rx = -((e.clientY - cy) / (rect.height / 2)) * 12;
    setRotation({ x: rx, y: ry });
    setLight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [unlocked]);

  const handleLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }, []);

  const cat = CATEGORY_COLORS[achievement.category];
  const rarity = getRarity(achievement.points);
  const isSpecial = achievement.category === "special";
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);
  const cardImage = CARD_IMAGES[achievement.id];
  const hasImage = !!cardImage;

  // Card with actual image — the image IS the card (includes border, title, XP, etc.)
  if (hasImage) {
    return (
      <div style={{ perspective: "800px" }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleLeave}
          onClick={onClick}
          className={`relative cursor-pointer transition-transform duration-200 ease-out ${
            unlocked ? "" : "grayscale brightness-50"
          }`}
          style={{
            transform: hovered && unlocked
              ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
              : "rotateX(0) rotateY(0) scale(1)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden bg-black"
            style={{
              aspectRatio: "630/948",
              border: `2px solid ${unlocked ? cat.border : "rgba(255,255,255,0.1)"}`,
              boxShadow: unlocked ? `0 0 20px ${cat.glow}, 0 4px 20px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <Image
              src={cardImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
            />

            {/* Light reflection on hover */}
            {hovered && unlocked && (
              <div
                className="absolute inset-0 pointer-events-none z-[4]"
                style={{
                  background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                }}
              />
            )}

            {/* Locked overlay */}
            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[3]">
                <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                  <span className="text-white/40 text-lg">?</span>
                </div>
              </div>
            )}

            {/* NEW badge */}
            {isNew && unlocked && (
              <div className="absolute top-1.5 right-1.5 z-[5]">
                <span className="px-1.5 py-0.5 rounded text-[7px] font-black tracking-wider bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30">
                  NEW
                </span>
              </div>
            )}
          </div>

          {/* Unlocked glow pulse */}
          {unlocked && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none animate-pulse opacity-20"
              style={{ boxShadow: `inset 0 0 30px ${cat.glow}` }}
            />
          )}
        </div>
      </div>
    );
  }

  // Fallback: emoji-based card for achievements without images
  return (
    <div style={{ perspective: "800px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        onClick={onClick}
        className={`relative cursor-pointer transition-transform duration-200 ease-out ${
          unlocked ? "" : "grayscale"
        }`}
        style={{
          transform: hovered && unlocked
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
            : "rotateX(0) rotateY(0) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Card body */}
        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            aspectRatio: "5/7",
            border: `2px solid ${unlocked ? cat.border : "rgba(255,255,255,0.1)"}`,
            boxShadow: unlocked ? `0 0 20px ${cat.glow}, 0 4px 20px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${unlocked ? cat.bg : "from-gray-900/80 to-gray-800/60"}`} />

          {/* Hologram overlay for special cards */}
          {isSpecial && unlocked && (
            <div
              className="absolute inset-0 pointer-events-none z-[3] opacity-30"
              style={{
                background: hovered
                  ? `conic-gradient(from ${light.x * 3.6}deg at ${light.x}% ${light.y}%, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080)`
                  : "conic-gradient(from 0deg at 50% 50%, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080)",
                mixBlendMode: "overlay",
              }}
            />
          )}

          {/* Light reflection on hover */}
          {hovered && unlocked && (
            <div
              className="absolute inset-0 pointer-events-none z-[4]"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              }}
            />
          )}

          {/* Card content */}
          <div className="relative z-[2] h-full flex flex-col p-2.5">
            {/* Top bar: category + points */}
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[7px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: unlocked ? `${cat.border}20` : "rgba(255,255,255,0.05)",
                  color: unlocked ? cat.border : "rgba(255,255,255,0.3)",
                }}
              >
                {CATEGORY_LABELS[achievement.category]}
              </span>
              <span
                className="text-[8px] font-bold font-mono-num"
                style={{ color: unlocked ? "#fcd34d" : "rgba(255,255,255,0.2)" }}
              >
                {achievement.points} XP
              </span>
            </div>

            {/* Illustration area */}
            <div className="flex-1 flex items-center justify-center relative">
              {unlocked ? (
                <div
                  className="text-4xl sm:text-5xl drop-shadow-lg select-none"
                  style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}
                >
                  {achievement.icon}
                </div>
              ) : (
                <div className="relative">
                  <div className="text-4xl sm:text-5xl opacity-20 blur-[2px] select-none">
                    {achievement.icon}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white/30 text-lg">?</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className="mt-auto">
              {/* Card name */}
              <div
                className={`text-[11px] font-bold leading-tight mb-1 truncate ${
                  unlocked ? "text-white" : "text-gray-600"
                }`}
              >
                {unlocked ? title : "???"}
              </div>

              {/* Stars */}
              <div
                className="text-[10px] tracking-wider"
                style={{
                  background: unlocked
                    ? "linear-gradient(180deg, #fcd34d, #b45309)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {starsStr}
              </div>
            </div>
          </div>

          {/* NEW badge */}
          {isNew && unlocked && (
            <div className="absolute top-1.5 right-1.5 z-[5]">
              <span className="px-1.5 py-0.5 rounded text-[7px] font-black tracking-wider bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30">
                NEW
              </span>
            </div>
          )}

          {/* Unlocked glow pulse */}
          {unlocked && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none animate-pulse opacity-20"
              style={{ boxShadow: `inset 0 0 30px ${cat.glow}` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
