"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { SEIG_PER_BLOCK, BLOCKS_PER_YEAR } from "@/constants/contracts";

interface Coin {
  id: number;
  x: number;
  size: number;
  delay: number;
  rotation: number;
}

type Period = "1m" | "6m" | "1y" | "3y";

const PERIOD_MULTIPLIERS: Record<Period, number> = {
  "1m": 1 / 12,
  "6m": 6 / 12,
  "1y": 1,
  "3y": 3,
};

interface SeigniorageRainProps {
  inputAmount: string;
  totalStaked: number;
}

export default function SeigniorageRain({ inputAmount, totalStaked }: SeigniorageRainProps) {
  const { t } = useTranslation();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [period, setPeriod] = useState<Period>("1y");
  const coinIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputNum = Number(inputAmount) || 0;
  const hasInput = inputNum > 0;

  // Seigniorage per block for the input amount
  // User stakes inputNum TON (= inputNum WTON after wrapping)
  // Their share = inputNum / (totalStaked + inputNum)
  const effectiveTotal = totalStaked + inputNum;
  const seigPerBlockForUser = effectiveTotal > 0
    ? SEIG_PER_BLOCK * (inputNum / effectiveTotal)
    : 0;

  // Estimated earnings for the selected period
  const estimatedEarnings = useMemo(() => {
    const blocksInPeriod = BLOCKS_PER_YEAR * PERIOD_MULTIPLIERS[period];
    return seigPerBlockForUser * blocksInPeriod;
  }, [seigPerBlockForUser, period]);

  const spawnCoins = useCallback(() => {
    const count = 3 + Math.floor(Math.random() * 3);
    const newCoins: Coin[] = Array.from({ length: count }, () => {
      coinIdRef.current += 1;
      return {
        id: coinIdRef.current,
        x: 5 + Math.random() * 90,
        size: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 400,
        rotation: Math.random() * 360,
      };
    });
    setCoins((prev) => [...prev.slice(-20), ...newCoins]);
  }, []);

  // Spawn coins when there's input
  useEffect(() => {
    if (!hasInput) {
      setCoins([]);
      return;
    }
    spawnCoins();
    intervalRef.current = setInterval(spawnCoins, 12_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasInput, spawnCoins]);

  // Clean up expired coins
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCoins((prev) => {
        if (prev.length > 15) return prev.slice(-10);
        return prev;
      });
    }, 3000);
    return () => clearInterval(cleanup);
  }, []);

  const periodKeys: { key: Period; label: string }[] = [
    { key: "1m", label: t.dashboard.period1m },
    { key: "6m", label: t.dashboard.period6m },
    { key: "1y", label: t.dashboard.period1y },
    { key: "3y", label: t.dashboard.period3y },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
      {/* Falling coins (only when has input) */}
      {hasInput && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="absolute animate-coin-drop"
              style={{
                left: `${coin.x}%`,
                top: "-20px",
                fontSize: `${coin.size}rem`,
                animationDelay: `${coin.delay}ms`,
                transform: `rotate(${coin.rotation}deg)`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-amber to-yellow-600 border border-yellow-400/50 flex items-center justify-center shadow-sm shadow-amber-500/30">
                <span className="text-[8px] font-bold text-yellow-900">W</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="text-xs text-gray-400 mb-3 text-center">
          {t.dashboard.estimatedEarnings}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 justify-center mb-3 p-0.5 rounded-lg bg-white/5 w-fit mx-auto">
          {periodKeys.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                period === key
                  ? "bg-accent-amber/20 text-accent-amber"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Earnings display */}
        {hasInput ? (
          <>
            <div className="text-2xl font-mono-num font-bold text-accent-amber text-center">
              +{estimatedEarnings.toLocaleString("en-US", { maximumFractionDigits: 2 })} TON
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {t.dashboard.seignioragePerBlock.replace("{amount}", seigPerBlockForUser.toFixed(6))}
            </div>
            <div className="text-[10px] text-gray-600 mt-1 text-center">
              {t.dashboard.earningsNote}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 text-center py-2">
            {t.dashboard.inputAmountPrompt}
          </div>
        )}
      </div>
    </div>
  );
}
