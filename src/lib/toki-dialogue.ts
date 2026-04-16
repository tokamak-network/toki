// ─── Toki Visual Novel Chat Dialogue Tree ────────────────────────────

export type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing" | "neutral";

export interface DialogueChoice {
  labelKo: string;
  labelEn: string;
  next: string; // target node id
}

export interface DialogueNode {
  id: string;
  mood: Mood;
  textKo: string;
  textEn: string;
  choices?: DialogueChoice[];
  /** If set, auto-navigate to this node after text finishes (no choices shown) */
  autoNext?: string;
}

// Maintenance fallback choices (shown when AI server is down)
export const MAINTENANCE_CHOICES: DialogueChoice[] = [
  { labelKo: "토카막 네트워크가 뭐야?", labelEn: "What is Tokamak Network?", next: "what-is-tokamak" },
  { labelKo: "스테이킹이 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
  { labelKo: "수익률 알려줘", labelEn: "Tell me about APR", next: "apr-info" },
  { labelKo: "TON 어디서 사?", labelEn: "Where to buy TON?", next: "buy-ton" },
  { labelKo: "복권 이벤트가 뭐야?", labelEn: "What's the lottery event?", next: "lottery-info" },
];

// Keyword → node id mapping for free-text input
// Order matters: more specific patterns are checked first
export const KEYWORD_MAP: Record<string, string> = {
  // Korean keywords — greetings & small talk
  "안녕": "greeting",
  "반가워": "greeting",
  "하이": "greeting",
  "헬로": "greeting",
  "ㅎㅇ": "greeting",
  "고마워": "thanks",
  "감사": "thanks",
  "땡큐": "thanks",
  "잘가": "bye",
  "바이": "bye",
  "또 봐": "bye",
  "ㅂㅂ": "bye",
  // Korean keywords — Tokamak/TON info
  "토카막": "what-is-tokamak",
  "토카막 네트워크": "what-is-tokamak",
  "TON이 뭐": "what-is-ton",
  "톤이 뭐": "what-is-ton",
  "톤 코인": "what-is-ton",
  "토키가 뭐": "what-is-toki",
  "토키 뭐야": "what-is-toki",
  // Korean keywords — lottery/event
  "복권": "lottery-info",
  "럭키": "lottery-info",
  "래플": "lottery-info",
  "당첨": "lottery-info",
  "이벤트": "lottery-info",
  "경품": "lottery-info",
  "할인": "lottery-info",
  "쿠폰": "lottery-info",
  "더 그린": "lottery-info",
  "the green": "lottery-info",
  // Korean keywords — price/market
  "시세": "price-info",
  "가격": "price-info",
  "얼마야": "price-info",
  "몇 원": "price-info",
  "차트": "price-info",
  "코인마켓캡": "price-info",
  // Korean keywords — intent to stake (must come before generic "스테이킹")
  "스테이킹 하고": "want-to-stake",
  "스테이킹하고": "want-to-stake",
  "스테이킹 시작": "want-to-stake",
  "스테이킹 해보": "want-to-stake",
  "스테이킹해보": "want-to-stake",
  "스테이킹 할래": "want-to-stake",
  "스테이킹할래": "want-to-stake",
  "스테이킹 바로": "want-to-stake",
  "바로 스테이킹": "want-to-stake",
  "스테이킹 하러": "want-to-stake",
  "지금 스테이킹": "want-to-stake",
  // Korean keywords — general staking info
  "스테이킹": "what-is-staking",
  "스테이크": "what-is-staking",
  "수익": "apr-info",
  "수익률": "apr-info",
  "이자": "apr-info",
  "APR": "apr-info",
  "apr": "apr-info",
  "구매": "buy-ton",
  "구입": "buy-ton",
  "어디서": "buy-ton",
  "업비트": "buy-ton",
  "빗썸": "buy-ton",
  "거래소": "buy-ton",
  "생태계": "ecosystem",
  "에코시스템": "ecosystem",
  "가스": "gasless",
  "가스비": "gasless",
  "수수료": "gasless",
  "안전": "safety",
  "보안": "safety",
  "지갑": "wallet-info",
  "Privy": "wallet-info",
  "privy": "wallet-info",
  "언스테이킹": "unstaking",
  "출금": "unstaking",
  "인출": "unstaking",
  // Korean keywords — help/general
  "뭐 할 수 있": "help-menu",
  "뭐 물어볼": "help-menu",
  "도와줘": "help-menu",
  "도움": "help-menu",
  "메뉴": "help-menu",
  "뭐해": "what-can-you-do",
  "심심해": "bored",
  // English keywords — greetings & small talk
  "hello": "greeting",
  "hi": "greeting",
  "hey": "greeting",
  "thanks": "thanks",
  "thank you": "thanks",
  "bye": "bye",
  "goodbye": "bye",
  "see you": "bye",
  // English keywords — Tokamak/TON info
  "tokamak": "what-is-tokamak",
  "what is ton": "what-is-ton",
  "ton coin": "what-is-ton",
  "what is toki": "what-is-toki",
  "who is toki": "what-is-toki",
  // English keywords — lottery/event
  "lottery": "lottery-info",
  "lucky": "lottery-info",
  "raffle": "lottery-info",
  "prize": "lottery-info",
  "event": "lottery-info",
  "discount": "lottery-info",
  "coupon": "lottery-info",
  // English keywords — price/market
  "price": "price-info",
  "how much is ton": "price-info",
  "market": "price-info",
  "chart": "price-info",
  "coinmarketcap": "price-info",
  // English keywords — intent to stake (must come before generic "staking")
  "want to stake": "want-to-stake",
  "start staking": "want-to-stake",
  "stake now": "want-to-stake",
  "begin staking": "want-to-stake",
  "try staking": "want-to-stake",
  "do staking": "want-to-stake",
  "let me stake": "want-to-stake",
  "ready to stake": "want-to-stake",
  "i want to stake": "want-to-stake",
  // English keywords — general staking info
  "staking": "what-is-staking",
  "stake": "what-is-staking",
  "yield": "apr-info",
  "earn": "apr-info",
  "reward": "apr-info",
  "buy": "buy-ton",
  "purchase": "buy-ton",
  "exchange": "buy-ton",
  "upbit": "buy-ton",
  "ecosystem": "ecosystem",
  "explore": "ecosystem",
  "gas": "gasless",
  "fee": "gasless",
  "gasless": "gasless",
  "safe": "safety",
  "security": "safety",
  "wallet": "wallet-info",
  "unstake": "unstaking",
  "withdraw": "unstaking",
  // English keywords — help/general
  "help": "help-menu",
  "what can you do": "what-can-you-do",
  "menu": "help-menu",
  "bored": "bored",
};

export const DIALOGUE_TREE: DialogueNode[] = [
  // ─── Root ───
  {
    id: "root",
    mood: "welcome",
    textKo: "안녕! 나는 토키야. 토카막 네트워크에 대해 뭐든 물어봐!",
    textEn: "Hey! I'm Toki. Ask me anything about Tokamak Network!",
    choices: [
      { labelKo: "토카막 네트워크가 뭐야?", labelEn: "What is Tokamak Network?", next: "what-is-tokamak" },
      { labelKo: "스테이킹이 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
      { labelKo: "수익률 알려줘", labelEn: "Tell me about APR", next: "apr-info" },
      { labelKo: "TON 어디서 사?", labelEn: "Where to buy TON?", next: "buy-ton" },
      { labelKo: "생태계 둘러보기", labelEn: "Explore ecosystem", next: "ecosystem" },
    ],
  },

  // ─── What is Tokamak Network ───
  {
    id: "what-is-tokamak",
    mood: "proud",
    textKo: "토카막 네트워크는 이더리움 레이어2 프로토콜이야! 누구나 쉽게 롤업을 만들 수 있게 해주는 온디맨드 네트워크 플랫폼이지. TON은 토카막의 네이티브 토큰이고, 국내 4대 거래소에 모두 상장돼 있어!",
    textEn: "Tokamak Network is an Ethereum Layer 2 protocol! It's an on-demand network platform that lets anyone easily create rollups. TON is Tokamak's native token, listed on all major Korean exchanges!",
    choices: [
      { labelKo: "스테이킹은 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
      { labelKo: "생태계 둘러보기", labelEn: "Explore ecosystem", next: "ecosystem" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Want to Stake (intent flow) ───
  {
    id: "want-to-stake",
    mood: "excited",
    textKo: "오! 스테이킹 하고 싶구나! 혹시 스테이킹 해본 적 있어?",
    textEn: "Oh! You want to stake! Have you staked before?",
    choices: [
      { labelKo: "처음이야, 알려줘!", labelEn: "First time, teach me!", next: "go-onboarding" },
      { labelKo: "해봤어, 바로 할래", labelEn: "Done it before, let's go", next: "go-staking" },
    ],
  },

  // ─── Staking ───
  {
    id: "what-is-staking",
    mood: "explain",
    textKo: "스테이킹은 네가 가진 TON을 네트워크에 맡기는 거야. 그러면 네트워크가 안전해지고, 그 보상으로 추가 TON을 받을 수 있어!",
    textEn: "Staking means depositing your TON into the network. This helps secure the network, and you earn extra TON as a reward!",
    choices: [
      { labelKo: "어떻게 시작해?", labelEn: "How do I start?", next: "how-to-stake" },
      { labelKo: "수익률은?", labelEn: "What's the APR?", next: "apr-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "how-to-stake",
    mood: "determined",
    textKo: "Toki에서는 3단계면 끝! 로그인 → TON 입금 → 스테이킹 버튼 클릭. 가스비도 TON으로 내니까 ETH 없어도 돼!",
    textEn: "With Toki, it's just 3 steps! Login → Deposit TON → Click stake. Gas is paid in TON, so no ETH needed!",
    choices: [
      { labelKo: "가스비가 뭐야?", labelEn: "What are gas fees?", next: "gasless" },
      { labelKo: "바로 해볼래!", labelEn: "Let me try now!", next: "go-dashboard" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── APR ───
  {
    id: "apr-info",
    mood: "excited",
    textKo: "현재 시뇨리지 APR은 약 {apr}%야! 복리로 자동 적용되니까, 맡겨두기만 하면 TON이 계속 불어나!",
    textEn: "Current seigniorage APR is about {apr}%! It compounds automatically, so your TON keeps growing just by holding!",
    choices: [
      { labelKo: "시뇨리지가 뭐야?", labelEn: "What's seigniorage?", next: "seigniorage" },
      { labelKo: "바로 스테이킹!", labelEn: "Start staking!", next: "go-dashboard" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "seigniorage",
    mood: "reading",
    textKo: "시뇨리지는 토카막 네트워크가 블록마다 새로 만드는 TON이야. 스테이킹한 사람들한테 나눠주는 거지. 은행 이자처럼 생각하면 돼!",
    textEn: "Seigniorage is new TON minted by the network every block. It's distributed to stakers — think of it like bank interest!",
    choices: [
      { labelKo: "얼마나 벌 수 있어?", labelEn: "How much can I earn?", next: "apr-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Buy TON ───
  {
    id: "buy-ton",
    mood: "wink",
    textKo: "TON은 업비트, 빗썸, 코인원, 코빗에서 살 수 있어! 거래소에서 TON을 산 다음, Toki 지갑 주소로 출금하면 돼.",
    textEn: "You can buy TON on Upbit, Bithumb, Coinone, or Korbit! Buy TON on the exchange, then withdraw to your Toki wallet address.",
    choices: [
      { labelKo: "출금 방법 알려줘", labelEn: "How to withdraw?", next: "withdraw-guide" },
      { labelKo: "지갑 주소는 어디?", labelEn: "Where's my wallet?", next: "wallet-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "withdraw-guide",
    mood: "pointing",
    textKo: "거래소 앱에서 '출금' → 네트워크는 'Ethereum(ERC20)' 선택 → Toki 대시보드에 있는 지갑 주소 복사해서 붙여넣기! 온보딩 튜토리얼에서 자세히 알려줄게.",
    textEn: "In the exchange app: 'Withdraw' → Select 'Ethereum(ERC20)' network → Paste your wallet address from the Toki dashboard! The onboarding tutorial walks you through it.",
    choices: [
      { labelKo: "튜토리얼 해볼래", labelEn: "Try the tutorial", next: "go-onboarding" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Ecosystem ───
  {
    id: "ecosystem",
    mood: "proud",
    textKo: "토카막 네트워크 생태계에는 스테이킹 외에도 다양한 서비스가 있어! 한번 둘러볼래?",
    textEn: "The Tokamak ecosystem has lots of services beyond staking! Want to explore?",
    choices: [
      { labelKo: "둘러보기", labelEn: "Explore", next: "go-explore" },
      { labelKo: "스테이킹부터", labelEn: "Staking first", next: "what-is-staking" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Gasless ───
  {
    id: "gasless",
    mood: "cheer",
    textKo: "블록체인 거래에는 보통 ETH로 수수료를 내야 하는데, Toki는 TON으로 가스비를 대신 내줘! ETH를 따로 준비할 필요 없어.",
    textEn: "Blockchain transactions usually need ETH for fees, but Toki pays gas in TON for you! No need to get ETH separately.",
    choices: [
      { labelKo: "어떻게 가능해?", labelEn: "How does that work?", next: "gasless-detail" },
      { labelKo: "바로 시작!", labelEn: "Let's start!", next: "go-dashboard" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "gasless-detail",
    mood: "reading",
    textKo: "Toki는 Paymaster라는 기술을 써서, 네가 내야 할 ETH 가스비를 TON으로 대납해주는 거야. EIP-7702 같은 최신 기술 덕분이지!",
    textEn: "Toki uses a Paymaster that covers your ETH gas fees using TON instead. It's powered by cutting-edge tech like EIP-7702!",
    choices: [
      { labelKo: "멋지다!", labelEn: "That's cool!", next: "go-dashboard" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Safety ───
  {
    id: "safety",
    mood: "explain",
    textKo: "Toki는 Privy로 지갑을 관리해서, 비밀키가 안전하게 암호화돼 있어. 스마트 컨트랙트도 토카막 네트워크에서 검증된 거야!",
    textEn: "Toki uses Privy for wallet management, so your private keys are securely encrypted. Smart contracts are verified by Tokamak Network!",
    choices: [
      { labelKo: "지갑에 대해 더", labelEn: "More about wallets", next: "wallet-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Wallet ───
  {
    id: "wallet-info",
    mood: "explain",
    textKo: "Toki에 로그인하면 Privy가 자동으로 지갑을 만들어줘. 카카오나 구글 계정으로 로그인하면 끝! 비밀키는 안전하게 암호화돼서 저장돼.",
    textEn: "When you log into Toki, Privy automatically creates a wallet. Just sign in with Kakao or Google! Your private key is safely encrypted.",
    choices: [
      { labelKo: "비밀키가 뭐야?", labelEn: "What's a private key?", next: "private-key" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "private-key",
    mood: "worried",
    textKo: "비밀키는 지갑의 진짜 열쇠야. 이걸 가진 사람만 자산을 옮길 수 있어. Toki에서는 Privy가 안전하게 보관해주지만, 원하면 MetaMask로 내보낼 수도 있어!",
    textEn: "A private key is the real key to your wallet. Only whoever has it can move assets. In Toki, Privy keeps it safe — but you can export it to MetaMask if you want!",
    choices: [
      { labelKo: "MetaMask가 뭐야?", labelEn: "What's MetaMask?", next: "metamask-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "metamask-info",
    mood: "wink",
    textKo: "MetaMask는 가장 유명한 암호화폐 지갑이야. 브라우저 확장 프로그램으로 설치할 수 있어. 온보딩 튜토리얼에서 자세히 알려줄게!",
    textEn: "MetaMask is the most popular crypto wallet. It's a browser extension you can install. The onboarding tutorial will walk you through it!",
    choices: [
      { labelKo: "튜토리얼 시작", labelEn: "Start tutorial", next: "go-onboarding" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Unstaking ───
  {
    id: "unstaking",
    mood: "explain",
    textKo: "언스테이킹은 맡긴 TON을 다시 돌려받는 거야. 출금 요청을 하면 일정 기간 후에 인출할 수 있어. 대시보드에서 할 수 있어!",
    textEn: "Unstaking means getting your staked TON back. After requesting withdrawal, you can claim it after a delay period. You can do it from the dashboard!",
    choices: [
      { labelKo: "대시보드 가기", labelEn: "Go to dashboard", next: "go-dashboard" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Navigation nodes ───
  {
    id: "go-dashboard",
    mood: "peace",
    textKo: "좋아! 대시보드로 이동할게. 화이팅!",
    textEn: "Great! Let's head to the dashboard. Good luck!",
  },
  {
    id: "go-onboarding",
    mood: "excited",
    textKo: "온보딩 튜토리얼을 시작할게! 내가 하나씩 알려줄 테니 걱정 마!",
    textEn: "Let's start the onboarding tutorial! I'll guide you step by step, don't worry!",
  },
  {
    id: "go-staking",
    mood: "determined",
    textKo: "좋아! 스테이킹 페이지로 바로 이동할게. 화이팅!",
    textEn: "Let's go! Taking you straight to the staking page. Good luck!",
  },
  {
    id: "go-explore",
    mood: "proud",
    textKo: "생태계 페이지로 이동할게! 재밌는 게 많을 거야.",
    textEn: "Let's go to the ecosystem page! There's a lot of cool stuff!",
  },

  // ─── Greetings & Small Talk ───
  {
    id: "greeting",
    mood: "welcome",
    textKo: "안녕~! 반가워! 나는 토키야 🐰 토카막 네트워크에 대해 뭐든 물어봐!",
    textEn: "Hey there~! Nice to meet you! I'm Toki 🐰 Ask me anything about Tokamak Network!",
    choices: [
      { labelKo: "토카막 네트워크가 뭐야?", labelEn: "What is Tokamak Network?", next: "what-is-tokamak" },
      { labelKo: "복권 이벤트가 뭐야?", labelEn: "What's the lottery event?", next: "lottery-info" },
      { labelKo: "스테이킹이 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
    ],
  },
  {
    id: "thanks",
    mood: "cheer",
    textKo: "에헤~ 도움이 됐다니 기뻐! 또 궁금한 거 있으면 언제든 말해줘~",
    textEn: "Yay~ Glad I could help! Feel free to ask me anything anytime~",
    choices: [
      { labelKo: "다른 거 물어볼래", labelEn: "Ask something else", next: "root" },
    ],
  },
  {
    id: "bye",
    mood: "peace",
    textKo: "또 봐~ 언제든 돌아와! 기다리고 있을게 👋",
    textEn: "See you~ Come back anytime! I'll be waiting 👋",
  },

  // ─── What is TON ───
  {
    id: "what-is-ton",
    mood: "explain",
    textKo: "TON은 토카막 네트워크의 네이티브 토큰이야! 스테이킹하면 보상을 받을 수 있고, 업비트·빗썸·코인원·코빗에서 살 수 있어. 국내 4대 거래소 모두 상장돼 있지!",
    textEn: "TON is the native token of Tokamak Network! You can earn rewards by staking, and buy it on Upbit, Bithumb, Coinone, or Korbit — all major Korean exchanges!",
    choices: [
      { labelKo: "스테이킹은 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
      { labelKo: "어디서 사?", labelEn: "Where to buy?", next: "buy-ton" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── What is Toki ───
  {
    id: "what-is-toki",
    mood: "proud",
    textKo: "나 토키! 토카막 네트워크의 마스코트이자 가이드야. 스테이킹도 도와주고, 생태계도 소개해주고, 궁금한 건 뭐든 대답해줄게! 사실 나 엄청 똑똑해 😎",
    textEn: "I'm Toki! The mascot and guide for Tokamak Network. I help with staking, introduce the ecosystem, and answer all your questions! I'm actually super smart 😎",
    choices: [
      { labelKo: "토카막 네트워크가 뭐야?", labelEn: "What is Tokamak Network?", next: "what-is-tokamak" },
      { labelKo: "스테이킹 시작!", labelEn: "Start staking!", next: "want-to-stake" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Lottery / Event ───
  {
    id: "lottery-info",
    mood: "excited",
    textKo: "토키 럭키 복권 이벤트! 더 그린(THE GREEN)에서 무료로 복권 카드를 받을 수 있어. 100% 당첨이고, 최대 100 TON까지 받을 수 있어! 할인 쿠폰도 바로 사용 가능하지~",
    textEn: "Toki Lucky Lottery event! Get a free lottery card at THE GREEN. 100% win rate, up to 100 TON! Discount coupons can be used right away~",
    choices: [
      { labelKo: "복권 하러 가기", labelEn: "Go to lottery", next: "go-lottery" },
      { labelKo: "TON이 뭐야?", labelEn: "What is TON?", next: "what-is-ton" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "go-lottery",
    mood: "cheer",
    textKo: "좋아! 복권 페이지로 이동할게. 행운을 빌어! 🍀",
    textEn: "Great! Let's go to the lottery page. Good luck! 🍀",
  },

  // ─── Price Info ───
  {
    id: "price-info",
    mood: "wink",
    textKo: "TON 시세는 업비트나 코인마켓캡에서 실시간으로 확인할 수 있어! 나는 투자 조언은 못 해주지만, 스테이킹하면 보유량을 늘릴 수 있다는 건 알려줄게~",
    textEn: "You can check TON prices on Upbit or CoinMarketCap in real-time! I can't give investment advice, but I can tell you that staking helps grow your holdings~",
    choices: [
      { labelKo: "스테이킹 수익률은?", labelEn: "What's the staking APR?", next: "apr-info" },
      { labelKo: "TON 어디서 사?", labelEn: "Where to buy TON?", next: "buy-ton" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Help / Menu ───
  {
    id: "help-menu",
    mood: "pointing",
    textKo: "내가 도와줄 수 있는 것들이야! 👇\n• 토카막 네트워크 & TON 소개\n• 스테이킹 방법 안내\n• 수익률(APR) 확인\n• TON 구매 방법\n• 지갑 관련 도움\n• 복권 이벤트 안내\n뭐가 궁금해?",
    textEn: "Here's what I can help with! 👇\n• Tokamak Network & TON intro\n• How to stake\n• APR info\n• Where to buy TON\n• Wallet help\n• Lottery event info\nWhat are you curious about?",
    choices: [
      { labelKo: "스테이킹이 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
      { labelKo: "TON 어디서 사?", labelEn: "Where to buy TON?", next: "buy-ton" },
      { labelKo: "복권 이벤트", labelEn: "Lottery event", next: "lottery-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Fun / Misc ───
  {
    id: "what-can-you-do",
    mood: "wink",
    textKo: "나? 토카막 네트워크의 모든 걸 알려줄 수 있어! 스테이킹, TON 구매, 지갑, 이벤트... 뭐든 물어봐!",
    textEn: "Me? I can tell you everything about Tokamak Network! Staking, buying TON, wallets, events... ask away!",
    choices: [
      { labelKo: "스테이킹 알려줘", labelEn: "Tell me about staking", next: "what-is-staking" },
      { labelKo: "복권 이벤트", labelEn: "Lottery event", next: "lottery-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
  {
    id: "bored",
    mood: "laughing",
    textKo: "심심해? 그러면 복권 한 장 긁어볼래? 아니면 스테이킹으로 TON 모아보는 건 어때!",
    textEn: "Bored? How about scratching a lottery card? Or maybe start staking to grow your TON!",
    choices: [
      { labelKo: "복권 하러 가기", labelEn: "Go to lottery", next: "go-lottery" },
      { labelKo: "스테이킹 시작!", labelEn: "Start staking!", next: "want-to-stake" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },

  // ─── Fallback ───
  {
    id: "fallback",
    mood: "confused",
    textKo: "음... 그건 아직 잘 모르겠어. 다른 거 물어볼래?",
    textEn: "Hmm... I'm not sure about that yet. Want to ask something else?",
    choices: [
      { labelKo: "스테이킹이 뭐야?", labelEn: "What is staking?", next: "what-is-staking" },
      { labelKo: "수익률 알려줘", labelEn: "Tell me about APR", next: "apr-info" },
      { labelKo: "복권 이벤트", labelEn: "Lottery event", next: "lottery-info" },
      { labelKo: "처음으로", labelEn: "Back to start", next: "root" },
    ],
  },
];

/** Find a dialogue node by id */
export function getNode(id: string): DialogueNode | undefined {
  return DIALOGUE_TREE.find((n) => n.id === id);
}

/** Match free-text input to a node id using keyword map */
export function matchKeyword(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const [keyword, nodeId] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword.toLowerCase())) {
      return nodeId;
    }
  }
  return null;
}
