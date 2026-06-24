import type { Mood } from "./dialogue";

export type { Mood };

export const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "toki-welcome.png",
  explain: "toki-explain.png",
  thinking: "toki-thinking.png",
  excited: "toki-excited.png",
  proud: "toki-proud.png",
  cheer: "toki-cheer.png",
  wink: "toki-wink.png",
  surprised: "toki-excited.png",     // fallback
  confused: "toki-thinking.png",     // fallback
  shy: "toki-wink.png",              // fallback
  determined: "toki-excited.png",    // fallback
  pointing: "toki-explain.png",      // fallback
  reading: "toki-explain.png",       // fallback
  "crying-happy": "toki-celebrate.png", // fallback
  peace: "toki-welcome.png",         // fallback
  worried: "toki-thinking.png",      // fallback
  laughing: "toki-cheer.png",        // fallback
  neutral: "toki-welcome.png",       // fallback
};

export function getSpriteUrl(mood: Mood): string {
  return chrome.runtime.getURL(`assets/characters/${MOOD_IMAGES[mood]}`);
}
