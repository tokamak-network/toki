"use client";

import Image from "next/image";

const CARDS = [
  {
    id: "onboarding",
    title: "Welcome Adventurer",
    description: "Complete your first steps",
    achievements: "5/5 Achievements",
    rarity: "SR",
    sprite: "/characters/toki-cheer.png",
    gradient: "from-amber-900/30 to-yellow-600/20",
    borderColor: "border-yellow-500",
    rarityColor: "text-yellow-300",
    unlocked: true,
  },
  {
    id: "staking",
    title: "Master Staker",
    description: "Become a staking expert",
    achievements: "6/6 Achievements",
    rarity: "SSR",
    sprite: "/characters/toki-proud.png",
    gradient: "from-cyan-900/30 to-blue-600/20",
    borderColor: "border-cyan-400",
    rarityColor: "text-cyan-300",
    unlocked: true,
  },
  {
    id: "explore",
    title: "Explorer",
    description: "Discover the ecosystem",
    achievements: "3/3 Achievements",
    rarity: "SR",
    sprite: "/characters/toki-excited.png",
    gradient: "from-purple-900/30 to-indigo-600/20",
    borderColor: "border-purple-500",
    rarityColor: "text-purple-300",
    unlocked: false,
  },
  {
    id: "social",
    title: "Social Butterfly",
    description: "Connect with Toki",
    achievements: "3/3 Achievements",
    rarity: "R",
    sprite: "/characters/toki-wink.png",
    gradient: "from-pink-900/30 to-rose-600/20",
    borderColor: "border-pink-500",
    rarityColor: "text-pink-300",
    unlocked: false,
  },
  {
    id: "special",
    title: "Legend",
    description: "Complete everything",
    achievements: "2/2 Achievements",
    rarity: "UR+",
    sprite: "/characters/toki-proud.png",
    gradient: "from-emerald-900/30 to-teal-600/20",
    borderColor: "",
    rarityColor: "text-emerald-300",
    unlocked: false,
  },
] as const;

export default function TokiTradingCards() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Title Area with Toki */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src="/characters/toki-excited.png"
              alt="Toki"
              fill
              className="object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            />
          </div>
          <div className="relative bg-gray-800/90 backdrop-blur-sm border border-cyan-500/30 rounded-2xl px-8 py-4 max-w-xl">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 border-l border-b border-cyan-500/30 rotate-45" />
            <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Collect Toki Trading Cards!
            </h2>
          </div>
        </div>
        <p className="text-center text-gray-400 text-lg">
          Unlock exclusive cards by completing achievement categories
        </p>
      </div>

      {/* Card Carousel */}
      <div className="max-w-7xl mx-auto">
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory px-4 trading-scrollbar">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0 w-72 snap-center"
              style={{ perspective: "1000px" }}
            >
              <div
                className={`
                  relative aspect-[3/4] rounded-xl overflow-hidden
                  transition-all duration-500
                  ${card.unlocked ? "hover:rotate-y-5 hover:-rotate-x-3 hover:scale-105" : ""}
                `}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />

                {/* Border */}
                {card.id === "special" ? (
                  <div className="absolute inset-0 rounded-xl p-[3px] rainbow-border">
                    <div className="absolute inset-0 rounded-xl" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 border-2 ${card.borderColor} rounded-xl`} />
                )}

                {/* Holographic Shimmer (unlocked only) */}
                {card.unlocked && <div className="absolute inset-0 shimmer-effect pointer-events-none" />}

                {/* Card Content */}
                <div className="relative h-full p-5 flex flex-col">
                  {/* Rarity Badge */}
                  <div className="flex justify-between items-start">
                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                      <span className={`text-xs font-bold ${card.rarityColor}`}>
                        {card.rarity}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                      #{card.id}
                    </div>
                  </div>

                  {/* Toki Sprite */}
                  <div className="flex-1 flex items-center justify-center py-4">
                    {card.unlocked ? (
                      <div className="relative w-44 h-44">
                        <Image
                          src={card.sprite}
                          alt={card.title}
                          fill
                          className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        />
                      </div>
                    ) : (
                      <div className="relative w-44 h-44">
                        <Image
                          src={card.sprite}
                          alt="Locked"
                          fill
                          className="object-contain opacity-15 blur-sm grayscale"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border-2 border-gray-600 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="text-center space-y-2">
                    <h3
                      className={`text-xl font-bold ${
                        card.unlocked ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={`text-xs ${
                        card.unlocked ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {card.description}
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                        card.unlocked
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-gray-800/50 text-gray-600 border border-gray-700"
                      }`}
                    >
                      {card.achievements}
                    </div>
                  </div>
                </div>

                {/* Locked Overlay */}
                {!card.unlocked && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Text */}
      <p className="text-center text-gray-600 text-sm mt-4">
        Complete all achievements to collect every card!
      </p>

      <style jsx>{`
        .shimmer-effect {
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255, 255, 255, 0.08) 38%,
            rgba(255, 255, 255, 0.15) 40%,
            rgba(255, 255, 255, 0.08) 42%,
            transparent 50%
          );
          background-size: 250% 100%;
          animation: shimmer 4s infinite linear;
        }

        @keyframes shimmer {
          0% { background-position: 250% 0; }
          100% { background-position: -250% 0; }
        }

        .rainbow-border {
          background: linear-gradient(
            135deg,
            #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000
          );
          background-size: 400% 400%;
          animation: rainbow-shift 3s linear infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        @keyframes rainbow-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hover\\:rotate-y-5:hover {
          transform: perspective(1000px) rotateY(5deg) rotateX(-3deg);
        }

        .trading-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .trading-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .trading-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
    </section>
  );
}
