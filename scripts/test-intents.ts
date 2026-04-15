#!/usr/bin/env tsx
// ─── Toki Intent Parser Test Suite ──────────────────────────────────
//
// Tests ALL intent patterns with bilingual inputs (Korean + English)
// Usage: npx tsx scripts/test-intents.ts

import { parseIntent } from '../src/lib/toki-intent-parser';
import type { ParsedIntent } from '../src/lib/toki-intents';

// ─── Test Case Definition ───────────────────────────────────────────

interface TestCase {
  description: string;
  input: string;
  expected: {
    category: string;
    action: string;
    params?: Record<string, string>;
  } | null;
}

const TEST_CASES: TestCase[] = [
  // ─── Wallet: logout ───────────────────────────────────────────────
  {
    description: "wallet.logout (KO: 로그아웃)",
    input: "로그아웃",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "wallet.logout (KO: 연결 해제)",
    input: "연결 해제",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "wallet.logout (KO: 지갑 연결 해제)",
    input: "지갑 연결 해제",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "wallet.logout (EN: logout)",
    input: "logout",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "wallet.logout (EN: sign out)",
    input: "sign out",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "wallet.logout (EN: disconnect wallet)",
    input: "disconnect wallet",
    expected: { category: "wallet", action: "logout" },
  },

  // ─── Wallet: login ────────────────────────────────────────────────
  {
    description: "wallet.login (KO: 지갑 만들기)",
    input: "지갑 만들기",
    expected: { category: "wallet", action: "login" },
  },
  {
    description: "wallet.login (KO: 로그인)",
    input: "로그인",
    expected: { category: "wallet", action: "login" },
  },
  {
    description: "wallet.login (KO: 회원가입)",
    input: "회원가입",
    expected: { category: "wallet", action: "login" },
  },
  {
    description: "wallet.login (EN: create wallet)",
    input: "create wallet",
    expected: { category: "wallet", action: "login" },
  },
  {
    description: "wallet.login (EN: sign up)",
    input: "sign up",
    expected: { category: "wallet", action: "login" },
  },
  {
    description: "wallet.login (EN: login)",
    input: "login",
    expected: { category: "wallet", action: "login" },
  },

  // ─── Wallet: exportKey ────────────────────────────────────────────
  {
    description: "wallet.exportKey (KO: 비밀키 내보내기)",
    input: "비밀키 내보내기",
    expected: { category: "wallet", action: "exportKey" },
  },
  {
    description: "wallet.exportKey (KO: 비밀키 보여줘)",
    input: "비밀키 보여줘",
    expected: { category: "wallet", action: "exportKey" },
  },
  {
    description: "wallet.exportKey (EN: private key)",
    input: "private key",
    expected: { category: "wallet", action: "exportKey" },
  },
  {
    description: "wallet.exportKey (EN: export key)",
    input: "export key",
    expected: { category: "wallet", action: "exportKey" },
  },

  // ─── Wallet: showAddress ──────────────────────────────────────────
  {
    description: "wallet.showAddress (KO: 내 주소)",
    input: "내 주소",
    expected: { category: "wallet", action: "showAddress" },
  },
  {
    description: "wallet.showAddress (KO: 지갑 주소 알려줘)",
    input: "지갑 주소 알려줘",
    expected: { category: "wallet", action: "showAddress" },
  },
  {
    description: "wallet.showAddress (KO: 주소 복사)",
    input: "주소 복사",
    expected: { category: "wallet", action: "showAddress" },
  },
  {
    description: "wallet.showAddress (EN: my address)",
    input: "my address",
    expected: { category: "wallet", action: "showAddress" },
  },
  {
    description: "wallet.showAddress (EN: wallet address)",
    input: "wallet address",
    expected: { category: "wallet", action: "showAddress" },
  },
  {
    description: "wallet.showAddress (EN: show address)",
    input: "show address",
    expected: { category: "wallet", action: "showAddress" },
  },

  // ─── Wallet: balance ──────────────────────────────────────────────
  {
    description: "wallet.balance (KO: 잔액)",
    input: "잔액",
    expected: { category: "wallet", action: "balance" },
  },
  {
    description: "wallet.balance (KO: 얼마 있어?)",
    input: "얼마 있어?",
    expected: { category: "wallet", action: "balance" },
  },
  {
    description: "wallet.balance (KO: 내 TON)",
    input: "내 TON",
    expected: { category: "wallet", action: "balance" },
  },
  {
    description: "wallet.balance (EN: balance)",
    input: "balance",
    expected: { category: "wallet", action: "balance" },
  },
  {
    description: "wallet.balance (EN: check balance)",
    input: "check balance",
    expected: { category: "wallet", action: "balance" },
  },
  {
    description: "wallet.balance (EN: how much do i have)",
    input: "how much do i have",
    expected: { category: "wallet", action: "balance" },
  },

  // ─── Staking: setAmount ───────────────────────────────────────────
  {
    description: "staking.setAmount (KO: 100톤 스테이킹)",
    input: "100톤 스테이킹",
    expected: { category: "staking", action: "setAmount", params: { amount: "100" } },
  },
  {
    description: "staking.setAmount (KO: 스테이킹 50.5톤)",
    input: "스테이킹 50.5톤",
    expected: { category: "staking", action: "setAmount", params: { amount: "50.5" } },
  },
  {
    description: "staking.setAmount (EN: stake 200 TON)",
    input: "stake 200 TON",
    expected: { category: "staking", action: "setAmount", params: { amount: "200" } },
  },
  {
    description: "staking.setAmount (EN: 75.25 TON stake)",
    input: "75.25 TON stake",
    expected: { category: "staking", action: "setAmount", params: { amount: "75.25" } },
  },

  // ─── Staking: tokiPick ────────────────────────────────────────────
  {
    description: "staking.tokiPick (KO: 토키 픽)",
    input: "토키 픽",
    expected: { category: "staking", action: "tokiPick" },
  },
  {
    description: "staking.tokiPick (KO: 토키 추천해줘)",
    input: "토키 추천해줘",
    expected: { category: "staking", action: "tokiPick" },
  },
  {
    description: "staking.tokiPick (KO: 골라줘)",
    input: "골라줘",
    expected: { category: "staking", action: "tokiPick" },
  },
  {
    description: "staking.tokiPick (EN: toki pick)",
    input: "toki pick",
    expected: { category: "staking", action: "tokiPick" },
  },
  {
    description: "staking.tokiPick (EN: recommend)",
    input: "recommend",
    expected: { category: "staking", action: "tokiPick" },
  },
  {
    description: "staking.tokiPick (EN: pick for me)",
    input: "pick for me",
    expected: { category: "staking", action: "tokiPick" },
  },

  // ─── Staking: stakeMax ────────────────────────────────────────────
  {
    description: "staking.stakeMax (KO: 전부 스테이킹)",
    input: "전부 스테이킹",
    expected: { category: "staking", action: "stakeMax" },
  },
  {
    description: "staking.stakeMax (KO: 올인)",
    input: "올인",
    expected: { category: "staking", action: "stakeMax" },
  },
  {
    description: "staking.stakeMax (KO: 맥스)",
    input: "맥스",
    expected: { category: "staking", action: "stakeMax" },
  },
  {
    description: "staking.stakeMax (EN: stake all)",
    input: "stake all",
    expected: { category: "staking", action: "stakeMax" },
  },
  {
    description: "staking.stakeMax (EN: max stake)",
    input: "max stake",
    expected: { category: "staking", action: "stakeMax" },
  },
  {
    description: "staking.stakeMax (EN: all in)",
    input: "all in",
    expected: { category: "staking", action: "stakeMax" },
  },

  // ─── Staking: start ───────────────────────────────────────────────
  {
    description: "staking.start (KO: 스테이킹 시작)",
    input: "스테이킹 시작",
    expected: { category: "staking", action: "start" },
  },
  {
    description: "staking.start (KO: 스테이킹 해줘)",
    input: "스테이킹 해줘",
    expected: { category: "staking", action: "start" },
  },
  {
    description: "staking.start (KO: 바로 스테이킹)",
    input: "바로 스테이킹",
    expected: { category: "staking", action: "start" },
  },
  {
    description: "staking.start (EN: start staking)",
    input: "start staking",
    expected: { category: "staking", action: "start" },
  },
  {
    description: "staking.start (EN: want to stake)",
    input: "want to stake",
    expected: { category: "staking", action: "start" },
  },
  {
    description: "staking.start (EN: stake now)",
    input: "stake now",
    expected: { category: "staking", action: "start" },
  },

  // ─── Staking: unstake ─────────────────────────────────────────────
  {
    description: "staking.unstake (KO: 언스테이킹)",
    input: "언스테이킹",
    expected: { category: "staking", action: "unstake" },
  },
  {
    description: "staking.unstake (KO: 스테이킹 해제)",
    input: "스테이킹 해제",
    expected: { category: "staking", action: "unstake" },
  },
  {
    description: "staking.unstake (KO: 출금)",
    input: "출금",
    expected: { category: "staking", action: "unstake" },
  },
  {
    description: "staking.unstake (EN: unstake)",
    input: "unstake",
    expected: { category: "staking", action: "unstake" },
  },
  {
    description: "staking.unstake (EN: withdraw)",
    input: "withdraw",
    expected: { category: "staking", action: "unstake" },
  },
  {
    description: "staking.unstake (EN: claim)",
    input: "claim",
    expected: { category: "staking", action: "unstake" },
  },

  // ─── Staking: checkRewards ────────────────────────────────────────
  {
    description: "staking.checkRewards (KO: 보상 확인)",
    input: "보상 확인",
    expected: { category: "staking", action: "checkRewards" },
  },
  {
    description: "staking.checkRewards (KO: 수익 확인)",
    input: "수익 확인",
    expected: { category: "staking", action: "checkRewards" },
  },
  {
    description: "staking.checkRewards (KO: 얼마 벌었어?)",
    input: "얼마 벌었어?",
    expected: { category: "staking", action: "checkRewards" },
  },
  {
    description: "staking.checkRewards (EN: check rewards)",
    input: "check rewards",
    expected: { category: "staking", action: "checkRewards" },
  },
  {
    description: "staking.checkRewards (EN: my rewards)",
    input: "my rewards",
    expected: { category: "staking", action: "checkRewards" },
  },
  {
    description: "staking.checkRewards (EN: how much did i earn)",
    input: "how much did i earn",
    expected: { category: "staking", action: "checkRewards" },
  },

  // ─── Navigation: dashboard ────────────────────────────────────────
  {
    description: "navigation.dashboard (KO: 대시보드)",
    input: "대시보드",
    expected: { category: "navigation", action: "dashboard" },
  },
  {
    description: "navigation.dashboard (KO: 홈)",
    input: "홈",
    expected: { category: "navigation", action: "dashboard" },
  },
  {
    description: "navigation.dashboard (EN: dashboard)",
    input: "dashboard",
    expected: { category: "navigation", action: "dashboard" },
  },
  {
    description: "navigation.dashboard (EN: home)",
    input: "home",
    expected: { category: "navigation", action: "dashboard" },
  },
  {
    description: "navigation.dashboard (EN: go home)",
    input: "go home",
    expected: { category: "navigation", action: "dashboard" },
  },

  // ─── Navigation: onboarding ───────────────────────────────────────
  {
    description: "navigation.onboarding (KO: 온보딩)",
    input: "온보딩",
    expected: { category: "navigation", action: "onboarding" },
  },
  {
    description: "navigation.onboarding (KO: 튜토리얼)",
    input: "튜토리얼",
    expected: { category: "navigation", action: "onboarding" },
  },
  {
    description: "navigation.onboarding (KO: 퀘스트)",
    input: "퀘스트",
    expected: { category: "navigation", action: "onboarding" },
  },
  {
    description: "navigation.onboarding (EN: onboarding)",
    input: "onboarding",
    expected: { category: "navigation", action: "onboarding" },
  },
  {
    description: "navigation.onboarding (EN: tutorial)",
    input: "tutorial",
    expected: { category: "navigation", action: "onboarding" },
  },
  {
    description: "navigation.onboarding (EN: quest)",
    input: "quest",
    expected: { category: "navigation", action: "onboarding" },
  },

  // ─── Navigation: explore ──────────────────────────────────────────
  {
    description: "navigation.explore (KO: 생태계)",
    input: "생태계",
    expected: { category: "navigation", action: "explore" },
  },
  {
    description: "navigation.explore (KO: 탐험)",
    input: "탐험",
    expected: { category: "navigation", action: "explore" },
  },
  {
    description: "navigation.explore (KO: 둘러보기)",
    input: "둘러보기",
    expected: { category: "navigation", action: "explore" },
  },
  {
    description: "navigation.explore (EN: explore)",
    input: "explore",
    expected: { category: "navigation", action: "explore" },
  },
  {
    description: "navigation.explore (EN: ecosystem)",
    input: "ecosystem",
    expected: { category: "navigation", action: "explore" },
  },

  // ─── Navigation: collection ───────────────────────────────────────
  {
    description: "navigation.collection (KO: 컬렉션)",
    input: "컬렉션",
    expected: { category: "navigation", action: "collection" },
  },
  {
    description: "navigation.collection (KO: 카드 보여줘)",
    input: "카드 보여줘",
    expected: { category: "navigation", action: "collection" },
  },
  {
    description: "navigation.collection (KO: 업적)",
    input: "업적",
    expected: { category: "navigation", action: "collection" },
  },
  {
    description: "navigation.collection (EN: collection)",
    input: "collection",
    expected: { category: "navigation", action: "collection" },
  },
  {
    description: "navigation.collection (EN: my cards)",
    input: "my cards",
    expected: { category: "navigation", action: "collection" },
  },
  {
    description: "navigation.collection (EN: achievements)",
    input: "achievements",
    expected: { category: "navigation", action: "collection" },
  },

  // ─── Navigation: staking ──────────────────────────────────────────
  {
    description: "navigation.staking (KO: 스테이킹 페이지)",
    input: "스테이킹 페이지",
    expected: { category: "navigation", action: "staking" },
  },
  {
    description: "navigation.staking (KO: 스테이킹 화면)",
    input: "스테이킹 화면",
    expected: { category: "navigation", action: "staking" },
  },
  {
    description: "navigation.staking (EN: staking page)",
    input: "staking page",
    expected: { category: "navigation", action: "staking" },
  },
  {
    description: "navigation.staking (EN: go to staking)",
    input: "go to staking",
    expected: { category: "navigation", action: "staking" },
  },

  // ─── Event: participate ───────────────────────────────────────────
  {
    description: "event.participate (KO: 이벤트)",
    input: "이벤트",
    expected: { category: "event", action: "participate" },
  },
  {
    description: "event.participate (KO: 참여)",
    input: "참여",
    expected: { category: "event", action: "participate" },
  },
  {
    description: "event.participate (KO: 이벤트 참여)",
    input: "이벤트 참여",
    expected: { category: "event", action: "participate" },
  },
  {
    description: "event.participate (EN: event)",
    input: "event",
    expected: { category: "event", action: "participate" },
  },
  {
    description: "event.participate (EN: participate)",
    input: "participate",
    expected: { category: "event", action: "participate" },
  },
  {
    description: "event.participate (EN: join event)",
    input: "join event",
    expected: { category: "event", action: "participate" },
  },

  // ─── Info: whatIsToki ─────────────────────────────────────────────
  {
    description: "info.whatIsToki (KO: 토키가 뭐야?)",
    input: "토키가 뭐야?",
    expected: { category: "info", action: "whatIsToki" },
  },
  {
    description: "info.whatIsToki (KO: 토키 소개)",
    input: "토키 소개",
    expected: { category: "info", action: "whatIsToki" },
  },
  {
    description: "info.whatIsToki (EN: what is toki)",
    input: "what is toki",
    expected: { category: "info", action: "whatIsToki" },
  },
  {
    description: "info.whatIsToki (EN: who is toki)",
    input: "who is toki",
    expected: { category: "info", action: "whatIsToki" },
  },
  {
    description: "info.whatIsToki (EN: about toki)",
    input: "about toki",
    expected: { category: "info", action: "whatIsToki" },
  },

  // ─── Info: help ───────────────────────────────────────────────────
  {
    description: "info.help (KO: 도와줘)",
    input: "도와줘",
    expected: { category: "info", action: "help" },
  },
  {
    description: "info.help (KO: 뭐 할 수 있어?)",
    input: "뭐 할 수 있어?",
    expected: { category: "info", action: "help" },
  },
  {
    description: "info.help (KO: 기능)",
    input: "기능",
    expected: { category: "info", action: "help" },
  },
  {
    description: "info.help (EN: help)",
    input: "help",
    expected: { category: "info", action: "help" },
  },
  {
    description: "info.help (EN: what can you do)",
    input: "what can you do",
    expected: { category: "info", action: "help" },
  },
  {
    description: "info.help (EN: commands)",
    input: "commands",
    expected: { category: "info", action: "help" },
  },

  // ─── Negative tests (should NOT match specific patterns) ──────────
  {
    description: "NEGATIVE: '로그아웃해줘' should match logout NOT login",
    input: "로그아웃해줘",
    expected: { category: "wallet", action: "logout" },
  },
  {
    description: "NEGATIVE: '지갑' alone should NOT match any specific intent",
    input: "지갑",
    expected: null,
  },
  {
    description: "NEGATIVE: random text should return null",
    input: "random unrelated text",
    expected: null,
  },
  {
    description: "NEGATIVE: empty string should return null",
    input: "",
    expected: null,
  },
  {
    description: "NEGATIVE: whitespace only should return null",
    input: "   ",
    expected: null,
  },
];

// ─── Test Runner ────────────────────────────────────────────────────

function formatResult(result: ParsedIntent | null, expected: TestCase['expected']): string {
  if (!expected && !result) return "✓ PASS (correctly returned null)";
  if (!expected && result) return "✗ FAIL (expected null, got intent)";
  if (expected && !result) return "✗ FAIL (expected intent, got null)";
  if (!expected || !result) return "✗ FAIL (unexpected null)";

  const categoryMatch = result.category === expected.category;
  const actionMatch = result.action === expected.action;

  let paramsMatch = true;
  if (expected.params) {
    paramsMatch = Object.entries(expected.params).every(
      ([key, value]) => result.params[key] === value
    );
  }

  if (categoryMatch && actionMatch && paramsMatch) {
    return "✓ PASS";
  }

  const errors: string[] = [];
  if (!categoryMatch) errors.push(`category: ${result.category} ≠ ${expected.category}`);
  if (!actionMatch) errors.push(`action: ${result.action} ≠ ${expected.action}`);
  if (!paramsMatch) {
    errors.push(`params: ${JSON.stringify(result.params)} ≠ ${JSON.stringify(expected.params)}`);
  }

  return `✗ FAIL (${errors.join(", ")})`;
}

function runTests(): number {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Toki Intent Parser Test Suite");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let passCount = 0;
  let failCount = 0;

  for (const testCase of TEST_CASES) {
    const result = parseIntent(testCase.input);
    const status = formatResult(result, testCase.expected);
    const passed = status.startsWith("✓");

    if (passed) {
      passCount++;
    } else {
      failCount++;
    }

    console.log(`${status}`);
    console.log(`  ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    if (result) {
      console.log(`  Result: ${result.category}.${result.action}${Object.keys(result.params).length > 0 ? ` (${JSON.stringify(result.params)})` : ""}`);
    } else {
      console.log(`  Result: null`);
    }
    console.log();
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Results: ${passCount} passed, ${failCount} failed`);
  console.log(`  Total: ${TEST_CASES.length} tests`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return failCount;
}

// ─── Entry Point ────────────────────────────────────────────────────

const failCount = runTests();
process.exit(failCount > 0 ? 1 : 0);
