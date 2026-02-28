"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementStorage,
  calculateLevel,
  checkCondition,
  EMPTY_STORAGE,
} from "@/lib/achievements";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType =
  | "quest-complete"
  | "stake"
  | "unstake"
  | "explore-visit"
  | "service-click"
  | "category-view"
  | "chat-open"
  | "chat-dialogue"
  | "chat-freetext";

interface AchievementContextValue {
  storage: AchievementStorage;
  trackActivity: (type: ActivityType, meta?: Record<string, unknown>) => void;
  unlockQueue: Achievement[];
  dismissToast: () => void;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

const STORAGE_KEY = "toki-achievements";
const ONBOARDING_KEY = "toki-onboarding";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadStorage(): AchievementStorage {
  if (typeof window === "undefined") return EMPTY_STORAGE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        score: parsed.score ?? 0,
        level: parsed.level ?? 1,
        unlocked: parsed.unlocked ?? [],
        metadata: {
          totalStaked: parsed.metadata?.totalStaked ?? 0,
          servicesClicked: parsed.metadata?.servicesClicked ?? [],
          dialoguesSeen: parsed.metadata?.dialoguesSeen ?? [],
          freetextCount: parsed.metadata?.freetextCount ?? 0,
          categoriesViewed: parsed.metadata?.categoriesViewed ?? [],
          questsCompleted: parsed.metadata?.questsCompleted ?? [],
        },
      };
    }
  } catch {
    // ignore
  }
  return EMPTY_STORAGE;
}

function saveStorage(storage: AchievementStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function migrateOnboarding(storage: AchievementStorage): AchievementStorage {
  if (typeof window === "undefined") return storage;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return storage;
    const data = JSON.parse(raw);
    const completed: string[] = data.completed || [];
    if (completed.length === 0) return storage;

    // Check if already migrated
    const alreadyMigrated = completed.every((id) =>
      storage.metadata.questsCompleted.includes(id),
    );
    if (alreadyMigrated) return storage;

    // Merge quest completions
    const merged = new Set([...storage.metadata.questsCompleted, ...completed]);
    return {
      ...storage,
      metadata: {
        ...storage.metadata,
        questsCompleted: Array.from(merged),
      },
    };
  } catch {
    return storage;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState<AchievementStorage>(EMPTY_STORAGE);
  const [unlockQueue, setUnlockQueue] = useState<Achievement[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load + migrate on mount
  useEffect(() => {
    let loaded = loadStorage();
    loaded = migrateOnboarding(loaded);

    // Check achievements from migrated data
    const newUnlocks: Achievement[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (checkCondition(achievement, loaded)) {
        loaded.unlocked.push(achievement.id);
        loaded.score += achievement.points;
        newUnlocks.push(achievement);
      }
    }
    loaded.level = calculateLevel(loaded.score);
    saveStorage(loaded);
    setStorage(loaded);
    if (newUnlocks.length > 0) {
      setUnlockQueue(newUnlocks);
    }
    setInitialized(true);
  }, []);

  const trackActivity = useCallback(
    (type: ActivityType, meta?: Record<string, unknown>) => {
      setStorage((prev) => {
        const next = structuredClone(prev);

        // Update metadata based on activity type
        switch (type) {
          case "quest-complete": {
            const questId = meta?.questId as string;
            if (questId && !next.metadata.questsCompleted.includes(questId)) {
              next.metadata.questsCompleted.push(questId);
            }
            break;
          }
          case "stake": {
            const amount = Number(meta?.amount) || 0;
            next.metadata.totalStaked += amount;
            const paymasterMode = meta?.paymasterMode as string;
            const stakingMode = meta?.stakingMode as string;
            if (
              paymasterMode === "sponsor" &&
              !next.unlocked.includes("stake-gasless")
            ) {
              // Mark gasless used — condition check below will handle unlock
              next.unlocked.push("stake-gasless");
            }
            if (
              stakingMode === "delegation" &&
              !next.unlocked.includes("stake-delegation")
            ) {
              next.unlocked.push("stake-delegation");
            }
            break;
          }
          case "unstake": {
            if (!next.unlocked.includes("unstake-first")) {
              next.unlocked.push("unstake-first");
            }
            break;
          }
          case "explore-visit": {
            if (!next.unlocked.includes("explore-visit")) {
              next.unlocked.push("explore-visit");
            }
            break;
          }
          case "service-click": {
            const serviceId = meta?.serviceId as string;
            if (
              serviceId &&
              !next.metadata.servicesClicked.includes(serviceId)
            ) {
              next.metadata.servicesClicked.push(serviceId);
            }
            break;
          }
          case "category-view": {
            const categoryId = meta?.categoryId as string;
            if (
              categoryId &&
              !next.metadata.categoriesViewed.includes(categoryId)
            ) {
              next.metadata.categoriesViewed.push(categoryId);
            }
            break;
          }
          case "chat-open": {
            if (!next.unlocked.includes("chat-start")) {
              next.unlocked.push("chat-start");
            }
            break;
          }
          case "chat-dialogue": {
            const nodeId = meta?.nodeId as string;
            if (nodeId && !next.metadata.dialoguesSeen.includes(nodeId)) {
              next.metadata.dialoguesSeen.push(nodeId);
            }
            break;
          }
          case "chat-freetext": {
            next.metadata.freetextCount += 1;
            break;
          }
        }

        // Check all achievements for new unlocks
        const newUnlocks: Achievement[] = [];
        for (const achievement of ACHIEVEMENTS) {
          if (checkCondition(achievement, next)) {
            next.unlocked.push(achievement.id);
            next.score += achievement.points;
            newUnlocks.push(achievement);
          }
        }

        next.level = calculateLevel(next.score);
        saveStorage(next);

        if (newUnlocks.length > 0) {
          setUnlockQueue((q) => [...q, ...newUnlocks]);
        }

        return next;
      });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setUnlockQueue((q) => q.slice(1));
  }, []);

  if (!initialized) return <>{children}</>;

  return (
    <AchievementContext.Provider
      value={{ storage, trackActivity, unlockQueue, dismissToast }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const ctx = useContext(AchievementContext);
  if (!ctx) {
    throw new Error("useAchievement must be used within AchievementProvider");
  }
  return ctx;
}
