"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { WithdrawalStatus } from "@/hooks/useWithdrawalStatus";
import type { UserStakingData } from "@/hooks/useStakingSubgraph";

interface StakingSummaryCardProps {
  subgraphData?: UserStakingData | null;
  wtonBalance?: string;
  withdrawalStatus: WithdrawalStatus;
  loading?: boolean;
}

export default function StakingSummaryCard({
  subgraphData,
  wtonBalance,
  withdrawalStatus,
  loading,
}: StakingSummaryCardProps) {
  const { t } = useTranslation();

  const hasStaking = subgraphData || (wtonBalance && Number(wtonBalance) > 0);
  const hasWithdrawalActivity =
    withdrawalStatus.pendingRequests.length > 0 ||
    withdrawalStatus.withdrawableRequests.length > 0;

  if (!hasStaking && !hasWithdrawalActivity) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">{t.dashboard.myStaking}</h2>
        <div className="p-4 rounded-lg bg-white/5 text-center">
          <div className="text-sm text-gray-400 mb-1">{t.dashboard.noActiveStaking}</div>
          <div className="text-xs text-gray-500 mb-3">{t.dashboard.noActiveStakingDesc}</div>
          <Link
            href="/staking"
            className="inline-block px-4 py-2 rounded-lg bg-accent-cyan/20 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/30 transition-colors"
          >
            {t.dashboard.staking} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t.dashboard.myStaking}</h2>
        <Link
          href="/staking"
          className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
        >
          {t.dashboard.manageStaking} →
        </Link>
      </div>

      {/* Staking Amounts */}
      {subgraphData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-xs text-gray-500 mb-1">{t.dashboard.stakedPrincipal}</div>
            <div className="text-sm font-mono-num font-semibold text-gray-300">
              {subgraphData.depositedFormatted}
            </div>
            <div className="text-[10px] text-gray-600">WTON</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-green-500/10">
            <div className="text-xs text-gray-500 mb-1">{t.dashboard.seigEarned}</div>
            <div className="text-sm font-mono-num font-semibold text-green-400">
              +{subgraphData.seigEarnedFormatted}
            </div>
            <div className="text-[10px] text-gray-600">WTON</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-accent-gold/10">
            <div className="text-xs text-gray-500 mb-1">{t.dashboard.totalStakedValue}</div>
            <div className="text-sm font-mono-num font-semibold text-accent-gold">
              {loading ? "..." : wtonBalance || "—"}
            </div>
            <div className="text-[10px] text-gray-600">WTON</div>
          </div>
        </div>
      )}

      {/* Withdrawal Status */}
      {hasWithdrawalActivity && (
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <div className="px-4 py-2 bg-white/5">
            <h3 className="text-xs text-gray-400 font-medium">{t.dashboard.withdrawalStatus}</h3>
          </div>

          <div className="p-3 space-y-2">
            {/* Withdrawable */}
            {withdrawalStatus.withdrawableRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)] animate-pulse" />
                  <div>
                    <div className="text-sm font-medium text-green-400">
                      {t.dashboard.withdrawalReady}
                    </div>
                    <div className="text-xs text-green-400/70">
                      {withdrawalStatus.totalWithdrawableFormatted} WTON ·{" "}
                      {t.dashboard.withdrawalReadyCount.replace(
                        "{count}",
                        String(withdrawalStatus.withdrawableRequests.length)
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href="/staking?tab=unstaking"
                  className="px-3 py-1.5 rounded-lg bg-green-600/80 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                >
                  {t.dashboard.withdrawNow}
                </Link>
              </div>
            )}

            {/* Pending */}
            {withdrawalStatus.pendingRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                  <div>
                    <div className="text-sm text-yellow-400/80">
                      {t.dashboard.withdrawalPending}
                    </div>
                    <div className="text-xs text-gray-500">
                      {withdrawalStatus.totalPendingFormatted} WTON ·{" "}
                      {t.dashboard.withdrawalPendingCount.replace(
                        "{count}",
                        String(withdrawalStatus.pendingRequests.length)
                      )}
                    </div>
                  </div>
                </div>
                {withdrawalStatus.nearestWithdrawTimeFormatted && (
                  <div className="text-xs text-gray-500">
                    {t.dashboard.nearestWithdraw.replace(
                      "{time}",
                      withdrawalStatus.nearestWithdrawTimeFormatted
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Per-operator breakdown */}
            {Object.entries(withdrawalStatus.byOperator).map(([opAddr, requests]) => {
              const opWithdrawable = requests.filter((r) => r.isWithdrawable);
              const opPending = requests.filter((r) => !r.isWithdrawable);
              const totalAmount = requests.reduce((sum, r) => sum + r.amount, BigInt(0));
              const formatted = Number(formatUnits(totalAmount, 27)).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              });

              return (
                <div key={opAddr} className="px-3 py-2 rounded-lg bg-white/3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-mono">
                      {opAddr.slice(0, 8)}...{opAddr.slice(-4)}
                    </span>
                    <span className="text-gray-400 font-mono-num">{formatted} WTON</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {opWithdrawable.length > 0 && (
                      <span className="text-green-400/70">
                        {opWithdrawable.length} {t.dashboard.withdrawalReady.toLowerCase()}
                      </span>
                    )}
                    {opPending.length > 0 && (
                      <span className="text-yellow-400/60">
                        {opPending.length} {t.dashboard.withdrawalPending.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
