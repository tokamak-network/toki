"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, formatUnits, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useEip7702 } from "@/hooks/useEip7702";
import { useSessionKey } from "@/hooks/useSessionKey";
import AchievementPanel from "./AchievementPanel";
import StakingPanel from "./StakingPanel";
import StakingPanelBeginner from "./StakingPanelBeginner";
import UnstakingPanel from "./UnstakingPanel";

const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "sepolia";
const chain = isTestnet ? sepolia : mainnet;

const TON_ADDRESS = isTestnet
  ? "0xa30fe40285b8f5c0457dbc3b7c8a280373c40044"
  : "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5";
const WTON_ADDRESS = isTestnet
  ? "0x79e0d92670106c85e9067b56b8f674340dca0bbd"
  : "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2";

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || undefined, {
    timeout: 15_000,
  }),
});

interface Balances {
  eth: string;
  ton: string;
  wton: string;
}

export default function DashboardContent() {
  const { ready, authenticated, user, logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const { smartAccountClient, walletType, paymasterMode, isMetaMask } =
    useEip7702();
  const router = useRouter();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [stakingUiMode, setStakingUiMode] = useState<"beginner" | "expert">(
    () => {
      if (typeof window !== "undefined") {
        return (
          (localStorage.getItem("toki-staking-mode") as
            | "beginner"
            | "expert") || "beginner"
        );
      }
      return "beginner";
    },
  );
  const [stakingTab, setStakingTab] = useState<"staking" | "unstaking">(
    "staking",
  );
  const { t } = useTranslation();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");

  // Check if user explicitly linked an external wallet (e.g. MetaMask).
  // MetaMask injects into useWallets() even after logout/re-login with Privy,
  // so we only use it if the user actually linked it in their account.
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet",
  );
  const primaryWallet =
    (hasLinkedExternalWallet && externalWallet) || embeddedWallet;

  // EIP-7702: EOA === Smart Account, so balance address is always the EOA
  const balanceAddress = primaryWallet?.address;

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

  const getEthereumProvider = useCallback(async () => {
    if (!primaryWallet) throw new Error("No wallet connected");
    return await primaryWallet.getEthereumProvider();
  }, [primaryWallet]);

  const sessionKey = useSessionKey(
    primaryWallet ? getEthereumProvider : null,
    (primaryWallet?.address as `0x${string}`) || null,
  );

  useEffect(() => {
    if (balanceAddress) {
      fetchBalances();
    }
  }, [balanceAddress, fetchBalances]);

  // Close account menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountMenuOpen]);

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
    (a) => a.type === "google_oauth",
  );
  const emailAccount = user?.linkedAccounts?.find((a) => a.type === "email");
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

  const handleExportWallet = async () => {
    if (embeddedWallet) {
      await exportWallet({ address: embeddedWallet.address });
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-md bg-background/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
            <span className="text-lg font-bold text-gradient">Toki</span>
          </a>
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{t.dashboard.account}</span>
              <svg
                className={`w-3 h-3 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a2340] border border-white/10 shadow-xl shadow-black/40 overflow-hidden z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="text-sm font-medium text-gray-200 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {shortAddr}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {embeddedWallet && (
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleExportWallet();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                        />
                      </svg>
                      {t.dashboard.exportPrivateKey}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9"
                      />
                    </svg>
                    {t.dashboard.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
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
                  {walletType === "external"
                    ? " (MetaMask)"
                    : walletType === "embedded"
                      ? " (Embedded)"
                      : ""}
                </span>
              )}
              {smartAccountClient &&
                paymasterMode === "none" &&
                walletType === "external" && (
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchBalances}
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
          </div>
        </div>

        {/* Achievement Panel */}
        <AchievementPanel />

        {/* Staking / Unstaking Tabs + Panel */}
        {primaryWallet && (
          <div className="mb-6">
            {/* Staking / Unstaking Tab */}
            <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white/5 w-fit">
              <button
                onClick={() => setStakingTab("staking")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stakingTab === "staking"
                    ? "bg-accent-blue/20 text-accent-cyan"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.dashboard.stakingTab}
              </button>
              <button
                onClick={() => setStakingTab("unstaking")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stakingTab === "unstaking"
                    ? "bg-accent-blue/20 text-accent-cyan"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.dashboard.unstakingTab}
              </button>
            </div>

            {stakingTab === "staking" ? (
              <>
                {/* Beginner / Expert Mode Toggle */}
                <div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-white/5 w-fit">
                  <button
                    onClick={() => {
                      setStakingUiMode("beginner");
                      localStorage.setItem("toki-staking-mode", "beginner");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      stakingUiMode === "beginner"
                        ? "bg-accent-blue/20 text-accent-cyan"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t.dashboard.beginnerMode}
                  </button>
                  <button
                    onClick={() => {
                      setStakingUiMode("expert");
                      localStorage.setItem("toki-staking-mode", "expert");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      stakingUiMode === "expert"
                        ? "bg-accent-blue/20 text-accent-cyan"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t.dashboard.expertMode}
                  </button>
                </div>

                {stakingUiMode === "beginner" ? (
                  <StakingPanelBeginner
                    walletAddress={primaryWallet.address}
                    getEthereumProvider={getEthereumProvider}
                    smartAccountClient={smartAccountClient}
                    onBalanceChange={fetchBalances}
                    paymasterMode={paymasterMode}
                    isMetaMask={isMetaMask}
                    sessionKey={sessionKey}
                  />
                ) : (
                  <StakingPanel
                    walletAddress={primaryWallet.address}
                    getEthereumProvider={getEthereumProvider}
                    smartAccountClient={smartAccountClient}
                    onBalanceChange={fetchBalances}
                    paymasterMode={paymasterMode}
                    isMetaMask={isMetaMask}
                    sessionKey={sessionKey}
                  />
                )}
              </>
            ) : (
              <UnstakingPanel
                walletAddress={primaryWallet.address}
                getEthereumProvider={getEthereumProvider}
                smartAccountClient={smartAccountClient}
                onBalanceChange={fetchBalances}
                paymasterMode={paymasterMode}
              />
            )}
          </div>
        )}

        {/* Connected Accounts */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {t.dashboard.connectedAccounts}
          </h2>
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
                  <span className="text-green-400 text-xs">
                    {t.dashboard.verified}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem Banner */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {t.dashboard.exploreTitle}
              </h2>
              <p className="text-sm text-gray-500">{t.dashboard.exploreDesc}</p>
            </div>
            <a
              href="/explore"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-blue/20 to-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:from-accent-blue/30 hover:to-accent-cyan/30 transition-all shrink-0"
            >
              {t.dashboard.exploreButton} →
            </a>
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
