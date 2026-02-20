"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { formatUnits } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia, mainnet } from "viem/chains";
import StakingPanel from "./StakingPanel";
import { useEip7702 } from "@/hooks/useEip7702";
import { useTranslation } from "@/components/providers/LanguageProvider";

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
  const { smartAccountClient, walletType } = useEip7702();
  const router = useRouter();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const primaryWallet = externalWallet || embeddedWallet;

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

  useEffect(() => {
    if (balanceAddress) {
      fetchBalances();
    }
  }, [balanceAddress, fetchBalances]);

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

  const handleExportWallet = async () => {
    if (embeddedWallet) {
      await exportWallet({ address: embeddedWallet.address });
    }
  };

  const getEthereumProvider = async () => {
    if (!primaryWallet) throw new Error("No wallet connected");
    return await primaryWallet.getEthereumProvider();
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
            <span className="text-lg font-bold text-gradient">Ttoni</span>
          </a>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors"
          >
            {t.dashboard.logout}
          </button>
        </div>
      </header>

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
              {smartAccountClient && (
                <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                  {t.dashboard.gasless}
                  {walletType === "external" ? " (MetaMask)" : walletType === "embedded" ? " (Embedded)" : ""}
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
              label="WTON"
              value={loading ? "..." : balances?.wton || "\u2014"}
              color="text-accent-gold"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {embeddedWallet && (
              <button
                onClick={handleExportWallet}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
              >
                {t.dashboard.exportPrivateKey}
              </button>
            )}
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

        {/* Staking Panel */}
        {primaryWallet && (
          <div className="mb-6">
            <StakingPanel
              walletAddress={primaryWallet.address}
              getEthereumProvider={getEthereumProvider}
              smartAccountClient={smartAccountClient}
              onBalanceChange={fetchBalances}
            />
          </div>
        )}

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
