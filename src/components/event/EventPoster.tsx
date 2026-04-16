"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

export default function EventPoster() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [landed, setLanded] = useState(false);

  // Trigger entry animation on mount
  useEffect(() => {
    const t1 = setTimeout(() => setEntered(true), 100);
    // Drop animation is 0.8s, show neon + stamp after landing
    const t2 = setTimeout(() => setLanded(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Spotlight follows mouse/touch
  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    const overlay = spotlightRef.current;
    if (!wrap || !overlay) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((clientY - rect.top) / rect.height * 100).toFixed(1);
    overlay.style.setProperty("--mx", x + "%");
    overlay.style.setProperty("--my", y + "%");
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-2xl mb-6"
      style={{ overflow: "visible" }}
      onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        handlePointer(t.clientX, t.clientY);
      }}
    >
      {/* 6. Neon border — always rendered, fade in after landing */}
      <div
        className={`absolute rounded-[18px] animate-neon-rotate transition-opacity duration-700 ${landed ? "opacity-100" : "opacity-0"}`}
        style={{
          inset: "-3px",
          background: "conic-gradient(from var(--neon-angle, 0deg), #ec4899, #22d3ee, #a855f7, #ec4899)",
          filter: "blur(1px)",
          zIndex: 0,
        }}
      />
      <div
        className={`absolute rounded-[18px] animate-neon-rotate transition-opacity duration-700 ${landed ? "opacity-50" : "opacity-0"}`}
        style={{
          inset: "-3px",
          background: "conic-gradient(from var(--neon-angle, 0deg), #ec4899, #22d3ee, #a855f7, #ec4899)",
          filter: "blur(12px)",
          zIndex: 0,
        }}
      />

      {/* 7. Poster image with drop animation */}
      <div className="relative z-[1] w-full rounded-2xl" style={{ aspectRatio: "600/849" }}>
        <Image
          src="/event-poster.webp"
          alt="Toki Lottery Event Poster"
          fill
          className={`rounded-2xl object-cover ${entered ? "animate-ticket-drop" : "invisible"}`}
          priority
        />
      </div>

      {/* 4. Spotlight overlay */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 z-[2] pointer-events-none rounded-2xl"
        style={{
          background: "radial-gradient(circle 120px at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.25) 0%, transparent 100%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* 1. Cherry blossom petals */}
      <div className="absolute z-[2] pointer-events-none overflow-hidden" style={{ inset: "-30px" }}>
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-[50%_0_50%_0] opacity-0 animate-petal-fall"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              background: "radial-gradient(circle, #f9a8d4 30%, #fbcfe8 70%, transparent)",
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* 7. Drop shadow */}
      {entered && (
        <div
          className="absolute z-0 animate-shadow-grow"
          style={{
            bottom: "-8px",
            left: "10%",
            right: "10%",
            height: "16px",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}

const PETALS = [
  { size: "11px", left: "3%", duration: "4.2s", delay: "0s" },
  { size: "9px", left: "12%", duration: "5.1s", delay: "0.6s" },
  { size: "13px", left: "22%", duration: "3.8s", delay: "1.4s" },
  { size: "10px", left: "35%", duration: "4.6s", delay: "0.2s" },
  { size: "8px", left: "45%", duration: "5.4s", delay: "2.0s" },
  { size: "12px", left: "55%", duration: "3.9s", delay: "0.9s" },
  { size: "10px", left: "65%", duration: "4.3s", delay: "1.7s" },
  { size: "14px", left: "75%", duration: "5.0s", delay: "0.4s" },
  { size: "9px", left: "85%", duration: "4.1s", delay: "2.3s" },
  { size: "11px", left: "93%", duration: "4.7s", delay: "1.1s" },
  { size: "7px", left: "8%", duration: "5.2s", delay: "3.0s" },
  { size: "10px", left: "50%", duration: "4.4s", delay: "3.5s" },
];
