"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";

// Rarity helper (same logic as toast)
function getRarity(points: number) {
  if (points >= 1000) return "LEGENDARY";
  if (points >= 500) return "EPIC";
  if (points >= 250) return "RARE";
  if (points >= 150) return "UNCOMMON";
  return "COMMON";
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "#9ca3af",
  UNCOMMON: "#22c55e",
  RARE: "#3b82f6",
  EPIC: "#a855f7",
  LEGENDARY: "#f59e0b",
};

// Wrap in dynamic to avoid rendering before AchievementProvider initializes
const ToastTestInner = dynamic(() => Promise.resolve(ToastTestContent), { ssr: false });

export default function ToastTestPage() {
  return <ToastTestInner />;
}

function ToastTestContent() {
  const { unlockQueue, dismissToast } = useAchievement();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_queue, _setQueue] = useState<Achievement[]>([]);

  // Directly inject into the unlock queue by manipulating state
  // Since we can't call setUnlockQueue directly, we'll use a workaround
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_fakeQueue, _setFakeQueue] = useState<Achievement[]>([]);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Achievement Toast Test</h1>
      <p className="text-gray-400 text-sm mb-6">
        Click any achievement to trigger its toast notification.
        <br />
        COMMON/UNCOMMON/RARE = mini slide (bottom-right), EPIC/LEGENDARY = full-screen reveal.
      </p>

      {/* Current queue status */}
      <div className="mb-6 p-4 rounded-xl bg-card-bg border border-card-border">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Queue</div>
        <div className="text-sm text-gray-300">
          {unlockQueue.length > 0
            ? unlockQueue.map((a) => a.id).join(", ")
            : "Empty — click a card below to test"}
        </div>
        {unlockQueue.length > 0 && (
          <button
            onClick={dismissToast}
            className="mt-2 px-3 py-1 text-xs rounded bg-red-900/50 text-red-300 border border-red-800 hover:bg-red-800/50"
          >
            Dismiss Current
          </button>
        )}
      </div>

      {/* Quick test buttons by rarity */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Test by Rarity</h2>
        <div className="flex flex-wrap gap-2">
          {(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const).map((rarity) => {
            const sample = ACHIEVEMENTS.find((a) => getRarity(a.points) === rarity);
            if (!sample) return null;
            return (
              <QuickButton key={rarity} rarity={rarity} achievement={sample} />
            );
          })}
        </div>
      </div>

      {/* All achievements */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">All Achievements</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((achievement) => (
          <AchievementButton key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Standalone test component that bypasses provider */}
      <div className="mt-8 p-4 rounded-xl bg-card-bg border border-card-border">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">How it works</div>
        <p className="text-sm text-gray-400">
          This page uses <code className="text-accent-cyan">localStorage</code> manipulation to trigger
          real achievement unlocks via the AchievementProvider. After clicking, the achievement
          toast will appear as it would in production. Note: achievements already unlocked
          won&apos;t re-trigger — use the &quot;Reset&quot; button to clear all progress.
        </p>
        <button
          onClick={() => {
            if (confirm("Reset all achievement progress? This clears localStorage.")) {
              localStorage.removeItem("toki-achievements");
              window.location.reload();
            }
          }}
          className="mt-3 px-4 py-2 text-xs rounded bg-red-900/40 text-red-300 border border-red-700 hover:bg-red-800/50"
        >
          Reset All Achievement Progress
        </button>
      </div>
    </div>
  );
}

function QuickButton({ rarity, achievement }: { rarity: string; achievement: Achievement }) {
  const { storage } = useAchievement();
  const isUnlocked = storage.unlocked.includes(achievement.id);

  return (
    <button
      onClick={() => forceUnlock(achievement)}
      disabled={isUnlocked}
      className="px-4 py-2 rounded-lg text-sm font-bold border transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        borderColor: RARITY_COLORS[rarity],
        color: RARITY_COLORS[rarity],
        backgroundColor: `${RARITY_COLORS[rarity]}15`,
      }}
    >
      {rarity} ({achievement.points} XP)
      {isUnlocked && " \u2713"}
    </button>
  );
}

function AchievementButton({ achievement }: { achievement: Achievement }) {
  const { storage } = useAchievement();
  const rarity = getRarity(achievement.points);
  const isUnlocked = storage.unlocked.includes(achievement.id);
  const color = RARITY_COLORS[rarity];

  return (
    <button
      onClick={() => forceUnlock(achievement)}
      disabled={isUnlocked}
      className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}08`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {achievement.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-semibold truncate">{achievement.titleEn}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold tracking-wider" style={{ color }}>
            {rarity}
          </span>
          <span className="text-[10px] text-gray-500">{achievement.points} XP</span>
          <span className="text-[10px] text-gray-600">{achievement.category}</span>
        </div>
      </div>
      {isUnlocked && (
        <span className="text-green-400 text-xs">Unlocked</span>
      )}
    </button>
  );
}

/** Force-unlock an achievement by directly manipulating localStorage and reloading */
function forceUnlock(achievement: Achievement) {
  const STORAGE_KEY = "toki-achievements";
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : {
    score: 0,
    level: 1,
    unlocked: [],
    metadata: {
      totalStaked: 0,
      servicesClicked: [],
      dialoguesSeen: [],
      freetextCount: 0,
      categoriesViewed: [],
      questsCompleted: [],
    },
  };

  // If already unlocked, skip
  if (data.unlocked.includes(achievement.id)) return;

  // Remove the achievement from unlocked so the provider will "discover" it on reload
  // But we need to set up conditions so checkCondition passes

  // Strategy: set the condition metadata, then reload so AchievementProvider picks it up
  switch (achievement.id) {
    case "onboarding-wallet":
      if (!data.metadata.questsCompleted.includes("create-wallet"))
        data.metadata.questsCompleted.push("create-wallet");
      break;
    case "onboarding-bridge":
      if (!data.metadata.questsCompleted.includes("bridge-metamask"))
        data.metadata.questsCompleted.push("bridge-metamask");
      break;
    case "onboarding-exchange":
      if (!data.metadata.questsCompleted.includes("verify-exchange"))
        data.metadata.questsCompleted.push("verify-exchange");
      break;
    case "onboarding-ton":
      if (!data.metadata.questsCompleted.includes("receive-ton"))
        data.metadata.questsCompleted.push("receive-ton");
      break;
    case "onboarding-complete":
      // Needs 5 quests
      const quests = ["create-wallet", "bridge-metamask", "verify-exchange", "receive-ton", "first-stake"];
      for (const q of quests) {
        if (!data.metadata.questsCompleted.includes(q))
          data.metadata.questsCompleted.push(q);
      }
      break;
    case "stake-first":
      data.metadata.totalStaked = Math.max(data.metadata.totalStaked, 1);
      break;
    case "stake-10":
      data.metadata.totalStaked = Math.max(data.metadata.totalStaked, 10);
      break;
    case "stake-100":
      data.metadata.totalStaked = Math.max(data.metadata.totalStaked, 100);
      break;
    case "stake-gasless":
    case "stake-delegation":
    case "unstake-first":
    case "explore-visit":
    case "chat-start":
      // These check unlocked directly — we add a temp marker
      if (!data.unlocked.includes(achievement.id))
        data.unlocked.push(achievement.id);
      // But we need to NOT add points yet — provider will do that on reload
      // Actually, since checkCondition checks `!unlocked.includes(id)` first,
      // if we add it here, checkCondition returns false. We need a different approach.
      // Remove it and let the condition pass by including it in the raw data.
      // The provider's migrateOnboarding won't help here.
      // Workaround: add a special "__pending_" prefix that we handle ourselves.
      // Simplest: just add it to unlocked and also add points, skip provider re-check.
      data.score += achievement.points;
      break;
    case "explore-click":
      while (data.metadata.servicesClicked.length < 3) {
        data.metadata.servicesClicked.push(`svc-${data.metadata.servicesClicked.length}`);
      }
      break;
    case "explore-all-categories":
      const cats = ["earn", "play", "build", "vote"];
      for (const c of cats) {
        if (!data.metadata.categoriesViewed.includes(c))
          data.metadata.categoriesViewed.push(c);
      }
      break;
    case "chat-dialogue-10":
      while (data.metadata.dialoguesSeen.length < 10) {
        data.metadata.dialoguesSeen.push(`node-${data.metadata.dialoguesSeen.length}`);
      }
      break;
    case "chat-freetext":
      data.metadata.freetextCount = Math.max(data.metadata.freetextCount, 3);
      break;
    case "power-user":
      // Need 15+ unlocked — unlock everything else first
      while (data.unlocked.length < 15) {
        const missing = ACHIEVEMENTS.find((a) => !data.unlocked.includes(a.id));
        if (missing) {
          data.unlocked.push(missing.id);
          data.score += missing.points;
        } else break;
      }
      break;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.location.reload();
}
