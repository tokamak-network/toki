"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { AI_ACCESS_URL, MIN_TON_AI_ACCESS as MIN_TON } from "@/lib/aiAccess";

// TON AI Access — detailed-wallet variant. Eligibility here is a native HINT
// computed from the staking balance the hub already reads on-chain. The AI Access
// site re-validates authoritatively (GET /api/staking/balance) before issuing a
// key, so a slight mismatch is safe.

export default function AiAccessCard({
  stakedTon,
  loading,
}: {
  stakedTon: number;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const eligible = stakedTon >= MIN_TON;
  const needed = Math.max(0, MIN_TON - stakedTon);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <section className="mb-6">
      <div className="relative overflow-hidden rounded-2xl border border-accent-cyan/20 bg-gradient-to-br from-accent-blue/10 via-accent-cyan/[0.06] to-transparent p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-accent-cyan/15 border border-accent-cyan/25 flex items-center justify-center text-2xl shrink-0">
            🤖
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{t.hub.aiAccessTitle}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent-cyan/15 text-accent-cyan">
                {t.hub.aiAccessBadge}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t.hub.aiAccessTagline}</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">{t.hub.aiAccessDesc}</p>

        {/* Eligibility state */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-accent-cyan/40 border-t-accent-cyan animate-spin" />
            {t.hub.aiAccessChecking}
          </div>
        ) : eligible ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-accent-gold">
                {t.hub.aiAccessEligibleTitle}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {t.hub.aiAccessEligibleSub.replace("{amount}", fmt(stakedTon))}
              </div>
            </div>
            <a
              href={AI_ACCESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-sm font-semibold hover:scale-[1.02] transition-transform"
            >
              {t.hub.aiAccessGetKey} →
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-200">
                {t.hub.aiAccessLockedTitle.replace("{needed}", fmt(needed))}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t.hub.aiAccessLockedSub.replace("{min}", String(MIN_TON))}
              </div>
            </div>
            <Link
              href="/staking"
              className="shrink-0 text-center px-5 py-2.5 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-sm font-semibold hover:bg-accent-cyan/25 transition-colors"
            >
              {t.hub.aiAccessStakeCta} →
            </Link>
          </div>
        )}

        {/* Footnote — honest about the handoff + on-chain re-check */}
        <p className="text-[11px] text-gray-600 mt-4">{t.hub.aiAccessFootnote}</p>
      </div>
    </section>
  );
}
