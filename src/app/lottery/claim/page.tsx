import { Suspense } from "react";
import Image from "next/image";
import LotteryClaimContent from "./LotteryClaimContent";

export const dynamic = "force-dynamic";

export default function LotteryClaimPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
          }}
        >
          <div className="text-center space-y-4">
            <Image
              src="/characters/toki-thinking.png"
              alt="Toki"
              width={120}
              height={120}
              className="mx-auto animate-pulse-slow"
            />
            <p className="text-pink-400 animate-pulse">카드 확인 중...</p>
          </div>
        </main>
      }
    >
      <LotteryClaimContent />
    </Suspense>
  );
}
