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

/* ─── 3D Tilt Card (Marquee Item) ──────────────────────────────────────────── */

function TiltCard({
  achievement,
  onClick,
}: {
  achievement: AchievementItem;
  onClick: () => void;
}) {
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
        onClick={onClick}
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
          {hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Fullscreen Card Reveal Overlay ───────────────────────────────────────── */

function CardRevealOverlay({
  achievement,
  onClose,
}: {
  achievement: AchievementItem;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<
    "backdrop" | "card-enter" | "burst" | "flip" | "text" | "particles" | "idle"
  >("backdrop");
  const [exiting, setExiting] = useState(false);

  const rarity = getRarity(achievement.points);
  const isLegendary = rarity.label === "LEGENDARY";
  const color = CATEGORY_COLORS[achievement.category];
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

  // Animation sequence
  useState(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("card-enter"), 150));
    timers.push(setTimeout(() => setPhase("burst"), 400));
    timers.push(setTimeout(() => setPhase("flip"), 700));
    timers.push(setTimeout(() => setPhase("text"), 1200));
    timers.push(setTimeout(() => setPhase("particles"), 1400));
    timers.push(setTimeout(() => setPhase("idle"), 2200));
    return () => timers.forEach(clearTimeout);
  });

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onClose, 500);
  }, [exiting, onClose]);

  const phaseIndex = [
    "backdrop", "card-enter", "burst", "flip", "text", "particles", "idle",
  ].indexOf(phase);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={phaseIndex >= 5 ? handleClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Legendary gold flash */}
      {isLegendary && phaseIndex >= 3 && (
        <div
          className="absolute inset-0 pointer-events-none animate-[legendaryFlash_1s_ease-out_forwards]"
          style={{
            boxShadow:
              "inset 0 0 80px rgba(245,158,11,0.4), inset 0 0 200px rgba(245,158,11,0.1)",
          }}
        />
      )}

      {/* Light burst */}
      {phaseIndex >= 2 && (
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-[burstPulse_0.8s_ease-out_forwards] opacity-0"
          style={{
            background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Card */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          exiting
            ? "scale-50 translate-y-[30vh] opacity-0"
            : phaseIndex >= 1
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0"
        }`}
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-[200px] h-[280px] sm:w-[240px] sm:h-[336px] transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: phaseIndex >= 3 ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/toki-logo.png" alt="Toki" width={48} height={48} className="opacity-30" />
            </div>
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ boxShadow: `inset 0 0 40px ${color}20` }}
            />
          </div>

          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              border: `2px solid ${color}`,
              boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
            }}
          >
            {CARD_IMAGES[achievement.id] && (
              <Image
                src={CARD_IMAGES[achievement.id]}
                alt={achievement.titleEn}
                fill
                className="object-cover"
                sizes="240px"
              />
            )}
          </div>
        </div>

        {/* Particles */}
        {phaseIndex >= 5 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: isLegendary ? 16 : 8 }).map((_, i) => (
              <span
                key={i}
                className="absolute animate-[floatUp_2s_ease-out_forwards] opacity-0"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  bottom: "20%",
                  fontSize: `${isLegendary ? 14 + Math.random() * 10 : 10 + Math.random() * 8}px`,
                  color: isLegendary ? "#fcd34d" : color,
                  textShadow: `0 0 8px ${isLegendary ? "#fcd34d" : color}`,
                  animationDelay: `${Math.random() * 1}s`,
                }}
              >
                {"\u2605"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Text */}
      <div
        className={`absolute bottom-[14%] sm:bottom-[17%] left-0 right-0 text-center transition-all duration-500 ${
          phaseIndex >= 4 && !exiting
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold text-white mb-1">
          {achievement.titleEn}
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className="text-xs font-bold tracking-wider px-2 py-0.5 rounded"
            style={{ color, backgroundColor: `${color}20` }}
          >
            {rarity.label}
          </span>
          <span
            className="text-sm tracking-wider"
            style={{
              background: "linear-gradient(180deg, #fcd34d, #b45309)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {starsStr}
          </span>
        </div>
        <div className="text-accent-amber font-mono text-base font-bold mb-3">
          +{achievement.points} XP
        </div>

        {phaseIndex >= 6 && (
          <div className="text-gray-500 text-xs animate-pulse">Tap to close</div>
        )}
      </div>
    </div>
  );
}

/* ─── Main: Card Wall + Gacha ──────────────────────────────────────────────── */

export default function CardWallGacha() {
  const [selected, setSelected] = useState<AchievementItem | null>(null);

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
            TAP A CARD TO REVEAL
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

        {/* Marquee */}
        <div className="cwg-container">
          <div className="cwg-track">
            {MARQUEE_CARDS.map((card, i) => (
              <div key={`${card.id}-${i}`} className="cwg-item">
                <TiltCard
                  achievement={card}
                  onClick={() => setSelected(card)}
                />
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

      {/* Fullscreen reveal overlay */}
      {selected && (
        <CardRevealOverlay
          key={selected.id}
          achievement={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <style jsx>{`
        .cwg-container {
          overflow: hidden;
          width: 100%;
          padding: 1rem 0 1.5rem;
        }
        .cwg-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: cwg-scroll 40s linear infinite;
        }
        .cwg-track:hover {
          animation-play-state: paused;
        }
        .cwg-item {
          flex-shrink: 0;
        }
        @keyframes cwg-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
