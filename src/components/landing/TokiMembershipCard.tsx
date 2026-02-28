"use client";

import { useState, useRef, useCallback, MouseEvent, useEffect } from "react";
import Image from "next/image";

/* ─── Card Data ─────────────────────────────────────────────────────────────── */

interface CardData {
  level: number;
  tier: string;
  name: string;
  bgImage: string | null;   // null = fallback gradient
  charImage: string | null;  // null = silhouette
  gradient: string;          // fallback or overlay
  stars: number;
  achievements: string;
  xp: string;
  locked: boolean;
}

const CARDS: CardData[] = [
  {
    level: 1,
    tier: "BRONZE",
    name: "Beginner",
    bgImage: "/card-bg-bronze.png",
    charImage: "/toki-card-bronze.png",
    gradient: "from-amber-950 to-amber-800",
    stars: 1,
    achievements: "5/19",
    xp: "500 XP",
    locked: false,
  },
  {
    level: 2,
    tier: "SILVER",
    name: "Explorer",
    bgImage: null,
    charImage: null,
    gradient: "from-gray-500 to-gray-700",
    stars: 2,
    achievements: "8/19",
    xp: "1,500 XP",
    locked: true,
  },
  {
    level: 3,
    tier: "GOLD",
    name: "Staker",
    bgImage: null,
    charImage: null,
    gradient: "from-yellow-700 to-amber-600",
    stars: 3,
    achievements: "12/19",
    xp: "3,000 XP",
    locked: true,
  },
  {
    level: 4,
    tier: "PLATINUM",
    name: "Expert",
    bgImage: null,
    charImage: null,
    gradient: "from-slate-400 to-slate-600",
    stars: 4,
    achievements: "16/19",
    xp: "5,000 XP",
    locked: true,
  },
  {
    level: 5,
    tier: "TOKI BLACK",
    name: "Master",
    bgImage: null,
    charImage: null,
    gradient: "from-gray-950 to-cyan-950",
    stars: 5,
    achievements: "19/19",
    xp: "MAX",
    locked: true,
  },
];

/* ─── Single Card Component ─────────────────────────────────────────────────── */

function MemberCard({
  card,
  isCenter,
}: {
  card: CardData;
  isCenter: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
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
  }, []);

  const handleLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }, []);

  const starsStr = "\u2605".repeat(card.stars) + "\u2606".repeat(5 - card.stars);

  return (
    <div
      className={`flex-shrink-0 transition-all duration-500 ${
        isCenter ? "scale-100 opacity-100 z-10" : "scale-[0.85] opacity-60"
      }`}
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        className="relative cursor-pointer transition-transform duration-200 ease-out"
        style={{
          transform: hovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            : "rotateX(0) rotateY(0)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Card */}
        <div className="relative w-[420px] h-[265px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Background: image or gradient */}
          {card.bgImage ? (
            <Image
              src={card.bgImage}
              alt={card.tier}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
          )}

          {/* Dark overlay for locked */}
          {card.locked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />
          )}

          {/* Light reflection */}
          {hovered && !card.locked && (
            <div
              className="absolute inset-0 pointer-events-none z-[5] transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.35) 0%, transparent 55%)`,
              }}
            />
          )}

          {/* Card content */}
          <div className="relative h-full z-[2] flex">
            {/* Left: Character */}
            <div className="w-[45%] h-full flex items-end justify-center relative">
              {card.charImage && !card.locked ? (
                <div className="relative w-full h-full">
                  <Image
                    src={card.charImage}
                    alt={card.name}
                    fill
                    className="object-contain object-bottom drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="w-[55%] h-full p-5 flex flex-col justify-between">
              {/* Top label */}
              <div>
                <div
                  className="text-[9px] font-semibold tracking-[0.3em] mb-1.5"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  }}
                >
                  TOKI STAKING MEMBER
                </div>
                <div
                  className="text-xl font-black tracking-[0.15em]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                  }}
                >
                  {card.tier}
                </div>
              </div>

              {/* Middle: Stars + Level */}
              <div>
                <div
                  className="text-lg mb-0.5"
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
                  className="text-xs font-medium tracking-[0.08em]"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  Level {card.level} &middot; {card.name}
                </div>
              </div>

              {/* Bottom: Stats */}
              <div>
                <div className="border-t border-white/15 mb-2" />
                {card.locked ? (
                  <div
                    className="text-[10px] tracking-wide"
                    style={{ color: "rgba(255,255,255,0.35)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    Reach Level {card.level} to unlock
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] tracking-wide">
                      <span style={{ color: "rgba(255,255,255,0.45)", textShadow: "0 1px 1px rgba(0,0,0,0.4)" }}>
                        Achievements
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: "rgba(255,255,255,0.8)", textShadow: "0 1px 1px rgba(0,0,0,0.4)" }}
                      >
                        {card.achievements}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] tracking-wide mt-1">
                      <span style={{ color: "rgba(255,255,255,0.45)", textShadow: "0 1px 1px rgba(0,0,0,0.4)" }}>
                        XP
                      </span>
                      <span
                        className="font-bold"
                        style={{
                          background: "linear-gradient(180deg, #fcd34d 0%, #d97706 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
                        }}
                      >
                        {card.xp}
                      </span>
                    </div>
                    <div
                      className="text-[9px] font-mono mt-2.5 tracking-[0.12em]"
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        textShadow: "0 1px 1px rgba(0,0,0,0.5)",
                      }}
                    >
                      0x1a2B...9fE0
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Carousel Section ──────────────────────────────────────────────────────── */

export default function TokiMembershipCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cardWidth = 420;
    const gap = 32;
    const containerWidth = container.offsetWidth;
    const scrollTarget = index * (cardWidth + gap) - (containerWidth - cardWidth) / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, []);

  // Sync activeIndex with scroll position
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const handleScroll = () => {
      const cardWidth = 420;
      const gap = 32;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft + (containerWidth - cardWidth) / 2;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveIndex(Math.max(0, Math.min(index, CARDS.length - 1)));
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Initial scroll to center first card
  useEffect(() => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cardWidth = 420;
      const containerWidth = container.offsetWidth;
      const scrollTarget = -(containerWidth - cardWidth) / 2;
      container.scrollLeft = scrollTarget;
    }
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
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

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-8 overflow-x-auto px-[calc(50vw-210px)] pb-8 snap-x snap-mandatory carousel-scroll"
        >
          {CARDS.map((card, i) => (
            <div key={card.level} className="snap-center" onClick={() => scrollToIndex(i)}>
              <MemberCard card={card} isCenter={i === activeIndex} />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {CARDS.map((card, i) => (
            <button
              key={card.level}
              onClick={() => scrollToIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeIndex
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="flex justify-center items-center gap-4 mt-12 px-4">
          <div className="relative w-16 h-16 flex-shrink-0 card-float">
            <Image
              src="/toki-wink.png"
              alt="Toki"
              fill
              className="object-contain"
            />
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 max-w-xs">
            <p className="text-sm text-gray-300">
              Which card will you earn?
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .carousel-scroll::-webkit-scrollbar {
          display: none;
        }
        .carousel-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .card-float {
          animation: cardFloat 3s ease-in-out infinite;
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  );
}
