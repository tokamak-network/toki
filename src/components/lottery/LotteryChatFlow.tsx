"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { QRCodeSVG } from "qrcode.react";
import { PRIZE_TIERS, type PrizeTier } from "@/constants/lottery";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { fetchStakingData } from "@/lib/staking";
import MicButton from "@/components/chat/MicButton";
import VoiceIndicator from "@/components/chat/VoiceIndicator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  sender: "toki" | "user" | "system";
  content: React.ReactNode;
  mood?: string;
  timestamp?: number;
}

interface LotteryChatFlowProps {
  cardNumber: string;
  tier: PrizeTier;
  prizeAmount: number;
  onChooseReward: (choice: "discount" | "ton") => Promise<{ txHash?: string; showMission?: boolean }>;
  txHash?: string | null;
  walletAddress?: string | null;
  loading?: boolean;
}

// ─── Exchange logos ────────────────────────────────────────────────────────────

const EXCHANGE_LOGOS = [
  { name: "Upbit", initial: "U", color: "bg-blue-500", hex: "#3B82F6" },
  { name: "Bithumb", initial: "B", color: "bg-orange-500", hex: "#F97316" },
  { name: "Coinone", initial: "C", color: "bg-purple-500", hex: "#A855F7" },
  { name: "GOPAX", initial: "G", color: "bg-emerald-500", hex: "#10B981" },
];

// ─── Confetti particle (CSS-only) ─────────────────────────────────────────────

function ConfettiParticles({ tier }: { tier: PrizeTier }) {
  const isJackpot = tier === "jackpot";
  const colors = isJackpot
    ? ["#f59e0b", "#fbbf24", "#fcd34d", "#f9a8d4", "#ffffff", "#f97316", "#facc15", "#fb923c"]
    : ["#f9a8d4", "#fbcfe8", "#f472b6", "#c4b5fd", "#fda4af", "#ffffff", "#fce7f3"];

  const particles = Array.from({ length: 12 }, (_, i) => {
    const color = colors[i % colors.length];
    const left = `${5 + (i * 8) % 90}%`;
    const delay = `${(i * 0.15).toFixed(2)}s`;
    const size = i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5;
    const duration = `${1.8 + (i % 4) * 0.3}s`;
    const shape = i % 4 === 0 ? "50%" : i % 4 === 1 ? "0%" : i % 4 === 2 ? "2px" : "50%";
    return { color, left, delay, size, duration, shape };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationFillMode: "forwards",
          }}
        />
      ))}
    </div>
  );
}

// ─── Prize reveal card ────────────────────────────────────────────────────────

function PrizeRevealCard({ prize, tier }: { prize: typeof PRIZE_TIERS[PrizeTier]; tier: PrizeTier }) {
  const isJackpot = tier === "jackpot";
  const isLucky = tier === "lucky";

  const gradientText = isJackpot
    ? "from-amber-300 via-yellow-200 to-amber-400"
    : isLucky
    ? "from-pink-500 via-rose-400 to-pink-600"
    : "from-pink-500 to-purple-500";

  const cardGlow = isJackpot
    ? "shadow-[0_0_40px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]"
    : "shadow-[0_0_30px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]";

  const borderColor = isJackpot
    ? "border-amber-400/40"
    : "border-pink-300/40";

  const bgGlow = isJackpot
    ? "bg-gradient-to-br from-amber-50/80 via-white/70 to-amber-50/60"
    : "bg-gradient-to-br from-pink-50/80 via-white/70 to-fuchsia-50/60";

  return (
    <div className="w-full mb-2 animate-bounce-in" style={{ animationDuration: "0.7s" }}>
      <div
        className={`relative w-full rounded-2xl border ${borderColor} ${bgGlow} ${cardGlow} p-5 overflow-hidden`}
      >
        {/* Confetti */}
        <ConfettiParticles tier={tier} />

        {/* Inner shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />

        <div className="relative flex flex-col items-center gap-2 text-center">
          {/* Emoji — large */}
          <div
            className="text-5xl"
            style={{
              filter: isJackpot ? "drop-shadow(0 0 12px rgba(245,158,11,0.8))" : "drop-shadow(0 0 8px rgba(244,114,182,0.6))",
              animation: "float 2.5s ease-in-out infinite",
            }}
          >
            {prize.emoji}
          </div>

          {/* Prize amount */}
          <p
            className={`text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r ${gradientText} bg-clip-text text-transparent`}
            style={{
              filter: isJackpot
                ? "drop-shadow(0 2px 8px rgba(245,158,11,0.4))"
                : "drop-shadow(0 2px 6px rgba(244,114,182,0.3))",
            }}
          >
            {prize.label}
          </p>

          {/* Label */}
          <p className="text-sm font-semibold text-pink-900/60 tracking-wide">
            {isJackpot ? "🏆 대박 당첨!" : isLucky ? "⭐ 행운 당첨!" : "🎉 당첨!"}
          </p>
        </div>
      </div>
    </div>
  );
}


// ─── APR highlight card ───────────────────────────────────────────────────────

function AprCard() {
  const [apr, setApr] = useState<number | null>(null);

  useEffect(() => {
    fetchStakingData()
      .then((data) => setApr(data.apr))
      .catch(() => setApr(null));
  }, []);

  return (
    <div
      className="rounded-xl border border-pink-300/30 mt-2 p-3 overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, rgba(251,207,232,0.3) 0%, rgba(255,255,255,0.5) 60%)",
        boxShadow: "0 0 20px rgba(244,114,182,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-pink-400/40 via-pink-300/20 to-transparent" />
      <p className="text-xs text-pink-900/50 font-medium mb-0.5">현재 스테이킹 수익률</p>
      <p
        className="text-2xl font-black tracking-tight text-pink-600"
        style={{ textShadow: "0 0 20px rgba(236,72,153,0.3)" }}
      >
        {apr !== null ? `~${apr.toFixed(1)}% APR` : "loading..."}
      </p>
    </div>
  );
}

// ─── Exchange logos row ───────────────────────────────────────────────────────

function ExchangeRow() {
  return (
    <div className="flex justify-start gap-4 mt-3">
      {EXCHANGE_LOGOS.map((ex) => (
        <div key={ex.name} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-10 h-10 rounded-full ${ex.color} flex items-center justify-center text-sm font-black text-white`}
            style={{ boxShadow: `0 0 12px ${ex.hex}55` }}
          >
            {ex.initial}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">{ex.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 mb-3">
      <div
        className="backdrop-blur-md border-l-2 border-l-pink-400/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(252,231,243,0.5) 100%)",
          border: "1px solid rgba(244,114,182,0.2)",
          borderLeft: "2px solid rgba(244,114,182,0.4)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-pink-400/70 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Individual chat bubble ───────────────────────────────────────────────────

function TokiBubble({
  message,
  isConsecutive,
}: {
  message: ChatMessage;
  isConsecutive: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 animate-fade-in-up ${isConsecutive ? "mb-1" : "mb-2.5"}`}>
      <div
        className="max-w-[85%] backdrop-blur-md rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-pink-950 leading-relaxed"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.55) 100%)",
          border: "1px solid rgba(244,114,182,0.25)",
          borderLeft: "2px solid rgba(244,114,182,0.4)",
          boxShadow: "0 2px 12px rgba(244,114,182,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end mb-2.5 animate-fade-in-up">
      <div
        className="max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white leading-relaxed"
        style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.85) 0%, rgba(168,85,247,0.75) 100%)",
          boxShadow: "0 2px 12px rgba(236,72,153,0.2)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function SystemBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center my-3 animate-fade-in-up">
      <div
        className="text-xs text-pink-900/50 rounded-full px-4 py-1.5"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(244,114,182,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Choice buttons ───────────────────────────────────────────────────────────

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
  disabled,
  accentColor,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
  accentColor: "amber" | "cyan";
}) {
  const borderHover = accentColor === "amber" ? "hover:border-amber-400/50" : "hover:border-pink-400/50";
  const iconBg = accentColor === "amber" ? "bg-amber-100 border border-amber-300/40" : "bg-pink-100 border border-pink-300/40";
  const glowColor = accentColor === "amber" ? "rgba(245,158,11,0.1)" : "rgba(244,114,182,0.1)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-2xl text-left ${borderHover} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.5) 100%)",
        border: "1px solid rgba(244,114,182,0.2)",
        backdropFilter: "blur(12px)",
        boxShadow: `0 2px 16px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-2xl shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-pink-950 text-sm leading-snug">{title}</p>
          <p className="text-xs text-pink-900/50 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Success card (TON transfer result) ───────────────────────────────────────

function TonSuccessCard({
  addr,
  hash,
  prize,
}: {
  addr: string | null | undefined;
  hash: string | null | undefined;
  prize: typeof PRIZE_TIERS[PrizeTier];
}) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden animate-bounce-in"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(209,250,229,0.5) 100%)",
        border: "1px solid rgba(16,185,129,0.3)",
        boxShadow: "0 0 24px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="p-4 space-y-3">
        {/* Success header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300/50 flex items-center justify-center text-sm text-emerald-600"
            style={{ boxShadow: "0 0 12px rgba(16,185,129,0.2)" }}
          >
            ✓
          </div>
          <div>
            <p className="text-xs text-emerald-600/80 font-medium">전송 완료</p>
            <p className="text-lg font-black text-emerald-600 tracking-tight">
              {prize.label}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-emerald-400/30 via-emerald-300/15 to-transparent" />

        {/* Details */}
        <div className="space-y-2 text-xs">
          {addr && (
            <div>
              <span className="text-pink-900/40 font-medium">지갑 주소</span>
              <p className="font-mono text-pink-950/70 mt-0.5 break-all text-[10px] leading-relaxed">{addr}</p>
            </div>
          )}
          {hash && (
            <div>
              <span className="text-pink-900/40 font-medium">트랜잭션 해시</span>
              <p className="font-mono text-pink-950/70 mt-0.5 break-all text-[10px] leading-relaxed">{hash}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── QR result card ───────────────────────────────────────────────────────────

function QrResultCard({
  qrData,
  prize,
  cardNumber,
}: {
  qrData: string;
  prize: typeof PRIZE_TIERS[PrizeTier];
  cardNumber: string;
}) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden animate-bounce-in"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.75) 0%, rgba(254,243,199,0.4) 100%)",
        border: "1px solid rgba(245,158,11,0.25)",
        boxShadow: "0 0 24px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="p-4 flex flex-col items-center gap-4">
        {/* QR area */}
        <div className="bg-white rounded-2xl p-3 shadow-lg shadow-pink-200/30">
          <QRCodeSVG value={qrData} size={148} level="M" includeMargin={false} />
        </div>

        {/* Details */}
        <div className="w-full space-y-1.5 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-pink-200/30">
            <span className="text-pink-900/50 font-medium">할인 금액</span>
            <span className="text-amber-600 font-black text-sm">
              {prize.label}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-pink-200/30">
            <span className="text-pink-900/50 font-medium">카드 번호</span>
            <span className="font-mono text-pink-950/70 text-[11px]">{cardNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-pink-900/50 font-medium">유효기간</span>
            <span className="text-pink-950/70">
              {(() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = now.getMonth() + 1;
                const d = now.getDate();
                return `${y}년 ${m}월 ${d}일 23:59까지`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FlowPhase =
  | "prize_reveal"
  | "awaiting_login"
  | "onboarding"
  | "wallet_ready"
  | "choice"
  | "discount_result"
  | "ton_result"
  | "done";

let _idCounter = 0;
function genId() {
  return `msg-${++_idCounter}-${Date.now()}`;
}

export default function LotteryChatFlow({
  cardNumber,
  tier,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prizeAmount,
  onChooseReward,
  txHash,
  walletAddress,
  loading = false,
}: LotteryChatFlowProps) {
  const prize = PRIZE_TIERS[tier];
  const { login, authenticated, user } = usePrivy();

  // Chat input & voice
  const [chatInput, setChatInput] = useState("");
  const {
    transcript: voiceTranscript,
    isListening,
    isSupported: micSupported,
    startListening,
    stopListening,
    finalTranscript,
  } = useSpeechRecognition({ locale: "ko-KR" });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [actionButtons, setActionButtons] = useState<React.ReactNode | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<FlowPhase>("prize_reveal");
  const [slideIndex, setSlideIndex] = useState(0);
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [resultData, setResultData] = useState<{
    txHash?: string | null;
    showMission?: boolean;
    choice?: "discount" | "ton";
  }>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<FlowPhase>(phase);
  const initializedRef = useRef(false);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, actionButtons]);

  // ─── Message helpers ────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: genId(), timestamp: Date.now() },
    ]);
  }, []);

  const addTokiMessage = useCallback(
    (content: React.ReactNode, mood: string, typingMs = 900): Promise<void> => {
      return new Promise((resolve) => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: genId(), sender: "toki", content, mood, timestamp: Date.now() },
          ]);
          setTimeout(resolve, 200);
        }, typingMs);
      });
    },
    [],
  );

  const addUserMessage = useCallback((content: React.ReactNode) => {
    setMessages((prev) => [
      ...prev,
      { id: genId(), sender: "user", content, timestamp: Date.now() },
    ]);
  }, []);

  const addSystemMessage = useCallback((content: React.ReactNode) => {
    setMessages((prev) => [
      ...prev,
      { id: genId(), sender: "system", content, timestamp: Date.now() },
    ]);
  }, []);

  // ─── Chat input & voice handlers ────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleChatSubmit = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setChatInput("");
    // Toki acknowledges free-text input
    addTokiMessage("지금은 복권 플로우 진행 중이야~ 위의 버튼을 눌러줘! 😊", "wink", 700);
  }, [chatInput, addUserMessage, addTokiMessage]);

  // Voice → auto-submit when finalTranscript changes
  useEffect(() => {
    if (finalTranscript) {
      addUserMessage(finalTranscript);
      addTokiMessage("음성 입력 고마워! 지금은 위의 버튼으로 진행해줘~ 🎤", "wink", 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript]);

  // ─── Phase runners ──────────────────────────────────────────────────────────

  const runPrizeReveal = useCallback(async () => {
    await addTokiMessage("와아~ 카드 확인했어!", "excited", 700);

    // Prize reveal as a special full-width card (not a plain bubble)
    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        sender: "toki",
        mood: prize.tokiMood,
        timestamp: Date.now(),
        content: <PrizeRevealCard prize={prize} tier={tier} />,
      },
    ]);

    await addTokiMessage(
      "당첨금을 받으려면 계정이 필요해! 아래 버튼으로 시작해줘~",
      "presenting",
      900,
    );

    setPhase("awaiting_login");
  }, [addTokiMessage, prize, tier]);

  const ONBOARDING_SLIDES = [
    {
      mood: "presenting",
      messages: [
        "반가워! 네가 받은 TON은 토카막 네트워크의 토큰이야~",
        "2017년부터 이더리움 생태계에서 꾸준히 개발해온 한국 블록체인 프로젝트야. 8년 넘게 살아남은 프로젝트는 많지 않거든~",
      ],
      extra: null as null | React.ReactNode,
      accent: "pink" as const,
    },
    {
      mood: "proud",
      messages: [
        "TON은 업비트, 빗썸, 코인원, 고팍스 — 국내 4대 거래소에 모두 상장돼 있어!",
        "그만큼 검증된 프로젝트라는 뜻이야~ 실체 있는 프로젝트만 상장될 수 있거든!",
      ],
      extra: <ExchangeRow />,
      accent: "pink" as const,
    },
    {
      mood: "excited",
      messages: [
        "스테이킹은 은행에 돈을 맡기고 이자를 받는 것처럼, TON을 네트워크에 맡겨서 보상을 받는 거야!",
        "맡긴 TON은 네트워크를 안전하게 지키는 데 쓰여. 그 대가로 보상이 자동으로 쌓이는 거지!",
      ],
      extra: <AprCard />,
      accent: "pink" as const,
    },
    {
      mood: "proud",
      messages: [
        "스테이킹 말고도 토카막에는 DeFi, AI, 게임 등 66개 넘는 프로젝트가 있어!",
        "토키에서는 스테이킹, 퀘스트, 카드 수집까지 — 내가 다 알려줄게~",
      ],
      extra: null,
      accent: "purple" as const,
    },
  ];

  const runOnboardingSlide = useCallback(
    async (idx: number) => {
      const slide = ONBOARDING_SLIDES[idx];
      setActionButtons(null);

      if (slide.extra) {
        await addTokiMessage(
          <div>
            <p className="leading-relaxed">{slide.messages[0]}</p>
            {slide.extra}
          </div>,
          slide.mood,
          900,
        );
      } else {
        await addTokiMessage(slide.messages[0], slide.mood, 900);
      }

      if (slide.messages[1]) {
        await addTokiMessage(slide.messages[1], slide.mood, 700);
      }

      const isLast = idx === ONBOARDING_SLIDES.length - 1;
      setActionButtons(
        <button
          onClick={() => {
            setActionButtons(null);
            if (isLast) {
              setPhase("wallet_ready");
            } else {
              setSlideIndex(idx + 1);
            }
          }}
          className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            boxShadow: "0 4px 20px rgba(236,72,153,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {isLast ? "지갑 확인하기" : "다음 →"}
        </button>,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addTokiMessage],
  );

  const runWalletReady = useCallback(async () => {
    const addr = user?.wallet?.address;

    await addTokiMessage("지갑이 준비됐어! 🎉", "cheer", 700);
    if (addr) {
      addSystemMessage(
        <span className="font-mono text-pink-600 text-xs">{addr}</span>,
      );
    }
    await addTokiMessage(`${prize.label} 어떻게 받을래?`, "presenting", 800);

    setActionButtons(
      <div className="flex flex-col gap-3">
        <ChoiceCard
          icon="🍺"
          title="바에서 할인 받기"
          description={`오늘 이 바에서 ${prize.label} 가치만큼 할인!`}
          onClick={() => handleChoice("discount")}
          disabled={choiceLoading}
          accentColor="amber"
        />
        <ChoiceCard
          icon="💎"
          title="내 지갑으로 받기"
          description={`${prize.label}을 내 지갑으로 전송!`}
          onClick={() => handleChoice("ton")}
          disabled={choiceLoading}
          accentColor="cyan"
        />
      </div>,
    );

    setPhase("choice");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTokiMessage, addSystemMessage, choiceLoading, prize, user]);

  const handleChoice = useCallback(
    async (choice: "discount" | "ton") => {
      if (!user?.id) return;
      setActionButtons(null);
      setChoiceLoading(true);

      addUserMessage(choice === "discount" ? "🍺 바에서 할인 받기" : "💎 내 지갑으로 받기");

      await addTokiMessage("알겠어! 처리 중이야~", "thinking", 600);

      try {
        const result = await onChooseReward(choice);
        setResultData({ ...result, choice });

        if (choice === "discount") {
          setPhase("discount_result");
        } else {
          setPhase("ton_result");
        }
      } catch {
        await addTokiMessage(
          "앗, 문제가 생겼어 😢 잠깐 후에 다시 시도해줘!",
          "thinking",
          600,
        );
        setChoiceLoading(false);
      }
    },
    [user, addUserMessage, addTokiMessage, onChooseReward],
  );

  const runDiscountResult = useCallback(async () => {
    const qrData = JSON.stringify({
      type: "toki-discount",
      cardNumber,
      amount: prize.amount,
    });

    await addTokiMessage("짜잔~ QR 코드야! 바 스탭에게 보여줘!", "proud", 700);

    addMessage({
      sender: "toki",
      mood: "proud",
      content: <QrResultCard qrData={qrData} prize={prize} cardNumber={cardNumber} />,
    });

    await addTokiMessage(
      "나중에 toki.tokamak.network에서 또 만나~ 👋",
      "proud",
      1000,
    );
    setPhase("done");
  }, [addTokiMessage, addMessage, cardNumber, prize]);

  const runTonResult = useCallback(async () => {
    const addr = user?.wallet?.address ?? walletAddress;
    const hash = resultData.txHash ?? txHash;

    await addTokiMessage(
      <span className="font-black text-base">🎉 {prize.label} 전송 완료!</span>,
      "celebrate",
      700,
    );

    addMessage({
      sender: "toki",
      mood: "celebrate",
      content: <TonSuccessCard addr={addr} hash={hash} prize={prize} />,
    });

    if (resultData.showMission) {
      await addTokiMessage(
        "미션을 완료하면 카드를 한 장 더 받을 수 있어! 🎁",
        "excited",
        900,
      );
      setActionButtons(
        <a
          href="/mission"
          className="w-full py-3.5 rounded-2xl font-bold text-base text-center block text-gray-900 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
            boxShadow: "0 4px 20px rgba(245,158,11,0.30), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          🎁 미션 완료하면 카드 한 장 더!
        </a>,
      );
    } else {
      await addTokiMessage(
        "TON을 스테이킹하면 보상이 자동으로 쌓여~ 한번 해볼래?",
        "proud",
        900,
      );
      setActionButtons(
        <a
          href="/staking"
          className="w-full py-3.5 rounded-2xl font-bold text-base text-center block text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            boxShadow: "0 4px 20px rgba(236,72,153,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          스테이킹하러 가기
        </a>,
      );
    }

    setPhase("done");
  }, [addTokiMessage, addMessage, prize, user, walletAddress, txHash, resultData]);

  // ─── Phase sequencer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    runPrizeReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authenticated && phase === "awaiting_login") {
      setActionButtons(null);
      addUserMessage("로그인 완료! ✅");
      setPhase("onboarding");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, phase]);

  useEffect(() => {
    if (phase === "onboarding") {
      runOnboardingSlide(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "onboarding" && slideIndex > 0) {
      runOnboardingSlide(slideIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex]);

  useEffect(() => {
    if (phase === "wallet_ready") {
      runWalletReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "discount_result") {
      runDiscountResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "ton_result") {
      runTonResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      {/* ── Background ────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {/* Base cherry blossom gradient (matches landing page) */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #fff5f7 0%, #ffe4ec 30%, #ffd6e0 50%, #fce8ef 70%, #f5e6f0 100%)",
          }}
        />
        {/* Background image */}
        <Image
          src="/backgrounds/lottery-chat.png"
          alt=""
          fill
          className="object-cover opacity-20"
          priority
        />
        {/* Soft light overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30" />
        {/* Floating cherry blossom orbs */}
        <div
          className="absolute top-[8%] left-[12%] w-72 h-72 rounded-full blur-[90px] animate-orb-float-1"
          style={{ background: "rgba(251,207,232,0.35)" }}
        />
        <div
          className="absolute top-[45%] right-[8%] w-80 h-80 rounded-full blur-[100px] animate-orb-float-2"
          style={{ background: "rgba(249,168,212,0.25)" }}
        />
        <div
          className="absolute bottom-[15%] left-[40%] w-60 h-60 rounded-full blur-[80px] animate-orb-float-3"
          style={{ background: "rgba(196,181,253,0.2)" }}
        />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        <div
          className="flex items-center gap-3 px-5 py-3.5"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.6) 100%)",
            borderBottom: "1px solid rgba(244,114,182,0.15)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full overflow-hidden"
              style={{
                boxShadow: "0 0 0 2px rgba(244,114,182,0.4), 0 0 16px rgba(244,114,182,0.15)",
              }}
            >
              <Image
                src="/characters/toki-welcome.png"
                alt="Toki"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white"
              style={{ boxShadow: "0 0 8px rgba(74,222,128,0.4)" }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-pink-950 tracking-wide">토키</p>
            <p className="text-[11px] font-medium text-emerald-500">온라인</p>
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400/30" />
          </div>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
        {messages.map((msg, i) => {
          if (msg.sender === "toki") {
            const isConsecutive = i > 0 && messages[i - 1]?.sender === "toki";
            return (
              <TokiBubble
                key={msg.id}
                message={msg}
                isConsecutive={isConsecutive}
              />
            );
          }
          if (msg.sender === "user") {
            return <UserBubble key={msg.id} message={msg} />;
          }
          return <SystemBubble key={msg.id} message={msg} />;
        })}

        {isTyping && <TypingIndicator />}

        {loading && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-gray-500 animate-pulse">처리 중...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Bottom area ──────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-pink-400/25 to-transparent" />
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(252,231,243,0.55) 100%)",
            borderTop: "1px solid rgba(244,114,182,0.12)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Login button — rendered at render-time so `login` is never stale */}
          {phase === "awaiting_login" && !authenticated && (
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={() => login()}
                className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                style={{
                  boxShadow: "0 4px 24px rgba(244,114,182,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <GoogleIcon />
                Google로 시작하기
              </button>
            </div>
          )}

          {/* Action buttons (when present) */}
          {actionButtons && (
            <div className="px-4 pt-3 pb-1">
              {actionButtons}
            </div>
          )}

          {/* Voice indicator */}
          <VoiceIndicator
            transcript={voiceTranscript}
            isListening={isListening}
            locale="ko"
          />

          {/* Chat input bar */}
          <div className="px-3 pb-3 pt-2">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="메시지 입력..."
                className="flex-1 px-3 py-2 rounded-lg text-sm text-pink-950 placeholder-pink-300 outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(244,114,182,0.2)",
                }}
              />
              {micSupported && (
                <MicButton isListening={isListening} onClick={toggleMic} />
              )}
              <button
                onClick={handleChatSubmit}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "rgba(244,114,182,0.15)",
                  color: "#9d174d",
                }}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Google icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
