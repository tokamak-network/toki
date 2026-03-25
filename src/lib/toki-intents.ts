// ─── Toki Intent Definitions + Bilingual Regex Patterns ──────────────

export type IntentCategory = "wallet" | "staking" | "navigation" | "event" | "info";

export interface IntentPattern {
  category: IntentCategory;
  action: string;
  patterns: RegExp[];
  /** Extract named params (e.g. amount) from matched input */
  extractParams?: (input: string) => Record<string, string>;
}

export interface ParsedIntent {
  category: IntentCategory;
  action: string;
  params: Record<string, string>;
  /** Original matched text */
  raw: string;
}

// ─── Amount extraction helper ────────────────────────────────────────

const AMOUNT_REGEX = /(\d+(?:\.\d+)?)\s*(?:톤|TON|ton)/i;
const AMOUNT_ONLY_REGEX = /(\d+(?:\.\d+)?)/;

function extractAmount(input: string): Record<string, string> {
  const match = input.match(AMOUNT_REGEX) || input.match(AMOUNT_ONLY_REGEX);
  return match ? { amount: match[1] } : {};
}

// ─── Intent Patterns (order matters: more specific first) ────────────

export const INTENT_PATTERNS: IntentPattern[] = [
  // ─── Wallet intents ───
  {
    category: "wallet",
    action: "login",
    patterns: [
      /지갑\s*만들/i, /지갑\s*생성/i, /계정\s*만들/i, /계정\s*생성/i,
      /로그인/i, /회원가입/i, /가입/i,
      /create\s*wallet/i, /make\s*wallet/i, /create\s*account/i,
      /sign\s*up/i, /log\s*in/i, /login/i,
    ],
  },
  {
    category: "wallet",
    action: "exportKey",
    patterns: [
      /비밀키\s*내보내/i, /비밀키\s*보여/i, /비밀키\s*복사/i,
      /private\s*key/i, /export\s*key/i,
    ],
  },
  {
    category: "wallet",
    action: "showAddress",
    patterns: [
      /내\s*주소/i, /지갑\s*주소/i, /주소\s*알려/i, /주소\s*보여/i,
      /my\s*address/i, /wallet\s*address/i, /show\s*address/i,
    ],
  },

  // ─── Staking intents (specific first) ───
  {
    category: "staking",
    action: "setAmount",
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:톤|TON|ton)\s*스테이킹/i,
      /스테이킹\s*(\d+(?:\.\d+)?)\s*(?:톤|TON|ton)/i,
      /stake\s*(\d+(?:\.\d+)?)\s*(?:TON|ton)/i,
      /(\d+(?:\.\d+)?)\s*(?:TON|ton)\s*stake/i,
    ],
    extractParams: extractAmount,
  },
  {
    category: "staking",
    action: "tokiPick",
    patterns: [
      /토키\s*픽/i, /토키\s*추천/i, /토키\s*골라/i, /토키가\s*골라/i,
      /추천\s*해/i, /골라\s*줘/i,
      /toki\s*pick/i, /recommend/i, /pick\s*for\s*me/i, /choose\s*for\s*me/i,
    ],
  },
  {
    category: "staking",
    action: "stakeMax",
    patterns: [
      /전부\s*스테이킹/i, /전액\s*스테이킹/i, /올인/i, /다\s*스테이킹/i, /맥스/i, /최대/i,
      /stake\s*all/i, /stake\s*max/i, /max\s*stake/i, /all\s*in/i,
    ],
  },
  {
    category: "staking",
    action: "start",
    patterns: [
      /스테이킹\s*시작/i, /스테이킹\s*하고/i, /스테이킹\s*해/i, /스테이킹\s*할래/i,
      /스테이킹해/i, /스테이킹하러/i, /바로\s*스테이킹/i,
      /start\s*staking/i, /want\s*to\s*stake/i, /let\s*me\s*stake/i,
      /begin\s*staking/i, /do\s*staking/i, /stake\s*now/i,
    ],
  },
  {
    category: "staking",
    action: "unstake",
    patterns: [
      /언스테이킹/i, /스테이킹\s*해제/i, /출금/i, /인출/i,
      /unstake/i, /withdraw/i, /claim/i,
    ],
  },
  {
    category: "staking",
    action: "checkRewards",
    patterns: [
      /보상\s*확인/i, /수익\s*확인/i, /얼마\s*벌/i, /시뇨리지/i, /수익률/i,
      /check\s*rewards/i, /my\s*rewards/i, /how\s*much.*earn/i, /seigniorage/i, /apr/i,
    ],
  },

  // ─── Navigation intents ───
  {
    category: "navigation",
    action: "dashboard",
    patterns: [
      /대시보드/i, /홈/i,
      /dashboard/i, /home/i, /go\s*home/i,
    ],
  },
  {
    category: "navigation",
    action: "onboarding",
    patterns: [
      /온보딩/i, /튜토리얼/i, /퀘스트/i, /가이드/i,
      /onboarding/i, /tutorial/i, /quest/i, /guide/i,
    ],
  },
  {
    category: "navigation",
    action: "explore",
    patterns: [
      /생태계/i, /탐험/i, /둘러보/i,
      /explore/i, /ecosystem/i,
    ],
  },

  // ─── Event intents ───
  {
    category: "event",
    action: "participate",
    patterns: [
      /이벤트/i, /참여/i, /이벤트\s*참여/i,
      /event/i, /participate/i, /join\s*event/i,
    ],
  },

  // ─── Info intents ───
  {
    category: "info",
    action: "whatIsToki",
    patterns: [
      /토키가\s*뭐/i, /토키\s*뭐야/i, /토키\s*소개/i,
      /what\s*is\s*toki/i, /who\s*is\s*toki/i, /about\s*toki/i,
    ],
  },
  {
    category: "info",
    action: "help",
    patterns: [
      /도와/i, /도움/i, /뭐\s*할\s*수\s*있/i, /메뉴/i,
      /help/i, /what\s*can\s*you\s*do/i, /menu/i,
    ],
  },
];
