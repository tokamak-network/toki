// ─── Event Mode Configuration ────────────────────────────────────────

export const EVENT_CONFIG = {
  /** Enable/disable event mode globally */
  enabled: true,
  /** Auto-reset to idle after completion (seconds) */
  autoResetTimer: 30,
  /** Community links shown after TON drop */
  communityLinks: {
    discord: "https://discord.gg/tokamaknetwork",
    telegram: "https://t.me/tokamak_network",
  },
  /** QR code API (no deps needed) */
  qrApiUrl: "https://api.qrserver.com/v1/create-qr-code",
  /** QR code size */
  qrSize: 200,
} as const;

export type EventState =
  | "idle"
  | "listening"
  | "processing"
  | "wallet_create"
  | "ton_drop"
  | "community_signup"
  | "complete";
