"use client";

import { useEffect, useState, useRef, useCallback, type MouseEvent } from "react";
import type { Achievement, AchievementCategory } from "@/lib/achievements";
import { useTranslation } from "@/components/providers/LanguageProvider";

// ─── Category Styles (shared with AchievementCard) ────────────────────────────

const CATEGORY_COLORS: Record<AchievementCategory, { border: string; bg: string; glow: string }> = {
  onboarding: { border: "#22c55e", bg: "from-green-900/60 to-green-800/30", glow: "rgba(34,197,94,0.4)" },
  staking:    { border: "#f59e0b", bg: "from-amber-900/60 to-yellow-800/30", glow: "rgba(245,158,11,0.4)" },
  explore:    { border: "#3b82f6", bg: "from-blue-900/60 to-blue-800/30", glow: "rgba(59,130,246,0.4)" },
  social:     { border: "#a855f7", bg: "from-purple-900/60 to-purple-800/30", glow: "rgba(168,85,247,0.4)" },
  special:    { border: "#f59e0b", bg: "from-amber-900/50 to-rose-900/30", glow: "rgba(245,158,11,0.5)" },
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  onboarding: "ONBOARDING",
  staking: "STAKING",
  explore: "EXPLORE",
  social: "SOCIAL",
  special: "SPECIAL",
};

function getRarity(points: number): { stars: number; label: string } {
  if (points >= 1000) return { stars: 5, label: "LEGENDARY" };
  if (points >= 500) return { stars: 4, label: "EPIC" };
  if (points >= 250) return { stars: 3, label: "RARE" };
  if (points >= 150) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CardDetailModalProps {
  achievement: Achievement;
  unlocked: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ achievement, unlocked, onClose }: CardDetailModalProps) {
  const { locale } = useTranslation();
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const title = locale === "ko" ? achievement.titleKo : achievement.titleEn;
  const desc = locale === "ko" ? achievement.descKo : achievement.descEn;
  const cat = CATEGORY_COLORS[achievement.category];
  const rarity = getRarity(achievement.points);
  const isSpecial = achievement.category === "special";
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !unlocked) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 15;
    const rx = -((e.clientY - cy) / (rect.height / 2)) * 15;
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        visible ? "bg-black/70 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-8 transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large card */}
        <div style={{ perspective: "1200px" }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleLeave}
            className={`relative transition-transform duration-200 ease-out ${
              unlocked ? "" : "grayscale"
            }`}
            style={{
              transform: hovered && unlocked
                ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.02)`
                : "rotateX(0) rotateY(0) scale(1)",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="relative w-[260px] h-[364px] sm:w-[300px] sm:h-[420px] rounded-2xl overflow-hidden"
              style={{
                border: `3px solid ${unlocked ? cat.border : "rgba(255,255,255,0.1)"}`,
                boxShadow: unlocked
                  ? `0 0 40px ${cat.glow}, 0 8px 32px rgba(0,0,0,0.5)`
                  : "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${unlocked ? cat.bg : "from-gray-900/80 to-gray-800/60"}`} />

              {/* Hologram for special */}
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

              {/* Light reflection */}
              {hovered && unlocked && (
                <div
                  className="absolute inset-0 pointer-events-none z-[4]"
                  style={{
                    background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.35) 0%, transparent 50%)`,
                  }}
                />
              )}

              {/* Card content */}
              <div className="relative z-[2] h-full flex flex-col p-5">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[9px] font-bold tracking-[0.2em] px-2 py-1 rounded"
                    style={{
                      backgroundColor: unlocked ? `${cat.border}25` : "rgba(255,255,255,0.05)",
                      color: unlocked ? cat.border : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {CATEGORY_LABELS[achievement.category]}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    #{achievement.id.split("-").pop()?.toUpperCase()}
                  </span>
                </div>

                {/* Illustration */}
                <div className="flex-1 flex items-center justify-center">
                  {unlocked ? (
                    <div className="text-7xl sm:text-8xl drop-shadow-lg select-none">
                      {achievement.icon}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-7xl sm:text-8xl opacity-15 blur-[3px] select-none">
                        {achievement.icon}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-white/25 text-3xl">?</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px w-full mb-3" style={{ backgroundColor: unlocked ? `${cat.border}40` : "rgba(255,255,255,0.08)" }} />

                {/* Bottom info */}
                <div>
                  <div className={`text-base font-bold mb-1 ${unlocked ? "text-white" : "text-gray-600"}`}>
                    {unlocked ? title : "???"}
                  </div>
                  <div className={`text-xs leading-relaxed mb-2 ${unlocked ? "text-gray-400" : "text-gray-700"}`}>
                    {unlocked ? desc : "???"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div
                      className="text-sm tracking-wider"
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
                    <span
                      className="text-sm font-bold font-mono-num"
                      style={{ color: unlocked ? "#fcd34d" : "rgba(255,255,255,0.15)" }}
                    >
                      {achievement.points} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close hint */}
        <button
          onClick={handleClose}
          className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
        >
          ESC or tap to close
        </button>
      </div>
    </div>
  );
}
