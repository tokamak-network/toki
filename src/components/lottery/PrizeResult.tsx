"use client";

import Image from "next/image";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

interface PrizeResultProps {
  tier: PrizeTier;
  onContinue: () => void;
}

export default function PrizeResult({ tier, onContinue }: PrizeResultProps) {
  const prize = PRIZE_TIERS[tier];
  const isJackpot = tier === "jackpot";
  const isLucky = tier === "lucky";

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      {/* Toki character with mood */}
      <div className={`relative ${isJackpot ? "animate-bounce-in" : "animate-character-entrance"}`}>
        <Image
          src={`/characters/toki-${prize.tokiMood}.png`}
          alt="Toki"
          width={200}
          height={200}
          className="drop-shadow-2xl"
        />
        {isJackpot && (
          <div className="absolute -top-4 -right-4 text-4xl animate-wiggle">
            👑
          </div>
        )}
      </div>

      {/* Prize amount */}
      <div className="space-y-2">
        <p className="text-lg text-gray-400">축하해요!</p>
        <div className={`text-5xl font-black ${
          isJackpot
            ? "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent"
            : isLucky
            ? "bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent"
            : "text-white"
        }`}>
          {prize.emoji} {prize.label}
        </div>
        <p className="text-sm text-gray-500">당첨!</p>
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full max-w-xs py-3 rounded-xl font-bold text-lg
          bg-gradient-to-r from-accent-cyan to-accent-blue
          text-white shadow-lg shadow-accent-cyan/20
          hover:shadow-accent-cyan/40 hover:scale-[1.02]
          active:scale-[0.98] transition-all duration-200"
      >
        당첨금 받으러 가기!
      </button>
      <p className="text-xs text-gray-500">
        계정을 만들면 당첨금을 받을 수 있어요
      </p>
    </div>
  );
}
