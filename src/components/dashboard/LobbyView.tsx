"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import LobbyHotspot from "./LobbyHotspot";
import LobbyOverlay from "./LobbyOverlay";
import CardCollection from "./CardCollection";

interface LobbyViewProps {
  balances: { eth: string; ton: string; wton: string } | null;
  loading: boolean;
  walletAddress: string;
  shortAddr: string;
  displayName: string;
  onRefreshBalances: () => void;
  isTestnet: boolean;
}

export default function LobbyView({
  balances,
  loading,
  walletAddress,
  shortAddr,
  displayName,
  onRefreshBalances,
  isTestnet,
}: LobbyViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueText, setDialogueText] = useState("");
  const [roomLoaded, setRoomLoaded] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setRoomLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Random Toki greeting
  const greetings = [
    t.lobby.tokiGreeting1,
    t.lobby.tokiGreeting2,
    t.lobby.tokiGreeting3,
    t.lobby.tokiGreeting4,
  ];

  const handleTokiClick = () => {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setDialogueText(randomGreeting);
    setShowDialogue(true);
    setTimeout(() => setShowDialogue(false), 4000);
  };

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
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden select-none bg-[#0a0e1a]">
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
        />
      </div>

      {/* === Room Title === */}
      <div
        className={`absolute top-5 left-1/2 -translate-x-1/2 text-center z-10 transition-all duration-700 ${
          roomLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <h1 className="text-lg font-bold text-white/70 tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {displayName}&apos;s Room
        </h1>
        <p className="text-[11px] text-cyan-400/50 mt-0.5 drop-shadow-md">{t.lobby.welcomeSub}</p>
      </div>

      {/* === Toki Character (overlaid on room center-bottom) === */}
      <div
        className={`absolute bottom-[2%] left-1/2 -translate-x-1/2 z-10 transition-all duration-700 delay-500 ${
          roomLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Character glow on floor */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[160px] h-[60px] opacity-50"
          style={{
            background: "radial-gradient(ellipse, rgba(74,144,217,0.35) 0%, transparent 70%)",
            filter: "blur(15px)",
          }}
        />

        {/* Toki image - clickable */}
        <button
          onClick={handleTokiClick}
          className="relative cursor-pointer hover:scale-105 transition-transform duration-300 focus:outline-none"
          aria-label="Talk to Toki"
        >
          <Image
            src="/toki-welcome.png"
            alt="Toki"
            width={180}
            height={230}
            className="object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            priority
          />
        </button>
      </div>

      {/* === VN Dialogue Box === */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xl transition-all duration-300 ${
          showDialogue ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="relative bg-[#0f1729]/90 backdrop-blur-md border border-cyan-400/20 rounded-xl px-6 py-4 shadow-xl shadow-black/50">
          {/* Name tag */}
          <div className="absolute -top-3 left-4 px-3 py-0.5 bg-cyan-500/20 border border-cyan-400/30 rounded-md">
            <span className="text-xs font-bold text-cyan-400">TOKI</span>
          </div>
          {/* Dialogue text */}
          <p className="text-sm text-gray-200 mt-1 leading-relaxed">{dialogueText}</p>
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
              <div className="flex-1 p-3 rounded-lg bg-white/5 font-mono text-sm text-gray-300 truncate">
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
                  {loading ? "..." : balances?.wton || "\u2014"}
                </div>
              </div>
            </div>
          </div>

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
