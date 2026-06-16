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
  | "fade"; //  default fallback

export const TRANSITIONS: Record<TransKey, { inMs: number; outMs: number }> = {
  launch: { inMs: 300, outMs: 440 },
  zoom: { inMs: 280, outMs: 380 },
  iris: { inMs: 420, outMs: 500 },
  flip: { inMs: 300, outMs: 420 },
  glitch: { inMs: 300, outMs: 380 },
  spread: { inMs: 340, outMs: 440 },
  map: { inMs: 360, outMs: 420 },
  fade: { inMs: 200, outMs: 240 },
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
