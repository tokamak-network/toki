"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  formatUnits,
} from "viem";
import { useTranslation } from "@/components/providers/LanguageProvider";
import LobbyHotspot from "./LobbyHotspot";
import LobbyOverlay from "./LobbyOverlay";
import CardCollection from "./CardCollection";
import { depositManagerAbi } from "@/lib/abi";
import { CONTRACTS } from "@/constants/contracts";
import { chain, publicClient } from "@/lib/chain";
import type { UserStakingData } from "@/hooks/useStakingSubgraph";
import type { WithdrawalStatus } from "@/hooks/useWithdrawalStatus";

interface LobbyViewProps {
  balances: { eth: string; ton: string; wton: string; staked: string } | null;
  loading: boolean;
  walletAddress: string;
  shortAddr?: string;
  displayName: string;
  onRefreshBalances: () => void;
  isTestnet: boolean;
  subgraphData?: UserStakingData | null;
  subgraphLoading?: boolean;
  withdrawalStatus?: WithdrawalStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smartAccountClient?: { sendTransaction: (...args: any[]) => Promise<`0x${string}`> } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEthereumProvider?: () => Promise<any>;
}

export default function LobbyView({
  balances,
  loading,
  walletAddress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shortAddr,
  displayName,
  onRefreshBalances,
  isTestnet,
  subgraphData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subgraphLoading,
  withdrawalStatus,
  smartAccountClient,
  getEthereumProvider,
}: LobbyViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueText, setDialogueText] = useState("");
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [withdrawProcessing, setWithdrawProcessing] = useState<string | null>(null);
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const greetings = [
    t.lobby.tokiGreeting1,
    t.lobby.tokiGreeting2,
    t.lobby.tokiGreeting3,
    t.lobby.tokiGreeting4,
  ];

  // Entrance animation + auto-greeting (withdrawal-aware)
  useEffect(() => {
    const timer = setTimeout(() => setRoomLoaded(true), 100);
    const greetTimer = setTimeout(() => {
      // Prioritize withdrawal alerts
      if (withdrawalStatus?.hasWithdrawable) {
        showTokiMessage(t.lobby.tokiWithdrawReady, 7000);
      } else if (
        withdrawalStatus?.pendingRequests.length &&
        withdrawalStatus.pendingRequests.length > 0 &&
        withdrawalStatus.nearestWithdrawTimeFormatted
      ) {
        showTokiMessage(
          t.lobby.tokiWithdrawPending.replace("{time}", withdrawalStatus.nearestWithdrawTimeFormatted),
          6000
        );
      } else {
        const g = [t.lobby.tokiGreeting1, t.lobby.tokiGreeting2, t.lobby.tokiGreeting3, t.lobby.tokiGreeting4];
        showTokiMessage(g[Math.floor(Math.random() * g.length)], 5000);
      }
    }, 1200);
    return () => { clearTimeout(timer); clearTimeout(greetTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawalStatus?.hasWithdrawable]);

  const dialogueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showTokiMessage = useCallback((text: string, duration?: number) => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    setDialogueText(text);
    setShowDialogue(true);
    if (duration) {
      dialogueTimerRef.current = setTimeout(() => setShowDialogue(false), duration);
    }
  }, []);

  const hideTokiMessage = useCallback(() => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    dialogueTimerRef.current = setTimeout(() => setShowDialogue(false), 300);
  }, []);

  const handleTokiClick = () => {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    showTokiMessage(randomGreeting, 4000);
  };

  // Auto-open panel from URL param (e.g. /dashboard?panel=wallet)
  useEffect(() => {
    const panel = searchParams.get("panel");
    if (panel === "wallet") setActivePanel("wallet");
  }, [searchParams]);

  const handleWithdraw = useCallback(async (operatorAddr: string, count: number) => {
    setWithdrawProcessing(operatorAddr);
    setWithdrawError(null);
    setWithdrawTxHash(null);
    const depositManagerAddr = CONTRACTS.DEPOSIT_MANAGER_PROXY as `0x${string}`;
    const addr = walletAddress as `0x${string}`;

    try {
      let hash: `0x${string}`;

      if (smartAccountClient) {
        hash = await smartAccountClient.sendTransaction({
          calls: [{
            to: depositManagerAddr,
            data: encodeFunctionData({
              abi: depositManagerAbi,
              functionName: "processRequests",
              args: [operatorAddr as `0x${string}`, BigInt(count), true],
            }),
          }],
        });
      } else if (getEthereumProvider) {
        const provider = await getEthereumProvider();
        const walletClient = createWalletClient({ chain, transport: custom(provider), account: addr });
        hash = await walletClient.writeContract({
          address: depositManagerAddr,
          abi: depositManagerAbi,
          functionName: "processRequests",
          args: [operatorAddr as `0x${string}`, BigInt(count), true],
        });
      } else {
        throw new Error("No wallet available");
      }

      setWithdrawTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      withdrawalStatus?.refresh();
      onRefreshBalances();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Withdraw failed:", errMsg);
      if (errMsg.includes("User rejected")) {
        setWithdrawError(t.dashboard.txRejected);
      } else {
        setWithdrawError(errMsg.slice(0, 200));
      }
    }
    setWithdrawProcessing(null);
  }, [smartAccountClient, getEthereumProvider, walletAddress, withdrawalStatus, onRefreshBalances, t]);

  const handleStaking = () => {
    router.push("/staking");
  };

  const handleExplore = () => {
    router.push("/explore");
  };

  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#0a0e1a]">
      {/* === Room Background (fullscreen 16:9) === */}
      <div className="absolute inset-0">
        <Image
          src="/lobby-room.png"
          alt="Toki's Room"
          fill
          className={`object-cover transition-all duration-1000 ${
            roomLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          priority
        />
      </div>

      {/* === CSS Dynamic Effects Layer === */}
      <div className="absolute inset-0 pointer-events-none">

        {/* ── MONITORS: beacon + bright particles ── */}
        {/* Beacon - large pulsing orb on monitor center */}
        <div className="absolute rounded-full" style={{
          top: "36%", left: "20%", width: "8px", height: "8px",
          background: "rgba(34,211,238,1)",
          boxShadow: "0 0 16px 6px rgba(34,211,238,0.7), 0 0 40px 15px rgba(34,211,238,0.3)",
          animation: "beacon 2s ease-in-out infinite",
        }} />
        {/* Monitor particles - large, bright, rising */}
        {[
          { left: "8%", top: "48%" }, { left: "16%", top: "50%" },
          { left: "24%", top: "45%" }, { left: "32%", top: "52%" },
          { left: "36%", top: "46%" }, { left: "12%", top: "42%" },
          { left: "28%", top: "40%" }, { left: "20%", top: "36%" },
          { left: "10%", top: "34%" }, { left: "34%", top: "38%" },
        ].map((p, i) => (
          <div key={`mon-p-${i}`} className="absolute rounded-full" style={{
            left: p.left, top: p.top,
            width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
            background: "rgba(34,211,238,1)",
            boxShadow: `0 0 ${8 + (i % 3) * 4}px ${4 + (i % 2) * 2}px rgba(34,211,238,0.6)`,
            animation: `monitorParticle ${2.5 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.35}s`,
          }} />
        ))}

        {/* ── PORTAL: beacon + orbiting particles ── */}
        <div className="absolute" style={{ top: "8%", left: "62%", width: "22%", height: "82%" }}>
          {/* Orbiting particles - larger with stronger glow */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={`orb-${i}`} className="absolute rounded-full" style={{
              top: "50%", left: "50%",
              width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
              background: i % 2 === 0 ? "rgba(139,92,246,1)" : "rgba(96,165,250,1)",
              boxShadow: `0 0 12px 5px ${i % 2 === 0 ? "rgba(139,92,246,0.7)" : "rgba(96,165,250,0.7)"}`,
              animation: `portalOrbit ${2.5 + i * 0.35}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }} />
          ))}
        </div>

        {/* ── ACHIEVEMENT BOARD: beacon + bright sparkle particles ── */}
        {/* Beacon - prominent pulse on board center */}
        <div className="absolute rounded-full" style={{
          top: "40%", right: "12%", width: "8px", height: "8px",
          background: "rgba(168,85,247,1)",
          boxShadow: "0 0 16px 6px rgba(168,85,247,0.7), 0 0 40px 15px rgba(168,85,247,0.3)",
          animation: "beacon 2.5s ease-in-out infinite",
          animationDelay: "0.8s",
        }} />
        {/* Board sparkle particles - bigger, brighter */}
        {[
          { top: "20%", right: "7%" }, { top: "26%", right: "15%" },
          { top: "32%", right: "9%" }, { top: "38%", right: "19%" },
          { top: "44%", right: "11%" }, { top: "50%", right: "17%" },
          { top: "56%", right: "8%" }, { top: "62%", right: "14%" },
          { top: "28%", right: "21%" }, { top: "46%", right: "6%" },
          { top: "34%", right: "13%" }, { top: "52%", right: "20%" },
        ].map((p, i) => (
          <div key={`board-p-${i}`} className="absolute rounded-full" style={{
            top: p.top, right: p.right,
            width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
            background: i % 3 === 0 ? "rgba(168,85,247,1)" : i % 3 === 1 ? "rgba(192,132,252,1)" : "rgba(216,180,254,0.9)",
            boxShadow: `0 0 ${8 + (i % 2) * 4}px ${4 + (i % 2) * 2}px rgba(168,85,247,0.6)`,
            animation: `boardParticle ${2 + i * 0.25}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}

        {/* ── SAFE: beacon + bright amber/green particles ── */}
        {/* Beacon LED */}
        <div className="absolute rounded-full" style={{
          bottom: "12%", left: "18%", width: "8px", height: "8px",
          background: "#f59e0b",
          boxShadow: "0 0 14px 5px rgba(245,158,11,0.8), 0 0 35px 12px rgba(245,158,11,0.3)",
          animation: "beacon 2s ease-in-out infinite",
          animationDelay: "0.4s",
        }} />
        {/* Green status LED */}
        <div className="absolute w-2 h-2 rounded-full" style={{
          bottom: "10%", left: "20%",
          background: "#22c55e",
          boxShadow: "0 0 10px 4px rgba(34,197,94,0.6)",
          animation: "safeBlink 3s ease-in-out infinite",
          animationDelay: "1s",
        }} />
        {/* Safe particles */}
        {[
          { bottom: "6%", left: "15%" }, { bottom: "14%", left: "20%" },
          { bottom: "18%", left: "16%" }, { bottom: "4%", left: "22%" },
          { bottom: "10%", left: "24%" }, { bottom: "16%", left: "18%" },
        ].map((p, i) => (
          <div key={`safe-p-${i}`} className="absolute rounded-full" style={{
            bottom: p.bottom, left: p.left,
            width: `${3 + (i % 2) * 2}px`, height: `${3 + (i % 2) * 2}px`,
            background: i % 2 === 0 ? "rgba(245,158,11,1)" : "rgba(34,197,94,0.9)",
            boxShadow: `0 0 ${6 + (i % 2) * 4}px ${3 + (i % 2)}px ${i % 2 === 0 ? "rgba(245,158,11,0.6)" : "rgba(34,197,94,0.5)"}`,
            animation: `safeParticle ${1.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}

        {/* ── STRING LIGHTS along ceiling garland ── */}
        {[
          { left: "10%", top: "9%" }, { left: "18%", top: "7%" },
          { left: "26%", top: "9%" }, { left: "34%", top: "7.5%" },
          { left: "42%", top: "9%" }, { left: "50%", top: "7%" },
          { left: "58%", top: "8.5%" }, { left: "66%", top: "7%" },
          { left: "74%", top: "9%" }, { left: "82%", top: "7.5%" },
          { left: "90%", top: "9%" },
        ].map((pos, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full" style={{
            ...pos,
            background: "rgba(255,220,150,0.9)",
            boxShadow: "0 0 8px 3px rgba(255,200,100,0.5)",
            animation: `twinkle ${2 + (i % 3) * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}

        {/* ── FLOATING DUST PARTICLES ── */}
        {[...Array(12)].map((_, i) => (
          <div key={`dust-${i}`} className="absolute rounded-full" style={{
            width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
            left: `${8 + i * 7}%`, top: `${20 + (i % 5) * 14}%`,
            background: i % 2 === 0 ? "rgba(34,211,238,0.3)" : "rgba(255,220,150,0.25)",
            animation: `dustFloat ${5 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}
      </div>

      {/* === Hotspots (positioned to match room objects) === */}
      <div
        className={`absolute inset-0 z-10 transition-all duration-700 delay-300 ${
          roomLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Staking Terminal - covers the triple monitors */}
        <LobbyHotspot
          label={t.lobby.stakingMonitor}
          description={t.lobby.stakingMonitorDesc}
          onClick={handleStaking}
          position={{ top: "22%", left: "2%" }}
          size={{ width: "38%", height: "35%" }}
          color="34,211,238"
          pingDelay={0}
          onHoverEnter={() => {
            if (withdrawalStatus?.hasWithdrawable) {
              showTokiMessage(t.lobby.tokiWithdrawReady);
            } else {
              showTokiMessage(t.lobby.tokiHoverStaking);
            }
          }}
          onHoverLeave={hideTokiMessage}
          badgeCount={withdrawalStatus?.withdrawableRequests.length}
          badgeColor="34,197,94"
        />

        {/* Wallet Vault - covers the safe */}
        <LobbyHotspot
          label={t.lobby.walletSafe}
          description={t.lobby.walletSafeDesc}
          onClick={() => setActivePanel("wallet")}
          position={{ bottom: "4%", left: "14%" }}
          size={{ width: "14%", height: "22%" }}
          color="245,158,11"
          pingDelay={1.2}
          onHoverEnter={() => {
            if (withdrawalStatus?.hasWithdrawable) {
              showTokiMessage(t.lobby.tokiVaultWithdraw);
            } else if (withdrawalStatus?.pendingRequests.length) {
              showTokiMessage(
                t.lobby.tokiWithdrawPending.replace(
                  "{time}",
                  withdrawalStatus.nearestWithdrawTimeFormatted || ""
                )
              );
            } else {
              showTokiMessage(t.lobby.tokiHoverWallet);
            }
          }}
          onHoverLeave={hideTokiMessage}
          badgeCount={
            withdrawalStatus?.withdrawableRequests.length
              ? withdrawalStatus.withdrawableRequests.length
              : withdrawalStatus?.pendingRequests.length || undefined
          }
          badgeColor={
            withdrawalStatus?.withdrawableRequests.length
              ? "34,197,94"    // green = ready to claim
              : "234,179,8"   // amber = still waiting
          }
        />

        {/* Achievement Board - covers the right wall bulletin board */}
        <LobbyHotspot
          label={t.lobby.achievementBoard}
          description={t.lobby.achievementBoardDesc}
          onClick={() => setActivePanel("achievements")}
          position={{ top: "15%", right: "4%" }}
          size={{ width: "20%", height: "55%" }}
          color="168,85,247"
          pingDelay={0.6}
          onHoverEnter={() => showTokiMessage(t.lobby.tokiHoverAchievement)}
          onHoverLeave={hideTokiMessage}
        />

        {/* Explore Portal - covers the swirling vortex doorway */}
        <LobbyHotspot
          label={t.lobby.exploreDoor}
          description={t.lobby.exploreDoorDesc}
          onClick={handleExplore}
          position={{ top: "10%", left: "62%" }}
          size={{ width: "18%", height: "78%" }}
          color="139,92,246"
          pingDelay={1.8}
          onHoverEnter={() => showTokiMessage(t.lobby.tokiHoverExplore)}
          onHoverLeave={hideTokiMessage}
        />
      </div>

      {/* === Room Title === */}
      <div
        className={`absolute top-20 left-1/2 -translate-x-1/2 text-center z-10 transition-all duration-700 ${
          roomLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_2px_rgba(34,211,238,0.5)]" />
          <h1 className="text-xs font-mono text-cyan-300/80 tracking-[0.15em] uppercase">
            {displayName}&apos;s Room
          </h1>
        </div>
      </div>

      {/* === Hologram Toki (on plant pot) === */}
      <div
        className={`absolute z-20 transition-all duration-700 delay-500 ${
          roomLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ bottom: "calc(30% + 119px)", left: "calc(38% + 127px)", width: "12%", height: "35%" }}
      >
        {/* Hologram base glow — sits on the plant pot */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-4 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(34,211,238,0.5) 0%, rgba(34,211,238,0.15) 50%, transparent 80%)",
            filter: "blur(4px)",
            animation: "holoBasePulse 2s ease-in-out infinite",
          }}
        />

        {/* Projection beam */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "70%",
            height: "100%",
            background: "linear-gradient(0deg, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0.03) 50%, transparent 100%)",
            clipPath: "polygon(25% 100%, 75% 100%, 90% 0%, 10% 0%)",
          }}
        />

        {/* Chibi Toki hologram */}
        <div
          className="relative w-full h-full flex items-end justify-center cursor-pointer"
          onClick={handleTokiClick}
        >
          <Image
            src="/characters/toki-holo-chibi.png"
            alt="Toki Hologram"
            width={120}
            height={120}
            className={`relative z-10 object-contain transition-all duration-500 ${
              showDialogue ? "scale-110" : "scale-100"
            }`}
            style={{
              maxHeight: "85%",
              filter: "brightness(1.3) saturate(0.7) drop-shadow(0 0 12px rgba(34,211,238,0.5))",
              opacity: 0.88,
              animation: "holoFloat 3s ease-in-out infinite",
            }}
          />
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(34,211,238,0.06) 1px, rgba(34,211,238,0.06) 2px)",
              animation: "holoScanScroll 2s linear infinite",
            }}
          />
          {/* Glitch flicker */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ animation: "holoGlitch 6s ease-in-out infinite" }}
          />
        </div>

        {/* Speech bubble */}
        <div
          className={`absolute pointer-events-none transition-all duration-400 ${
            showDialogue ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
          }`}
          style={{ top: "-14px", left: "50%", transform: "translateX(-50%)" }}
        >
          <div
            className="relative rounded-xl px-4 py-2 max-w-[220px] whitespace-nowrap border"
            style={{
              background: "rgba(15,23,41,0.75)",
              borderColor: "rgba(34,211,238,0.2)",
              boxShadow: "0 0 20px rgba(34,211,238,0.1), inset 0 0 20px rgba(34,211,238,0.03)",
            }}
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{ background: "rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.8)", border: "1px solid rgba(34,211,238,0.25)" }}>
              TOKI
            </div>
            <p className="text-xs leading-relaxed mt-1 whitespace-normal" style={{ color: "rgba(34,211,238,0.8)" }}>{dialogueText}</p>
            {/* Bubble tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45" style={{ background: "rgba(15,23,41,0.75)", borderRight: "1px solid rgba(34,211,238,0.2)", borderBottom: "1px solid rgba(34,211,238,0.2)" }} />
          </div>
        </div>
      </div>

      {/* === Overlay Panels === */}

      {/* Wallet Panel */}
      <LobbyOverlay
        isOpen={activePanel === "wallet"}
        onClose={() => setActivePanel(null)}
        title={t.lobby.walletSafe}
        icon={<span className="text-xl">🔐</span>}
      >
        <div className="space-y-6">
          {/* Wallet address */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">{t.dashboard.wallet}</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 p-3 rounded-lg bg-white/5 font-mono text-sm text-gray-300 break-all">
                {walletAddress || "\u2014"}
              </div>
              <button
                onClick={copyAddress}
                className="px-4 py-3 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition-colors"
              >
                {copied ? t.dashboard.copied : t.dashboard.copy}
              </button>
            </div>
          </div>

          {/* Balances */}
          <div>
            <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.balances}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-xs text-gray-500 mb-1">ETH</div>
                <div className="text-lg font-mono-num font-semibold text-gray-300">
                  {loading ? "..." : balances?.eth || "\u2014"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-xs text-gray-500 mb-1">TON</div>
                <div className="text-lg font-mono-num font-semibold text-accent-cyan">
                  {loading ? "..." : balances?.ton || "\u2014"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-xs text-gray-500 mb-1">TON (staked)</div>
                <div className="text-lg font-mono-num font-semibold text-accent-gold">
                  {loading ? "..." : balances?.staked || "\u2014"}
                </div>
              </div>
            </div>
          </div>

          {/* Seigniorage Breakdown */}
          {subgraphData && (
            <div>
              <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.staking}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">{t.dashboard.stakedPrincipal}</div>
                  <div className="text-base font-mono-num font-semibold text-gray-300">
                    {subgraphData.depositedFormatted}
                  </div>
                  <div className="text-[10px] text-gray-600">WTON</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-green-500/10">
                  <div className="text-xs text-gray-500 mb-1">{t.dashboard.seigEarned}</div>
                  <div className="text-base font-mono-num font-semibold text-green-400">
                    +{subgraphData.seigEarnedFormatted}
                  </div>
                  <div className="text-[10px] text-gray-600">WTON</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-accent-gold/10">
                  <div className="text-xs text-gray-500 mb-1">{t.dashboard.totalStakedValue}</div>
                  <div className="text-base font-mono-num font-semibold text-accent-gold">
                    {loading ? "..." : balances?.staked || "\u2014"}
                  </div>
                  <div className="text-[10px] text-gray-600">WTON</div>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Status in Vault */}
          {withdrawalStatus && (withdrawalStatus.withdrawableRequests.length > 0 || withdrawalStatus.pendingRequests.length > 0) && (
            <div>
              <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.vaultWithdrawalTitle}</h3>
              <div className="space-y-3">
                {/* Withdrawable items */}
                {withdrawalStatus.withdrawableRequests.length > 0 && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 overflow-hidden">
                    <div className="px-4 py-2 bg-green-500/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)] animate-pulse" />
                      <span className="text-xs font-medium text-green-400">{t.dashboard.withdrawalReady}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {withdrawalStatus.withdrawableRequests.map((req) => {
                        const formatted = Number(formatUnits(req.amount, 27)).toLocaleString("en-US", { maximumFractionDigits: 2 });
                        return (
                          <div key={`${req.operatorAddress}-${req.index}`} className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-mono-num text-green-400">{formatted} TON</div>
                              <div className="text-[10px] text-gray-500 font-mono">{req.operatorAddress.slice(0, 10)}...{req.operatorAddress.slice(-4)}</div>
                            </div>
                            <button
                              onClick={() => handleWithdraw(req.operatorAddress, 1)}
                              disabled={withdrawProcessing === req.operatorAddress}
                              className="px-4 py-2 rounded-lg bg-green-600/80 text-white text-xs font-medium disabled:opacity-40 hover:bg-green-600 transition-colors whitespace-nowrap"
                            >
                              {withdrawProcessing === req.operatorAddress ? t.dashboard.vaultWithdrawProcessing : t.dashboard.withdrawAsTon}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pending items */}
                {withdrawalStatus.pendingRequests.length > 0 && (
                  <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/10 overflow-hidden">
                    <div className="px-4 py-2 bg-yellow-500/5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                      <span className="text-xs text-yellow-400/80">{t.dashboard.withdrawalPending}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {withdrawalStatus.pendingRequests.map((req) => {
                        const formatted = Number(formatUnits(req.amount, 27)).toLocaleString("en-US", { maximumFractionDigits: 2 });
                        const days = Math.floor((req.blocksRemaining * 12) / 86400);
                        const hours = Math.floor(((req.blocksRemaining * 12) % 86400) / 3600);
                        return (
                          <div key={`${req.operatorAddress}-${req.index}`} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-mono-num text-yellow-400/80">{formatted} TON</div>
                              <div className="text-[10px] text-gray-500 font-mono">{req.operatorAddress.slice(0, 10)}...{req.operatorAddress.slice(-4)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-yellow-400/60">{t.dashboard.waiting}</div>
                              <div className="text-[10px] text-gray-500">~{days}d {hours}h</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tx status */}
                {withdrawTxHash && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-sm text-green-400">{t.dashboard.txSubmitted}</div>
                    <a
                      href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${withdrawTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-500 hover:text-green-300 font-mono break-all"
                    >
                      {withdrawTxHash}
                    </a>
                  </div>
                )}
                {withdrawError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-sm text-red-400 break-all">{withdrawError}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staking Transaction History */}
          {subgraphData?.events && subgraphData.events.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-400 mb-3">{t.dashboard.stakingHistory}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {subgraphData.events.slice(0, 20).map((ev, i) => {
                  const date = new Date(Number(ev.timestamp) * 1000);
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    <a
                      key={ev.transactionHash || `${ev.type}-${i}`}
                      href={ev.transactionHash ? `https://${isTestnet ? "sepolia." : ""}etherscan.io/tx/${ev.transactionHash}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${
                          ev.type === "stake" ? "bg-green-400" :
                          ev.type === "unstake" ? "bg-yellow-400" :
                          ev.type === "withdrawal" ? "bg-blue-400" :
                          "bg-purple-400"
                        }`} />
                        <div>
                          <div className="text-xs font-medium text-gray-300">
                            {ev.type === "stake" ? "Stake" :
                             ev.type === "unstake" ? "Unstake" :
                             ev.type === "withdrawal" ? "Withdrawal" :
                             "Restake"}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {ev.candidateName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-mono-num font-semibold ${
                          ev.type === "stake" || ev.type === "restake" ? "text-green-400" : "text-yellow-400"
                        }`}>
                          {ev.type === "stake" || ev.type === "restake" ? "+" : "-"}{ev.amount} TON
                        </div>
                        <div className="text-[10px] text-gray-600 group-hover:text-accent-cyan transition-colors">
                          {dateStr}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRefreshBalances}
              className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
            >
              {t.dashboard.refreshBalances}
            </button>
            <a
              href={`https://${isTestnet ? "sepolia." : ""}etherscan.io/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-white/10 text-sm text-gray-300 hover:bg-white/15 transition-colors"
            >
              {t.dashboard.viewOnEtherscan}
            </a>
          </div>
        </div>
      </LobbyOverlay>

      {/* Achievements Panel */}
      <LobbyOverlay
        isOpen={activePanel === "achievements"}
        onClose={() => setActivePanel(null)}
        title={t.lobby.achievementBoard}
        icon={<span className="text-xl">🏆</span>}
      >
        <CardCollection />
      </LobbyOverlay>
    </div>
  );
}
