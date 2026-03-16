"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { formatUnits } from "viem";
import Link from "next/link";
import Header from "@/components/layout/Header";
import CardCollection from "./CardCollection";
import LobbyView from "./LobbyView";
import StakingSummaryCard from "./StakingSummaryCard";
import { useEip7702 } from "@/hooks/useEip7702";
import { useStakingSubgraph } from "@/hooks/useStakingSubgraph";
import { useWithdrawalStatus } from "@/hooks/useWithdrawalStatus";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { publicClient as client, isTestnet } from "@/lib/chain";
import { CONTRACTS } from "@/constants/contracts";

const TON_ADDRESS = CONTRACTS.TON;
const WTON_ADDRESS = CONTRACTS.WTON;

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface Balances {
  eth: string;
  ton: string;
  wton: string;
}

export default function DashboardContent() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { smartAccountClient, walletType, paymasterMode } = useEip7702();
  const router = useRouter();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { t } = useTranslation();

  // Track screen size for lobby vs list view
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  // Check if user explicitly linked an external wallet (e.g. MetaMask).
  // MetaMask injects into useWallets() even after logout/re-login with Privy,
  // so we only use it if the user actually linked it in their account.
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet"
  );
  const primaryWallet = (hasLinkedExternalWallet && externalWallet) || embeddedWallet;

  // EIP-7702: EOA === Smart Account, so balance address is always the EOA
  const balanceAddress = primaryWallet?.address;

  // Subgraph: seigniorage earnings breakdown
  const { data: subgraphData, loading: subgraphLoading, refresh: refreshSubgraph } = useStakingSubgraph(balanceAddress);

  // Withdrawal status (shared between mobile dashboard + lobby)
  const withdrawalStatus = useWithdrawalStatus(balanceAddress);

  // Push notifications for withdrawal readiness
  const { notify, permission: notifPermission, requestPermission, isSupported: notifSupported } = usePushNotification();
  const prevWithdrawableCount = useRef(0);

  useEffect(() => {
    if (
      withdrawalStatus.hasWithdrawable &&
      withdrawalStatus.withdrawableRequests.length > prevWithdrawableCount.current
    ) {
      notify(
        t.dashboard.notificationWithdrawTitle,
        {
          body: t.dashboard.notificationWithdrawBody.replace(
            "{amount}",
            withdrawalStatus.totalWithdrawableFormatted
          ),
          tag: "withdrawal-ready",
        }
      );
    }
    prevWithdrawableCount.current = withdrawalStatus.withdrawableRequests.length;
  }, [withdrawalStatus.hasWithdrawable, withdrawalStatus.withdrawableRequests.length, withdrawalStatus.totalWithdrawableFormatted, notify, t]);

  const fetchBalances = useCallback(async () => {
    if (!balanceAddress) return;
    setLoading(true);
    try {
      const addr = balanceAddress as `0x${string}`;
      const [ethBal, tonBal, wtonBal] = await Promise.all([
        client.getBalance({ address: addr }),
        client.readContract({
          address: TON_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [addr],
        }),
        client.readContract({
          address: WTON_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [addr],
        }),
      ]);
      setBalances({
        eth: Number(formatUnits(ethBal, 18)).toFixed(6),
        ton: Number(formatUnits(tonBal, 18)).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
        wton: Number(formatUnits(wtonBal, 27)).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
      });
    } catch {
      setBalances({ eth: "\u2014", ton: "\u2014", wton: "\u2014" });
    }
    setLoading(false);
  }, [balanceAddress]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (balanceAddress) {
      fetchBalances();
    }
  }, [balanceAddress, fetchBalances]);

  const handleRefresh = useCallback(() => {
    fetchBalances();
    refreshSubgraph();
  }, [fetchBalances, refreshSubgraph]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  const addr = balanceAddress || "";
  const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "\u2014";

  const googleAccount = user?.linkedAccounts?.find(
    (a) => a.type === "google_oauth"
  );
  const emailAccount = user?.linkedAccounts?.find(
    (a) => a.type === "email"
  );
  const displayName =
    (googleAccount as { name?: string })?.name ||
    (emailAccount as { address?: string })?.address ||
    shortAddr ||
    "User";

  const copyAddress = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen bg-grid ${isDesktop ? "h-screen overflow-hidden" : ""}`}>
      <Header />

      {/* Desktop: 2.5D Lobby View */}
      {isDesktop ? (
        <LobbyView
          balances={balances}
          loading={loading}
          walletAddress={addr}
          shortAddr={shortAddr}
          displayName={displayName}
          onRefreshBalances={handleRefresh}
          isTestnet={isTestnet}
          subgraphData={subgraphData}
          subgraphLoading={subgraphLoading}
          withdrawalStatus={withdrawalStatus}
        />
      ) : (
        /* Mobile: Original list layout */
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Profile */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">
              {displayName}
            </h1>
            <p className="text-gray-500 text-sm">
              {isTestnet ? "Sepolia Testnet" : "Ethereum Mainnet"}
            </p>
          </div>

          {/* Wallet Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t.dashboard.wallet}</h2>
              <div className="flex items-center gap-2">
                {smartAccountClient && paymasterMode === "sponsor" && (
                  <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                    {t.dashboard.gasless}
                    {walletType === "external" ? " (MetaMask)" : walletType === "embedded" ? " (Embedded)" : ""}
                  </span>
                )}
                {smartAccountClient && paymasterMode === "none" && walletType === "external" && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                    EIP-7702
                  </span>
                )}
                {embeddedWallet && (
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-purple/20 text-accent-purple">
                    {t.dashboard.embedded}
                  </span>
                )}
                {externalWallet && (
                  <span className="px-2 py-0.5 rounded text-xs bg-accent-cyan/20 text-accent-cyan">
                    {t.dashboard.external}
                  </span>
                )}
              </div>
            </div>

            {/* Wallet Address */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-lg bg-white/5 font-mono text-sm text-gray-300 truncate">
                  {primaryWallet?.address || "\u2014"}
                </div>
                <button
                  onClick={copyAddress}
                  className="px-4 py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition-colors shrink-0"
                >
                  {copied ? t.dashboard.copied : t.dashboard.copy}
                </button>
              </div>
            </div>

            {/* Balances */}
            <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.balances}</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <BalanceItem
                label="ETH"
                value={loading ? "..." : balances?.eth || "\u2014"}
                color="text-gray-300"
              />
              <BalanceItem
                label="TON"
                value={loading ? "..." : balances?.ton || "\u2014"}
                color="text-accent-cyan"
              />
              <BalanceItem
                label="TON (staked)"
                value={loading ? "..." : balances?.wton || "\u2014"}
                color="text-accent-gold"
              />
            </div>

            {/* Staking Summary with Withdrawal Status */}
            <div className="mt-4 mb-6">
              <StakingSummaryCard
                subgraphData={subgraphData}
                wtonBalance={balances?.wton}
                withdrawalStatus={withdrawalStatus}
                loading={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
              >
                {t.dashboard.refreshBalances}
              </button>
              <a
                href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/address/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
              >
                {t.dashboard.viewOnEtherscan}
              </a>
              {notifSupported && notifPermission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 rounded-lg bg-accent-cyan/10 text-sm text-accent-cyan hover:bg-accent-cyan/20 transition-colors"
                >
                  {t.dashboard.enableNotifications}
                </button>
              )}
              {notifSupported && notifPermission === "granted" && (
                <span className="px-4 py-2 rounded-lg bg-green-500/10 text-sm text-green-400/80">
                  {t.dashboard.notificationsEnabled}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <Link
              href="/staking"
              className="flex-1 p-4 rounded-xl bg-gradient-to-r from-accent-blue/10 to-accent-cyan/10 border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all group"
            >
              <div className="text-accent-cyan font-semibold text-sm mb-1 group-hover:translate-x-1 transition-transform">
                {t.dashboard.staking} →
              </div>
              <div className="text-xs text-gray-500">{t.dashboard.stakingDesc}</div>
            </Link>
            <a
              href="/explore"
              className="flex-1 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
            >
              <div className="text-purple-400 font-semibold text-sm mb-1 group-hover:translate-x-1 transition-transform">
                {t.dashboard.exploreButton} →
              </div>
              <div className="text-xs text-gray-500">{t.dashboard.exploreDesc}</div>
            </a>
          </div>

          {/* Card Collection */}
          <CardCollection />

          {/* Connected Accounts */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{t.dashboard.connectedAccounts}</h2>
            <div className="space-y-3">
              {user?.linkedAccounts?.map((account, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <AccountIcon type={account.type} />
                    <div>
                      <div className="text-gray-300 capitalize">
                        {account.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {getAccountDetail(account)}
                      </div>
                    </div>
                  </div>
                  {"verifiedAt" in account ? (
                    <span className="text-green-400 text-xs">{t.dashboard.verified}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* All Wallets */}
          {wallets.length > 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t.dashboard.allWallets} ({wallets.length})
              </h2>
              <div className="space-y-3">
                {wallets.map((w) => (
                  <div
                    key={w.address}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm"
                  >
                    <div className="font-mono text-gray-300 truncate mr-3">
                      {w.address}
                    </div>
                    <span className="text-gray-500 text-xs shrink-0">
                      {w.walletClientType === "privy"
                        ? t.dashboard.embedded
                        : w.walletClientType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function BalanceItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-mono-num font-semibold ${color}`}>
        {value}
      </div>
    </div>
  );
}

function AccountIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    google_oauth: "G",
    email: "@",
    wallet: "W",
    phone: "#",
  };
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
      {icons[type] || "?"}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAccountDetail(account: any): string {
  if (account.email) return account.email as string;
  if (account.address) return account.address as string;
  if (account.name) return account.name as string;
  if (account.phoneNumber) return account.phoneNumber as string;
  return "";
}
