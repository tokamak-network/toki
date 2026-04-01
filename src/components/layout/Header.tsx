"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { isTestnet } from "@/lib/chain";

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
          <Image
            src="/toki-icon.png"
            alt="Toki"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full bg-white/10 p-0.5"
          />
          <Image
            src="/toki-title-logo.png"
            alt="Toki — Stake Easy"
            width={120}
            height={48}
            className="w-[60px] h-auto"
            priority
          />
          {isTestnet && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 leading-none">
              TESTNET
            </span>
          )}
        </a>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-8 text-sm text-gray-400">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            {t.header.howItWorks}
          </a>
          <a href="/explore" className="hover:text-foreground transition-colors">
            {t.header.explore}
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
          {/* Temp reset button for testing */}
          <button
            onClick={() => {
              if (confirm("Clear all local data and reload?")) {
                // Preserve Privy keys to avoid SDK crash, clear only app data
                const keys = Object.keys(localStorage);
                keys.forEach((key) => {
                  if (!key.startsWith("privy")) {
                    localStorage.removeItem(key);
                  }
                });
                window.location.reload();
              }
            }}
            className="px-2 py-1 rounded text-[10px] text-red-400 border border-red-400/30 bg-red-400/5 hover:bg-red-400/10 transition-colors"
          >
            RESET
          </button>
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
            <a href="/explore" onClick={() => setMobileOpen(false)} className="block py-2 text-gray-400 hover:text-foreground">
              {t.header.explore}
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
