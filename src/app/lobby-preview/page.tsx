"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LobbyHotspot from "@/components/dashboard/LobbyHotspot";

export default function LobbyPreview() {
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueText, setDialogueText] = useState("");

  const greetings = [
    "Welcome to your room! Click around to explore~",
    "Hey! Try clicking the monitors or the portal!",
    "The achievement board has your card collection!",
  ];

  useEffect(() => {
    const timer = setTimeout(() => setRoomLoaded(true), 100);
    const greetTimer = setTimeout(() => {
      setDialogueText(greetings[Math.floor(Math.random() * greetings.length)]);
      setShowDialogue(true);
      setTimeout(() => setShowDialogue(false), 5000);
    }, 1200);
    return () => { clearTimeout(timer); clearTimeout(greetTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTokiClick = () => {
    setDialogueText(greetings[Math.floor(Math.random() * greetings.length)]);
    setShowDialogue(true);
    setTimeout(() => setShowDialogue(false), 4000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#0a0e1a]">
      {/* Room Background */}
      <div className="absolute inset-0">
        <Image
          src="/lobby-room.png"
          alt="Room"
          fill
          className={`object-cover transition-all duration-1000 ${
            roomLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          priority
        />
      </div>

      {/* CSS Dynamic Effects Layer */}
      <div className="absolute inset-0 pointer-events-none">

        {/* ── MONITORS: beacon + bright particles ── */}
        <div className="absolute rounded-full" style={{
          top: "36%", left: "20%", width: "8px", height: "8px",
          background: "rgba(34,211,238,1)",
          boxShadow: "0 0 16px 6px rgba(34,211,238,0.7), 0 0 40px 15px rgba(34,211,238,0.3)",
          animation: "beacon 2s ease-in-out infinite",
        }} />
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

        {/* ── PORTAL: orbiting particles ── */}
        <div className="absolute" style={{ top: "8%", left: "62%", width: "22%", height: "82%" }}>
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

        {/* ── ACHIEVEMENT BOARD: beacon + bright sparkles ── */}
        <div className="absolute rounded-full" style={{
          top: "40%", right: "12%", width: "8px", height: "8px",
          background: "rgba(168,85,247,1)",
          boxShadow: "0 0 16px 6px rgba(168,85,247,0.7), 0 0 40px 15px rgba(168,85,247,0.3)",
          animation: "beacon 2.5s ease-in-out infinite",
          animationDelay: "0.8s",
        }} />
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

        {/* ── SAFE: beacon + bright particles ── */}
        <div className="absolute rounded-full" style={{
          bottom: "12%", left: "18%", width: "8px", height: "8px",
          background: "#f59e0b",
          boxShadow: "0 0 14px 5px rgba(245,158,11,0.8), 0 0 35px 12px rgba(245,158,11,0.3)",
          animation: "beacon 2s ease-in-out infinite",
          animationDelay: "0.4s",
        }} />
        <div className="absolute w-2 h-2 rounded-full" style={{
          bottom: "10%", left: "20%", background: "#22c55e",
          boxShadow: "0 0 10px 4px rgba(34,197,94,0.6)",
          animation: "safeBlink 3s ease-in-out infinite", animationDelay: "1s",
        }} />
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

        {/* ── STRING LIGHTS ── */}
        {[
          { left: "10%", top: "9%" }, { left: "18%", top: "7%" }, { left: "26%", top: "9%" },
          { left: "34%", top: "7.5%" }, { left: "42%", top: "9%" }, { left: "50%", top: "7%" },
          { left: "58%", top: "8.5%" }, { left: "66%", top: "7%" }, { left: "74%", top: "9%" },
          { left: "82%", top: "7.5%" }, { left: "90%", top: "9%" },
        ].map((pos, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full" style={{
            ...pos, background: "rgba(255,220,150,0.9)",
            boxShadow: "0 0 8px 3px rgba(255,200,100,0.5)",
            animation: `twinkle ${2 + (i % 3) * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}

        {/* ── DUST PARTICLES ── */}
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

      {/* Hotspots */}
      <div className={`absolute inset-0 z-10 transition-all duration-700 delay-300 ${roomLoaded ? "opacity-100" : "opacity-0"}`}>
        <LobbyHotspot label="Staking Terminal" description="Manage staking" onClick={() => {}}
          position={{ top: "22%", left: "2%" }} size={{ width: "38%", height: "35%" }}
          color="34,211,238" pingDelay={0} />
        <LobbyHotspot label="Wallet Vault" description="Check balances" onClick={() => {}}
          position={{ bottom: "4%", left: "14%" }} size={{ width: "14%", height: "22%" }}
          color="245,158,11" pingDelay={1.2} />
        <LobbyHotspot label="Achievement Board" description="Card collection" onClick={() => {}}
          position={{ top: "15%", right: "4%" }} size={{ width: "20%", height: "55%" }}
          color="168,85,247" pingDelay={0.6} />
        <LobbyHotspot label="Explore Portal" description="Discover ecosystem" onClick={() => {}}
          position={{ top: "10%", left: "62%" }} size={{ width: "18%", height: "78%" }}
          color="139,92,246" pingDelay={1.8} />
      </div>

      {/* VN-Style Toki Dialogue */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ${
        showDialogue ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}>
        <div className="relative flex items-end px-4 pb-4 pt-2">
          <div className={`relative flex-shrink-0 transition-all duration-500 delay-100 ${
            showDialogue ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          }`}>
            <Image src="/characters/toki-welcome.png" alt="Toki" width={140} height={180}
              className="object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" />
          </div>
          <div className={`flex-1 ml-2 mb-4 transition-all duration-400 delay-200 ${
            showDialogue ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            <div className="relative bg-[#0f1729]/90 backdrop-blur-md border border-cyan-400/20 rounded-xl px-5 py-3 shadow-xl shadow-black/50">
              <div className="absolute -top-3 left-4 px-3 py-0.5 bg-cyan-500/20 border border-cyan-400/30 rounded-md">
                <span className="text-xs font-bold text-cyan-400">TOKI</span>
              </div>
              <p className="text-sm text-gray-200 mt-1 leading-relaxed">{dialogueText}</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Toki Chat Button */}
      <button
        onClick={handleTokiClick}
        className={`absolute bottom-4 right-4 z-15 w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400/30 shadow-lg shadow-black/40 hover:scale-110 hover:border-cyan-400/60 transition-all duration-300 ${
          showDialogue ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${roomLoaded ? "translate-y-0" : "translate-y-8 opacity-0"}`}
        aria-label="Talk to Toki"
      >
        <Image src="/characters/toki-welcome.png" alt="Chat with Toki" width={48} height={48}
          className="object-cover object-top scale-150" />
      </button>
    </div>
  );
}
