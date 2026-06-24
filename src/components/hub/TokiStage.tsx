"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// Lobby moods — fallback when no imageSrc (full-body) is given.
export type TokiMood =
  | "welcome"
  | "proud"
  | "cheer"
  | "excited"
  | "thinking"
  | "pointing"
  | "wink";

// Character-by-character reveal (mirrors VNStakingPanel's useTypewriter).
function useTypewriter(text: string, speed = 32) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

/**
 * Toki standing in the scene: full-body sprite anchored to the bottom-center of
 * its parent, with the dialogue box overlaid at the bottom. Character is static
 * — soft glow pulse + a brief bounce on mood change (respects reduced-motion).
 * Fills its parent (which must have a height). Tap dialogue to fast-forward.
 */
export default function TokiStage({
  mood,
  dialogue,
  imageSrc,
  speaker = "Toki",
}: {
  mood: TokiMood;
  dialogue: string;
  imageSrc?: string;
  speaker?: string;
}) {
  const { displayed, done, skip } = useTypewriter(dialogue);
  const [popKey, setPopKey] = useState(0);

  useEffect(() => {
    setPopKey((k) => k + 1);
  }, [mood, imageSrc]);

  const src = imageSrc ?? `/characters/toki-${mood}.png`;
  const full = !!imageSrc;

  return (
    <div className="relative h-full w-full flex items-end justify-center">
      {/* Character group (glow + sprite) — shifted left 230px on desktop, down 70px + top 110px */}
      <div className="relative flex items-end justify-center top-[110px] translate-y-[70px] lg:-translate-x-[230px]">
        {/* Glow behind the character */}
        <div
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl animate-glow-pulse opacity-30"
          style={{ backgroundColor: "rgba(34, 211, 238, 0.35)" }}
        />

        {/* Character (brief bounce on mood change) */}
        <div key={popKey} className="relative animate-reaction motion-reduce:animate-none">
          <Image
            src={src}
            alt="Toki"
            width={full ? 533 : 512}
            height={full ? 1450 : 512}
            priority
            className={`${
              full
                ? "h-[46vh] sm:h-[54vh] lg:h-[78vh] w-auto"
                : "w-48 sm:w-64 md:w-72 lg:w-80 h-auto"
            } object-contain drop-shadow-2xl`}
          />
        </div>
      </div>

      {/* Dialogue box — pinned to the very bottom, shifted left 230px on desktop */}
      <div
        className="absolute bottom-0 left-1/2 w-[40rem] max-w-[92vw] [transform:translateX(-50%)_translateY(70px)] lg:[transform:translateX(calc(-50%_-_230px))_translateY(70px)] cursor-pointer select-none"
        onClick={() => !done && skip()}
      >
        <div className="bg-black/65 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 mb-2">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">
              {speaker}
            </span>
          </div>
          <p className="text-gray-100 text-sm sm:text-base leading-relaxed">
            {displayed}
            {!done && (
              <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
