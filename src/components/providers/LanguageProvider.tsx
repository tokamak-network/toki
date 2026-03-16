"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { dictionaries, type Locale, type Dictionary } from "@/locales";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "ko",
  setLocale: () => {},
  t: dictionaries.ko,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR default: "ko", then sync from localStorage/browser on mount
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("toki-locale") as Locale | null;
      let detected: Locale;
      if (saved === "en" || saved === "ko") {
        detected = saved;
      } else {
        const browserLang = navigator.language || navigator.languages?.[0] || "en";
        detected = browserLang.startsWith("ko") ? "ko" : "en";
      }
      setLocaleState(detected);
      document.documentElement.lang = detected;
    } catch {
      // iOS may throw SecurityError on localStorage after background termination
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("toki-locale", newLocale);
    } catch {
      // iOS private browsing or quota exceeded
    }
    document.documentElement.lang = newLocale;
  };

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: dictionaries[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
