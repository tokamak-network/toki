"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

type CinematicPhase = "boot" | "typing" | "ready" | "slide-away" | "done";

// ─── Terminal Typing Hook ────────────────────────────────────────────

function useTerminalSequence(
  lines: string[],
  active: boolean,
  charSpeed = 30,
  lineDelay = 300
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

    // Start typing characters of current line
    if (currentCharIndex === 0) {
      // Add a new empty line entry
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
            // Delay before next line
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
  }, [active, currentLineIndex, currentCharIndex, lines, charSpeed, lineDelay, done]);

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

  const terminalLines = useMemo(() => [
    t.onboarding.introTerminal1,
    t.onboarding.introTerminal2,
    t.onboarding.introTerminal3,
    t.onboarding.introTerminal4,
    t.onboarding.introTerminal5,
    t.onboarding.introTerminal6,
    t.onboarding.introTerminal7,
    t.onboarding.introTerminal8,
    t.onboarding.introTerminal9,
  ], [t]);

  const { visibleLines, done: typingDone, skipAll } = useTerminalSequence(
    terminalLines,
    phase === "typing"
  );

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

  // Ready → Slide-away
  useEffect(() => {
    if (phase !== "ready") return;
    const timer = setTimeout(() => setPhase("slide-away"), 1200);
    return () => clearTimeout(timer);
  }, [phase]);

  // Slide-away → Done
  useEffect(() => {
    if (phase !== "slide-away") return;
    const timer = setTimeout(() => {
      setPhase("done");
      if (!completeCalled.current) {
        completeCalled.current = true;
        onComplete();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  // Click to skip
  const handleSkip = useCallback(() => {
    if (phase === "done") return;
    if (phase === "typing") {
      skipAll();
    }
    // Jump straight to slide-away
    setPhase("slide-away");
  }, [phase, skipAll]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-50 cursor-pointer select-none ${
        phase === "slide-away" ? "animate-cinematic-exit" : ""
      }`}
      onClick={handleSkip}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0e17]" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 terminal-scanlines" />

      {/* Terminal content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 md:px-20 max-w-3xl mx-auto">
        {/* Boot cursor */}
        {phase === "boot" && (
          <div className="terminal-glow font-mono text-accent-cyan text-sm sm:text-base">
            <span className="inline-block w-2.5 h-5 bg-accent-cyan animate-pulse" />
          </div>
        )}

        {/* Terminal lines */}
        {(phase === "typing" || phase === "ready" || phase === "slide-away") && (
          <div className="space-y-1.5">
            {visibleLines.map((line, i) => (
              <div
                key={i}
                className="terminal-glow font-mono text-accent-cyan text-sm sm:text-base leading-relaxed"
              >
                {line}
                {/* Blinking cursor on the active line */}
                {phase === "typing" &&
                  !typingDone &&
                  i === visibleLines.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
                  )}
              </div>
            ))}

            {/* "TOKAMAK NETWORK" brand */}
            {(phase === "ready" || phase === "slide-away") && (
              <div className="mt-8 animate-fade-in">
                <div className="text-2xl sm:text-4xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-cyan terminal-glow">
                  TOKAMAK NETWORK
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skip hint */}
        {phase !== "slide-away" && (
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <span className="text-xs text-gray-600 font-mono animate-pulse">
              {t.onboarding.introTerminalSkip}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
