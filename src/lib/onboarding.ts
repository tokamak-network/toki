// ─── Onboarding Progress — Single Source of Truth ────────────────────────────
//
// Persisted per-user in localStorage under `toki-onboarding-{userId}`.
// Every consumer (OnboardingQuest flow, AchievementProvider migration, the
// StakingScreen "new user" guidance) reads completion from THIS module so the
// three places can never disagree about whether onboarding is finished.

// Canonical quest IDs, in order. Keep in sync with buildQuests() in
// components/onboarding/OnboardingQuest.tsx.
export const QUEST_IDS = [
  "create-wallet",
  "bridge-metamask",
  "verify-exchange",
  "receive-ton",
  "first-stake",
] as const;

export const TOTAL_QUESTS = QUEST_IDS.length;

// Quest IDs from a previous app version. Their presence means the stored data
// predates the current quest set and must be reset.
export const OLD_QUEST_IDS = ["install-metamask", "connect-toki", "verify-upbit"];

export const ONBOARDING_PREFIX = "toki-onboarding";
export const ONBOARDING_SCHEMA_VERSION = 2;

export type OnboardingStatus = "in-progress" | "completed";

export interface OnboardingState {
  schemaVersion: number;
  questIndex: number; // index of the NEXT quest to play (0..TOTAL_QUESTS)
  totalXp: number;
  completed: string[]; // completed quest IDs
  status: OnboardingStatus; // explicit flag — never inferred from array length downstream
  completedAt: number | null;
}

export const EMPTY_ONBOARDING: OnboardingState = {
  schemaVersion: ONBOARDING_SCHEMA_VERSION,
  questIndex: 0,
  totalXp: 0,
  completed: [],
  status: "in-progress",
  completedAt: null,
};

export function onboardingKey(userId: string): string {
  return `${ONBOARDING_PREFIX}-${userId}`;
}

// Build a fully-formed state object, deriving the explicit `status` flag from
// the quest index so callers never have to compute the boundary themselves.
export function buildOnboardingState(
  questIndex: number,
  totalXp: number,
  completed: string[],
): OnboardingState {
  const clampedIndex = Math.min(Math.max(questIndex, 0), TOTAL_QUESTS);
  const status: OnboardingStatus = clampedIndex >= TOTAL_QUESTS ? "completed" : "in-progress";
  return {
    schemaVersion: ONBOARDING_SCHEMA_VERSION,
    questIndex: clampedIndex,
    totalXp,
    completed,
    status,
    completedAt: status === "completed" ? Date.now() : null,
  };
}

// Normalize raw localStorage data (old `{questIndex,totalXp,completed}` shape OR
// the current shape) into a current OnboardingState.
function normalize(raw: unknown): OnboardingState {
  const data = (raw ?? {}) as Record<string, unknown>;
  const completed: string[] = Array.isArray(data.completed) ? (data.completed as string[]) : [];
  const questIndex = typeof data.questIndex === "number" ? data.questIndex : 0;
  const totalXp = typeof data.totalXp === "number" ? data.totalXp : 0;

  const allDone =
    data.status === "completed" ||
    questIndex >= TOTAL_QUESTS ||
    QUEST_IDS.every((id) => completed.includes(id));

  const rawCompletedAt =
    typeof data.completedAt === "number" ? (data.completedAt as number) : null;
  // Invariant: a completed record always carries a completedAt timestamp, even
  // when migrated from the old shape that never stored one.
  const completedAt = allDone ? rawCompletedAt ?? Date.now() : null;

  return {
    schemaVersion: ONBOARDING_SCHEMA_VERSION,
    questIndex: allDone ? TOTAL_QUESTS : Math.min(Math.max(questIndex, 0), TOTAL_QUESTS),
    totalXp,
    completed,
    status: allDone ? "completed" : "in-progress",
    completedAt,
  };
}

// Load onboarding state for a user. Returns a fresh EMPTY state when there is no
// user, no stored data, or the stored data is from an incompatible old version
// (in which case the stale key is removed explicitly).
export function loadOnboarding(userId: string | null | undefined): OnboardingState {
  if (typeof window === "undefined" || !userId) return { ...EMPTY_ONBOARDING };
  try {
    const key = onboardingKey(userId);
    let raw = localStorage.getItem(key);
    // Legacy un-namespaced global key — only used when this account has no
    // per-user data yet, and consumed once (below) so it can't repeatedly leak
    // one device's progress to other accounts.
    let fromLegacyGlobal = false;
    if (!raw) {
      raw = localStorage.getItem(ONBOARDING_PREFIX);
      fromLegacyGlobal = !!raw;
    }
    if (!raw) return { ...EMPTY_ONBOARDING };

    const parsed = JSON.parse(raw);
    const completed: string[] = Array.isArray(parsed?.completed) ? parsed.completed : [];

    // Stale old-version data → reset cleanly (versioned, not silent legacy guesswork).
    if (completed.some((id: string) => OLD_QUEST_IDS.includes(id))) {
      try {
        localStorage.removeItem(key);
        if (fromLegacyGlobal) localStorage.removeItem(ONBOARDING_PREFIX);
      } catch {
        // ignore
      }
      return { ...EMPTY_ONBOARDING };
    }

    const state = normalize(parsed);
    // Consume-once migration of the legacy global key into this account's key.
    if (fromLegacyGlobal) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.removeItem(ONBOARDING_PREFIX);
      } catch {
        // ignore
      }
    }
    return state;
  } catch {
    return { ...EMPTY_ONBOARDING };
  }
}

export function saveOnboarding(
  userId: string | null | undefined,
  state: OnboardingState,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(onboardingKey(userId), JSON.stringify(state));
  } catch {
    // iOS private browsing or quota exceeded
  }
}

// The one question every consumer should ask instead of re-deriving completion.
export function isOnboardingComplete(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return loadOnboarding(userId).status === "completed";
}
