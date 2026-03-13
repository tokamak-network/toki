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
  locale: "en",
  setLocale: () => {},
  t: dictionaries.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("toki-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "ko")) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    } else {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      const detected: Locale = browserLang.startsWith("ko") ? "ko" : "en";
      setLocaleState(detected);
      document.documentElement.lang = detected;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("toki-locale", newLocale);
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
