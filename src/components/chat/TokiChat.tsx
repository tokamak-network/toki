"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { useStakingData, replaceApr } from "@/components/providers/StakingDataProvider";
import {
  type Mood,
  type DialogueNode,
  getNode,
  matchKeyword,
} from "@/lib/toki-dialogue";

// ─── Constants ────────────────────────────────────────────────────────

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/toki-welcome.png",
  explain: "/toki-explain.png",
  thinking: "/toki-thinking.png",
  excited: "/toki-excited.png",
  proud: "/toki-proud.png",
  cheer: "/toki-cheer.png",
  wink: "/toki-wink.png",
  surprised: "/toki-surprised.png",
  confused: "/toki-confused.png",
  shy: "/toki-shy.png",
  determined: "/toki-determined.png",
  pointing: "/toki-pointing.png",
  reading: "/toki-reading.png",
  "crying-happy": "/toki-crying-happy.png",
  peace: "/toki-peace.png",
  worried: "/toki-worried.png",
  laughing: "/toki-laughing.png",
  neutral: "/toki.png",
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

// Navigation node IDs → routes
const NAV_ROUTES: Record<string, string> = {
  "go-dashboard": "/dashboard",
  "go-onboarding": "/onboarding",
  "go-staking": "/staking",
  "go-explore": "/explore",
};

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

// ─── Chat Bubble (Floating Button) ───────────────────────────────────

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

// ─── Character Display ───────────────────────────────────────────────

function ChatCharacter({ mood }: { mood: Mood }) {
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
    <div className="relative flex justify-center h-44 overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full blur-2xl opacity-50 transition-colors duration-500"
        style={{ backgroundColor: MOOD_GLOW[mood] }}
      />
      <Image
        src={MOOD_IMAGES[transitioning ? prevMood : mood]}
        alt="Toki"
        width={256}
        height={256}
        className={`relative z-10 w-40 h-auto drop-shadow-lg transition-opacity duration-150 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

// ─── Dialogue Display ────────────────────────────────────────────────

function DialogueDisplay({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
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

// ─── Choices ─────────────────────────────────────────────────────────

function ChoiceButtons({
  node,
  locale,
  onSelect,
  visible,
}: {
  node: DialogueNode;
  locale: string;
  onSelect: (nextId: string) => void;
  visible: boolean;
}) {
  if (!node.choices || !visible) return null;

  return (
    <div className="px-4 pb-2 space-y-1.5">
      {node.choices.map((choice, i) => (
        <button
          key={`${node.id}-${i}`}
          onClick={() => onSelect(choice.next)}
          className="w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 hover:bg-accent-cyan/10 hover:border-accent-cyan/30 hover:text-accent-cyan transition-all animate-slide-up-fade"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
        >
          {locale === "ko" ? choice.labelKo : choice.labelEn}
        </button>
      ))}
    </div>
  );
}

// ─── Free Text Input ─────────────────────────────────────────────────

function TextInput({
  locale,
  onSubmit,
  visible,
}: {
  locale: string;
  onSubmit: (text: string) => void;
  visible: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={locale === "ko" ? "직접 입력..." : "Type a question..."}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent-cyan/40 transition-colors"
        />
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

// ─── Video Suggestion ─────────────────────────────────────────────────

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

function VideoSuggestion({ videoKey, locale }: { videoKey: string; locale: string }) {
  const video = TUTORIAL_VIDEOS[videoKey];
  const isMobile = useIsMobile();
  if (!video) return null;

  const href = isMobile && video.mobileUrl ? video.mobileUrl : video.url;

  return (
    <div className="px-4 pb-2 animate-slide-up-fade">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <span>{locale === "ko" ? video.labelKo : video.labelEn}</span>
      </a>
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────────────

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
  const [currentNodeId, setCurrentNodeId] = useState("root");
  const [typingDone, setTypingDone] = useState(false);
  const [key, setKey] = useState(0); // force re-render on node change
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ text: string; mood: Mood; videoKey?: string } | null>(null);

  const handleTypingComplete = useCallback(() => {
    setTypingDone(true);
  }, []);

  const node = getNode(currentNodeId);
  if (!node) return null;

  const rootNode = getNode("root");

  // Determine what to display: AI response overrides node text
  const displayMood = aiLoading ? "thinking" : aiResponse ? aiResponse.mood : node.mood;
  const displayText = aiLoading
    ? t.chat.aiThinking
    : aiResponse
      ? aiResponse.text
      : replaceApr(locale === "ko" ? node.textKo : node.textEn, apr);
  const isNavNode = currentNodeId in NAV_ROUTES;

  const navigateTo = (nodeId: string) => {
    setAiResponse(null);
    setAiLoading(false);
    setTypingDone(false);
    setKey((k) => k + 1);
    setCurrentNodeId(nodeId);
    trackActivity("chat-dialogue", { nodeId });
  };

  const handleChoiceSelect = (nextId: string) => {
    // Clear any AI response when selecting a choice
    setAiResponse(null);
    if (nextId in NAV_ROUTES) {
      navigateTo(nextId);
      setTimeout(() => {
        router.push(NAV_ROUTES[nextId]);
      }, 1500);
    } else {
      navigateTo(nextId);
    }
  };

  const handleFreeText = async (input: string) => {
    trackActivity("chat-freetext");
    const matched = matchKeyword(input);
    if (matched) {
      handleChoiceSelect(matched);
      return;
    }
    // AI call
    setAiLoading(true);
    setAiResponse(null);
    setTypingDone(false);
    setKey((k) => k + 1);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, locale }),
      });
      const data = await res.json();
      setAiLoading(false);
      setAiResponse({ text: data.reply, mood: data.mood as Mood, videoKey: data.videoKey });
      setKey((k) => k + 1);
    } catch {
      setAiLoading(false);
      navigateTo("fallback");
    }
  };

  // When showing AI response, use root node choices for navigation
  const showAiChoices = aiResponse && !aiLoading && rootNode?.choices;

  return (
    <div className="w-80 sm:w-96 rounded-2xl overflow-hidden border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/50 animate-slide-up-fade flex flex-col max-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Image src="/toki-icon.png" alt="Toki" width={24} height={24} className="rounded-full" />
          <span className="text-sm font-semibold text-gradient">Toki</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
            online
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Character */}
      <div className="bg-gradient-to-b from-black/40 to-transparent">
        <ChatCharacter mood={displayMood} />
      </div>

      {/* Dialogue */}
      <div className="border-t border-white/5 bg-black/30 flex-1 overflow-y-auto">
        <DialogueDisplay key={key} text={displayText} onComplete={handleTypingComplete} />

        {/* Video suggestion — show after AI typing completes */}
        {aiResponse?.videoKey && typingDone && (
          <VideoSuggestion videoKey={aiResponse.videoKey} locale={locale} />
        )}

        {/* Choices — show root choices when AI responded, or normal choices otherwise */}
        {!isNavNode && !aiLoading && !aiResponse && (
          <ChoiceButtons
            node={node}
            locale={locale}
            onSelect={handleChoiceSelect}
            visible={typingDone}
          />
        )}
        {showAiChoices && rootNode && (
          <ChoiceButtons
            node={rootNode}
            locale={locale}
            onSelect={handleChoiceSelect}
            visible={typingDone}
          />
        )}

        {/* Free text input — show when choices are visible */}
        {!isNavNode && !aiLoading && (
          <TextInput locale={locale} onSubmit={handleFreeText} visible={typingDone} />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function TokiChat() {
  const [open, setOpen] = useState(false);
  const { locale } = useTranslation();
  const { trackActivity } = useAchievement();

  const handleOpen = () => {
    if (!open) {
      trackActivity("chat-open");
    }
    setOpen(!open);
  };

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
