"use client";

import { useState } from "react";

interface LobbyHotspotProps {
  label: string;
  description: string;
  onClick: () => void;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  size?: { width: string; height: string };
  color?: string; // e.g. "34,211,238" (cyan), "168,85,247" (purple)
  pingDelay?: number; // stagger ping animation per hotspot (seconds)
}

export default function LobbyHotspot({
  label,
  description,
  onClick,
  position,
  size = { width: "120px", height: "120px" },
  color = "255,255,255",
  pingDelay = 0,
}: LobbyHotspotProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="absolute cursor-pointer focus:outline-none group"
      style={{ ...position, width: size.width, height: size.height }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${label}: ${description}`}
    >
      {/* Hover glow bloom */}
      <div
        className="absolute inset-0 rounded-[40%] transition-all duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(ellipse at center, rgba(${color},0.25) 0%, rgba(${color},0.08) 50%, transparent 75%)`
            : "transparent",
          transform: isHovered ? "scale(1.1)" : "scale(0.9)",
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Ping ripple 1 */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: "30%", height: "30%",
          transform: "translate(-50%, -50%)",
          border: `2px solid rgba(${color},0.6)`,
          boxShadow: `0 0 8px 2px rgba(${color},0.3)`,
          animation: `hotspotPing 3.5s ease-out infinite`,
          animationDelay: `${pingDelay}s`,
        }}
      />
      {/* Ping ripple 2 (offset) */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: "30%", height: "30%",
          transform: "translate(-50%, -50%)",
          border: `2px solid rgba(${color},0.4)`,
          boxShadow: `0 0 6px 2px rgba(${color},0.2)`,
          animation: `hotspotPing 3.5s ease-out infinite`,
          animationDelay: `${pingDelay + 0.6}s`,
        }}
      />

      {/* Label tooltip on hover */}
      <div
        className={`absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 z-10 ${
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10">
          <div className="text-xs font-bold text-white">{label}</div>
          <div className="text-[10px] text-gray-400">{description}</div>
        </div>
      </div>
    </button>
  );
}
