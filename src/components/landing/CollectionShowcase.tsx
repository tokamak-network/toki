"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

const RARITY_COLORS: Record<string, string> = {
  COMMON: "#9ca3af",
  UNCOMMON: "#60a5fa",
  RARE: "#a78bfa",
  EPIC: "#ffd700",
  LEGENDARY: "#ff4444",
};

function getRarity(points: number) {
  if (points >= 1000) return { stars: 5, label: "LEGENDARY" };
  if (points >= 500) return { stars: 4, label: "EPIC" };
  if (points >= 250) return { stars: 3, label: "RARE" };
  if (points >= 150) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

// Reveal these specific cards (mix of rarities for visual interest)
const REVEALED_IDS = new Set([
  "onboarding-wallet",   // COMMON - green
  "stake-100",           // EPIC - amber
  "onboarding-complete", // EPIC - green
  "power-user",          // LEGENDARY - red
  "explore-visit",       // COMMON - blue
  "stake-first",         // UNCOMMON - amber
]);

function getHoloGradient(angle: number, stars: number): string {
  if (stars >= 5) {
    return `linear-gradient(${angle}deg,
      rgba(255,0,0,0.3) 0%, rgba(255,165,0,0.3) 14%,
      rgba(255,255,0,0.3) 28%, rgba(0,255,0,0.3) 42%,
      rgba(0,100,255,0.3) 57%, rgba(128,0,255,0.3) 71%,
      rgba(255,0,128,0.3) 85%, rgba(255,0,0,0.3) 100%)`;
  }
  if (stars >= 4) {
    return `linear-gradient(${angle}deg,
      rgba(255,200,50,0.35) 0%, rgba(255,120,50,0.25) 33%,
      rgba(100,200,255,0.25) 66%, rgba(255,200,50,0.35) 100%)`;
  }
  if (stars >= 3) {
    return `linear-gradient(${angle}deg,
      rgba(150,200,255,0.25) 0%, rgba(200,150,255,0.2) 50%,
      rgba(150,200,255,0.25) 100%)`;
  }
  if (stars >= 2) {
    return `linear-gradient(${angle}deg,
      transparent 25%, rgba(200,230,255,0.2) 50%, transparent 75%)`;
  }
  return `linear-gradient(${angle}deg,
    transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`;
}

function getHoloOpacity(stars: number): number {
  if (stars >= 5) return 0.7;
  if (stars >= 4) return 0.5;
  if (stars >= 3) return 0.35;
  if (stars >= 2) return 0.2;
  return 0.12;
}

/* ── Revealed card with holographic cursor-tracking ── */
function HoloCard({
  achievement,
  color,
  rarity,
}: {
  achievement: (typeof ACHIEVEMENTS)[number];
  color: string;
  rarity: { stars: number; label: string };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const rafId = useRef<number>(0);

  const handleMove = useCallback((e: React.MouseEvent) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    });
  }, []);

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    setMouse(null);
  }, []);

  const isHovered = mouse !== null;
  const rotateX = mouse ? (mouse.y - 0.5) * -15 : 0;
  const rotateY = mouse ? (mouse.x - 0.5) * 15 : 0;
  const holoAngle = mouse
    ? Math.atan2(mouse.y - 0.5, mouse.x - 0.5) * (180 / Math.PI) + 90
    : 0;
  const shineX = mouse ? mouse.x * 100 : 50;
  const shineY = mouse ? mouse.y * 100 : 50;
  const rarityColor = RARITY_COLORS[rarity.label];

  return (
    <div
      className="relative group"
      style={{ perspective: "800px" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      ref={cardRef}
    >
      <div
        className="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden will-change-transform"
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
            : "rotateX(0) rotateY(0) scale(1)",
          transformStyle: "preserve-3d",
          transition: isHovered
            ? "transform 0.08s linear"
            : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          border: `2px solid ${color}`,
          boxShadow: isHovered
            ? `0 0 20px ${color}40, 0 0 60px ${color}15, 0 20px 40px rgba(0,0,0,0.4)`
            : "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Card image */}
        <Image
          src={CARD_IMAGES[achievement.id]}
          alt={achievement.titleEn}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
        />

        {/* Holographic rainbow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isHovered ? getHoloOpacity(rarity.stars) : 0,
            background: getHoloGradient(holoAngle, rarity.stars),
            mixBlendMode: "color-dodge",
            transition: "opacity 0.3s",
          }}
        />

        {/* Spotlight that follows cursor */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.25) 0%, transparent 55%)`,
            mixBlendMode: "overlay",
            transition: "opacity 0.3s",
          }}
        />

        {/* Edge highlight on tilt */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg sm:rounded-xl"
          style={{
            opacity: isHovered ? 0.4 : 0,
            boxShadow: `inset 0 0 30px 0 ${color}20`,
            transition: "opacity 0.3s",
          }}
        />
      </div>

      {/* Rarity stars on hover */}
      {isHovered && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center items-center gap-0.5">
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <span
              key={i}
              className="text-[10px]"
              style={{
                color: rarityColor,
                textShadow: `0 0 6px ${rarityColor}`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Locked card with flip-to-peek reveal ── */
function LockedCard({
  achievement,
  color,
  rarity,
}: {
  achievement: (typeof ACHIEVEMENTS)[number];
  color: string;
  rarity: { stars: number; label: string };
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isFlipped) return;

    setIsFlipped(true);

    // Glow burst for RARE+
    if (rarity.stars >= 3) {
      setShowGlow(true);
    }

    // Flip back after peek
    timerRef.current = setTimeout(() => {
      setIsFlipped(false);
      setShowGlow(false);
    }, 2200);
  }, [isFlipped, rarity.stars]);

  const rarityColor = RARITY_COLORS[rarity.label];
  const hasImage = !!CARD_IMAGES[achievement.id];

  return (
    <div
      className="relative group"
      style={{ perspective: "800px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow burst behind card on reveal */}
      {showGlow && (
        <div
          className="absolute -inset-3 rounded-2xl pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle, ${rarityColor}50 0%, ${rarityColor}20 40%, transparent 70%)`,
            filter: "blur(10px)",
            animation: "glowPulse 0.8s ease-out forwards",
          }}
        />
      )}

      {/* Card flip container */}
      <div
        className="relative aspect-[2/3] rounded-lg sm:rounded-xl cursor-pointer z-[1]"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
        }}
        onClick={handleClick}
      >
        {/* ─ Front face: locked state ─ */}
        <div
          className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            border: `2px solid ${isHovered && !isFlipped ? `${color}40` : "rgba(255,255,255,0.08)"}`,
            boxShadow: isHovered && !isFlipped
              ? `0 0 15px ${color}20, 0 8px 24px rgba(0,0,0,0.3)`
              : "0 4px 16px rgba(0,0,0,0.3)",
            transition: "box-shadow 0.3s, border-color 0.3s, transform 0.3s",
            transform: isHovered && !isFlipped ? "scale(1.03)" : "scale(1)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 flex flex-col items-center justify-center gap-2">
            <div className="text-2xl sm:text-3xl opacity-20" style={{ color }}>
              ?
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 opacity-10">
              <Image
                src="/toki-logo.png"
                alt=""
                width={32}
                height={32}
                className="opacity-50"
              />
            </div>

            {/* Tap hint */}
            {isHovered && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span
                  className="text-[9px] text-gray-500 tracking-wider uppercase"
                  style={{ animation: "fadeInUp 0.3s ease-out" }}
                >
                  tap to peek
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─ Back face: peeked content ─ */}
        <div
          className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: `2px solid ${rarityColor}80`,
            boxShadow: `0 0 30px ${rarityColor}30, 0 12px 40px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Blurred card preview */}
          {hasImage && (
            <Image
              src={CARD_IMAGES[achievement.id]}
              alt=""
              fill
              className="object-cover blur-[10px] brightness-[0.4] saturate-50"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
            />
          )}
          {!hasImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
          )}

          {/* Info overlay */}
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1.5 p-2">
            <div className="text-base">🔒</div>
            <div className="text-[10px] sm:text-xs text-white/90 text-center font-semibold leading-tight">
              {achievement.titleEn}
            </div>
            <div className="text-[8px] sm:text-[10px] text-white/50 text-center leading-tight px-1">
              {achievement.descEn}
            </div>
            {/* Stars */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: rarity.stars }).map((_, i) => (
                <span
                  key={i}
                  className="text-[9px]"
                  style={{
                    color: rarityColor,
                    textShadow: `0 0 4px ${rarityColor}`,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div
              className="text-[8px] tracking-[0.15em] uppercase font-bold mt-0.5"
              style={{ color: rarityColor }}
            >
              {rarity.label}
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip (only before flipping) */}
      {isHovered && !isFlipped && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-900/95 border border-white/10 shadow-xl">
          <div className="text-[10px] text-gray-400 text-center">
            {achievement.descEn}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function CollectionShowcase() {
  const revealed = ACHIEVEMENTS.filter((a) => REVEALED_IDS.has(a.id)).length;

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Keyframe animations */}
      <style>{`
        @keyframes glowPulse {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 tracking-widest mb-6">
            {ACHIEVEMENTS.length} CARDS TO COLLECT
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            YOUR CARD{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
              COLLECTION
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Complete quests.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">
              Unlock
            </span>{" "}
            them all.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {ACHIEVEMENTS.map((achievement) => {
            const isRevealed = REVEALED_IDS.has(achievement.id);
            const color = CATEGORY_COLORS[achievement.category];
            const rarity = getRarity(achievement.points);

            if (isRevealed && CARD_IMAGES[achievement.id]) {
              return (
                <HoloCard
                  key={achievement.id}
                  achievement={achievement}
                  color={color}
                  rarity={rarity}
                />
              );
            }

            return (
              <LockedCard
                key={achievement.id}
                achievement={achievement}
                color={color}
                rarity={rarity}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>REVEALED</span>
            <span className="font-mono">
              {revealed} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-amber transition-all duration-1000"
              style={{ width: `${(revealed / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
          >
            Start Collecting
            <span className="text-lg">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
