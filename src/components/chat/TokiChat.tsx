"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { useStakingData, replaceApr } from "@/components/providers/StakingDataProvider";
import {
  type Mood,
  type DialogueChoice,
  getNode,
  matchKeyword,
} from "@/lib/toki-dialogue";
import { parseIntent } from "@/lib/toki-intent-parser";
import { executeAction, type ActionContext, type ChatActionButton } from "@/lib/toki-actions";
import { useChatStakingFlow } from "@/hooks/useChatStakingFlow";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useEip7702 } from "@/hooks/useEip7702";
import { useSessionKey } from "@/hooks/useSessionKey";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import MicButton from "./MicButton";
import VoiceIndicator from "./VoiceIndicator";

// ─── Constants ────────────────────────────────────────────────────────

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  thinking: "/characters/toki-thinking.png",
  excited: "/characters/toki-excited.png",
  proud: "/characters/toki-proud.png",
  cheer: "/characters/toki-cheer.png",
  wink: "/characters/toki-wink.png",
  surprised: "/characters/toki-surprised.png",
  confused: "/characters/toki-confused.png",
  shy: "/characters/toki-shy.png",
  determined: "/characters/toki-determined.png",
  pointing: "/characters/toki-pointing.png",
  reading: "/characters/toki-reading.png",
  "crying-happy": "/characters/toki-crying-happy.png",
  peace: "/characters/toki-peace.png",
  worried: "/characters/toki-worried.png",
  laughing: "/characters/toki-laughing.png",
  neutral: "/characters/toki.png",
};

const MOOD_GLOW: Record<Mood, string> = {
  welcome: "rgba(74, 144, 217, 0.4)",
  explain: "rgba(96, 165, 250, 0.4)",
  thinking: "rgba(99, 102, 241, 0.4)",
  excited: "rgba(245, 158, 11, 0.5)",
  proud: "rgba(34, 211, 238, 0.45)",
  cheer: "rgba(168, 85, 247, 0.4)",
  wink: "rgba(236, 72, 153, 0.4)",
  surprised: "rgba(245, 158, 11, 0.40)",
  confused: "rgba(99, 102, 241, 0.30)",
  shy: "rgba(236, 72, 153, 0.40)",
  determined: "rgba(239, 68, 68, 0.35)",
  pointing: "rgba(34, 211, 238, 0.35)",
  reading: "rgba(96, 165, 250, 0.30)",
  "crying-happy": "rgba(245, 158, 11, 0.40)",
  peace: "rgba(168, 85, 247, 0.35)",
  worried: "rgba(239, 68, 68, 0.30)",
  laughing: "rgba(245, 158, 11, 0.45)",
  neutral: "rgba(148, 163, 184, 0.30)",
};

const TUTORIAL_VIDEOS: Record<string, { url: string; mobileUrl?: string; labelKo: string; labelEn: string }> = {
  "create-wallet": { url: "https://www.youtube.com/watch?v=UURB7Tc7D4M&t=129", labelKo: "지갑 만들기 영상 보기", labelEn: "Watch: Create a Wallet" },
  "install-metamask": { url: "https://www.youtube.com/watch?v=KjwlrQAtdYU", mobileUrl: "https://www.youtube.com/shorts/stRSJxS2kyY", labelKo: "MetaMask 설치 영상 보기", labelEn: "Watch: Install MetaMask" },
  "import-key": { url: "https://www.youtube.com/watch?v=yvOie0hBr2k", mobileUrl: "https://www.youtube.com/watch?v=O8R6V2fvwKs&t=173", labelKo: "비밀키 가져오기 영상 보기", labelEn: "Watch: Import Private Key" },
  "receive-ton": { url: "https://www.youtube.com/shorts/D-6tFe_KBZs", labelKo: "TON 출금 방법 영상 보기", labelEn: "Watch: Withdraw TON" },
};

const NAV_ROUTES: Record<string, string> = {
  "go-dashboard": "/dashboard",
  "go-onboarding": "/onboarding",
  "go-staking": "/staking",
  "go-explore": "/explore",
};

// ─── Types ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: "user" | "toki";
  text: string;
  mood?: Mood;
  actions?: ChatActionButton[];
}

// ─── Typewriter Hook ──────────────────────────────────────────────────

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ─── Visual Novel: Character ─────────────────────────────────────────

function ChatCharacter({ mood, fullScreen }: { mood: Mood; fullScreen?: boolean }) {
  const [prevMood, setPrevMood] = useState(mood);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (mood !== prevMood) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevMood(mood);
        setTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mood, prevMood]);

  return (
    <div className={`relative flex justify-center items-end overflow-hidden ${fullScreen ? "h-[40vh]" : "h-44"}`}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full blur-2xl opacity-50 transition-colors duration-500"
        style={{ backgroundColor: MOOD_GLOW[mood] }}
      />
      <Image
        src={MOOD_IMAGES[transitioning ? prevMood : mood]}
        alt="Toki"
        width={256}
        height={256}
        className={`relative z-10 object-contain object-bottom drop-shadow-lg transition-opacity duration-150 ${
          fullScreen ? "w-60 h-[40vh]" : "w-40 h-44"
        } ${transitioning ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}

// ─── Visual Novel: Dialogue ──────────────────────────────────────────

function DialogueDisplay({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const { displayed, done, skip } = useTypewriter(text, 25);

  useEffect(() => {
    if (done && onComplete) onComplete();
  }, [done, onComplete]);

  return (
    <div
      className="px-4 py-3 cursor-pointer select-none min-h-[72px] flex flex-col justify-center"
      onClick={() => !done && skip()}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-accent-cyan font-bold text-xs tracking-wide">Toki</span>
      </div>
      <p className="text-gray-100 text-sm leading-relaxed">
        {displayed}
        {!done && (
          <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
        )}
      </p>
    </div>
  );
}

// ─── Chat Mode: Message Bubbles ──────────────────────────────────────

const ACTION_VARIANT_CLASSES: Record<string, string> = {
  primary: "px-3 py-1.5 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/25 hover:border-accent-cyan/40 transition-all",
  secondary: "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:bg-white/10 hover:text-gray-300 transition-all",
  danger: "px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all",
};

function TokiMessageBubble({
  text,
  mood,
  actions,
  locale,
  onAction,
}: {
  text: string;
  mood?: Mood;
  actions?: ChatActionButton[];
  locale?: string;
  onAction?: (actionId: string, params?: Record<string, string>) => void;
}) {
  return (
    <div className="flex gap-2 px-3 py-1 animate-slide-up-fade">
      <Image
        src={MOOD_IMAGES[mood || "welcome"]}
        alt="Toki"
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover object-top shrink-0 mt-0.5 ring-1 ring-white/10"
      />
      <div className="flex-1 max-w-[80%] space-y-1.5">
        <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
          <p className="text-[13px] text-gray-200 leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {actions.map((btn) => (
              <button
                key={btn.id}
                onClick={() => onAction?.(btn.id, btn.params)}
                className={ACTION_VARIANT_CLASSES[btn.variant || "primary"]}
              >
                {locale === "ko" ? btn.labelKo : btn.labelEn}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessageBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end px-3 py-1 animate-slide-up-fade">
      <div className="bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
        <p className="text-[13px] text-gray-100 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 px-3 py-1">
      <Image
        src={MOOD_IMAGES.thinking}
        alt="Toki"
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover object-top shrink-0 ring-1 ring-white/10"
      />
      <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2.5">
        <div className="flex items-center gap-1.5 h-4">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Shared: Chat Bubble (Floating Button) ───────────────────────────

function ChatBubble({ onClick, hasNewMessage }: { onClick: () => void; hasNewMessage: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-14 h-14 rounded-full shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/40 transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-accent-cyan/30 hover:border-accent-cyan/50"
    >
      <Image
        src="/toki-icon.png"
        alt="Chat with Toki"
        width={56}
        height={56}
        className="w-full h-full object-cover"
      />
      {hasNewMessage && (
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-accent-cyan rounded-full border-2 border-background animate-pulse" />
      )}
    </button>
  );
}

// ─── Shared: Choices ─────────────────────────────────────────────────

function ChoiceButtons({
  choices,
  locale,
  onSelect,
  compact,
}: {
  choices: DialogueChoice[];
  locale: string;
  onSelect: (choice: DialogueChoice) => void;
  compact?: boolean;
}) {
  return (
    <div className={`space-y-1.5 animate-slide-up-fade ${compact ? "px-3 pb-1 pl-12 space-y-1" : "px-4 pb-2"}`}>
      {choices.map((choice, i) => (
        <button
          key={`${choice.next}-${i}`}
          onClick={() => onSelect(choice)}
          className={`w-full text-left rounded-lg bg-white/5 border border-white/10 hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all ${
            compact ? "px-3 py-1.5 text-xs text-gray-300" : "px-3 py-2 text-sm text-gray-200"
          }`}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
        >
          {locale === "ko" ? choice.labelKo : choice.labelEn}
        </button>
      ))}
    </div>
  );
}

// ─── Shared: Text Input (with Mic) ──────────────────────────────────

function TextInputWithMic({
  locale,
  onSubmit,
  micSupported,
  isListening,
  onMicToggle,
}: {
  locale: string;
  onSubmit: (text: string) => void;
  micSupported: boolean;
  isListening: boolean;
  onMicToggle: () => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={locale === "ko" ? "메시지 입력..." : "Type a message..."}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent-cyan/40 transition-colors"
        />
        {micSupported && (
          <MicButton isListening={isListening} onClick={onMicToggle} />
        )}
        <button
          onClick={handleSubmit}
          className="px-3 py-2 rounded-lg bg-accent-cyan/20 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/30 transition-colors"
        >
          {locale === "ko" ? "전송" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared: Video Suggestion ────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function VideoSuggestion({ videoKey, locale, indent }: { videoKey: string; locale: string; indent?: boolean }) {
  const video = TUTORIAL_VIDEOS[videoKey];
  const isMobile = useIsMobile();
  if (!video) return null;

  const href = isMobile && video.mobileUrl ? video.mobileUrl : video.url;

  return (
    <div className={`px-3 pb-1 animate-slide-up-fade ${indent ? "pl-12" : "px-4"}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <span className="text-xs">{locale === "ko" ? video.labelKo : video.labelEn}</span>
      </a>
    </div>
  );
}

// ─── Chat Window (VN → Chat mode + Full-screen) ─────────────────────

function ChatWindow({
  onClose,
  locale,
}: {
  onClose: () => void;
  locale: string;
}) {
  const router = useRouter();
  const { trackActivity } = useAchievement();
  const { t } = useTranslation();
  const { apr } = useStakingData();
  const { login, logout, authenticated, user, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const { smartAccountClient } = useEip7702();

  // Wallet helpers for staking flow
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const externalWallet = wallets.find((w) => w.walletClientType !== "privy");
  const primaryWallet = externalWallet || embeddedWallet;

  const getEthereumProvider = useCallback(async () => {
    if (!primaryWallet) throw new Error("No wallet connected");
    return await primaryWallet.getEthereumProvider();
  }, [primaryWallet]);

  const sessionKey = useSessionKey(
    primaryWallet ? getEthereumProvider : null,
    (primaryWallet?.address as `0x${string}`) || null,
  );

  // ── Mode & layout state
  const [mode, setMode] = useState<"vn" | "chat">("vn");
  const [fullScreen, setFullScreen] = useState(false);

  // ── Visual-novel state
  const [typingDone, setTypingDone] = useState(false);
  const vnKey = 0;
  const rootNode = getNode("root");

  // ── Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChoices, setCurrentChoices] = useState<DialogueChoice[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [latestVideoKey, setLatestVideoKey] = useState<string | undefined>();
  const nextIdRef = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Voice hooks
  const { speak, isSupported: ttsSupported, ttsEnabled, setTtsEnabled } = useSpeechSynthesis({ locale });
  const { transcript, finalTranscript, isListening, isSupported: micSupported, startListening, stopListening } =
    useSpeechRecognition({ locale });

  // ── Helpers
  const addTokiMessage = useCallback((text: string, mood: Mood, choices?: DialogueChoice[], actions?: ChatActionButton[]) => {
    setMessages(prev => [...prev, { id: nextIdRef.current++, role: "toki", text, mood, actions }]);
    setCurrentChoices(choices ?? null);
    setLatestVideoKey(undefined);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: nextIdRef.current++, role: "user", text }]);
    setCurrentChoices(null);
    setLatestVideoKey(undefined);
  }, []);

  // Seed chat history with root greeting and switch mode
  const transitionToChat = useCallback(() => {
    if (rootNode) {
      const greeting = replaceApr(locale === "ko" ? rootNode.textKo : rootNode.textEn, apr);
      setMessages([{ id: nextIdRef.current++, role: "toki", text: greeting, mood: rootNode.mood }]);
    }
    setMode("chat");
  }, [locale, apr, rootNode]);

  // ── ESC to exit full screen
  useEffect(() => {
    if (!fullScreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullScreen]);

  // ── Auto-scroll in chat mode
  useEffect(() => {
    if (mode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiLoading, mode]);

  // ── TTS
  const lastSpokenIdRef = useRef(0);
  useEffect(() => {
    if (!ttsEnabled) return;
    if (mode === "chat") {
      const last = messages[messages.length - 1];
      if (last?.role === "toki" && last.id !== lastSpokenIdRef.current) {
        lastSpokenIdRef.current = last.id;
        speak(last.text);
      }
    }
  }, [messages, ttsEnabled, speak, mode]);

  // TTS for VN mode
  const lastVnSpokenRef = useRef("");
  useEffect(() => {
    if (!ttsEnabled || mode !== "vn" || !typingDone || !rootNode) return;
    const text = replaceApr(locale === "ko" ? rootNode.textKo : rootNode.textEn, apr);
    if (text && text !== lastVnSpokenRef.current) {
      lastVnSpokenRef.current = text;
      speak(text);
    }
  }, [typingDone, ttsEnabled, mode, rootNode, locale, apr, speak]);

  // ── Action context
  const actionCtx: ActionContext = {
    login,
    logout,
    isAuthenticated: authenticated,
    navigateTo: (path: string) => router.push(path),
    locale,
    exportWallet: exportWallet || undefined,
    userAddress: user?.wallet?.address,
  };

  // ── Staking flow hook
  const stakingFlow = useChatStakingFlow({
    locale,
    userAddress: user?.wallet?.address,
    smartAccountClient: smartAccountClient || undefined,
    sessionKey: sessionKey || undefined,
    getEthereumProvider: primaryWallet ? getEthereumProvider : undefined,
    t,
  });

  // ── Chat action handler (for inline buttons)
  const handleChatActionRef = useRef<(actionId: string, params?: Record<string, string>) => void>();
  handleChatActionRef.current = async (actionId: string, params?: Record<string, string>) => {
    switch (actionId) {
      case "privy-login":
        login();
        break;
      case "start-staking-flow": {
        const msgs = await stakingFlow.start();
        msgs.forEach(m => addTokiMessage(m.text, m.mood, undefined, m.actions));
        break;
      }
      case "stake-max":
      case "confirm-stake":
      case "staking-retry":
      case "staking-cancel": {
        const msgs = await stakingFlow.handleAction(actionId);
        msgs.forEach(m => addTokiMessage(m.text, m.mood, undefined, m.actions));
        break;
      }
      case "view-tx": {
        if (params?.url) window.open(params.url, "_blank", "noopener,noreferrer");
        break;
      }
      case "confirm-logout": {
        logout();
        addTokiMessage(
          locale === "ko" ? "로그아웃 완료! 다시 만나자~" : "Logged out! See you next time~",
          "wink",
        );
        break;
      }
      case "cancel-action": {
        addTokiMessage(
          locale === "ko" ? "취소했어! 다른 거 도와줄까?" : "Cancelled! Anything else I can help with?",
          "peace",
        );
        break;
      }
      case "copy-address": {
        if (params?.address) {
          navigator.clipboard.writeText(params.address);
          addTokiMessage(
            locale === "ko" ? "주소를 복사했어! 📋" : "Address copied! 📋",
            "cheer",
          );
        }
        break;
      }
      case "refresh-balance": {
        addTokiMessage(
          locale === "ko" ? "대시보드에서 최신 잔액을 확인할 수 있어!" : "Check your latest balance on the dashboard!",
          "pointing",
        );
        router.push("/dashboard");
        break;
      }
    }
  };

  const handleChatAction = useCallback((actionId: string, params?: Record<string, string>) => {
    handleChatActionRef.current?.(actionId, params);
  }, []);

  // ── handleFreeText via ref (avoids stale closure)
  const handleFreeTextRef = useRef<(input: string) => Promise<void>>();
  handleFreeTextRef.current = async (input: string) => {
    // Transition to chat on first interaction
    if (mode === "vn") transitionToChat();

    // Check staking flow first (intercepts amount input)
    if (stakingFlow.isActive) {
      const flowMsgs = stakingFlow.handleTextInput(input);
      if (flowMsgs) {
        addUserMessage(input);
        flowMsgs.forEach(m => addTokiMessage(m.text, m.mood, undefined, m.actions));
        return;
      }
    }

    addUserMessage(input);
    trackActivity("chat-freetext");

    // 1) Intent
    const intent = parseIntent(input);
    if (intent) {
      const result = executeAction(intent, actionCtx);
      const text = locale === "ko" ? result.textKo : result.textEn;
      addTokiMessage(text, result.mood, undefined, result.actions);
      if (result.sideEffect) setTimeout(() => result.sideEffect?.(), 500);
      if (result.navigateAfter) setTimeout(() => router.push(result.navigateAfter!), 2000);
      return;
    }

    // 2) Keyword
    const matched = matchKeyword(input);
    if (matched) {
      const node = getNode(matched);
      if (node) {
        const text = replaceApr(locale === "ko" ? node.textKo : node.textEn, apr);
        addTokiMessage(text, node.mood, node.choices);
        if (matched in NAV_ROUTES) {
          setTimeout(() => router.push(NAV_ROUTES[matched]), 1500);
        }
        return;
      }
    }

    // 3) AI
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          locale,
          userContext: {
            isAuthenticated: authenticated,
            address: user?.wallet?.address,
          },
        }),
      });
      const data = await res.json();
      setAiLoading(false);
      if (data.reply) {
        addTokiMessage(data.reply, (data.mood as Mood) || "explain");
        if (data.videoKey) setLatestVideoKey(data.videoKey);
      } else {
        addTokiMessage(locale === "ko" ? "음... 다시 한번 말해줄래?" : "Hmm... could you say that again?", "confused");
      }
    } catch {
      setAiLoading(false);
      addTokiMessage(locale === "ko" ? "앗, 잠시 문제가 생겼어. 다시 말해줘!" : "Oops, something went wrong. Try again!", "worried");
    }
  };

  const handleFreeText = useCallback((input: string) => {
    handleFreeTextRef.current?.(input);
  }, []);

  // ── Voice → text
  const lastProcessedTranscriptRef = useRef("");
  useEffect(() => {
    if (finalTranscript && finalTranscript !== lastProcessedTranscriptRef.current) {
      lastProcessedTranscriptRef.current = finalTranscript;
      handleFreeText(finalTranscript);
    }
  }, [finalTranscript, handleFreeText]);

  // ── Mic toggle
  const handleMicToggle = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  // ── Choice handler (works in both modes)
  const handleChoiceSelect = useCallback(
    (choice: DialogueChoice) => {
      if (mode === "vn") transitionToChat();

      addUserMessage(locale === "ko" ? choice.labelKo : choice.labelEn);

      const nextNode = getNode(choice.next);
      if (nextNode) {
        const text = replaceApr(locale === "ko" ? nextNode.textKo : nextNode.textEn, apr);
        setTimeout(() => {
          addTokiMessage(text, nextNode.mood, nextNode.choices);
          if (choice.next in NAV_ROUTES) {
            setTimeout(() => router.push(NAV_ROUTES[choice.next]), 1500);
          }
        }, 300);
      }
      trackActivity("chat-dialogue", { nodeId: choice.next });
    },
    [mode, transitionToChat, addUserMessage, addTokiMessage, locale, apr, router, trackActivity],
  );

  // ── VN typing complete handler
  const handleTypingComplete = useCallback(() => setTypingDone(true), []);

  if (!rootNode) return null;

  // ── VN display text
  const vnDisplayText = replaceApr(locale === "ko" ? rootNode.textKo : rootNode.textEn, apr);

  // ── Container classes
  const containerClass = fullScreen
    ? "fixed inset-0 sm:inset-4 z-[60] rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-white/10 bg-background backdrop-blur-none shadow-2xl shadow-black/50 flex flex-col"
    : "w-80 sm:w-96 rounded-2xl overflow-hidden border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/50 animate-slide-up-fade flex flex-col max-h-[560px]";

  return (
    <div className={containerClass}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/toki-icon.png" alt="Toki" width={24} height={24} className="rounded-full" />
          <span className="text-sm font-semibold text-gradient">Toki</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">online</span>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS toggle */}
          {ttsSupported && (
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ${ttsEnabled ? "text-accent-cyan" : "text-gray-300"}`}
              aria-label={ttsEnabled ? t.voice.ttsMute : t.voice.ttsUnmute}
            >
              {ttsEnabled ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          )}
          {/* Expand / Collapse */}
          <button
            onClick={() => setFullScreen(!fullScreen)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            aria-label={fullScreen ? "Collapse" : "Expand"}
          >
            {fullScreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Visual Novel Mode ──────────────────────────────── */}
      {mode === "vn" && (
        <>
          <div className="bg-gradient-to-b from-black/40 to-transparent">
            <ChatCharacter mood={rootNode.mood} fullScreen={fullScreen} />
          </div>
          <div className="border-t border-white/5 bg-black/30 flex-1 overflow-y-auto">
            <DialogueDisplay key={vnKey} text={vnDisplayText} onComplete={handleTypingComplete} />

            <VoiceIndicator transcript={transcript} isListening={isListening} locale={locale} />

            {typingDone && rootNode.choices && (
              <ChoiceButtons choices={rootNode.choices} locale={locale} onSelect={handleChoiceSelect} />
            )}

            {typingDone && (
              <TextInputWithMic
                locale={locale}
                onSubmit={handleFreeText}
                micSupported={micSupported}
                isListening={isListening}
                onMicToggle={handleMicToggle}
              />
            )}
          </div>
        </>
      )}

      {/* ── Chat Mode ──────────────────────────────────────── */}
      {mode === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-hide min-h-0">
            {messages.map((msg) =>
              msg.role === "toki" ? (
                <TokiMessageBubble
                  key={msg.id}
                  text={msg.text}
                  mood={msg.mood}
                  actions={msg.actions}
                  locale={locale}
                  onAction={handleChatAction}
                />
              ) : (
                <UserMessageBubble key={msg.id} text={msg.text} />
              ),
            )}

            {currentChoices && !aiLoading && (
              <ChoiceButtons choices={currentChoices} locale={locale} onSelect={handleChoiceSelect} compact />
            )}

            {latestVideoKey && <VideoSuggestion videoKey={latestVideoKey} locale={locale} indent />}

            {aiLoading && <TypingIndicator />}

            <VoiceIndicator transcript={transcript} isListening={isListening} locale={locale} />

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/5 shrink-0">
            <TextInputWithMic
              locale={locale}
              onSubmit={handleFreeText}
              micSupported={micSupported}
              isListening={isListening}
              onMicToggle={handleMicToggle}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

const HIDDEN_PATHS_MOBILE = ["/onboarding", "/staking"];

export default function TokiChat() {
  const [open, setOpen] = useState(false);
  const { locale } = useTranslation();
  const { trackActivity } = useAchievement();
  const pathname = usePathname();

  const handleOpen = () => {
    if (!open) {
      trackActivity("chat-open");
    }
    setOpen(!open);
  };

  // Hide on mobile for pages with their own dialogue UI
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isHiddenPath = HIDDEN_PATHS_MOBILE.some((p) => pathname.startsWith(p));
  if (isMobile && isHiddenPath) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <ChatWindow onClose={() => setOpen(false)} locale={locale} />
      )}
      <ChatBubble
        onClick={handleOpen}
        hasNewMessage={!open}
      />
    </div>
  );
}
