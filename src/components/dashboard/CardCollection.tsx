"use client";

import { useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import {
  ACHIEVEMENTS,
  getNextLevelProgress,
  type AchievementCategory,
} from "@/lib/achievements";
import type { Dictionary } from "@/locales";
import AchievementCard from "./AchievementCard";
import CardDetailModal from "./CardDetailModal";
import type { Achievement } from "@/lib/achievements";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

type TabKey = "all" | AchievementCategory;

const TABS: { key: TabKey; labelKey: keyof Dictionary["achievements"] }[] = [
  { key: "all", labelKey: "catAll" },
  { key: "onboarding", labelKey: "catOnboarding" },
  { key: "staking", labelKey: "catStaking" },
  { key: "explore", labelKey: "catExplore" },
  { key: "social", labelKey: "catSocial" },
  { key: "special", labelKey: "catSpecial" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardCollection() {
  const { storage } = useAchievement();
  const { t, locale } = useTranslation();
  const at = t.achievements;
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedCard, setSelectedCard] = useState<Achievement | null>(null);

  const { percent, next } = getNextLevelProgress(storage.score);
  const levelName = getLevelName(storage.level, at);

  const filtered =
    activeTab === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === activeTab);

  const unlockedCount = storage.unlocked.length;
  const totalCount = ACHIEVEMENTS.length;

  // Sort: unlocked first, then by points desc
  const sorted = [...filtered].sort((a, b) => {
    const aUnlocked = storage.unlocked.includes(a.id) ? 1 : 0;
    const bUnlocked = storage.unlocked.includes(b.id) ? 1 : 0;
    if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;
    return b.points - a.points;
  });

  return (
    <>
      <div className="mb-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">My Collection</h2>
            <p className="text-sm text-gray-500">
              {unlockedCount}/{totalCount} cards collected
            </p>
          </div>
          {/* Level badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">{at.level} {storage.level}</div>
              <div className="text-sm font-bold text-accent-cyan">{levelName}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
              <span className="text-accent-cyan font-black text-lg">{storage.level}</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{at.xp} Progress</span>
            <span className="text-sm font-mono-num font-bold text-accent-amber">
              {storage.score} {at.xp}
            </span>
          </div>
          {storage.level < 5 ? (
            <>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-600 mt-1 text-right">
                {at.nextLevel}: {next} {at.xp}
              </div>
            </>
          ) : (
            <div className="text-xs text-accent-cyan text-center">{at.allUnlocked}</div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
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

        {/* Card Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {sorted.map((achievement) => {
            // TODO: remove temp preview unlock
            const unlocked = achievement.id === "onboarding-wallet" || storage.unlocked.includes(achievement.id);
            const title = locale === "ko" ? achievement.titleKo : achievement.titleEn;

            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={unlocked}
                title={title}
                onClick={() => setSelectedCard(achievement)}
              />
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          achievement={selectedCard}
          unlocked={selectedCard.id === "onboarding-wallet" || storage.unlocked.includes(selectedCard.id)}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
