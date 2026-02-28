"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
import Image from "next/image";

/* ─── Card Data ─────────────────────────────────────────────────────────────── */

interface CardData {
  level: number;
  tier: string;
  name: string;
  bgImage: string;
  charImage: string;
  stars: number;
  achievements: string;
  xp: string;
}

const CARDS: CardData[] = [
  {
    level: 1, tier: "BRONZE", name: "Beginner",
    bgImage: "/card-bg-bronze.png", charImage: "/toki-card-bronze.png",
    stars: 1, achievements: "5/19", xp: "500 XP",
  },
  {
    level: 2, tier: "SILVER", name: "Explorer",
    bgImage: "/card-bg-silver.png", charImage: "/toki-card-silver.png",
    stars: 2, achievements: "8/19", xp: "1,500 XP",
  },
  {
    level: 3, tier: "GOLD", name: "Staker",
    bgImage: "/card-bg-gold.png", charImage: "/toki-card-gold-v2.png",
    stars: 3, achievements: "12/19", xp: "3,000 XP",
  },
  {
    level: 4, tier: "PLATINUM", name: "Expert",
    bgImage: "/card-bg-platinum.png", charImage: "/toki-card-platinum.png",
    stars: 4, achievements: "16/19", xp: "5,000 XP",
  },
  {
    level: 5, tier: "TOKI BLACK", name: "Master",
    bgImage: "/card-bg-black.png", charImage: "/toki-card-black.png",
    stars: 5, achievements: "19/19", xp: "MAX",
  },
];

// Duplicate cards for seamless infinite loop
const MARQUEE_CARDS = [...CARDS, ...CARDS];

/* ─── Single Card ───────────────────────────────────────────────────────────── */

function MemberCard({ card }: { card: CardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
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
  }, []);

  const handleLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }, []);

  const starsStr = "\u2605".repeat(card.stars) + "\u2606".repeat(5 - card.stars);

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        className="relative cursor-pointer transition-transform duration-200 ease-out"
        style={{
          transform: hovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
            : "rotateX(0) rotateY(0) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative w-[380px] h-[240px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Background */}
          <Image
            src={card.bgImage}
            alt={card.tier}
            fill
            className="object-cover"
          />

          {/* Light reflection on hover */}
          {hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-[5]"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
              }}
            />
          )}

          {/* Card content */}
          <div className="relative h-full z-[2] flex">
            {/* Left: Character */}
            <div className="w-[45%] h-full relative">
              <Image
                src={card.charImage}
                alt={card.name}
                fill
                className="object-contain object-bottom drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Right: Info */}
            <div className="w-[55%] h-full p-4 flex flex-col justify-between">
              <div>
                <div
                  className="text-[8px] font-semibold tracking-[0.3em]"
                  style={{ color: "rgba(255,255,255,0.5)", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  TOKI STAKING MEMBER
                </div>
                <div
                  className="text-lg font-black tracking-[0.15em] mt-1"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                  }}
                >
                  {card.tier}
                </div>
              </div>

              <div>
                <div
                  className="text-base"
                  style={{
                    letterSpacing: "0.2em",
                    background: "linear-gradient(180deg, #fcd34d 0%, #b45309 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
                  }}
                >
                  {starsStr}
                </div>
                <div
                  className="text-[11px] font-medium tracking-[0.08em]"
                  style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  Level {card.level} &middot; {card.name}
                </div>
              </div>

              <div>
                <div className="border-t border-white/15 mb-1.5" />
                <div className="flex justify-between text-[9px] tracking-wide">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Achievements</span>
                  <span className="font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {card.achievements}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] tracking-wide mt-0.5">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>XP</span>
                  <span
                    className="font-bold"
                    style={{
                      background: "linear-gradient(180deg, #fcd34d 0%, #d97706 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {card.xp}
                  </span>
                </div>
                <div
                  className="text-[8px] font-mono mt-1.5 tracking-[0.12em]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  0x1a2B...9fE0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Infinite Marquee Section ──────────────────────────────────────────────── */

export default function TokiMembershipCard() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 tracking-widest mb-6">
            COMING SOON
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            TOKI MEMBER CARD
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Complete achievements. Level up. Earn your exclusive card.
          </p>
        </div>

        {/* Infinite marquee carousel */}
        <div className="marquee-container">
          <div className="marquee-track">
            {MARQUEE_CARDS.map((card, i) => (
              <div key={`${card.level}-${i}`} className="marquee-item">
                <MemberCard card={card} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edge fade */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-black/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-black/80 to-transparent z-20 pointer-events-none" />

      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          width: 100%;
        }

        .marquee-track {
          display: flex;
          gap: 2rem;
          width: max-content;
          animation: marquee-scroll 30s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .marquee-item {
          flex-shrink: 0;
        }

        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
