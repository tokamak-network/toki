"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  locale?: string;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  /** Call to start; recognition auto-stops when silence is detected */
  startListening: () => void;
  /** Call to force-stop early (optional — recognition stops on its own) */
  stopListening: () => void;
  /** The final, confirmed transcript from the last session */
  finalTranscript: string;
}

/**
 * Web Speech API wrapper for speech-to-text.
 *
 * Design: tap-to-start, auto-stop on silence.
 * `continuous: false` means the browser ends recognition after a pause.
 * The final transcript is delivered via `finalTranscript` state.
 * The caller should watch `finalTranscript` changes to act on results.
 */
export function useSpeechRecognition({
  locale = "ko-KR",
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Abort previous session if any
    recognitionRef.current?.abort();

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    const lang = locale === "ko" ? "ko-KR" : locale === "en" ? "en-US" : locale;
    recognition.lang = lang;
    recognition.continuous = false;      // auto-stop after silence
    recognition.interimResults = true;   // show partial results
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // Show interim text as user speaks
      setTranscript(final || interim);

      // When we have a final result, commit it
      if (final) {
        setFinalTranscript(final);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: Event) => {
      // "no-speech" is normal — user just didn't say anything
      const errEvent = event as Event & { error?: string };
      if (errEvent.error !== "no-speech") {
        console.warn("[SpeechRecognition] error:", errEvent.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setIsListening(true);

    try {
      recognition.start();
    } catch (e) {
      // "already started" guard
      console.warn("[SpeechRecognition] start failed:", e);
      setIsListening(false);
    }
  }, [isSupported, locale]);

  const stopListening = useCallback(() => {
    // Use stop() (not abort()) so the browser delivers any pending results
    recognitionRef.current?.stop();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    transcript,
    finalTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
