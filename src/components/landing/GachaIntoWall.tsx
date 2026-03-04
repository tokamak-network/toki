"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";
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

const MID = Math.ceil(CARDS_WITH_IMAGES.length / 2);
const ROW1_BASE = CARDS_WITH_IMAGES.slice(0, MID);
const ROW2_BASE = CARDS_WITH_IMAGES.slice(MID);
const ROW1_CARDS = [...ROW1_BASE, ...ROW1_BASE];
const ROW2_CARDS = [...ROW2_BASE, ...ROW2_BASE];

const FEATURED =
  CARDS_WITH_IMAGES.find((a) => a.id === "onboarding-complete") || CARDS_WITH_IMAGES[0];
const FEATURED_ROW1_INDEX = ROW1_BASE.findIndex((a) => a.id === FEATURED.id);

// idle → flip-burst → revealed → wall-draw → card-fly → running
type Phase = "idle" | "flip-burst" | "revealed" | "wall-draw" | "card-fly" | "running";

/* ─── 3D Tilt Card ─────────────────────────────────────────────────────────── */

function TiltCard({
  achievement,
  innerRef,
  dimmed,
}: {
  achievement: AchievementItem;
  innerRef?: React.Ref<HTMLDivElement>;
  dimmed?: boolean;
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
    <div style={{ perspective: "800px" }} ref={innerRef}>
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
          opacity: dimmed ? 0 : 1,
          transition: dimmed
            ? "opacity 0.01s"
            : "transform 0.2s ease-out, opacity 0.4s ease",
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

/* ─── Main ─────────────────────────────────────────────────────────────────── */

export default function GachaIntoWall() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({});

  const gachaCardRef = useRef<HTMLDivElement>(null);
  const targetSlotRef = useRef<HTMLDivElement>(null);

  const card = FEATURED;
  const rarity = getRarity(card.points);
  const color = CATEGORY_COLORS[card.category];
  const starsStr = "\u2605".repeat(rarity.stars) + "\u2606".repeat(5 - rarity.stars);

  const handleFlip = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("flip-burst");
    setTimeout(() => setPhase("revealed"), 400);
  }, [phase]);

  // revealed → wall-draw (after 1.5s)
  useEffect(() => {
    if (phase !== "revealed") return;
    const t = setTimeout(() => setPhase("wall-draw"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // wall-draw → card-fly (after wall fades in, ~700ms)
  useEffect(() => {
    if (phase !== "wall-draw") return;
    const t = setTimeout(() => {
      if (gachaCardRef.current && targetSlotRef.current) {
        const from = gachaCardRef.current.getBoundingClientRect();
        const to = targetSlotRef.current.getBoundingClientRect();

        // Center-to-center offset
        const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        const scale = Math.min(to.width / from.width, to.height / from.height);

        setFlyStyle({
          transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateY(360deg)`,
          transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease 0.6s",
          opacity: 0,
        });
      }
      setPhase("card-fly");
    }, 700);
    return () => clearTimeout(t);
  }, [phase]);

  // card-fly → running (after fly animation completes)
  useEffect(() => {
    if (phase !== "card-fly") return;
    const t = setTimeout(() => setPhase("running"), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const isGacha = phase === "idle" || phase === "flip-burst" || phase === "revealed";
  const showWall = phase === "wall-draw" || phase === "card-fly" || phase === "running";
  const isRunning = phase === "running";
  const showFloatingCard = isGacha || phase === "wall-draw" || phase === "card-fly";

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
            {showWall ? `${CARDS_WITH_IMAGES.length} UNIQUE CARDS` : "TAP TO REVEAL"}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
            {showWall ? (
              <>
                ACHIEVEMENT{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
                  CARDS
                </span>
              </>
            ) : (
              <>
                COLLECT YOUR{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
                  TOKI CARDS
                </span>
              </>
            )}
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            {showWall ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 font-semibold">Stake</span>.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 font-semibold">Explore</span>.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">Collect</span> them all.
              </>
            ) : (
              "Complete quests to unlock exclusive cards."
            )}
          </p>
        </div>

        {/* ─── Floating Gacha Card ─── */}
        {showFloatingCard && (
          <div
            ref={gachaCardRef}
            className="relative z-30 mx-auto"
            style={{
              width: "fit-content",
              ...flyStyle,
            }}
          >
            <div
              onClick={handleFlip}
              className="relative"
              style={{ perspective: "1000px" }}
            >
              {/* Light burst */}
              {phase === "flip-burst" && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full z-0 animate-[burstPulse_0.6s_ease-out_forwards]"
                  style={{
                    background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
                  }}
                />
              )}

              <div
                className={`relative w-[220px] h-[308px] sm:w-[260px] sm:h-[364px] ${
                  phase === "idle" ? "cursor-pointer giw-peek" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transition: phase === "idle" ? "none" : "transform 0.7s ease-out",
                  transform:
                    phase !== "idle" && phase !== "flip-burst"
                      ? "rotateY(180deg)"
                      : "rotateY(0deg)",
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
                    <div className="text-[11px] tracking-[0.3em] uppercase font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">Tap to reveal</div>
                  </div>
                  <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(34,211,238,0.08)" }} />
                  {/* Shimmer sweep (idle only) */}
                  {phase === "idle" && <div className="giw-shimmer" />}
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
              {phase === "revealed" && (
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

            {/* Card info */}
            {phase === "revealed" && (
              <div className="text-center mt-4">
                <div className="text-sm font-bold text-white mb-1">{card.titleEn}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded" style={{ color, backgroundColor: `${color}20` }}>
                    {rarity.label}
                  </span>
                  <span className="text-xs tracking-wider" style={{ background: "linear-gradient(180deg, #fcd34d, #b45309)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {starsStr}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Card Wall ─── */}
        {showWall && (
          <div
            style={{
              opacity: phase === "wall-draw" ? 0 : 1,
              transform: phase === "wall-draw" ? "translateY(20px)" : "translateY(0)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
              // Trigger the transition after mount
              ...(phase === "wall-draw" ? { animation: "wallReveal 0.6s ease forwards" } : {}),
            }}
          >
            {/* Row 1 */}
            <div className="giw-container">
              <div className={`giw-track ${isRunning ? "giw-track-animate" : ""}`}>
                {ROW1_CARDS.map((c, i) => {
                  const isTarget =
                    c.id === FEATURED.id && i === FEATURED_ROW1_INDEX;
                  return (
                    <div key={`r1-${c.id}-${i}`} className="giw-item">
                      <TiltCard
                        achievement={c}
                        innerRef={isTarget ? targetSlotRef : undefined}
                        dimmed={isTarget && !isRunning}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2 (reverse) */}
            <div className="giw-container giw-row2">
              <div className={`giw-track-reverse ${isRunning ? "giw-track-reverse-animate" : ""}`}>
                {ROW2_CARDS.map((c, i) => (
                  <div key={`r2-${c.id}-${i}`} className="giw-item">
                    <TiltCard achievement={c} />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              className="text-center mt-12 px-4"
              style={{
                opacity: isRunning ? 1 : 0,
                transition: "opacity 0.5s ease 0.3s",
              }}
            >
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold text-sm hover:bg-accent-cyan/20 transition-colors"
              >
                Start Your Collection
                <span className="text-lg">&rarr;</span>
              </a>
            </div>
          </div>
        )}

        {/* Tap prompt (idle only) */}
        {phase === "idle" && (
          <div className="text-center mt-8 text-sm font-medium animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
            Tap the card to reveal
          </div>
        )}
      </div>

      {/* Edge fade */}
      {showWall && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        </>
      )}

      <style jsx>{`
        .giw-container {
          overflow: hidden;
          width: 100%;
          padding: 0.5rem 0;
        }
        .giw-row2 {
          margin-top: 1.5rem;
        }
        .giw-track, .giw-track-reverse {
          display: flex;
          gap: 1.5rem;
          width: max-content;
        }
        .giw-track-animate {
          animation: giw-scroll 35s linear infinite;
        }
        .giw-track-animate:hover {
          animation-play-state: paused;
        }
        .giw-track-reverse-animate {
          animation: giw-scroll-reverse 38s linear infinite;
        }
        .giw-track-reverse-animate:hover {
          animation-play-state: paused;
        }
        .giw-item {
          flex-shrink: 0;
        }
        @keyframes giw-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes giw-scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes wallReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Peek Tilt — card tilts to tease the front face */
        .giw-peek {
          animation: giw-peekTilt 7s ease-in-out infinite;
        }
        @keyframes giw-peekTilt {
          0% { transform: rotateY(0deg); }
          17% { transform: rotateY(-12deg); }
          27% { transform: rotateY(-12deg); }
          40% { transform: rotateY(0deg); }
          57% { transform: rotateY(12deg); }
          67% { transform: rotateY(12deg); }
          80% { transform: rotateY(0deg); }
          100% { transform: rotateY(0deg); }
        }

        /* Shimmer sweep — diagonal light streak */
        .giw-shimmer {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }
        /* Left-to-right sweep (left tilt) */
        .giw-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 40%;
          height: 200%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.12) 45%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.12) 55%,
            transparent 70%
          );
          animation: giw-shimmerLTR 7s ease-in-out infinite;
        }
        @keyframes giw-shimmerLTR {
          0%, 10% { transform: translateX(0); }
          32% { transform: translateX(400%); }
          32.1%, 100% { transform: translateX(0); }
        }

        /* Right-to-left sweep (right tilt) */
        .giw-shimmer::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -60%;
          width: 40%;
          height: 200%;
          background: linear-gradient(
            -105deg,
            transparent 30%,
            rgba(255,255,255,0.12) 45%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.12) 55%,
            transparent 70%
          );
          animation: giw-shimmerRTL 7s ease-in-out infinite;
        }
        @keyframes giw-shimmerRTL {
          0%, 50% { transform: translateX(0); }
          72% { transform: translateX(-400%); }
          72.1%, 100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
