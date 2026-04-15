"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechSynthesisOptions {
  locale?: string;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
}

const TTS_STORAGE_KEY = "toki-tts-enabled";

/**
 * Web Speech Synthesis wrapper for text-to-speech.
 * Auto-selects voice by locale (ko-KR / en-US).
 * TTS on/off toggle stored in localStorage.
 */
export function useSpeechSynthesis({
  locale = "ko-KR",
}: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabledState] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Load TTS preference from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(TTS_STORAGE_KEY);
    if (stored !== null) {
      setTtsEnabledState(stored === "true");
    } else {
      // Default: off on mobile, off on desktop (user opts in)
      setTtsEnabledState(false);
    }
  }, []);

  const setTtsEnabled = useCallback((enabled: boolean) => {
    setTtsEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(TTS_STORAGE_KEY, String(enabled));
    }
    if (!enabled && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !ttsEnabled || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const lang = locale === "ko" ? "ko-KR" : locale === "en" ? "en-US" : locale;
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, ttsEnabled, locale],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    ttsEnabled,
    setTtsEnabled,
  };
}
