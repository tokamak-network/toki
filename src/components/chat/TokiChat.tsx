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
};

// Navigation node IDs → routes
const NAV_ROUTES: Record<string, string> = {
  "go-dashboard": "/dashboard",
  "go-onboarding": "/onboarding",
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
  const { apr } = useStakingData();
  const [currentNodeId, setCurrentNodeId] = useState("root");
  const [typingDone, setTypingDone] = useState(false);
  const [key, setKey] = useState(0); // force re-render on node change

  const handleTypingComplete = useCallback(() => {
    setTypingDone(true);
  }, []);

  const node = getNode(currentNodeId);
  if (!node) return null;

  const text = replaceApr(locale === "ko" ? node.textKo : node.textEn, apr);
  const isNavNode = currentNodeId in NAV_ROUTES;

  const navigateTo = (nodeId: string) => {
    setTypingDone(false);
    setKey((k) => k + 1);
    setCurrentNodeId(nodeId);
    trackActivity("chat-dialogue", { nodeId });
  };

  const handleChoiceSelect = (nextId: string) => {
    // Check if it's a navigation node
    if (nextId in NAV_ROUTES) {
      navigateTo(nextId);
      setTimeout(() => {
        router.push(NAV_ROUTES[nextId]);
      }, 1500);
    } else {
      navigateTo(nextId);
    }
  };

  const handleFreeText = (input: string) => {
    trackActivity("chat-freetext");
    const matched = matchKeyword(input);
    if (matched) {
      handleChoiceSelect(matched);
    } else {
      navigateTo("fallback");
    }
  };

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
        <ChatCharacter mood={node.mood} />
      </div>

      {/* Dialogue */}
      <div className="border-t border-white/5 bg-black/30 flex-1 overflow-y-auto">
        <DialogueDisplay key={key} text={text} onComplete={handleTypingComplete} />

        {/* Choices */}
        {!isNavNode && (
          <ChoiceButtons
            node={node}
            locale={locale}
            onSelect={handleChoiceSelect}
            visible={typingDone}
          />
        )}

        {/* Free text input — show when choices are visible */}
        {!isNavNode && (
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
