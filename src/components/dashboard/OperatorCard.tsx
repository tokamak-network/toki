"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
  commissionRate?: number;
}

const CARD_GRADIENTS = [
  "from-blue-500/30 to-cyan-500/30",
  "from-purple-500/30 to-pink-500/30",
  "from-amber-500/30 to-orange-500/30",
  "from-green-500/30 to-emerald-500/30",
  "from-indigo-500/30 to-violet-500/30",
  "from-rose-500/30 to-red-500/30",
  "from-teal-500/30 to-cyan-500/30",
  "from-fuchsia-500/30 to-purple-500/30",
  "from-lime-500/30 to-green-500/30",
  "from-sky-500/30 to-blue-500/30",
];

const CARD_BORDER_COLORS = [
  "border-cyan-500/40",
  "border-pink-500/40",
  "border-orange-500/40",
  "border-emerald-500/40",
  "border-violet-500/40",
  "border-red-500/40",
  "border-teal-500/40",
  "border-fuchsia-500/40",
  "border-lime-500/40",
  "border-sky-500/40",
];

const CARD_GLOW_COLORS = [
  "shadow-cyan-500/20",
  "shadow-pink-500/20",
  "shadow-orange-500/20",
  "shadow-emerald-500/20",
  "shadow-violet-500/20",
  "shadow-red-500/20",
  "shadow-teal-500/20",
  "shadow-fuchsia-500/20",
  "shadow-lime-500/20",
  "shadow-sky-500/20",
];

interface OperatorCardProps {
  operators: Operator[];
  selectedOp: string;
  onSelect: (address: string) => void;
  shuffling?: boolean;
  autoSelectedIndex?: number;
}

function formatStaked(value: string): string {
  const num = Number(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

export default function OperatorCard({
  operators,
  selectedOp,
  onSelect,
  shuffling = false,
  autoSelectedIndex,
}: OperatorCardProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const CARD_WIDTH = 112;
  const GAP = 8;

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (CARD_WIDTH + GAP));
    setActiveIndex(Math.min(idx, operators.length - 1));
  }, [operators.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  // How many dots to show (group cards into pages of ~2 visible cards)
  const totalDots = operators.length;

  return (
    <div className="mb-4">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide"
      >
        {operators.map((op, i) => {
          const isSelected = selectedOp === op.address;
          const gradientIdx = i % CARD_GRADIENTS.length;
          const isAutoSelected = autoSelectedIndex === i;

          return (
            <button
              key={op.address}
              onClick={() => onSelect(op.address)}
              className={`
                snap-center shrink-0 w-[112px] p-3 rounded-xl border transition-all duration-300
                bg-gradient-to-br ${CARD_GRADIENTS[gradientIdx]}
                ${isSelected
                  ? `${CARD_BORDER_COLORS[gradientIdx]} scale-105 shadow-lg ${CARD_GLOW_COLORS[gradientIdx]}`
                  : "border-white/10 hover:border-white/20 hover:scale-[1.02]"
                }
                ${shuffling ? "animate-card-shuffle" : ""}
              `}
            >
              {/* Icon/Initial */}
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-base font-bold text-white mb-2 mx-auto">
                {op.name ? op.name.charAt(0).toUpperCase() : "O"}
              </div>

              {/* Name */}
              <div className="text-xs font-semibold text-white truncate text-center mb-1">
                {op.name || `${op.address.slice(0, 6)}...`}
              </div>

              {/* Total staked */}
              <div className="text-[10px] font-mono-num text-gray-300 text-center mb-1">
                {formatStaked(op.totalStaked)} TON
              </div>

              {/* Commission rate */}
              {op.commissionRate !== undefined && (
                <div className={`text-[10px] font-mono-num text-center ${
                  op.commissionRate < 0 ? "text-green-400" : op.commissionRate === 0 ? "text-gray-400" : "text-amber-400"
                }`}>
                  {op.commissionRate < 0 ? "" : op.commissionRate > 0 ? "+" : ""}{op.commissionRate.toFixed(1)}%
                </div>
              )}

              {/* My staked */}
              {Number(op.myStaked) > 0 && (
                <div className="text-[10px] font-mono-num text-accent-cyan text-center mt-1">
                  {t.dashboard.myStake}: {Number(op.myStaked).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
              )}

              {/* Auto selected badge */}
              {isAutoSelected && (
                <div className="mt-1 px-1.5 py-0.5 rounded-full bg-accent-amber/20 text-accent-amber text-[10px] font-semibold text-center">
                  Toki Pick
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll indicator dots */}
      {totalDots > 2 && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {operators.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                scrollRef.current?.scrollTo({
                  left: i * (CARD_WIDTH + GAP),
                  behavior: "smooth",
                });
              }}
              className={`rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "w-4 h-1.5 bg-accent-cyan"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
