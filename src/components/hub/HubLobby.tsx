"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import Header from "@/components/layout/Header";
import HubFooter from "./HubFooter";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { publicClient as client } from "@/lib/chain";
import { CONTRACTS } from "@/constants/contracts";
import ReceiveModal from "@/components/dashboard/ReceiveModal";
import TokiStage, { type TokiMood } from "./TokiStage";
import HudRail from "./HudRail";
import HubBackground from "./HubBackground";
import { type Eip1193Provider } from "@/lib/aiAccess";

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const accStakedAccountAbi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accStakedAccount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "pendingUnstakedAccount",
    outputs: [{ name: "wtonAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Concept A — "Toki Lobby" hub home (replaces /dashboard).
 * Two-column scene layout: a left scene panel (ambient video + full-body Toki)
 * and a right menu column (wallet snapshot + service dock). The video is
 * confined to the left panel so it never overlaps the slim footer below.
 * Detailed wallet lives at /wallet.
 */
export default function HubLobby() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  const { t } = useTranslation();

  const [showReceive, setShowReceive] = useState(false);
  const [ton, setTon] = useState<number | null>(null);
  const [staked, setStaked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const hasLinkedExternalWallet = user?.linkedAccounts?.some(
    (a) => a.type === "wallet"
  );
  const primaryWallet =
    (hasLinkedExternalWallet && externalWallet) || embeddedWallet;
  const balanceAddress = primaryWallet?.address;

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  const fetchBalances = useCallback(async () => {
    if (!balanceAddress) return;
    setLoading(true);
    try {
      const addr = balanceAddress as `0x${string}`;
      const results = await client.multicall({
        contracts: [
          {
            address: CONTRACTS.TON as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: accStakedAccountAbi,
            functionName: "accStakedAccount",
            args: [addr],
          },
          {
            address: CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`,
            abi: accStakedAccountAbi,
            functionName: "pendingUnstakedAccount",
            args: [addr],
          },
        ],
      });
      const tonBal =
        results[0].status === "success" ? (results[0].result as bigint) : BigInt(0);
      const stakedBal =
        results[1].status === "success" ? (results[1].result as bigint) : BigInt(0);
      const pendingBal =
        results[2].status === "success" ? (results[2].result as bigint) : BigInt(0);
      const netStaked = stakedBal > pendingBal ? stakedBal - pendingBal : BigInt(0);
      setTon(Number(formatUnits(tonBal, 18)));
      setStaked(Number(formatUnits(netStaked, 27)));
    } catch (e) {
      console.error("Failed to fetch hub balances:", e);
    }
    setLoading(false);
  }, [balanceAddress]);

  useEffect(() => {
    if (balanceAddress) fetchBalances();
  }, [balanceAddress, fetchBalances]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.dashboard.loading}</div>
      </div>
    );
  }

  const addr = balanceAddress || "";
  const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const googleAccount = user?.linkedAccounts?.find(
    (a) => a.type === "google_oauth"
  );
  const emailAccount = user?.linkedAccounts?.find((a) => a.type === "email");
  const displayName =
    (googleAccount as { name?: string })?.name ||
    (emailAccount as { address?: string })?.address ||
    shortAddr ||
    "User";

  const tonNum = ton ?? 0;
  const stakedNum = staked ?? 0;
  const total = tonNum + stakedNum;
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // Mood + greeting reflect staking state (Duolingo emotion-to-state mapping).
  let mood: TokiMood = "welcome";
  let dialogue = t.hub.greetingNew.replace("{name}", displayName);
  if (stakedNum > 0) {
    mood = "proud";
    dialogue = t.hub.greetingStaked.replace("{name}", displayName);
  } else if (tonNum > 0) {
    mood = "pointing";
    dialogue = t.hub.greetingHasTon.replace("{name}", displayName);
  }

  return (
    <div className="relative min-h-screen bg-grid flex flex-col overflow-hidden">
      <Header />

      {showReceive && addr && (
        <ReceiveModal address={addr} onClose={() => setShowReceive(false)} />
      )}

      <main className="relative flex-1 overflow-hidden">
        {/* Full-bleed ambient video */}
        <HubBackground />

        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 pt-16 pb-6 lg:pb-0 flex flex-col lg:flex-row gap-5">
          {/* Left: full-body Toki over the scene */}
          <div className="relative flex-1 flex items-end justify-center min-h-[46vh] lg:min-h-0">
            <TokiStage
              imageSrc="/characters/toki-fullbody.png"
              mood={mood}
              dialogue={dialogue}
            />
          </div>

          {/* Right: HUD column */}
          <div className="lg:w-72 shrink-0 flex flex-col justify-center gap-5">
            {/* Balance chip */}
            <div className="lg:self-stretch rounded-2xl bg-black/40 backdrop-blur-xl border border-accent-cyan/25 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                {t.hub.totalAssets}
              </div>
              <div className="text-2xl font-mono-num font-bold text-white leading-tight">
                {loading ? "…" : fmt(total)}{" "}
                <span className="text-sm font-normal text-accent-cyan">TON</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {t.hub.staked}{" "}
                <span className="text-accent-gold font-mono-num">{fmt(stakedNum)}</span>
                {" · "}
                {t.hub.idle}{" "}
                <span className="text-accent-cyan font-mono-num">{fmt(tonNum)}</span>
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => setShowReceive(true)}
                  className="px-3 py-1 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/25 transition-colors"
                >
                  {t.hub.receive}
                </button>
                <Link
                  href="/wallet"
                  className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium text-gray-200 hover:bg-white/15 transition-colors"
                >
                  {t.hub.openWallet} →
                </Link>
              </div>
            </div>

            {/* HUD rail: services + AI access */}
            <HudRail
              stakedTon={stakedNum}
              loading={loading}
              address={balanceAddress}
              getProvider={
                primaryWallet
                  ? async () =>
                      (await primaryWallet.getEthereumProvider()) as Eip1193Provider
                  : undefined
              }
            />
          </div>
        </div>
      </main>

      <HubFooter />
    </div>
  );
}
