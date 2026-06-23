// Profile-summary derivation — turns the raw achievement storage (+ tier system)
// into the shape the shareable "Toki Passport" card renders. Pure & framework-free
// so the in-app card and a future server OG image can share one source of truth.
import {
  ACHIEVEMENTS,
  CARD_TIERS,
  calculateLevel,
  getCardTier,
  getNextLevelProgress,
  type AchievementCategory,
  type AchievementStorage,
} from "./achievements";

// ─── Tier skins ───────────────────────────────────────────────────────────────
// Each tier reskins the card: accent, highlight, glow, sheen. Keyed by tier label.
export interface TierSkin {
  accent: string;
  accent2: string;
  glow: string;
  ring: string;
}

export const TIER_SKIN: Record<string, TierSkin> = {
  BRONZE: { accent: "#d08440", accent2: "#f0b277", glow: "rgba(208,132,64,.5)", ring: "rgba(208,132,64,.5)" },
  SILVER: { accent: "#aab4c4", accent2: "#e8edf5", glow: "rgba(200,210,225,.5)", ring: "rgba(200,210,225,.55)" },
  GOLD: { accent: "#f5b301", accent2: "#ffd778", glow: "rgba(245,179,1,.5)", ring: "rgba(245,179,1,.55)" },
  PLATINUM: { accent: "#7fd2ff", accent2: "#cdecff", glow: "rgba(127,210,255,.5)", ring: "rgba(127,210,255,.55)" },
  "TOKI BLACK": { accent: "#b388ff", accent2: "#7ff0ff", glow: "rgba(179,136,255,.55)", ring: "rgba(179,136,255,.6)" },
};

export function tierSkin(tier: string): TierSkin {
  return TIER_SKIN[tier] ?? TIER_SKIN.GOLD;
}

// ─── Achievement heatmap palette ────────────────────────────────────────────────
export const CATEGORY_COLOR: Record<AchievementCategory, string> = {
  onboarding: "#22d3ee",
  staking: "#f5b301",
  explore: "#a78bfa",
  social: "#f472b6",
  special: "#ffffff",
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  "onboarding",
  "staking",
  "explore",
  "social",
  "special",
];

export interface HeatCell {
  id: string;
  category: AchievementCategory;
  color: string;
  points: number;
  unlocked: boolean;
  icon: string;
  titleKo: string;
  titleEn: string;
}

export interface ProfileSummary {
  score: number;
  level: number;
  tier: { tier: string; name: string; stars: number; charImage: string };
  skin: TierSkin;
  progress: { percent: number; next: number; remaining: number; isMax: boolean };
  achievements: { total: number; unlocked: number };
  /** 19 achievement cells, category-sorted, for the heatmap mosaic. */
  cells: HeatCell[];
  byCategory: { category: AchievementCategory; color: string; unlocked: number; total: number }[];
}

/** Build the renderable summary from raw achievement storage. */
export function buildProfileSummary(storage: AchievementStorage): ProfileSummary {
  const score = storage.score ?? 0;
  const level = storage.level || calculateLevel(score);
  const t = getCardTier(level);
  const skin = tierSkin(t.tier);
  const p = getNextLevelProgress(score);
  const isMax = level >= CARD_TIERS.length;

  const unlockedSet = new Set(storage.unlocked ?? []);
  const ordered = [...ACHIEVEMENTS].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      b.points - a.points,
  );
  const cells: HeatCell[] = ordered.map((a) => ({
    id: a.id,
    category: a.category,
    color: CATEGORY_COLOR[a.category],
    points: a.points,
    unlocked: unlockedSet.has(a.id),
    icon: a.icon,
    titleKo: a.titleKo,
    titleEn: a.titleEn,
  }));

  const byCategory = CATEGORY_ORDER.map((category) => {
    const inCat = ACHIEVEMENTS.filter((a) => a.category === category);
    return {
      category,
      color: CATEGORY_COLOR[category],
      total: inCat.length,
      unlocked: inCat.filter((a) => unlockedSet.has(a.id)).length,
    };
  });

  return {
    score,
    level,
    tier: { tier: t.tier, name: t.name, stars: t.stars, charImage: t.charImage },
    skin,
    progress: { percent: p.percent, next: p.next, remaining: Math.max(0, p.next - score), isMax },
    achievements: {
      total: ACHIEVEMENTS.length,
      unlocked: cells.filter((c) => c.unlocked).length,
    },
    cells,
    byCategory,
  };
}

/** Short 0x… display address. */
export function shortenAddress(addr?: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
