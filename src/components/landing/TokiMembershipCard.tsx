"use client";

import { useState, useRef, MouseEvent } from "react";

type MembershipLevel = 1 | 2 | 3 | 4 | 5;

interface LevelTheme {
  level: MembershipLevel;
  name: string;
  gradient: string;
  tier: string;
  shimmer?: boolean;
  glow?: boolean;
}

const LEVEL_THEMES: Record<MembershipLevel, LevelTheme> = {
  1: {
    level: 1,
    name: "Bronze",
    gradient: "from-amber-950 to-amber-800",
    tier: "BRONZE",
  },
  2: {
    level: 2,
    name: "Silver",
    gradient: "from-gray-400 to-gray-600",
    tier: "SILVER",
  },
  3: {
    level: 3,
    name: "Gold",
    gradient: "from-yellow-600 to-amber-500",
    tier: "GOLD",
    shimmer: true,
  },
  4: {
    level: 4,
    name: "Platinum",
    gradient: "from-slate-300 to-slate-500",
    tier: "PLATINUM",
    shimmer: true,
  },
  5: {
    level: 5,
    name: "Toki Black",
    gradient: "from-gray-950 to-cyan-950",
    tier: "TOKI BLACK",
    shimmer: true,
    glow: true,
  },
};

export default function TokiMembershipCard() {
  const [selectedLevel, setSelectedLevel] = useState<MembershipLevel>(4);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [lightPosition, setLightPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateY = (mouseX / (rect.width / 2)) * 15;
    const rotateX = -(mouseY / (rect.height / 2)) * 15;

    setRotation({ x: rotateX, y: rotateY });

    const lightX = ((e.clientX - rect.left) / rect.width) * 100;
    const lightY = ((e.clientY - rect.top) / rect.height) * 100;
    setLightPosition({ x: lightX, y: lightY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setLightPosition({ x: 50, y: 50 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const currentTheme = LEVEL_THEMES[selectedLevel];
  const stars = "★".repeat(selectedLevel) + "☆".repeat(5 - selectedLevel);

  return (
    <section className="relative py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">
            TOKI STAKING MEMBER CARD
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Complete achievements. Level up. Earn your card.
          </p>
        </div>

        {/* Main Card Display */}
        <div className="flex justify-center mb-12" style={{ perspective: "1000px" }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            className="relative cursor-pointer transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Card Container */}
            <div
              className={`relative w-[600px] h-[378px] rounded-2xl overflow-hidden shadow-2xl ${
                currentTheme.glow ? "ring-2 ring-cyan-400/50 animate-pulse-glow" : ""
              }`}
            >
              {/* Card Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} ${
                  currentTheme.shimmer ? "animate-shimmer" : ""
                }`}
                style={
                  currentTheme.shimmer
                    ? {
                        backgroundSize: "200% 200%",
                      }
                    : undefined
                }
              />

              {/* Light Reflection Overlay */}
              {isHovered && (
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at ${lightPosition.x}% ${lightPosition.y}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
                  }}
                />
              )}

              {/* Card Content */}
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                {/* Top: Card Type */}
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium tracking-wider opacity-90">
                    TOKI STAKING MEMBER
                  </div>
                </div>

                {/* Middle: Toki Character */}
                <div className="flex justify-center items-center flex-1">
                  <div className="w-40 h-40 relative">
                    <img
                      src="/toki-proud.png"
                      alt="Toki Character"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>

                {/* Bottom: Member Info */}
                <div className="space-y-3">
                  {/* Stars and Level */}
                  <div>
                    <div className="text-2xl mb-1" style={{ letterSpacing: "0.1em" }}>
                      {stars}
                    </div>
                    <div className="text-base font-semibold">
                      Level {selectedLevel} · {currentTheme.name}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/30 w-1/2" />

                  {/* Wallet Address */}
                  <div className="text-sm font-mono opacity-90">0x1a2B...9fE0</div>

                  {/* Footer Info */}
                  <div className="flex justify-between items-end text-sm pt-2">
                    <div className="space-y-0.5">
                      <div className="font-bold tracking-wider text-base">
                        {currentTheme.tier}
                      </div>
                      <div className="border-t border-white/40 w-32" />
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="opacity-90">19/19 Achievements</div>
                      <div className="font-semibold">5,000 XP</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sparkle effect for Gold and above */}
              {currentTheme.shimmer && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-sparkle opacity-0" />
                  <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-sparkle-delayed opacity-0" />
                  <div className="absolute bottom-1/3 left-2/3 w-1 h-1 bg-white rounded-full animate-sparkle-slow opacity-0" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Level Selector Thumbnails */}
        <div className="flex justify-center gap-4 mb-16">
          {([1, 2, 3, 4, 5] as MembershipLevel[]).map((level) => {
            const theme = LEVEL_THEMES[level];
            const isSelected = selectedLevel === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`relative w-28 h-[70px] rounded-lg overflow-hidden transition-all duration-300 hover:scale-110 ${
                  isSelected
                    ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/50"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} ${
                    theme.shimmer ? "animate-shimmer" : ""
                  }`}
                  style={
                    theme.shimmer
                      ? {
                          backgroundSize: "200% 200%",
                        }
                      : undefined
                  }
                />
                <div className="relative h-full flex flex-col items-center justify-center text-white p-2">
                  <div className="text-xs font-bold tracking-wide mb-1">{theme.tier}</div>
                  <div className="text-[10px] opacity-80">Lv{level}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom: Toki Speech Bubble */}
        <div className="flex justify-center items-center gap-6">
          {/* Toki Character */}
          <div className="w-24 h-24 relative animate-float">
            <img
              src="/toki-wink.png"
              alt="Toki"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>

          {/* Speech Bubble */}
          <div className="relative bg-white text-gray-900 px-6 py-4 rounded-2xl shadow-xl max-w-xs">
            <div className="text-lg font-medium">Which card will you earn?</div>
            {/* Speech bubble tail */}
            <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-4 h-4 bg-white rotate-45" />
          </div>
        </div>
      </div>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 211, 238, 0.8);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-sparkle-delayed {
          animation: sparkle 2s ease-in-out infinite 0.5s;
        }

        .animate-sparkle-slow {
          animation: sparkle 3s ease-in-out infinite 1s;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
