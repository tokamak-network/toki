"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  ACHIEVEMENTS,
  EMPTY_STORAGE,
  checkCondition,
  calculateLevel,
  type Achievement,
  type AchievementStorage,
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

const STORAGE_PREFIX = "toki-achievements";
const ONBOARDING_PREFIX = "toki-onboarding";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}-${userId}`;
}

function onboardingKey(userId: string) {
  return `${ONBOARDING_PREFIX}-${userId}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadStorage(userId: string): AchievementStorage {
  if (typeof window === "undefined") return EMPTY_STORAGE;
  try {
    const raw = localStorage.getItem(storageKey(userId));
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
    // Migrate from legacy global key on first load for this user
    const legacy = localStorage.getItem(STORAGE_PREFIX);
    if (legacy) {
      const parsed = JSON.parse(legacy);
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

function saveStorage(userId: string, storage: AchievementStorage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(storage));
  } catch {
    // iOS private browsing or quota exceeded
  }
}

function migrateOnboarding(userId: string, storage: AchievementStorage): AchievementStorage {
  if (typeof window === "undefined") return storage;
  try {
    // Check per-user key first, then legacy global key
    const raw = localStorage.getItem(onboardingKey(userId))
      || localStorage.getItem(ONBOARDING_PREFIX);
    if (!raw) return storage;
    const data = JSON.parse(raw);
    const completed: string[] = data.completed || [];
    if (completed.length === 0) return storage;

    // Check if already migrated
    const alreadyMigrated = completed.every((id) =>
      storage.metadata.questsCompleted.includes(id)
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
  const { ready, authenticated, user } = usePrivy();
  const [storage, setStorage] = useState<AchievementStorage>(EMPTY_STORAGE);
  const [unlockQueue, setUnlockQueue] = useState<Achievement[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Resolve current user ID
  const userId = authenticated && user?.id ? user.id : null;

  // Load + migrate when user changes
  useEffect(() => {
    if (!ready) return;

    // Not logged in — reset to empty
    if (!userId) {
      setStorage(EMPTY_STORAGE);
      setActiveUserId(null);

      return;
    }

    // Same user already loaded
    if (userId === activeUserId) return;

    let loaded = loadStorage(userId);
    loaded = migrateOnboarding(userId, loaded);

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
    saveStorage(userId, loaded);
    setStorage(loaded);
    setActiveUserId(userId);
    if (newUnlocks.length > 0) {
      setUnlockQueue(newUnlocks);
    }
  }, [ready, userId, activeUserId]);

  const trackActivity = useCallback(
    (type: ActivityType, meta?: Record<string, unknown>) => {
      if (!userId) return; // Not logged in — ignore activity
      const currentUserId = userId;
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
            if (paymasterMode === "sponsor" && !next.unlocked.includes("stake-gasless")) {
              next.unlocked.push("stake-gasless");
            }
            if (!next.unlocked.includes("stake-delegation")) {
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
            if (serviceId && !next.metadata.servicesClicked.includes(serviceId)) {
              next.metadata.servicesClicked.push(serviceId);
            }
            break;
          }
          case "category-view": {
            const categoryId = meta?.categoryId as string;
            if (categoryId && !next.metadata.categoriesViewed.includes(categoryId)) {
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
        saveStorage(currentUserId, next);

        if (newUnlocks.length > 0) {
          setUnlockQueue((q) => [...q, ...newUnlocks]);
        }

        return next;
      });
    },
    [userId]
  );

  const dismissToast = useCallback(() => {
    setUnlockQueue((q) => q.slice(1));
  }, []);

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
