"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

type CinematicPhase =
  | "boot"
  | "typing"
  | "ready"
  | "panning"
  | "reveal"
  | "done";

// ─── Terminal Typing Hook ────────────────────────────────────────────

function useTerminalSequence(
  lines: string[],
  active: boolean,
  charSpeed = 30,
  lineDelay = 300,
) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skipAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisibleLines(lines);
    setCurrentLineIndex(lines.length);
    setCurrentCharIndex(0);
    setDone(true);
  }, [lines]);

  useEffect(() => {
    if (!active || done) return;

    if (currentLineIndex >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLineIndex];

    if (currentCharIndex === 0) {
      setVisibleLines((prev) => {
        const next = [...prev];
        if (next.length <= currentLineIndex) {
          next.push("");
        }
        return next;
      });
    }

    if (currentCharIndex < line.length) {
      intervalRef.current = setInterval(() => {
        setCurrentCharIndex((prev) => {
          const next = prev + 1;
          setVisibleLines((prevLines) => {
            const updated = [...prevLines];
            updated[currentLineIndex] = line.slice(0, next);
            return updated;
          });
          if (next >= line.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            timeoutRef.current = setTimeout(() => {
              setCurrentLineIndex((prev) => prev + 1);
              setCurrentCharIndex(0);
            }, lineDelay);
          }
          return next;
        });
      }, charSpeed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    active,
    currentLineIndex,
    currentCharIndex,
    lines,
    charSpeed,
    lineDelay,
    done,
  ]);

  return { visibleLines, done, skipAll };
}

// ─── IntroCinematic Component ────────────────────────────────────────

export default function IntroCinematic({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<CinematicPhase>("boot");
  const completeCalled = useRef(false);

  const terminalLines = useMemo(
    () => [
      t.onboarding.introTerminal1,
      t.onboarding.introTerminal2,
      t.onboarding.introTerminal3,
      t.onboarding.introTerminal4,
      t.onboarding.introTerminal5,
      t.onboarding.introTerminal6,
      t.onboarding.introTerminal7,
      t.onboarding.introTerminal8,
      t.onboarding.introTerminal9,
    ],
    [t],
  );

  const {
    visibleLines,
    done: typingDone,
    skipAll,
  } = useTerminalSequence(terminalLines, phase === "typing");

  // Boot → Typing
  useEffect(() => {
    if (phase !== "boot") return;
    const timer = setTimeout(() => setPhase("typing"), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Typing done → Ready
  useEffect(() => {
    if (phase === "typing" && typingDone) {
      const timer = setTimeout(() => setPhase("ready"), 400);
      return () => clearTimeout(timer);
    }
  }, [phase, typingDone]);

  // Ready → Panning
  useEffect(() => {
    if (phase !== "ready") return;
    const timer = setTimeout(() => setPhase("panning"), 1200);
    return () => clearTimeout(timer);
  }, [phase]);

  // Panning → Reveal (wait for pan animation to finish)
  useEffect(() => {
    if (phase !== "panning") return;
    const timer = setTimeout(() => setPhase("reveal"), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

  // Reveal: wait for user click (no auto-progress)

  // Click handler — behavior depends on phase
  const handleClick = useCallback(() => {
    if (phase === "done") return;

    if (phase === "reveal") {
      // User clicked after seeing the character → proceed to quest
      setPhase("done");
      if (!completeCalled.current) {
        completeCalled.current = true;
        onComplete();
      }
      return;
    }

    // During any other phase, skip to done
    if (phase === "typing") {
      skipAll();
    }
    setPhase("done");
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  }, [phase, skipAll, onComplete]);

  if (phase === "done") return null;

  // During panning/reveal, the scene scrolls up: laptop → character
  const isPanning = phase === "panning" || phase === "reveal";

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden"
      onClick={handleClick}
    >
      {/* ── Scrollable scene (200vh tall, pans from bottom to top) ── */}
      <div
        className="absolute inset-x-0 h-[200vh] transition-transform ease-in-out"
        style={{
          transform: isPanning ? "translateY(0)" : "translateY(-50%)",
          transitionDuration: isPanning ? "1.5s" : "0s",
        }}
      >
        {/* ── Top half: Character ── */}
        <div
          className="relative h-[100vh] bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/intro-toki-character.png')",
            backgroundColor: "#0c1018",
            backgroundPosition: "center 20%",
          }}
        >
          {/* Gradient blend at the bottom edge (connects to laptop section) */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e17] to-transparent z-20" />
        </div>

        {/* ── Bottom half: Laptop terminal ── */}
        <div className="relative h-[100vh]">
          {/* Laptop background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/intro-cafe-laptop.png')" }}
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Gradient blend at the top edge (connects to character section) */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0e17] to-transparent z-20" />

          {/* Scanline overlay */}
          <div className="absolute inset-0 terminal-scanlines" />

          {/* Terminal text overlay — positioned on the laptop screen */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="w-[58%] sm:w-[54%] md:w-[50%] -mt-[2%]">
              {/* Boot cursor */}
              {phase === "boot" && (
                <div className="terminal-glow font-mono text-accent-cyan text-xs sm:text-sm">
                  <span className="inline-block w-2 h-4 bg-accent-cyan animate-pulse" />
                </div>
              )}

              {/* Terminal lines */}
              {phase !== "boot" && (
                <div className="space-y-1 sm:space-y-1.5">
                  {visibleLines.map((line, i) => (
                    <div
                      key={i}
                      className="terminal-glow font-mono text-accent-cyan text-[11px] sm:text-xs md:text-sm leading-relaxed"
                    >
                      {line}
                      {phase === "typing" &&
                        !typingDone &&
                        i === visibleLines.length - 1 && (
                          <span className="inline-block w-1.5 h-3.5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
                        )}
                    </div>
                  ))}

                  {/* "TOKAMAK NETWORK" brand */}
                  {(phase === "ready" || isPanning) && (
                    <div className="mt-4 sm:mt-6 animate-fade-in">
                      <div className="text-sm sm:text-xl md:text-2xl font-bold tracking-[0.2em] sm:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-cyan terminal-glow">
                        TOKAMAK NETWORK
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skip hint during terminal phases */}
      {!isPanning && (
        <div className="absolute bottom-6 left-0 right-0 text-center z-30">
          <span className="text-xs text-gray-500 font-mono animate-pulse">
            {t.onboarding.introTerminalSkip}
          </span>
        </div>
      )}

      {/* Click to continue hint during reveal */}
      {phase === "reveal" && (
        <div className="absolute bottom-8 left-0 right-0 text-center z-30 animate-fade-in">
          <span className="text-sm text-white/70 font-mono animate-pulse">
            {t.onboarding.clickToContinue} ▼
          </span>
        </div>
      )}
    </div>
  );
}
