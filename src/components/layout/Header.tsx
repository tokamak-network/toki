"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/components/providers/LanguageProvider";

const ConnectButton = dynamic(() => import("./ConnectButton"), {
  ssr: false,
  loading: () => (
    <button
      disabled
      className="px-5 py-2 rounded-lg bg-white/10 text-gray-500 text-sm font-medium"
    >
      Connect
    </button>
  ),
});

function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center rounded-lg bg-white/5 border border-white/10 text-xs font-medium overflow-hidden">
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1.5 transition-colors ${
          locale === "en"
            ? "bg-accent-blue/20 text-accent-sky"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        EN
      </button>
      <div className="w-px h-4 bg-white/10" />
      <button
        onClick={() => setLocale("ko")}
        className={`px-2.5 py-1.5 transition-colors ${
          locale === "ko"
            ? "bg-accent-blue/20 text-accent-sky"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        KO
      </button>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-navy flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <span className="text-lg font-bold">
            <span className="text-gradient">Toki</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-8 text-sm text-gray-400">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            {t.header.howItWorks}
          </a>
          <a href="#why-toki" className="hover:text-foreground transition-colors">
            {t.header.whyToki}
          </a>
          <a href="#stats" className="hover:text-foreground transition-colors">
            {t.header.stats}
          </a>
          <a
            href="https://github.com/tokamak-network/toki"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {t.header.github}
          </a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <ConnectButton />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-gray-400 hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="sm:hidden border-t border-white/5 bg-background/95 backdrop-blur-md animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-400 hover:text-foreground">
              {t.header.howItWorks}
            </a>
            <a href="#why-toki" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-400 hover:text-foreground">
              {t.header.whyToki}
            </a>
            <a href="#stats" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-400 hover:text-foreground">
              {t.header.stats}
            </a>
            <a
              href="https://github.com/tokamak-network/toki"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-gray-400 hover:text-foreground"
            >
              {t.header.github}
            </a>
            <div className="pt-2 border-t border-white/5">
              <LanguageToggle />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
