// ─── Onboarding Guide Flows ───────────────────────────────────────────
//
// Page-aware, step-by-step guidance for the two flows users do OUTSIDE the
// Toki app and most often get stuck on:
//   1. Creating a MetaMask wallet            (on metamask.io)
//   2. Withdrawing TON from a Korean exchange (on upbit/bithumb/coinone/korbit)
//
// V1 is a pure instructional overlay — no wallet connection / Privy. The user's
// receiving address is pasted once (copied from MetaMask) and stored, so the
// exchange flow can hand it back with one click.

import type { Mood } from "./sprites";

// NOTE: the activation hostnames live as inline `matches` literals in
// contents/onboarding-guide.tsx (Plasmo needs them inline for static manifest
// generation). Keep those in sync with the EXCHANGES list below.

export type FlowId = "metamask" | "exchange";

export interface GuideAction {
  kind: "open-url" | "next" | "copy-address" | "connect";
  labelKo: string;
  url?: string;
}

export interface GuideStep {
  id: string;
  titleKo: string;
  /** Toki's line. `{address}` is replaced with the saved MetaMask address. */
  bodyKo: string;
  mood: Mood;
  actions?: GuideAction[];
  /** Render the "paste your MetaMask address" input on this step. */
  addressInput?: boolean;
  /** Live-detect MetaMask presence (shows a detected/not-yet badge). */
  detect?: "installed";
  /** CSS-selector candidates; the first match on the page is ring-highlighted. */
  highlight?: string[];
  /** Speech-bubble text Toki says while pointing at the highlighted element. */
  pointLabelKo?: string;
}

export interface ExchangeInfo {
  key: string;
  nameKo: string;
  guideUrl: string;
}

export interface DetectedFlow {
  id: FlowId;
  titleKo: string;
  steps: GuideStep[];
  exchange?: ExchangeInfo;
}

// Travel-Rule personal-wallet-registration guides (reused from the web app's
// onboarding EXCHANGE_GUIDES).
const EXCHANGES: { match: string; info: ExchangeInfo }[] = [
  {
    match: "upbit.com",
    info: {
      key: "upbit",
      nameKo: "업비트",
      guideUrl: "https://support.upbit.com/hc/ko/articles/6713306957977",
    },
  },
  {
    match: "bithumb.com",
    info: {
      key: "bithumb",
      nameKo: "빗썸",
      guideUrl: "https://support.bithumb.com/hc/ko/articles/51144300935577",
    },
  },
  {
    match: "coinone.co.kr",
    info: {
      key: "coinone",
      nameKo: "코인원",
      guideUrl: "https://support.coinone.co.kr/support/solutions/articles/31000163221",
    },
  },
  {
    match: "korbit.co.kr",
    info: {
      key: "korbit",
      nameKo: "코빗",
      guideUrl:
        "https://www.korbit.co.kr/faq/list/?category=6gTj8LJTQpSXvmFTie9hhs&article=7dWVcdas0GTuwWgLc1hPpV",
    },
  },
];

const METAMASK_STEPS: GuideStep[] = [
  {
    id: "install",
    titleKo: "메타마스크 설치",
    bodyKo:
      "안녕! 토키가 메타마스크 지갑 만드는 걸 도와줄게.\n이 페이지에서 'Download' 버튼을 눌러 크롬에 메타마스크를 추가해줘. 설치했으면 '다음'!",
    mood: "pointing",
    detect: "installed",
    // The real metamask.io/download install buttons (Chrome/Brave/Opera/Edge)
    // are <a> links to the Chrome Web Store extension page — NOT hrefs
    // containing "download" (that only matches the top-nav link). Target the
    // web-store install link first; querySelector returns the first (Chrome) one.
    highlight: [
      "a[href*='/webstore/detail/metamask']",
      "a[href*='nkbihfbeogaeaoehlefnkodbefgpgknn']",
      "a[href*='chromewebstore.google.com']",
      "a[href*='/download']",
    ],
    pointLabelKo: "여기 눌러요!",
    actions: [
      { kind: "open-url", labelKo: "공식 다운로드 페이지", url: "https://metamask.io/download/" },
      { kind: "next", labelKo: "설치했어!" },
    ],
  },
  {
    id: "create",
    titleKo: "지갑 만들기",
    bodyKo:
      "설치했으면 브라우저 오른쪽 위 퍼즐(확장) 아이콘에서 메타마스크를 열어줘.\n\n1) '새 지갑 생성' 선택\n2) 비밀번호 설정\n3) 비밀복구구문(시드 12단어)을 종이에 적어 안전하게 보관\n\n⚠️ 시드구문은 절대 스크린샷·캡처·공유 금지! 토키도 안 물어봐.",
    mood: "explain",
    actions: [{ kind: "next", labelKo: "지갑 만들었어!" }],
  },
  {
    id: "address",
    titleKo: "내 주소 저장",
    bodyKo:
      "지갑을 다 만들었으면 아래 '메타마스크 연결'을 눌러 — 토키가 주소를 자동으로 가져와 저장할게!\n(직접 붙여넣고 싶으면 메타마스크 계정 이름을 클릭하면 주소가 복사돼. 아래 칸에 붙여넣어도 돼.)",
    mood: "excited",
    addressInput: true,
    actions: [
      { kind: "connect", labelKo: "메타마스크 연결해서 자동 저장" },
      { kind: "next", labelKo: "저장했어, 다음" },
    ],
  },
  {
    id: "done",
    titleKo: "완료!",
    bodyKo:
      "완벽해! 저장한 받는 주소는:\n{address}\n\n이제 거래소에서 TON을 이 주소로 출금하면 돼. 거래소 사이트에 가면 토키가 또 도와줄게!",
    mood: "cheer",
    actions: [{ kind: "copy-address", labelKo: "주소 복사" }],
  },
];

function buildExchangeSteps(ex: ExchangeInfo): GuideStep[] {
  return [
    {
      id: "intro",
      titleKo: `${ex.nameKo}에서 TON 출금`,
      bodyKo: `${ex.nameKo}에서 TON을 네 메타마스크 지갑으로 출금하는 걸 도와줄게!\n한국 거래소는 '트래블룰' 때문에 먼저 개인지갑(메타마스크)을 등록해야 해.`,
      mood: "welcome",
      actions: [{ kind: "next", labelKo: "시작하기" }],
    },
    {
      id: "register",
      titleKo: "개인지갑 등록",
      bodyKo: `${ex.nameKo} 입출금 > 개인지갑(출금주소) 등록 메뉴에서 메타마스크 지갑을 등록해줘.\n가이드를 열어줄게.`,
      mood: "explain",
      highlight: [
        "a[href*='withdraw']",
        "a[href*='wallet']",
        "[class*='withdraw']",
        "[class*='deposit']",
      ],
      pointLabelKo: "여기예요!",
      actions: [{ kind: "open-url", labelKo: `${ex.nameKo} 등록 가이드`, url: ex.guideUrl }],
    },
    {
      id: "address",
      titleKo: "내 주소 복사",
      bodyKo:
        "등록·출금할 때 네 메타마스크 주소가 필요해.\n저장해 둔 주소를 복사해서 붙여넣어! (아직 없으면 아래에 붙여넣어 저장)\n{address}",
      mood: "pointing",
      addressInput: true,
      actions: [{ kind: "copy-address", labelKo: "주소 복사" }],
    },
    {
      id: "network",
      titleKo: "코인·네트워크 선택",
      bodyKo:
        "출금할 때 꼭 확인해!\n• 코인: TON (Tokamak Network)\n• 네트워크: 이더리움 (ERC-20)\n\n⚠️ 토카막 TON은 이더리움 ERC-20 토큰이야. 'TON(톤코인)'이나 다른 네트워크로 보내면 자산을 잃을 수 있어!",
      mood: "determined",
      actions: [{ kind: "next", labelKo: "확인했어" }],
    },
    {
      id: "withdraw",
      titleKo: "출금 신청",
      bodyKo:
        "받는 주소에 네 메타마스크 주소를 붙여넣고, 수량을 입력한 뒤 출금 신청!\n처음이면 소액으로 테스트해보는 걸 추천해.",
      mood: "explain",
      actions: [{ kind: "next", labelKo: "신청했어!" }],
    },
    {
      id: "done",
      titleKo: "거의 다 됐어!",
      bodyKo:
        "출금 신청 완료! 거래소 처리 + 네트워크 컨펌까지 보통 몇 분~수십 분 걸려.\n도착하면 메타마스크에 TON이 보일 거야. 수고했어!",
      mood: "cheer",
    },
  ];
}

export function detectFlow(hostname: string): DetectedFlow | null {
  if (hostname.includes("metamask.io")) {
    return { id: "metamask", titleKo: "메타마스크 지갑 만들기", steps: METAMASK_STEPS };
  }
  for (const e of EXCHANGES) {
    if (hostname.includes(e.match)) {
      return {
        id: "exchange",
        titleKo: `${e.info.nameKo} TON 출금`,
        steps: buildExchangeSteps(e.info),
        exchange: e.info,
      };
    }
  }
  return null;
}

export const isValidAddress = (a: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(a.trim());
