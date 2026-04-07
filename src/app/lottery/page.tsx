"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CardNumberInput from "@/components/lottery/CardNumberInput";

/**
 * Lottery landing page — fixed QR code leads here.
 * User enters card number from the physical scratch card.
 */
export default function LotteryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (cardNumber: string) => {
    setLoading(true);
    router.push(`/lottery/claim?code=${cardNumber}`);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Image
            src="/characters/toki-welcome.png"
            alt="Toki"
            width={140}
            height={140}
            className="mx-auto drop-shadow-2xl animate-float"
          />
          <div>
            <h1 className="text-2xl font-black text-white">
              🎉 Toki Lucky Lottery
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              스크래치 카드에서 확인한 카드번호를 입력해주세요!
            </p>
          </div>
        </div>

        {/* Card number input */}
        <CardNumberInput onSubmit={handleSubmit} loading={loading} />

        {/* Footer info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-600">
            카드번호는 스크래치 아래에 있어요
          </p>
          <p className="text-xs text-gray-700">
            Powered by Tokamak Network
          </p>
        </div>
      </div>
    </main>
  );
}
