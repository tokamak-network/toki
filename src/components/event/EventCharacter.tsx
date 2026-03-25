"use client";

import Image from "next/image";
import type { Mood } from "@/lib/toki-dialogue";

const MOOD_IMAGES: Record<string, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  thinking: "/characters/toki-thinking.png",
  excited: "/characters/toki-excited.png",
  proud: "/characters/toki-proud.png",
  cheer: "/characters/toki-cheer.png",
  wink: "/characters/toki-wink.png",
  peace: "/characters/toki-peace.png",
  confused: "/characters/toki-confused.png",
  determined: "/characters/toki-determined.png",
  neutral: "/characters/toki.png",
};

const MOOD_GLOW: Record<string, string> = {
  welcome: "rgba(74, 144, 217, 0.5)",
  thinking: "rgba(99, 102, 241, 0.5)",
  excited: "rgba(245, 158, 11, 0.6)",
  proud: "rgba(34, 211, 238, 0.5)",
  cheer: "rgba(168, 85, 247, 0.5)",
  wink: "rgba(236, 72, 153, 0.5)",
  peace: "rgba(34, 211, 238, 0.4)",
  confused: "rgba(99, 102, 241, 0.4)",
  determined: "rgba(239, 68, 68, 0.4)",
  neutral: "rgba(148, 163, 184, 0.3)",
};

interface EventCharacterProps {
  mood: Mood;
  isSpeaking?: boolean;
}

/**
 * Large Toki character for event/kiosk mode.
 * Takes up ~60% of the viewport height.
 */
export default function EventCharacter({ mood, isSpeaking }: EventCharacterProps) {
  const imageSrc = MOOD_IMAGES[mood] || MOOD_IMAGES.neutral;
  const glow = MOOD_GLOW[mood] || MOOD_GLOW.neutral;

  return (
    <div className="relative flex items-end justify-center h-[55vh]">
      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-60 transition-colors duration-700"
        style={{ backgroundColor: glow }}
      />
      <Image
        src={imageSrc}
        alt="Toki"
        width={512}
        height={512}
        priority
        className={`relative z-10 w-80 h-auto max-h-[50vh] object-contain object-bottom drop-shadow-2xl transition-all duration-300 ${
          isSpeaking ? "animate-toki-talking" : "animate-float"
        }`}
      />
    </div>
  );
}
