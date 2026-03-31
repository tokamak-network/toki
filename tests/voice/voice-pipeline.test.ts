/**
 * Voice Pipeline Unit Test
 *
 * Tests the full voice pipeline WITHOUT a browser:
 *   transcript text → parseIntent → executeAction → response validation
 *
 * This simulates what happens after SpeechRecognition delivers a final transcript.
 * No dev server or browser needed.
 *
 * Usage: npx tsx tests/voice/voice-pipeline.test.ts
 */

import { parseIntent } from "../../src/lib/toki-intent-parser";
import {
  executeAction,
  type ActionContext,
  type ActionResult,
} from "../../src/lib/toki-actions";

// ─── Mock action context (not logged in) ─────────────────────────────

const GUEST_CTX: ActionContext = {
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  navigateTo: () => {},
  locale: "ko",
};

const LOGGED_IN_CTX: ActionContext = {
  login: () => {},
  logout: () => {},
  isAuthenticated: true,
  navigateTo: () => {},
  locale: "ko",
  userAddress: "0x1234567890abcdef1234567890abcdef12345678",
  tonBalance: "1500.75",
};

// ─── Test cases: simulated voice transcripts ─────────────────────────

interface VoicePipelineTest {
  name: string;
  /** What the STT engine would return */
  transcript: string;
  context: ActionContext;
  expected: {
    intentCategory: string;
    intentAction: string;
    /** Substring that should appear in the Korean response */
    responseContains?: string;
    /** Mood of Toki's response */
    mood?: string;
    /** Should have action buttons? */
    hasActions?: boolean;
    /** Should navigate somewhere? */
    navigatesTo?: string;
  };
}

const PIPELINE_TESTS: VoicePipelineTest[] = [
  // ── Guest voice commands
  {
    name: "Guest: '로그인' → login prompt with action button",
    transcript: "로그인",
    context: GUEST_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "login",
      responseContains: "지갑",
      mood: "excited",
      hasActions: true,
    },
  },
  {
    name: "Guest: '잔액' → needs login",
    transcript: "잔액",
    context: GUEST_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "balance",
      responseContains: "로그인",
      hasActions: true,
    },
  },
  {
    name: "Guest: '스테이킹 시작' → needs login",
    transcript: "스테이킹 시작",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "start",
      responseContains: "로그인",
      hasActions: true,
    },
  },
  {
    name: "Guest: '로그아웃' → not logged in message",
    transcript: "로그아웃",
    context: GUEST_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "logout",
      responseContains: "로그인하지",
      mood: "confused",
    },
  },

  // ── Logged-in voice commands
  {
    name: "LoggedIn: '로그인' → already logged in",
    transcript: "로그인",
    context: LOGGED_IN_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "login",
      responseContains: "이미",
      mood: "wink",
      navigatesTo: "/dashboard",
    },
  },
  {
    name: "LoggedIn: '잔액' → shows balance with action buttons",
    transcript: "잔액",
    context: LOGGED_IN_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "balance",
      responseContains: "1,500.75",
      mood: "pointing",
      hasActions: true,
    },
  },
  {
    name: "LoggedIn: '내 주소' → shows address with copy button",
    transcript: "내 주소",
    context: LOGGED_IN_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "showAddress",
      responseContains: "0x123456",
      mood: "pointing",
      hasActions: true,
    },
  },
  {
    name: "LoggedIn: '로그아웃' → confirm logout with buttons",
    transcript: "로그아웃",
    context: LOGGED_IN_CTX,
    expected: {
      intentCategory: "wallet",
      intentAction: "logout",
      responseContains: "정말",
      mood: "worried",
      hasActions: true,
    },
  },
  {
    name: "LoggedIn: '스테이킹 시작' → start staking with action",
    transcript: "스테이킹 시작",
    context: LOGGED_IN_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "start",
      responseContains: "오퍼레이터",
      mood: "excited",
      hasActions: true,
    },
  },

  // ── Amount parsing (speech often has variations)
  {
    name: "Voice: '100톤 스테이킹' → amount 100",
    transcript: "100톤 스테이킹",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "setAmount",
      responseContains: "100",
      mood: "excited",
      navigatesTo: "/staking?amount=100",
    },
  },
  {
    name: "Voice: 'stake 50.5 TON' → amount 50.5",
    transcript: "stake 50.5 TON",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "setAmount",
      responseContains: "50.5",
    },
  },

  // ── Navigation
  {
    name: "Voice: '대시보드' → navigate dashboard",
    transcript: "대시보드",
    context: GUEST_CTX,
    expected: {
      intentCategory: "navigation",
      intentAction: "dashboard",
      navigatesTo: "/dashboard",
    },
  },
  {
    name: "Voice: '컬렉션' → navigate collection",
    transcript: "컬렉션",
    context: GUEST_CTX,
    expected: {
      intentCategory: "navigation",
      intentAction: "collection",
      navigatesTo: "/collection",
    },
  },

  // ── Toki Pick
  {
    name: "Voice: '토키 추천해줘' → toki pick",
    transcript: "토키 추천해줘",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "tokiPick",
      responseContains: "골라",
      mood: "cheer",
      navigatesTo: "/staking?tokiPick=true",
    },
  },

  // ── Info
  {
    name: "Voice: '토키가 뭐야?' → about toki",
    transcript: "토키가 뭐야?",
    context: GUEST_CTX,
    expected: {
      intentCategory: "info",
      intentAction: "whatIsToki",
      responseContains: "토키",
      mood: "welcome",
    },
  },
  {
    name: "Voice: '도와줘' → help menu",
    transcript: "도와줘",
    context: GUEST_CTX,
    expected: {
      intentCategory: "info",
      intentAction: "help",
      responseContains: "할 수 있어",
      mood: "cheer",
    },
  },

  // ── STT variations (common misrecognitions)
  {
    name: "STT variation: 'stake all' → stakeMax",
    transcript: "stake all",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "stakeMax",
      mood: "excited",
    },
  },
  {
    name: "STT variation: '올인' → stakeMax",
    transcript: "올인",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "stakeMax",
    },
  },
  {
    name: "STT variation: 'check rewards' → checkRewards",
    transcript: "check rewards",
    context: GUEST_CTX,
    expected: {
      intentCategory: "staking",
      intentAction: "checkRewards",
      navigatesTo: "/dashboard",
    },
  },
];

// ─── Runner ──────────────────────────────────────────────────────────

function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Voice Pipeline Integration Test");
  console.log("  (transcript → intent → action → response)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let pass = 0;
  let fail = 0;

  for (const tc of PIPELINE_TESTS) {
    const errors: string[] = [];

    // Step 1: Parse intent
    const intent = parseIntent(tc.transcript);
    if (!intent) {
      console.log(`✗ FAIL  ${tc.name}`);
      console.log(`        No intent matched for "${tc.transcript}"\n`);
      fail++;
      continue;
    }

    if (intent.category !== tc.expected.intentCategory) {
      errors.push(`category: ${intent.category} ≠ ${tc.expected.intentCategory}`);
    }
    if (intent.action !== tc.expected.intentAction) {
      errors.push(`action: ${intent.action} ≠ ${tc.expected.intentAction}`);
    }

    // Step 2: Execute action
    const result: ActionResult = executeAction(intent, tc.context);
    const responseText = tc.context.locale === "ko" ? result.textKo : result.textEn;

    if (tc.expected.responseContains && !responseText.includes(tc.expected.responseContains)) {
      errors.push(`response missing "${tc.expected.responseContains}" in "${responseText}"`);
    }
    if (tc.expected.mood && result.mood !== tc.expected.mood) {
      errors.push(`mood: ${result.mood} ≠ ${tc.expected.mood}`);
    }
    if (tc.expected.hasActions && (!result.actions || result.actions.length === 0)) {
      errors.push(`expected action buttons but got none`);
    }
    if (tc.expected.navigatesTo && result.navigateAfter !== tc.expected.navigatesTo) {
      errors.push(`navigate: ${result.navigateAfter} ≠ ${tc.expected.navigatesTo}`);
    }

    if (errors.length === 0) {
      console.log(`✓ PASS  ${tc.name}`);
      console.log(`        "${tc.transcript}" → ${intent.category}.${intent.action} → mood:${result.mood}`);
      if (result.actions?.length) {
        console.log(`        Actions: [${result.actions.map(a => a.id).join(", ")}]`);
      }
      if (result.navigateAfter) {
        console.log(`        Navigate: ${result.navigateAfter}`);
      }
      console.log();
      pass++;
    } else {
      console.log(`✗ FAIL  ${tc.name}`);
      errors.forEach((e) => console.log(`        ${e}`));
      console.log();
      fail++;
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Results: ${pass} passed, ${fail} failed`);
  console.log(`  Total: ${PIPELINE_TESTS.length} tests`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return fail;
}

const failCount = run();
process.exit(failCount > 0 ? 1 : 0);
