// ─── Screen-transition registry ──────────────────────────────────────────────
// Each hub menu owns a signature full-screen "game" transition. The cover
// overlay (TransitionProvider) plays <key>-in to mask the route swap, then
// <key>-out to reveal the new screen. Timings drive when router.push fires and
// when the reveal starts. Mirrors public/hud-game-transitions.html.

export type TransKey =
  | "launch" // rocket warp (staking)
  | "zoom" //   open-zoom (wallet)
  | "iris" //   stealth iris (private transfer)
  | "flip" //   card flip (lottery)
  | "glitch" // digital dissolve (AI access)
  | "spread" // card shutter (collection)
  | "map" //    map wipe (explore/ecosystem)
  | "curtain" // split doors close→open
  | "diamond" // diamond iris
  | "swipe" //  solid panel push from right
  | "flash" //  light burst
  | "squad" //  5-character wedge assemble (hub entry)
  | "fade"; //  default fallback

export const TRANSITIONS: Record<TransKey, { inMs: number; outMs: number }> = {
  launch: { inMs: 300, outMs: 440 },
  zoom: { inMs: 280, outMs: 380 },
  iris: { inMs: 420, outMs: 500 },
  flip: { inMs: 300, outMs: 420 },
  glitch: { inMs: 300, outMs: 380 },
  spread: { inMs: 340, outMs: 440 },
  map: { inMs: 360, outMs: 420 },
  curtain: { inMs: 360, outMs: 460 },
  diamond: { inMs: 380, outMs: 460 },
  swipe: { inMs: 320, outMs: 400 },
  flash: { inMs: 260, outMs: 340 },
  squad: { inMs: 1160, outMs: 960 }, // half speed (2× duration) for a calmer assemble
  // fade is the landing "시작하기" → /dashboard transition. Run it at HALF speed
  // (2× duration) so the cover lingers long enough to mask the dashboard load —
  // we'd rather the reveal start late than flash a half-loaded screen.
  fade: { inMs: 400, outMs: 480 },
};

// Hub menu key (HubLobby card.key) → transition. Unmapped keys fall back to fade.
export const MENU_TRANS: Record<string, TransKey> = {
  staking: "launch",
  wallet: "zoom",
  private: "iris",
  lottery: "flip",
  ai: "glitch",
  collection: "spread",
  explore: "map",
};

// ─── "시작하기" → /dashboard transition (user-selectable in /transitions) ─────
// The landing CTA has no menu key, so its transition is a standalone choice the
// user picks in the catalog page and we persist here. VideoHero reads it on click.
export const START_TRANS_STORAGE = "toki.startTransition";
export const DEFAULT_START_TRANS: TransKey = "squad";

export function getStartTransition(): TransKey {
  try {
    const v = localStorage.getItem(START_TRANS_STORAGE);
    if (v && v in TRANSITIONS) return v as TransKey;
  } catch {
    // storage unavailable — fall through to default
  }
  return DEFAULT_START_TRANS;
}

export function setStartTransition(k: TransKey): void {
  try {
    localStorage.setItem(START_TRANS_STORAGE, k);
  } catch {
    // non-fatal
  }
}
