"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import {
  ACHIEVEMENTS,
  calculateLevel,
  getNextLevelProgress,
  getCardTier,
} from "@/lib/achievements";

export default function ConnectButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useTranslation();
  const { storage } = useAchievement();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!ready) {
    return (
      <button
        disabled
        className="px-5 py-2 rounded-lg bg-white/10 text-gray-500 text-sm font-medium"
      >
        {t.header.loading}
      </button>
    );
  }

  if (authenticated && user) {
    const embeddedWallet = wallets.find(
      (w) => w.walletClientType === "privy"
    );
    const externalWallet = wallets.find(
      (w) => w.walletClientType !== "privy"
    );
    const displayWallet = externalWallet || embeddedWallet;
    const addr = displayWallet?.address;
    const shortAddr = addr
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : null;

    const googleAccount = user.linkedAccounts?.find(
      (a) => a.type === "google_oauth"
    );
    const emailAccount = user.linkedAccounts?.find(
      (a) => a.type === "email"
    );
    const displayName =
      (googleAccount as { name?: string })?.name ||
      (emailAccount as { address?: string })?.address ||
      shortAddr ||
      "Connected";

    const level = calculateLevel(storage.score);
    const progress = getNextLevelProgress(storage.score);
    const cardTier = getCardTier(level);
    const totalAchievements = ACHIEVEMENTS.length;
    const unlockedCount = storage.unlocked.length;
    const hasCard = storage.score > 0;
    const starsStr = "\u2605".repeat(cardTier.stars) + "\u2606".repeat(5 - cardTier.stars);

    return (
      <div className="relative" ref={panelRef}>
        {/* Account button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-300 max-w-[120px] truncate">
              {displayName}
            </span>
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Mobile: just the green dot button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-[280px] z-50 animate-slide-up">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
              {hasCard ? (
                <>
                  {/* Card + Info header */}
                  <div className="p-4 flex gap-3">
                    {/* Mini member card */}
                    <div className="relative w-[80px] h-[50px] rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <Image
                        src={cardTier.bgImage}
                        alt={cardTier.tier}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={cardTier.charImage}
                          alt={cardTier.name}
                          width={40}
                          height={40}
                          className="object-contain drop-shadow-lg"
                        />
                      </div>
                      <div className="absolute bottom-0.5 left-0 right-0 text-center">
                        <span className="text-[6px] font-bold tracking-wider text-white/80 drop-shadow">
                          {cardTier.tier}
                        </span>
                      </div>
                    </div>

                    {/* User info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">
                        {displayName}
                      </div>
                      {shortAddr && (
                        <div className="text-xs text-gray-500 font-mono">
                          {shortAddr}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {t.header.level} {level} · {cardTier.name}
                      </div>
                      <div className="text-xs text-accent-cyan font-medium">
                        {storage.score} XP
                      </div>
                    </div>
                  </div>

                  {/* XP Progress bar */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-500"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {t.header.nextLevel}: {progress.next} XP
                    </div>
                  </div>

                  <div className="border-t border-white/5 mx-4" />

                  {/* Achievements + Tier */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{t.header.achievements}</span>
                      <span className="text-xs text-white font-medium">
                        {unlockedCount}/{totalAchievements}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className="text-sm"
                        style={{
                          letterSpacing: "0.15em",
                          background: "linear-gradient(180deg, #fcd34d 0%, #b45309 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {starsStr}
                      </span>
                      <span className="text-xs text-gray-400 font-medium tracking-wide">
                        {cardTier.tier}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* No card header */}
                  <div className="p-4">
                    <div className="text-sm font-medium text-white truncate">
                      {displayName}
                    </div>
                    {shortAddr && (
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {shortAddr}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 mx-4" />

                  {/* CTA to start */}
                  <div className="p-4">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="text-sm font-medium text-white mb-1">
                        {t.header.noCardYet}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {t.header.noCardDesc}
                      </div>
                      <Link
                        href="/onboarding"
                        onClick={() => setOpen(false)}
                        className="block w-full py-2 rounded-lg bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-xs font-semibold text-center hover:scale-[1.02] transition-transform"
                      >
                        {t.header.startQuest} →
                      </Link>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-white/5 mx-4" />

              {/* Navigation links */}
              <div className="px-4 py-3 flex gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-medium text-center hover:bg-white/10 transition-colors"
                >
                  Dashboard
                </Link>
                {hasCard && (
                  <Link
                    href="/collection"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-medium text-center hover:bg-white/10 transition-colors"
                  >
                    {t.header.myCollection}
                  </Link>
                )}
              </div>

              <div className="border-t border-white/5 mx-4" />

              {/* Logout */}
              <div className="px-4 py-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-medium hover:bg-white/10 hover:text-gray-300 transition-colors"
                >
                  {t.header.logout}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-blue/80 to-accent-navy/80 text-white text-sm font-medium hover:from-accent-blue hover:to-accent-navy transition-all"
    >
      {t.header.connect}
    </button>
  );
}
