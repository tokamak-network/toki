"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import EventCharacter from "./EventCharacter";
import QRDisplay from "./QRDisplay";
import MicButton from "@/components/chat/MicButton";
import { EVENT_CONFIG, type EventState } from "@/constants/event";
import type { Mood } from "@/lib/toki-dialogue";

// ─── State Machine ───────────────────────────────────────────────────

const STATE_MOODS: Record<EventState, Mood> = {
  idle: "welcome",
  listening: "thinking",
  processing: "thinking",
  wallet_create: "excited",
  ton_drop: "excited",
  community_signup: "cheer",
  complete: "peace",
};

export default function EventFlow() {
  const { t, locale } = useTranslation();
  const { login, authenticated, user } = usePrivy();
  const [state, setState] = useState<EventState>("idle");
  const [tonAmount, setTonAmount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { speak, isSpeaking, ttsEnabled, setTtsEnabled } = useSpeechSynthesis({ locale });

  const { transcript, finalTranscript, isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition({ locale });

  // Watch finalTranscript — any voice input triggers wallet creation in event mode
  const lastProcessedRef = useRef<string>("");
  useEffect(() => {
    if (finalTranscript && finalTranscript !== lastProcessedRef.current && state === "listening") {
      lastProcessedRef.current = finalTranscript;
      setState("wallet_create");
      login();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript]);

  // Watch for authentication completion
  useEffect(() => {
    if (authenticated && state === "wallet_create") {
      handleTonDrop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, state]);

  // Auto-reset timer
  useEffect(() => {
    if (state === "complete") {
      timerRef.current = setTimeout(() => {
        reset();
      }, EVENT_CONFIG.autoResetTimer * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  // TTS for state transitions
  useEffect(() => {
    if (!ttsEnabled) return;
    const messages: Partial<Record<EventState, string>> = {
      idle: locale === "ko" ? t.event.idleMessage : t.event.idleMessage,
      wallet_create: locale === "ko" ? t.event.walletCreating : t.event.walletCreating,
      complete: locale === "ko" ? t.event.complete : t.event.complete,
    };
    const msg = messages[state];
    if (msg) speak(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleTonDrop = async () => {
    setState("ton_drop");
    try {
      const walletAddress = user?.wallet?.address;
      if (!walletAddress) {
        setError(locale === "ko" ? "지갑 주소를 찾을 수 없어..." : "Couldn't find wallet address...");
        setState("idle");
        return;
      }
      const res = await fetch("/api/event/ton-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "TON drop failed");
        setState("idle");
        return;
      }
      const data = await res.json();
      setTonAmount(data.amount);
      setState("community_signup");
    } catch {
      setError(locale === "ko" ? "네트워크 오류가 발생했어..." : "Network error occurred...");
      setState("idle");
    }
  };

  const reset = () => {
    setState("idle");
    setTonAmount(null);
    setError(null);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else if (state === "idle" || state === "listening") {
      setState("listening");
      startListening();
    }
  };

  const handleSkipToCommunity = () => {
    setState("complete");
  };

  const mood = STATE_MOODS[state];
  const walletAddress = user?.wallet?.address;
  const dashboardUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard`
    : "/dashboard";

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-background overflow-hidden px-6 py-8">
      {/* TTS toggle */}
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="Toggle TTS"
      >
        {ttsEnabled ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-accent-cyan">
            <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-500">
            <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>

      {/* Character */}
      <EventCharacter mood={mood} isSpeaking={isSpeaking} />

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-md">
        {/* Error display */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-slide-up-fade">
            {error}
            <button onClick={reset} className="ml-2 underline">
              {locale === "ko" ? "다시 시도" : "Try again"}
            </button>
          </div>
        )}

        {/* Idle state */}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-4 animate-slide-up-fade">
            <h2 className="text-2xl font-bold text-gradient text-center">
              {t.event.idleTitle}
            </h2>
            <p className="text-gray-400 text-center">
              {t.event.idleMessage}
            </p>
            {isSupported && (
              <div className="mt-4">
                <MicButton
                  isListening={isListening}
                  onClick={handleMicToggle}
                  className="!w-20 !h-20 !rounded-full"
                />
              </div>
            )}
            {/* Fallback: tap button if voice not supported */}
            <button
              onClick={() => {
                setState("wallet_create");
                login();
              }}
              className="px-6 py-3 rounded-xl bg-accent-cyan/20 text-accent-cyan font-medium hover:bg-accent-cyan/30 transition-colors"
            >
              {t.event.tapToStart}
            </button>
          </div>
        )}

        {/* Listening state */}
        {state === "listening" && (
          <div className="flex flex-col items-center gap-4 animate-slide-up-fade">
            <p className="text-lg text-accent-cyan">
              {transcript || t.event.listening}
            </p>
            <MicButton
              isListening={isListening}
              onClick={handleMicToggle}
              className="!w-20 !h-20 !rounded-full"
            />
          </div>
        )}

        {/* Processing / Wallet Create */}
        {(state === "processing" || state === "wallet_create") && (
          <div className="flex flex-col items-center gap-4 animate-slide-up-fade">
            <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
            <p className="text-gray-300">{t.event.walletCreating}</p>
          </div>
        )}

        {/* TON Drop */}
        {state === "ton_drop" && (
          <div className="flex flex-col items-center gap-4 animate-slide-up-fade">
            <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
            <p className="text-gray-300">{t.event.tonDropping}</p>
          </div>
        )}

        {/* Community Signup */}
        {state === "community_signup" && (
          <div className="flex flex-col items-center gap-6 animate-slide-up-fade">
            <h3 className="text-xl font-bold text-accent-cyan">
              {tonAmount
                ? (locale === "ko" ? `${tonAmount} TON 받았어!` : `You got ${tonAmount} TON!`)
                : t.event.tonDropSuccess}
            </h3>
            <p className="text-gray-400 text-center">{t.event.communityInvite}</p>
            <div className="flex gap-4">
              <a
                href={EVENT_CONFIG.communityLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-indigo-500/20 text-indigo-400 font-medium hover:bg-indigo-500/30 transition-colors"
              >
                Discord
              </a>
              <a
                href={EVENT_CONFIG.communityLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-blue-500/20 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
              >
                Telegram
              </a>
            </div>
            <button
              onClick={handleSkipToCommunity}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t.event.skipToComplete}
            </button>
          </div>
        )}

        {/* Complete */}
        {state === "complete" && (
          <div className="flex flex-col items-center gap-6 animate-slide-up-fade">
            <h3 className="text-xl font-bold text-gradient">
              {t.event.completeTitle}
            </h3>
            {walletAddress && (
              <QRDisplay
                url={dashboardUrl}
                label={t.event.qrLabel}
              />
            )}
            <p className="text-sm text-gray-500">
              {t.event.autoReset}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
