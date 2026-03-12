"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

type OverlayPhase = "enter" | "panning" | "playing" | "closing" | "done";

interface LaptopVideoOverlayProps {
  videoUrl?: string;
  children?: ReactNode;
  onClose: () => void;
  bgImage?: string;
}

export default function LaptopVideoOverlay({
  videoUrl,
  children,
  onClose,
  bgImage = "/backgrounds/1.png",
}: LaptopVideoOverlayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<OverlayPhase>("enter");
  const closeCalled = useRef(false);

  // Enter → start pan down after a brief moment (shows quest bg first)
  useEffect(() => {
    if (phase !== "enter") return;
    const timer = setTimeout(() => setPhase("panning"), 100);
    return () => clearTimeout(timer);
  }, [phase]);

  // Panning complete → playing
  useEffect(() => {
    if (phase !== "panning") return;
    const timer = setTimeout(() => setPhase("playing"), 1600);
    return () => clearTimeout(timer);
  }, [phase]);

  // Closing pan up complete → call onClose
  useEffect(() => {
    if (phase !== "closing") return;
    const timer = setTimeout(() => {
      setPhase("done");
      if (!closeCalled.current) {
        closeCalled.current = true;
        onClose();
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const handleClose = useCallback(() => {
    if (phase === "closing" || phase === "done") return;
    setPhase("closing");
  }, [phase]);

  if (phase === "done") return null;

  // enter: translateY(0) — shows quest bg (top half)
  // panning/playing: translateY(-50%) — shows laptop (bottom half)
  // closing: translateY(0) — back to quest bg
  const isPannedDown = phase === "panning" || phase === "playing";
  const isVideoReady = phase === "playing";

  return (
    <div
      className="fixed inset-0 z-40 cursor-pointer select-none overflow-hidden"
      onClick={handleClose}
    >
      {/* 200vh scrollable scene — reverse of IntroCinematic */}
      <div
        className="absolute inset-x-0 h-[200vh] transition-transform ease-in-out"
        style={{
          transform: isPannedDown ? "translateY(-50%)" : "translateY(0)",
          transitionDuration: "1.5s",
        }}
      >
        {/* Top half: Current quest background */}
        <div
          className="relative h-[100vh] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundColor: "#0c1018",
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e17] to-transparent z-20" />
        </div>

        {/* Bottom half: Laptop with video */}
        <div className="relative h-[100vh]">
          {/* Laptop background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/intro-cafe-laptop.png')" }}
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Gradient blend at top edge */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0e17] to-transparent z-20" />

          {/* Scanline overlay for laptop feel */}
          <div className="absolute inset-0 terminal-scanlines" />

          {/* Video area — positioned on the laptop screen */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div
              className="relative -mt-[2%]"
              style={{ width: "min(1300px, 78vw)", height: "min(800px, 70vh)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Laptop bezel frame */}
              <div className="absolute -inset-3 sm:-inset-4 rounded-xl bg-gradient-to-b from-[#2a2a2e] via-[#1c1c20] to-[#0e0e12] shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_120px_rgba(0,0,0,0.5)]" />

              {/* Inner bezel edge — subtle metallic highlight */}
              <div className="absolute -inset-1.5 sm:-inset-2 rounded-lg bg-gradient-to-b from-[#3a3a40] via-[#222228] to-[#18181c]" />

              {/* Screen area with glow */}
              <div
                className={`relative w-full h-full rounded-md overflow-hidden transition-all duration-700 ${
                  isVideoReady ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  boxShadow: isVideoReady
                    ? "inset 0 0 30px rgba(34,211,238,0.1), 0 0 40px rgba(34,211,238,0.08)"
                    : "none",
                }}
              >
                {/* Screen-on glow effect */}
                <div
                  className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000 ${
                    isVideoReady ? "opacity-0" : "opacity-100"
                  }`}
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, rgba(0,0,0,0.9) 70%)",
                  }}
                />

                {/* Content: video iframe or custom children */}
                {(phase === "panning" || phase === "playing") && (
                  children ? (
                    <div className="w-full h-full overflow-y-auto bg-[#0a0e17]">
                      {children}
                    </div>
                  ) : videoUrl ? (
                    <iframe
                      src={videoUrl}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: "none" }}
                    />
                  ) : null
                )}

                {/* Screen reflection overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: "linear-gradient(165deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)",
                  }}
                />
              </div>

              {/* Webcam dot on bezel top */}
              <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1a1a1e] z-30">
                <div className="absolute inset-0 rounded-full bg-gray-700" />
              </div>

              {/* Power LED on bezel bottom */}
              <div
                className={`absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full z-30 transition-all duration-1000 ${
                  isVideoReady ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-gray-600"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      {isVideoReady && (
        <div className="absolute top-6 right-6 z-50 animate-fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="px-5 py-2.5 rounded-full bg-white/15 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/25 transition-colors backdrop-blur-sm"
          >
            ✕ {t.onboarding.closeVideo}
          </button>
        </div>
      )}

      {/* Tap outside hint */}
      {isVideoReady && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <p className="text-white/40 text-xs tracking-wide animate-pulse">
            Tap outside to go back
          </p>
        </div>
      )}
    </div>
  );
}
