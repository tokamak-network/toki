"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";

interface DiscountQRProps {
  cardNumber: string;
  tier: PrizeTier;
}

export default function DiscountQR({ cardNumber, tier }: DiscountQRProps) {
  const prize = PRIZE_TIERS[tier];

  // QR contains card number for bar staff to scan & verify
  const qrData = JSON.stringify({
    type: "toki-discount",
    cardNumber,
    amount: prize.amount,
  });

  return (
    <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
      <Image
        src="/characters/toki-wink.png"
        alt="Toki"
        width={120}
        height={120}
        className="drop-shadow-2xl"
      />

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">할인 QR 코드</h2>
        <p className="text-sm text-gray-400">
          이 화면을 바 스탭에게 보여주세요!
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4">
        <QRCodeSVG
          value={qrData}
          size={200}
          level="M"
          includeMargin
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">할인 금액</span>
          <span className="text-lg font-bold text-accent-amber">{prize.label}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-400">카드 번호</span>
          <span className="text-sm font-mono text-gray-300">{cardNumber}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-400">유효기간</span>
          <span className="text-sm text-gray-300">오늘 자정까지</span>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        토키 계정이 만들어졌어요! 나중에 toki.tokamak.network에서 다시 만나~
      </p>
    </div>
  );
}
