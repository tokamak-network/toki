// ─── Achievement System - Phase 1 (localStorage) ────────────────────────────

export type AchievementCategory = "onboarding" | "staking" | "explore" | "social" | "special";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  icon: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  points: number;
  condition: (storage: AchievementStorage) => boolean;
}

export interface AchievementStorage {
  score: number;
  level: number;
  unlocked: string[];
  metadata: {
    totalStaked: number;
    servicesClicked: string[];
    dialoguesSeen: string[];
    freetextCount: number;
    categoriesViewed: string[];
    questsCompleted: string[];
  };
}

export const EMPTY_STORAGE: AchievementStorage = {
  score: 0,
  level: 1,
  unlocked: [],
  metadata: {
    totalStaked: 0,
    servicesClicked: [],
    dialoguesSeen: [],
    freetextCount: 0,
    categoriesViewed: [],
    questsCompleted: [],
  },
};

// ─── Level System ─────────────────────────────────────────────────────────────

export const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000];

export function calculateLevel(score: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getNextLevelProgress(score: number): {
  current: number;
  next: number;
  percent: number;
} {
  const level = calculateLevel(score);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  if (level >= LEVEL_THRESHOLDS.length) {
    return { current: score, next: nextThreshold, percent: 100 };
  }

  const range = nextThreshold - currentThreshold;
  const progress = score - currentThreshold;
  const percent = range > 0 ? Math.min(100, Math.round((progress / range) * 100)) : 100;

  return { current: score, next: nextThreshold, percent };
}

// ─── 19 Achievement Definitions ───────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── Onboarding (5) ──
  {
    id: "onboarding-wallet",
    category: "onboarding",
    icon: "W",
    titleKo: "지갑 생성",
    titleEn: "Wallet Created",
    descKo: "첫 번째 지갑을 생성했습니다",
    descEn: "Created your first wallet",
    points: 100,
    condition: (s) => s.metadata.questsCompleted.includes("create-wallet"),
  },
  {
    id: "onboarding-bridge",
    category: "onboarding",
    icon: "B",
    titleKo: "브릿지 마스터",
    titleEn: "Bridge Master",
    descKo: "MetaMask 브릿지를 완료했습니다",
    descEn: "Completed the MetaMask bridge",
    points: 200,
    condition: (s) => s.metadata.questsCompleted.includes("bridge-metamask"),
  },
  {
    id: "onboarding-exchange",
    category: "onboarding",
    icon: "E",
    titleKo: "거래소 인증",
    titleEn: "Exchange Verified",
    descKo: "거래소 지갑 인증을 완료했습니다",
    descEn: "Verified your exchange wallet",
    points: 300,
    condition: (s) => s.metadata.questsCompleted.includes("verify-exchange"),
  },
  {
    id: "onboarding-ton",
    category: "onboarding",
    icon: "T",
    titleKo: "첫 TON 받기",
    titleEn: "First TON",
    descKo: "첫 TON을 받았습니다",
    descEn: "Received your first TON",
    points: 250,
    condition: (s) => s.metadata.questsCompleted.includes("receive-ton"),
  },
  {
    id: "onboarding-complete",
    category: "onboarding",
    icon: "S",
    titleKo: "스테이킹 졸업",
    titleEn: "Staking Graduate",
    descKo: "모든 온보딩 퀘스트를 완료했습니다",
    descEn: "Completed all onboarding quests",
    points: 500,
    condition: (s) => s.metadata.questsCompleted.length >= 5,
  },

  // ── Staking (6) ──
  {
    id: "stake-first",
    category: "staking",
    icon: "S",
    titleKo: "첫 스테이킹",
    titleEn: "First Stake",
    descKo: "첫 스테이킹을 완료했습니다",
    descEn: "Completed your first stake",
    points: 200,
    condition: (s) => s.metadata.totalStaked > 0,
  },
  {
    id: "stake-10",
    category: "staking",
    icon: "10",
    titleKo: "10 TON 스테이커",
    titleEn: "10 TON Staker",
    descKo: "누적 10 TON 이상 스테이킹",
    descEn: "Staked 10+ TON total",
    points: 300,
    condition: (s) => s.metadata.totalStaked >= 10,
  },
  {
    id: "stake-100",
    category: "staking",
    icon: "100",
    titleKo: "고래 등장",
    titleEn: "Whale Alert",
    descKo: "누적 100 TON 이상 스테이킹",
    descEn: "Staked 100+ TON total",
    points: 500,
    condition: (s) => s.metadata.totalStaked >= 100,
  },
  {
    id: "stake-gasless",
    category: "staking",
    icon: "G",
    titleKo: "가스리스 달인",
    titleEn: "Gasless Master",
    descKo: "가스리스 스테이킹을 사용했습니다",
    descEn: "Used gasless staking",
    points: 150,
    condition: (s) => s.unlocked.includes("stake-gasless"), // toggled directly on track
  },
  {
    id: "stake-delegation",
    category: "staking",
    icon: "D",
    titleKo: "위임 마스터",
    titleEn: "Delegation Master",
    descKo: "세션 키 위임을 사용했습니다",
    descEn: "Used session key delegation",
    points: 200,
    condition: (s) => s.unlocked.includes("stake-delegation"),
  },
  {
    id: "unstake-first",
    category: "staking",
    icon: "U",
    titleKo: "안전 출금",
    titleEn: "Safe Withdrawal",
    descKo: "첫 언스테이킹을 완료했습니다",
    descEn: "Completed your first unstake",
    points: 100,
    condition: (s) => s.unlocked.includes("unstake-first"),
  },

  // ── Explore (3) ──
  {
    id: "explore-visit",
    category: "explore",
    icon: "X",
    titleKo: "생태계 탐험가",
    titleEn: "Ecosystem Explorer",
    descKo: "생태계 페이지를 방문했습니다",
    descEn: "Visited the ecosystem page",
    points: 50,
    condition: (s) => s.unlocked.includes("explore-visit"),
  },
  {
    id: "explore-click",
    category: "explore",
    icon: "C",
    titleKo: "서비스 호기심",
    titleEn: "Service Curious",
    descKo: "3개 이상의 서비스를 클릭했습니다",
    descEn: "Clicked 3+ different services",
    points: 100,
    condition: (s) => s.metadata.servicesClicked.length >= 3,
  },
  {
    id: "explore-all-categories",
    category: "explore",
    icon: "A",
    titleKo: "카테고리 마스터",
    titleEn: "Category Master",
    descKo: "4개 카테고리를 모두 탐색했습니다",
    descEn: "Explored all 4 categories",
    points: 150,
    condition: (s) => s.metadata.categoriesViewed.length >= 4,
  },

  // ── Social (3) ──
  {
    id: "chat-start",
    category: "social",
    icon: "H",
    titleKo: "대화 시작",
    titleEn: "Chat Started",
    descKo: "토키와 첫 대화를 시작했습니다",
    descEn: "Started your first chat with Toki",
    points: 50,
    condition: (s) => s.unlocked.includes("chat-start"),
  },
  {
    id: "chat-dialogue-10",
    category: "social",
    icon: "F",
    titleKo: "토키의 친구",
    titleEn: "Toki's Friend",
    descKo: "10개 이상의 대화 노드를 방문했습니다",
    descEn: "Visited 10+ dialogue nodes",
    points: 100,
    condition: (s) => s.metadata.dialoguesSeen.length >= 10,
  },
  {
    id: "chat-freetext",
    category: "social",
    icon: "Q",
    titleKo: "질문왕",
    titleEn: "Question King",
    descKo: "자유 입력을 3회 이상 했습니다",
    descEn: "Used free text input 3+ times",
    points: 75,
    condition: (s) => s.metadata.freetextCount >= 3,
  },

  // ── Special (1) ──
  {
    id: "power-user",
    category: "special",
    icon: "P",
    titleKo: "파워 유저",
    titleEn: "Power User",
    descKo: "15개 이상의 업적을 달성했습니다",
    descEn: "Unlocked 15+ achievements",
    points: 1000,
    condition: (s) => s.unlocked.length >= 15,
  },
];

// ─── Card Tiers ──────────────────────────────────────────────────────────────

export interface CardTier {
  level: number;
  tier: string;
  name: string;
  charImage: string;
  bgImage: string;
  stars: number;
  threshold: number;
}

export const CARD_TIERS: CardTier[] = [
  { level: 1, tier: "BRONZE", name: "Beginner", charImage: "/toki-card-bronze.png", bgImage: "/card-bg-bronze.png", stars: 1, threshold: 0 },
  { level: 2, tier: "SILVER", name: "Explorer", charImage: "/toki-card-silver.png", bgImage: "/card-bg-silver.png", stars: 2, threshold: 500 },
  { level: 3, tier: "GOLD", name: "Staker", charImage: "/toki-card-gold-v2.png", bgImage: "/card-bg-gold.png", stars: 3, threshold: 1500 },
  { level: 4, tier: "PLATINUM", name: "Expert", charImage: "/toki-card-platinum.png", bgImage: "/card-bg-platinum.png", stars: 4, threshold: 3000 },
  { level: 5, tier: "TOKI BLACK", name: "Master", charImage: "/toki-card-black.png", bgImage: "/card-bg-black.png", stars: 5, threshold: 5000 },
];

export function getCardTier(level: number): CardTier {
  return CARD_TIERS[Math.min(level, 5) - 1] || CARD_TIERS[0];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function checkCondition(achievement: Achievement, storage: AchievementStorage): boolean {
  if (storage.unlocked.includes(achievement.id)) return false; // already unlocked
  return achievement.condition(storage);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
