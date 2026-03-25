// ─── Execute parsed intents against app context ─────────────────────

import type { Mood } from "./toki-dialogue";
import type { ParsedIntent } from "./toki-intents";

/** Context provided by the chat component */
export interface ActionContext {
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  navigateTo: (path: string) => void;
  locale: string;
  exportWallet?: () => void;
  userAddress?: string;
  tonBalance?: string;
}

export interface ActionResult {
  textKo: string;
  textEn: string;
  mood: Mood;
  /** If set, navigate to this route after displaying the message */
  navigateAfter?: string;
  /** If set, call this function after displaying the message */
  sideEffect?: () => void;
}

/**
 * Execute a parsed intent. Returns an ActionResult with Toki's response
 * text, mood, and optional side effects.
 */
export function executeAction(
  intent: ParsedIntent,
  ctx: ActionContext,
): ActionResult {
  switch (intent.category) {
    case "wallet":
      return handleWallet(intent, ctx);
    case "staking":
      return handleStaking(intent, ctx);
    case "navigation":
      return handleNavigation(intent);
    case "event":
      return handleEvent();
    case "info":
      return handleInfo(intent);
    default:
      return fallbackResult();
  }
}

// ─── Handlers ────────────────────────────────────────────────────────

function handleWallet(intent: ParsedIntent, ctx: ActionContext): ActionResult {
  switch (intent.action) {
    case "login":
      if (ctx.isAuthenticated) {
        return {
          textKo: "이미 로그인 되어 있어! 대시보드에서 확인해볼까?",
          textEn: "You're already logged in! Want to check the dashboard?",
          mood: "wink",
          navigateAfter: "/dashboard",
        };
      }
      return {
        textKo: "좋아! 지금 바로 로그인 창을 열어줄게!",
        textEn: "Let's do it! Opening the login screen for you!",
        mood: "excited",
        sideEffect: () => ctx.login(),
      };

    case "exportKey":
      if (!ctx.isAuthenticated) {
        return {
          textKo: "먼저 로그인이 필요해! 로그인할까?",
          textEn: "You need to log in first! Shall I open login?",
          mood: "confused",
          sideEffect: () => ctx.login(),
        };
      }
      if (ctx.exportWallet) {
        return {
          textKo: "비밀키를 안전하게 내보내줄게! 팝업을 확인해!",
          textEn: "I'll safely export your key! Check the popup!",
          mood: "determined",
          sideEffect: () => ctx.exportWallet?.(),
        };
      }
      return {
        textKo: "대시보드에서 비밀키를 내보낼 수 있어!",
        textEn: "You can export your private key from the dashboard!",
        mood: "pointing",
        navigateAfter: "/dashboard",
      };

    case "showAddress":
      if (!ctx.isAuthenticated) {
        return {
          textKo: "먼저 로그인해서 지갑을 만들어야 해!",
          textEn: "You need to log in first to create a wallet!",
          mood: "explain",
          sideEffect: () => ctx.login(),
        };
      }
      if (ctx.userAddress) {
        return {
          textKo: `네 지갑 주소야: ${ctx.userAddress.slice(0, 8)}...${ctx.userAddress.slice(-6)}. 대시보드에서 복사할 수 있어!`,
          textEn: `Here's your address: ${ctx.userAddress.slice(0, 8)}...${ctx.userAddress.slice(-6)}. You can copy it from the dashboard!`,
          mood: "pointing",
          navigateAfter: "/dashboard",
        };
      }
      return {
        textKo: "대시보드에서 지갑 주소를 확인할 수 있어!",
        textEn: "You can check your wallet address on the dashboard!",
        mood: "pointing",
        navigateAfter: "/dashboard",
      };

    default:
      return fallbackResult();
  }
}

function handleStaking(intent: ParsedIntent, ctx: ActionContext): ActionResult {
  switch (intent.action) {
    case "setAmount":
      return {
        textKo: `${intent.params.amount} TON 스테이킹! 스테이킹 페이지로 이동할게~`,
        textEn: `Staking ${intent.params.amount} TON! Taking you to the staking page~`,
        mood: "excited",
        navigateAfter: `/staking?amount=${intent.params.amount}`,
      };

    case "tokiPick":
      return {
        textKo: "내가 제일 좋은 오퍼레이터를 골라줄게! 스테이킹 페이지로 가자~",
        textEn: "I'll pick the best operator for you! Let's go to staking~",
        mood: "cheer",
        navigateAfter: "/staking?tokiPick=true",
      };

    case "stakeMax":
      return {
        textKo: "전부 스테이킹! 좋은 선택이야! 스테이킹 페이지로 가자~",
        textEn: "Stake it all! Great choice! Let's go to staking~",
        mood: "excited",
        navigateAfter: "/staking?max=true",
      };

    case "start":
      if (!ctx.isAuthenticated) {
        return {
          textKo: "스테이킹하려면 먼저 로그인이 필요해! 로그인할까?",
          textEn: "You need to log in first to stake! Shall I open login?",
          mood: "explain",
          sideEffect: () => ctx.login(),
        };
      }
      return {
        textKo: "좋아! 스테이킹 페이지로 이동할게!",
        textEn: "Let's go! Taking you to the staking page!",
        mood: "determined",
        navigateAfter: "/staking",
      };

    case "unstake":
      return {
        textKo: "언스테이킹 페이지로 이동할게! 거기서 출금 요청할 수 있어~",
        textEn: "Taking you to the unstaking page! You can request withdrawal there~",
        mood: "explain",
        navigateAfter: "/staking?tab=unstaking",
      };

    case "checkRewards":
      return {
        textKo: "보상 확인하러 대시보드로 가자! 실시간으로 볼 수 있어~",
        textEn: "Let's check your rewards on the dashboard! You can see them in real-time~",
        mood: "excited",
        navigateAfter: "/dashboard",
      };

    default:
      return fallbackResult();
  }
}

function handleNavigation(intent: ParsedIntent): ActionResult {
  const routes: Record<string, { ko: string; en: string; path: string; mood: Mood }> = {
    dashboard: {
      ko: "대시보드로 이동할게!",
      en: "Taking you to the dashboard!",
      path: "/dashboard",
      mood: "peace",
    },
    onboarding: {
      ko: "온보딩 가이드를 시작할게! 하나씩 알려줄게~",
      en: "Starting the onboarding guide! I'll walk you through~",
      path: "/onboarding",
      mood: "excited",
    },
    explore: {
      ko: "생태계 페이지로 이동할게! 재밌는 게 많아~",
      en: "Let's explore the ecosystem! There's lots of cool stuff~",
      path: "/explore",
      mood: "proud",
    },
  };

  const route = routes[intent.action];
  if (route) {
    return {
      textKo: route.ko,
      textEn: route.en,
      mood: route.mood,
      navigateAfter: route.path,
    };
  }
  return fallbackResult();
}

function handleEvent(): ActionResult {
  return {
    textKo: "이벤트 페이지로 이동할게! 무료 TON을 받을 수 있어~",
    textEn: "Taking you to the event page! You can get free TON~",
    mood: "excited",
    navigateAfter: "/event",
  };
}

function handleInfo(intent: ParsedIntent): ActionResult {
  switch (intent.action) {
    case "whatIsToki":
      return {
        textKo: "나는 토키! 토카막 네트워크의 TON 스테이킹을 도와주는 귀여운 가이드야. 뭐든 물어봐!",
        textEn: "I'm Toki! A cute guide that helps you with TON staking on Tokamak Network. Ask me anything!",
        mood: "welcome",
      };

    case "help":
      return {
        textKo: "이런 것들을 할 수 있어! 지갑 만들기, 스테이킹, 보상 확인, 생태계 탐험... 뭐든 물어봐~",
        textEn: "I can help with: wallet creation, staking, checking rewards, exploring the ecosystem... Ask me anything~",
        mood: "cheer",
      };

    default:
      return fallbackResult();
  }
}

function fallbackResult(): ActionResult {
  return {
    textKo: "음... 잘 모르겠어. 다시 한번 말해줄래?",
    textEn: "Hmm... I'm not sure about that. Can you say it again?",
    mood: "confused",
  };
}
