"use client";

import Image from "next/image";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

interface ClaimChoiceProps {
  tier: PrizeTier;
  onChoose: (choice: "discount" | "ton") => void;
  loading?: boolean;
}

export default function ClaimChoice({ tier, onChoose, loading }: ClaimChoiceProps) {
  const prize = PRIZE_TIERS[tier];

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/toki-presenting.png"
        alt="Toki"
        width={140}
        height={140}
        className="drop-shadow-2xl"
      />

      <div className="space-y-1">
        <p className="text-lg font-bold text-white">
          {prize.emoji} {prize.label} 어떻게 받을래?
        </p>
        <p className="text-sm text-gray-400">둘 중 하나를 선택해줘~</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Discount option */}
        <button
          onClick={() => onChoose("discount")}
          disabled={loading}
          className="w-full p-4 rounded-2xl text-left
            bg-white/5 border border-white/10 hover:border-accent-amber/50
            hover:bg-accent-amber/5
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/20 flex items-center justify-center
              text-xl shrink-0 group-hover:scale-110 transition-transform">
              🍺
            </div>
            <div>
              <p className="font-bold text-white">바에서 할인 받기</p>
              <p className="text-xs text-gray-400 mt-0.5">
                오늘 이 바에서 {prize.label} 가치만큼 할인!
                <br />
                QR 코드를 스탭에게 보여주면 돼~
              </p>
            </div>
          </div>
        </button>

        {/* TON claim option */}
        <button
          onClick={() => onChoose("ton")}
          disabled={loading}
          className="w-full p-4 rounded-2xl text-left
            bg-white/5 border border-white/10 hover:border-accent-cyan/50
            hover:bg-accent-cyan/5
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center
              text-xl shrink-0 group-hover:scale-110 transition-transform">
              💎
            </div>
            <div>
              <p className="font-bold text-white">내 지갑으로 받기</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {prize.label}을 내 지갑으로 전송!
                <br />
                스테이킹하면 보상도 쌓여~
              </p>
            </div>
          </div>
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 animate-pulse">처리 중...</p>
      )}
    </div>
  );
}
