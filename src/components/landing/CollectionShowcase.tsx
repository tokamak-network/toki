"use client";

import { useState } from "react";
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

// Reveal these specific cards (mix of rarities for visual interest)
const REVEALED_IDS = new Set([
  "onboarding-wallet",   // COMMON - green
  "stake-100",           // EPIC - amber
  "onboarding-complete", // EPIC - green
  "power-user",          // LEGENDARY - red
  "explore-visit",       // COMMON - blue
  "stake-first",         // UNCOMMON - amber
]);

export default function CollectionShowcase() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const revealed = ACHIEVEMENTS.filter((a) => REVEALED_IDS.has(a.id)).length;

  return (
    <section className="relative py-24 overflow-hidden">
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-semibold">Unlock</span> them all.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {ACHIEVEMENTS.map((achievement) => {
            const isRevealed = REVEALED_IDS.has(achievement.id);
            const color = CATEGORY_COLORS[achievement.category];
            const rarity = getRarity(achievement.points);
            const isHovered = hoveredId === achievement.id;

            return (
              <div
                key={achievement.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(achievement.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className={`relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${
                    isRevealed
                      ? "hover:scale-105 hover:-translate-y-1"
                      : "hover:scale-102"
                  }`}
                  style={{
                    border: `2px solid ${isRevealed ? color : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isRevealed && isHovered
                      ? `0 0 20px ${color}30, 0 8px 32px rgba(0,0,0,0.4)`
                      : "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  {isRevealed && CARD_IMAGES[achievement.id] ? (
                    <Image
                      src={CARD_IMAGES[achievement.id]}
                      alt={achievement.titleEn}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                    />
                  ) : (
                    /* Locked card */
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 flex flex-col items-center justify-center gap-2">
                      <div
                        className="text-2xl sm:text-3xl opacity-20"
                        style={{ color }}
                      >
                        ?
                      </div>
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 opacity-10"
                      >
                        <Image
                          src="/toki-logo.png"
                          alt=""
                          width={32}
                          height={32}
                          className="opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover tooltip for locked cards */}
                {!isRevealed && isHovered && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-900/95 border border-white/10 shadow-xl">
                    <div className="text-[10px] text-gray-400 text-center">
                      {achievement.descEn}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>REVEALED</span>
            <span className="font-mono">{revealed} / {ACHIEVEMENTS.length}</span>
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
