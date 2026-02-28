"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Operator {
  address: string;
  name: string;
  totalStaked: string;
  myStaked: string;
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

  const CARD_WIDTH = 160;
  const GAP = 12;

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
        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide"
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
                snap-center shrink-0 w-[160px] p-4 rounded-xl border transition-all duration-300
                bg-gradient-to-br ${CARD_GRADIENTS[gradientIdx]}
                ${
                  isSelected
                    ? `${CARD_BORDER_COLORS[gradientIdx]} scale-105 shadow-lg ${CARD_GLOW_COLORS[gradientIdx]}`
                    : "border-white/10 hover:border-white/20 hover:scale-[1.02]"
                }
                ${shuffling ? "animate-card-shuffle" : ""}
              `}
            >
              {/* Icon/Initial */}
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white mb-3 mx-auto">
                {op.name ? op.name.charAt(0).toUpperCase() : "O"}
              </div>

              {/* Name */}
              <div className="text-sm font-semibold text-white truncate text-center mb-2">
                {op.name || `${op.address.slice(0, 8)}...`}
              </div>

              {/* Total staked */}
              <div className="text-xs text-gray-300 text-center mb-1">
                {t.dashboard.operatorStaked}
              </div>
              <div className="text-sm font-mono-num text-white text-center mb-2">
                {formatStaked(op.totalStaked)} TON
              </div>

              {/* My staked */}
              {Number(op.myStaked) > 0 && (
                <div className="text-xs font-mono-num text-accent-cyan text-center">
                  {t.dashboard.myStake}:{" "}
                  {Number(op.myStaked).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}

              {/* Auto selected badge */}
              {isAutoSelected && (
                <div className="mt-2 px-2 py-0.5 rounded-full bg-accent-amber/20 text-accent-amber text-xs font-semibold text-center">
                  {t.dashboard.tokiAutoSelected}
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
