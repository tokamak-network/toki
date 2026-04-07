"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useLottery } from "@/hooks/useLottery";
import LotteryChatFlow from "@/components/lottery/LotteryChatFlow";
import Image from "next/image";

/**
 * Lottery claim page — renders a chat-room flow via LotteryChatFlow.
 * The step-based components (PrizeResult, LotteryOnboarding, etc.) are kept
 * for potential reuse but no longer rendered here.
 */
export default function LotteryClaimPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { user } = usePrivy();

  const {
    step,
    cardNumber,
    tier,
    prizeAmount,
    txHash,
    walletAddress,
    loading,
    error,
    claimCard,
    chooseReward,
    setWalletAddress,
  } = useLottery();

  // Validate card on mount
  useEffect(() => {
    if (code && step === "loading") {
      claimCard(code);
    }
  }, [code, step, claimCard]);

  // Propagate wallet address from Privy once available
  useEffect(() => {
    const addr = user?.wallet?.address;
    if (addr && !walletAddress) {
      setWalletAddress(addr);
    }
  }, [user, walletAddress, setWalletAddress]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Image
            src="/characters/toki-thinking.png"
            alt="Toki"
            width={120}
            height={120}
            className="mx-auto animate-pulse-slow"
          />
          <p className="text-gray-400 animate-pulse">카드 확인 중...</p>
        </div>
      </main>
    );
  }

  // ── Invalid / Error ──────────────────────────────────────────────────────────
  if (step === "invalid") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          <Image
            src="/characters/toki-thinking.png"
            alt="Toki"
            width={120}
            height={120}
            className="mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">앗, 문제가 생겼어!</h2>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
          <a
            href="/lottery"
            className="inline-block py-3 px-6 rounded-xl font-bold
              bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            다시 입력하기
          </a>
        </div>
      </main>
    );
  }

  // ── Chat flow ────────────────────────────────────────────────────────────────
  if (!tier || !cardNumber) return null;

  const handleChooseReward = async (choice: "discount" | "ton") => {
    if (!user?.id) return {};
    const result = await chooseReward(choice, user.id);
    return {
      txHash: result?.txHash,
      showMission: result?.showMission,
    };
  };

  return (
    <LotteryChatFlow
      cardNumber={cardNumber}
      tier={tier}
      prizeAmount={prizeAmount ?? 0}
      onChooseReward={handleChooseReward}
      txHash={txHash}
      walletAddress={walletAddress}
      loading={loading}
    />
  );
}
