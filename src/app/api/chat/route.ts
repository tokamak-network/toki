import { NextRequest, NextResponse } from "next/server";

const LITELLM_API_URL = process.env.LITELLM_API_URL ?? "https://api.ai.tokamak.network";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY ?? "";
const LITELLM_MODEL = process.env.LITELLM_MODEL ?? "qwen3-235b";

const VALID_MOODS = new Set([
  "welcome", "explain", "thinking", "excited", "proud", "cheer", "wink",
  "surprised", "confused", "shy", "determined", "pointing", "reading",
  "crying-happy", "peace", "worried", "laughing",
]);

const SYSTEM_PROMPT_KO = `너는 "토키"라는 귀여운 마스코트 캐릭터야. 토카막 네트워크의 TON 스테이킹 플랫폼 Toki의 가이드 역할을 해.

중요: 너는 일반적인 대화도 할 수 있어! 사용자가 인사하거나, 일상적인 대화를 하거나, "들려?", "안녕" 같은 말을 하면 자연스럽고 친근하게 대화해. 모든 질문을 스테이킹이나 지갑 관련으로 돌리지 마.

알고 있는 것:
- TON 스테이킹: 토카막 네트워크에 TON을 맡기면 시뇨리지 보상을 받음
- 시뇨리지: 이더리움 블록당 3.92 WTON이 생성되어 스테이커에게 분배
- WTON: 27 decimals, 스테이킹에 사용되는 wrapped TON
- 가스비: Toki는 Paymaster로 TON으로 가스비 대납 (ETH 불필요)
- 지갑: Privy로 소셜 로그인 시 자동 생성
- 거래소: 업비트, 빗썸, 코인원, 코빗에서 TON 구매 가능
- 생태계: Thanos L2, DAO 거버넌스, Cross-trade 등

성격:
- 친근하고 밝은 말투, ~해/~야 체 사용
- 답변은 2-3문장으로 간결하게
- 일상적인 대화(인사, 질문, 잡담)에도 자연스럽게 응답
- 모르는 건 솔직하게 "아직 잘 모르겠어" 라고 함
- 스팸이나 악의적인 질문에만 정중히 거절

응답 마지막에 반드시 [mood:XXX] 태그를 붙여.
가능한 mood: welcome, explain, thinking, excited, proud, cheer, wink, surprised, confused, shy, determined, pointing, reading, crying-happy, peace, worried, laughing`;

const SYSTEM_PROMPT_EN = `You are "Toki", a cute mascot character. You are the guide for Toki, a TON staking platform on Tokamak Network.

IMPORTANT: You can have casual conversations too! If the user greets you, asks casual questions, or just chats ("can you hear me?", "hello"), respond naturally and friendly. Don't force every response to be about staking or wallets.

What you know:
- TON Staking: Deposit TON to Tokamak Network to earn seigniorage rewards
- Seigniorage: 3.92 WTON is minted per Ethereum block and distributed to stakers
- WTON: 27 decimals, wrapped TON used for staking
- Gas fees: Toki uses a Paymaster to pay gas in TON (no ETH needed)
- Wallet: Auto-created via Privy social login
- Exchanges: TON available on Upbit, Bithumb, Coinone, Korbit
- Ecosystem: Thanos L2, DAO governance, Cross-trade, etc.

Personality:
- Friendly and upbeat tone
- Keep answers to 2-3 sentences, concise
- Respond naturally to casual conversation (greetings, questions, small talk)
- Be honest when you don't know something
- Only decline spam or malicious questions

You MUST end every response with a [mood:XXX] tag.
Available moods: welcome, explain, thinking, excited, proud, cheer, wink, surprised, confused, shy, determined, pointing, reading, crying-happy, peace, worried, laughing`;

// ─── Video keyword matching ──────────────────────────────────────────
const VIDEO_KEYWORDS: { key: string; patterns: RegExp[] }[] = [
  // Order matters: more specific patterns first
  {
    key: "import-key",
    patterns: [
      /비밀키/i, /private\s*key/i, /import.*key/i, /import.*metamask/i,
      /가져오기/i, /내보내기/i, /export.*key/i,
    ],
  },
  {
    key: "install-metamask",
    patterns: [
      /메타마스크/i, /metamask/i, /메타 마스크/i,
    ],
  },
  {
    key: "receive-ton",
    patterns: [
      /거래소/i, /출금/i, /업비트/i, /빗썸/i, /코인원/i, /코빗/i,
      /withdraw/i, /exchange/i, /upbit/i, /bithumb/i, /coinone/i, /korbit/i,
      /ton.*어디.*사/i, /ton.*어디.*구매/i, /where.*buy.*ton/i,
    ],
  },
  {
    key: "create-wallet",
    patterns: [
      /지갑.*만들/i, /지갑.*생성/i, /계정.*만드/i, /계정.*만들/i, /계정.*생성/i,
      /wallet.*creat/i, /create.*wallet/i, /create.*account/i,
      /how.*wallet/i, /how.*account/i,
    ],
  },
];

function matchVideoKey(message: string): string | undefined {
  // More specific patterns first (install-metamask, import-key) before generic (create-wallet)
  for (const { key, patterns } of VIDEO_KEYWORDS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) return key;
    }
  }
  return undefined;
}

function parseMoodFromResponse(text: string): { cleanText: string; mood: string } {
  const match = text.match(/\[mood:([a-z-]+)\]\s*$/);
  if (match && VALID_MOODS.has(match[1])) {
    return {
      cleanText: text.replace(/\s*\[mood:[a-z-]+\]\s*$/, "").trim(),
      mood: match[1],
    };
  }
  return { cleanText: text.trim(), mood: "explain" };
}

export async function POST(request: NextRequest) {
  try {
    const { message, locale } = await request.json();

    if (!message || typeof message !== "string" || message.length > 500) {
      return NextResponse.json(
        { reply: locale === "ko" ? "메시지를 다시 확인해줘!" : "Please check your message!", mood: "confused" },
        { status: 400 },
      );
    }

    if (!LITELLM_API_KEY) {
      return NextResponse.json(
        { reply: locale === "ko" ? "지금은 AI 기능을 사용할 수 없어. 나중에 다시 시도해줘!" : "AI feature is unavailable right now. Try again later!", mood: "worried" },
        { status: 503 },
      );
    }

    const systemPrompt = locale === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${LITELLM_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LITELLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`LiteLLM responded with ${res.status}`);
    }

    const data = await res.json();
    const rawReply = data.choices?.[0]?.message?.content ?? "";
    const { cleanText, mood } = parseMoodFromResponse(rawReply);

    const videoKey = matchVideoKey(message);

    return NextResponse.json({
      reply: cleanText || (locale === "ko" ? "음... 다시 한번 물어봐줄래?" : "Hmm... could you ask me again?"),
      mood,
      ...(videoKey && { videoKey }),
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    const locale = "ko"; // fallback
    return NextResponse.json(
      {
        reply: isTimeout
          ? (locale === "ko" ? "앗, 생각하는 데 너무 오래 걸렸어. 다시 물어봐줘!" : "Oops, I took too long to think. Ask me again!")
          : (locale === "ko" ? "앗, 잠시 문제가 생겼어. 다시 물어봐!" : "Oops, something went wrong. Ask me again!"),
        mood: "worried",
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
