"use client";

import { useState } from "react";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";
import {
  ACHIEVEMENTS,
  type AchievementCategory,
  getNextLevelProgress,
} from "@/lib/achievements";
import type { Dictionary } from "@/locales";

// ─── Level Name Helper ────────────────────────────────────────────────────────

function getLevelName(level: number, t: Dictionary["achievements"]): string {
  const names: Record<number, string> = {
    1: t.level1,
    2: t.level2,
    3: t.level3,
    4: t.level4,
    5: t.level5,
  };
  return names[level] || t.level1;
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

type TabKey = "all" | AchievementCategory;

const TABS: {
  key: TabKey;
  labelKey: keyof Dictionary["achievements"];
  icon: string;
}[] = [
  { key: "all", labelKey: "catAll", icon: "" },
  { key: "onboarding", labelKey: "catOnboarding", icon: "" },
  { key: "staking", labelKey: "catStaking", icon: "" },
  { key: "explore", labelKey: "catExplore", icon: "" },
  { key: "social", labelKey: "catSocial", icon: "" },
  { key: "special", labelKey: "catSpecial", icon: "" },
];

// ─── Category Icon ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  onboarding: "\uD83C\uDF93",
  staking: "\uD83D\uDCB0",
  explore: "\uD83D\uDDFA",
  social: "\uD83D\uDCAC",
  special: "\u2B50",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AchievementPanel() {
  const { storage } = useAchievement();
  const { t, locale } = useTranslation();
  const at = t.achievements;
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const { percent, next } = getNextLevelProgress(storage.score);
  const levelName = getLevelName(storage.level, at);

  const filtered =
    activeTab === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === activeTab);

  const unlockedCount = storage.unlocked.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="card p-6 mb-6">
      {/* Header: Title + Score */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{at.panelTitle}</h2>
        <div className="text-sm text-gray-400">
          {unlockedCount}/{totalCount}
        </div>
      </div>

      {/* Level + Progress Bar */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent-blue/10 to-accent-cyan/10 border border-accent-cyan/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-accent-cyan font-bold text-lg">
              {at.level} {storage.level}
            </span>
            <span className="text-sm text-gray-400">{levelName}</span>
          </div>
          <div className="text-accent-amber font-mono-num text-sm font-semibold">
            {storage.score} {at.xp}
          </div>
        </div>

        {/* Progress bar */}
        {storage.level < 5 ? (
          <div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {at.nextLevel}: {next} {at.xp}
            </div>
          </div>
        ) : (
          <div className="text-xs text-accent-cyan text-center">
            {at.allUnlocked}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                : "bg-white/5 text-gray-500 border border-transparent hover:bg-white/10"
            }`}
          >
            {at[tab.labelKey]}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filtered.map((achievement) => {
          const unlocked = storage.unlocked.includes(achievement.id);
          const title =
            locale === "ko" ? achievement.titleKo : achievement.titleEn;
          const desc =
            locale === "ko" ? achievement.descKo : achievement.descEn;
          const catIcon = CATEGORY_ICONS[achievement.category];

          return (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-xl text-center transition-all ${
                unlocked
                  ? "bg-gradient-to-br from-accent-blue/15 to-accent-cyan/15 border border-accent-cyan/30"
                  : "bg-white/5 border border-white/10 opacity-50"
              }`}
              title={desc}
            >
              {/* Badge icon */}
              <div
                className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center text-sm font-bold ${
                  unlocked
                    ? "bg-gradient-to-br from-accent-blue to-accent-cyan text-white shadow-lg shadow-accent-cyan/20"
                    : "bg-white/10 text-gray-600"
                }`}
              >
                {unlocked ? achievement.icon : "\uD83D\uDD12"}
              </div>

              {/* Title */}
              <div
                className={`text-xs font-medium truncate ${
                  unlocked ? "text-gray-200" : "text-gray-600"
                }`}
              >
                {title}
              </div>

              {/* Points */}
              <div
                className={`text-[10px] mt-0.5 font-mono-num ${
                  unlocked ? "text-accent-amber" : "text-gray-700"
                }`}
              >
                {achievement.points} {at.xp}
              </div>

              {/* Category icon */}
              <div className="absolute top-1 right-1.5 text-[10px] opacity-50">
                {catIcon}
              </div>

              {/* Unlock check */}
              {unlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  &#x2713;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
