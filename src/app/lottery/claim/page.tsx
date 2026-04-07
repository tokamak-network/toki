"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useLottery } from "@/hooks/useLottery";
import { type PrizeTier } from "@/constants/lottery";
import PrizeResult from "@/components/lottery/PrizeResult";
import LotteryOnboarding from "@/components/lottery/LotteryOnboarding";
import ClaimChoice from "@/components/lottery/ClaimChoice";
import DiscountQR from "@/components/lottery/DiscountQR";
import TonClaimSuccess from "@/components/lottery/TonClaimSuccess";
import MissionPrompt from "@/components/lottery/MissionPrompt";
import BonusScratchReveal from "@/components/lottery/BonusScratchReveal";
import Image from "next/image";
import { useState } from "react";

/**
 * Lottery claim page — handles the full flow:
 * Card validation → Prize reveal → Onboarding → Choice → Result
 */
export default function LotteryClaimPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { user } = usePrivy();

  const {
    step,
    cardNumber,
    tier,
    txHash,
    walletAddress,
    showMission,
    error,
    loading,
    setStep,
    claimCard,
    chooseReward,
    setWalletAddress,
  } = useLottery();

  // Bonus card state for mission flow
  const [bonusCard, setBonusCard] = useState<{
    cardNumber: string;
    tier: string;
    prizeAmount: number;
  } | null>(null);

  // Validate card on mount
  useEffect(() => {
    if (code && step === "loading") {
      claimCard(code);
    }
  }, [code, step, claimCard]);

  const handleOnboardingComplete = (address: string) => {
    setWalletAddress(address);
    setStep("choice");
  };

  const handleChoose = async (choice: "discount" | "ton") => {
    if (!user?.id) return;
    await chooseReward(choice, user.id);
  };

  const handleMissionComplete = (card: { cardNumber: string; tier: string; prizeAmount: number }) => {
    setBonusCard(card);
  };

  // Loading
  if (step === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Image
            src="/toki-thinking.png"
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

  // Invalid / Error
  if (step === "invalid") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          <Image
            src="/toki-thinking.png"
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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Step 2: Prize reveal */}
        {step === "prize_reveal" && tier && (
          <PrizeResult
            tier={tier}
            onContinue={() => setStep("onboarding_login")}
          />
        )}

        {/* Step 3: Onboarding (login + slides + wallet) */}
        {(step === "onboarding_login" || step === "onboarding_slides" || step === "onboarding_wallet") && (
          <LotteryOnboarding onComplete={handleOnboardingComplete} />
        )}

        {/* Step 4: Choice */}
        {step === "choice" && tier && (
          <ClaimChoice
            tier={tier}
            onChoose={handleChoose}
            loading={loading}
          />
        )}

        {/* Discount QR */}
        {step === "discount_qr" && cardNumber && tier && (
          <DiscountQR cardNumber={cardNumber} tier={tier} />
        )}

        {/* TON success */}
        {step === "ton_success" && tier && walletAddress && (
          <TonClaimSuccess
            tier={tier}
            txHash={txHash}
            walletAddress={walletAddress}
            showMission={showMission}
            onMission={() => setStep("mission")}
          />
        )}

        {/* Mission */}
        {step === "mission" && cardNumber && !bonusCard && (
          <MissionPrompt
            cardNumber={cardNumber}
            onComplete={handleMissionComplete}
          />
        )}

        {/* Bonus card scratch */}
        {step === "mission" && bonusCard && (
          <BonusScratchReveal
            tier={bonusCard.tier as PrizeTier}
            onReveal={() => {
              // After bonus reveal, show choice for the bonus card
              // For now, just show success
            }}
          />
        )}
      </div>
    </main>
  );
}
