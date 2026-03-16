"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import type { Achievement, AchievementCategory } from "@/lib/achievements";

// ─── Card Image Map (same as AchievementCard) ──────────────────────────────
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

// ─── Category Colors ────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<AchievementCategory, { border: string; glow: string }> = {
  onboarding: { border: "#22c55e", glow: "rgba(34,197,94,0.4)" },
  staking: { border: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  explore: { border: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  social: { border: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  special: { border: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
};

// ─── Rarity ─────────────────────────────────────────────────────────────────
function getRarity(points: number): { stars: number; label: string } {
  if (points >= 1000) return { stars: 5, label: "LEGENDARY" };
  if (points >= 500) return { stars: 4, label: "EPIC" };
  if (points >= 250) return { stars: 3, label: "RARE" };
  if (points >= 150) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

function isHighRarity(points: number): boolean {
  const rarity = getRarity(points);
  return rarity.label === "EPIC" || rarity.label === "LEGENDARY";
}

// ─── CSS Particle Generator ─────────────────────────────────────────────────
function Particles({ count, color, legendary }: { count: number; color: string; legendary?: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {Array.from({ length: count }).map((_, i) => {
        const left = 10 + Math.random() * 80;
        const delay = Math.random() * 1.5;
        const duration = 1.5 + Math.random() * 1;
        const size = legendary ? 14 + Math.random() * 10 : 10 + Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute animate-[floatUp_var(--dur)_ease-out_var(--delay)_forwards] opacity-0"
            style={{
              left: `${left}%`,
              bottom: "30%",
              fontSize: `${size}px`,
              color,
              "--delay": `${delay}s`,
              "--dur": `${duration}s`,
              textShadow: `0 0 8px ${color}`,
            } as React.CSSProperties}
          >
            {"\u2605"}
          </span>
        );
      })}
    </div>
  );
}

// ─── Card Back (CSS) ────────────────────────────────────────────────────────
function CardBack({ borderColor }: { borderColor: string }) {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden"
      style={{
        backfaceVisibility: "hidden",
        border: `2px solid ${borderColor}`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/toki-logo.png"
          alt="Toki"
          width={48}
          height={48}
          className="opacity-40"
        />
      </div>
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px ${borderColor}40` }}
      />
    </div>
  );
}

// ─── Mini Toast (COMMON / UNCOMMON / RARE) ──────────────────────────────────
const MINI_DURATION = 4000;

function MiniToast({
  achievement,
  locale,
  onDismiss,
}: {
  achievement: Achievement;
  locale: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => setVisible(true));
    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 400);
    }, MINI_DURATION);
    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleClick = useCallback(() => {
    setExiting(true);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  const title = locale === "ko" ? achievement.titleKo : achievement.titleEn;
  const rarity = getRarity(achievement.points);
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);
  const cat = CATEGORY_COLORS[achievement.category];
  const cardImage = CARD_IMAGES[achievement.id];

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer flex items-center gap-3 px-4 py-3 rounded-2xl
        bg-background/95 backdrop-blur-xl border shadow-2xl
        transition-all duration-400 ease-out ${
          visible && !exiting
            ? "translate-x-0 opacity-100"
            : "translate-x-[120%] opacity-0"
        }`}
      style={{
        borderColor: `${cat.border}40`,
        boxShadow: `0 0 20px ${cat.glow}, 0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Card thumbnail */}
      <div
        className="w-[52px] h-[73px] flex-shrink-0 relative rounded-lg overflow-hidden animate-[glowPulse_2s_ease-in-out_infinite]"
        style={{
          border: `2px solid ${cat.border}`,
          "--glow-color": cat.glow,
        } as React.CSSProperties}
      >
        {cardImage ? (
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover"
            sizes="52px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-xl">{achievement.icon}</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold tracking-wider text-accent-cyan uppercase">
          {t.achievements.toastCardUnlocked}
        </div>
        <div className="text-sm text-gray-100 font-semibold truncate mt-0.5">
          {title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-accent-amber font-mono-num text-xs font-semibold">
            {t.achievements.toastXp.replace("{points}", String(achievement.points))}
          </span>
          <span
            className="text-[10px] tracking-wider"
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

      {/* Gold particles */}
      <div className="absolute -top-1 -right-1 pointer-events-none overflow-hidden w-16 h-16">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute animate-[miniFloat_2s_ease-out_forwards] text-accent-amber opacity-0"
            style={{
              right: `${8 + i * 12}px`,
              bottom: "0",
              fontSize: "10px",
              animationDelay: `${0.3 + i * 0.4}s`,
            }}
          >
            {"\u2605"}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Full Reveal (EPIC / LEGENDARY) ─────────────────────────────────────────
const FULL_AUTO_DISMISS = 8000;

function FullReveal({
  achievement,
  locale,
  onDismiss,
}: {
  achievement: Achievement;
  locale: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<
    "backdrop" | "card-enter" | "burst" | "flip" | "text" | "particles" | "idle"
  >("backdrop");
  const [exiting, setExiting] = useState(false);

  const rarity = getRarity(achievement.points);
  const isLegendary = rarity.label === "LEGENDARY";
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);
  const cat = CATEGORY_COLORS[achievement.category];
  const cardImage = CARD_IMAGES[achievement.id];
  const title = locale === "ko" ? achievement.titleKo : achievement.titleEn;

  // Animation sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("card-enter"), 200));
    timers.push(setTimeout(() => setPhase("burst"), 500));
    timers.push(setTimeout(() => setPhase("flip"), 800));
    timers.push(setTimeout(() => setPhase("text"), 1300));
    timers.push(setTimeout(() => setPhase("particles"), 1500));
    timers.push(setTimeout(() => setPhase("idle"), 2500));

    // Auto dismiss
    timers.push(
      setTimeout(() => {
        handleDismiss();
      }, FULL_AUTO_DISMISS)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDismiss, 600);
  }, [exiting, onDismiss]);

  const phaseIndex = ["backdrop", "card-enter", "burst", "flip", "text", "particles", "idle"].indexOf(phase);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={phaseIndex >= 5 ? handleDismiss : undefined}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${
          phaseIndex >= 0 ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Legendary gold border flash */}
      {isLegendary && phaseIndex >= 3 && (
        <div
          className="absolute inset-0 pointer-events-none animate-[legendaryFlash_1s_ease-out_forwards]"
          style={{
            boxShadow: "inset 0 0 80px rgba(245,158,11,0.4), inset 0 0 200px rgba(245,158,11,0.1)",
          }}
        />
      )}

      {/* Light burst */}
      {phaseIndex >= 2 && (
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-[burstPulse_0.8s_ease-out_forwards] opacity-0"
          style={{
            background: `radial-gradient(circle, ${cat.glow} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Card container */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          exiting
            ? "scale-50 translate-x-[40vw] translate-y-[30vh] opacity-0"
            : phaseIndex >= 1
              ? "scale-100 opacity-100"
              : "scale-0 opacity-0"
        }`}
        style={{
          perspective: "1000px",
        }}
      >
        {/* Card flip wrapper */}
        <div
          className="relative w-[180px] h-[252px] sm:w-[220px] sm:h-[308px] transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: phaseIndex >= 3 ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Card back */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardBack borderColor={cat.border} />
          </div>

          {/* Card front */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              border: `2px solid ${cat.border}`,
              boxShadow: `0 0 30px ${cat.glow}, 0 0 60px ${cat.glow}`,
            }}
          >
            {cardImage ? (
              <Image
                src={cardImage}
                alt={title}
                fill
                className="object-cover"
                sizes="220px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-6xl">{achievement.icon}</span>
              </div>
            )}
          </div>
        </div>

        {/* Particles */}
        {phaseIndex >= 5 && (
          <Particles
            count={isLegendary ? 16 : 8}
            color={isLegendary ? "#fcd34d" : cat.border}
            legendary={isLegendary}
          />
        )}
      </div>

      {/* Text overlay */}
      <div
        className={`absolute bottom-[15%] sm:bottom-[18%] left-0 right-0 text-center transition-all duration-500 ${
          phaseIndex >= 4 && !exiting
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
        }`}
      >
        <div className="text-[11px] font-bold tracking-[0.25em] text-accent-cyan uppercase mb-2">
          {t.achievements.toastCardUnlocked}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white mb-1">
          {title}
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span
            className="text-xs font-bold tracking-wider px-2 py-0.5 rounded"
            style={{
              color: cat.border,
              backgroundColor: `${cat.border}20`,
            }}
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
        <div className="text-accent-amber font-mono-num text-lg font-bold">
          {t.achievements.toastXp.replace("{points}", String(achievement.points))}
        </div>

        {phaseIndex >= 6 && (
          <div className="mt-4 text-gray-500 text-xs animate-pulse">
            {t.achievements.toastTapToClose}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AchievementToast() {
  const { unlockQueue, dismissToast } = useAchievement();
  const { locale } = useTranslation();

  const current = unlockQueue[0];
  if (!current) return null;

  const showFull = isHighRarity(current.points);

  if (showFull) {
    return (
      <FullReveal
        key={current.id}
        achievement={current}
        locale={locale}
        onDismiss={dismissToast}
      />
    );
  }

  return (
    <div className="fixed top-16 md:top-auto md:bottom-6 right-4 z-[60] w-[380px] max-w-[calc(100%-2rem)]">
      <MiniToast
        key={current.id}
        achievement={current}
        locale={locale}
        onDismiss={dismissToast}
      />
    </div>
  );
}
