"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

/**
 * Secondary balance line shown under a primary "X TON" figure when the user also
 * holds WTON (wrapped TON, 1:1 value). Renders nothing when WTON is 0 — so most
 * users never see it. Reused across every wallet-balance surface for consistency.
 */
export default function WtonSubline({
  wton,
  className = "",
}: {
  wton: number | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!wton || wton <= 0) return null;
  const f = wton.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <span className={`group relative inline-flex items-center gap-1.5 text-[11px] ${className}`}>
      <span className="font-semibold text-accent-gold">+ {f} WTON</span>
      <span className="text-gray-500">= {f} TON</span>
      <span className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-white/10 text-[8px] font-bold text-gray-300">
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 w-56 rounded-lg border border-accent-cyan/30 bg-[#06101a]/97 px-3 py-2 text-[11px] font-normal leading-relaxed text-gray-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-30">
        {t.stakingScreen.wtonTooltip}
      </span>
    </span>
  );
}
