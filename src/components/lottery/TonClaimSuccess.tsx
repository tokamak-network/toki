"use client";

import Image from "next/image";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

interface TonClaimSuccessProps {
  tier: PrizeTier;
  txHash: string | null;
  walletAddress: string;
  showMission: boolean;
  onMission: () => void;
}

export default function TonClaimSuccess({
  tier,
  txHash,
  walletAddress,
  showMission,
  onMission,
}: TonClaimSuccessProps) {
  const prize = PRIZE_TIERS[tier];

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/characters/toki-celebrate.png"
        alt="Toki"
        width={160}
        height={160}
        className="drop-shadow-2xl animate-bounce-in"
      />

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">
          {prize.emoji} {prize.label} 전송 완료!
        </h2>
        <p className="text-sm text-gray-400">
          네 지갑으로 TON이 전송됐어~
        </p>
      </div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">금액</span>
          <span className="text-lg font-bold text-accent-cyan">{prize.label}</span>
        </div>
        <div>
          <span className="text-sm text-gray-400">지갑</span>
          <p className="text-xs font-mono text-gray-300 mt-1 break-all">
            {walletAddress}
          </p>
        </div>
        {txHash && (
          <div>
            <span className="text-sm text-gray-400">트랜잭션</span>
            <p className="text-xs font-mono text-gray-300 mt-1 break-all">
              {txHash}
            </p>
          </div>
        )}
      </div>

      {showMission ? (
        <button
          onClick={onMission}
          className="w-full max-w-sm py-3 rounded-xl font-bold text-lg
            bg-gradient-to-r from-accent-amber to-yellow-500
            text-gray-900 shadow-lg shadow-accent-amber/20
            hover:shadow-accent-amber/40 hover:scale-[1.02]
            active:scale-[0.98] transition-all duration-200"
        >
          🎁 미션 완료하면 카드 한 장 더!
        </button>
      ) : (
        <a
          href="/staking"
          className="w-full max-w-sm py-3 rounded-xl font-bold text-lg text-center block
            bg-gradient-to-r from-accent-cyan to-accent-blue
            text-white shadow-lg shadow-accent-cyan/20
            hover:shadow-accent-cyan/40 hover:scale-[1.02]
            active:scale-[0.98] transition-all duration-200"
        >
          스테이킹하러 가기
        </a>
      )}

      <p className="text-xs text-gray-600">
        toki.tokamak.network에서 언제든 확인할 수 있어~
      </p>
    </div>
  );
}
