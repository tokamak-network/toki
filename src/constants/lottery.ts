// ─── Lottery System Configuration ────────────────────────────────────

export const LOTTERY_CONFIG = {
  /** Card number format: {campaignPrefix}-{6 alphanumeric} */
  cardNumberPattern: /^[A-Z]{2}\d{2}-[A-Z0-9]{6}$/,
  /** Card number input placeholder */
  cardNumberPlaceholder: "TK01-XXXXXX",
  /** Discount QR expiry: end of current day (midnight) */
  discountExpiryHours: 24,
  /** Community links */
  communityLinks: {
    discord: "https://discord.gg/tokamaknetwork",
    telegram: "https://t.me/tokamak_network",
  },
} as const;

/**
 * Event-fixed KRW-per-TON rate. Shown on both the user's prize reveal and
 * the staff redeem page so the bar can apply a consistent discount
 * regardless of live market price.
 */
export const EVENT_KRW_PER_TON = 700;

export const PRIZE_TIERS = {
  bust: { amount: 0, label: "꽝", emoji: "🫥", tokiMood: "worried" },
  basic: { amount: 10, label: "10 TON", emoji: "🍀", tokiMood: "welcome" },
  lucky: { amount: 20, label: "20 TON", emoji: "⭐", tokiMood: "cheer" },
  super: { amount: 50, label: "50 TON", emoji: "✨", tokiMood: "excited" },
  jackpot: { amount: 100, label: "100 TON", emoji: "🏆", tokiMood: "celebrate" },
} as const;

export type PrizeTier = keyof typeof PRIZE_TIERS;

export type CardStatus =
  | "unclaimed"
  | "discount_used"
  | "ton_claimed"
  | "expired";

export type LotteryStep =
  | "loading"
  | "invalid"
  | "prize_reveal"
  | "onboarding_login"
  | "onboarding_slides"
  | "onboarding_wallet"
  | "choice"
  | "discount_qr"
  | "ton_success"
  | "mission";

export interface LotteryCard {
  cardNumber: string;
  campaignId: string;
  prizeAmount: number;
  tier: PrizeTier;
  status: CardStatus;
  isBonus: boolean;
}
