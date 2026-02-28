import "@testing-library/jest-dom";
import { useEffect } from "react";
import { vi } from "vitest";
import { dictionaries } from "@/locales";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Privy
vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({
    ready: true,
    authenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    exportWallet: vi.fn(),
  }),
  useWallets: () => ({
    wallets: [],
  }),
}));

// Mock Audio
vi.mock("@/components/audio/AudioProvider", () => ({
  useAudio: () => ({
    isPlaying: false,
    toggle: vi.fn(),
  }),
}));

// Mock Achievements (trackActivity)
vi.mock("@/components/providers/AchievementProvider", () => ({
  useAchievement: () => ({
    trackActivity: vi.fn(),
    achievements: [],
  }),
}));

// Mock i18n
vi.mock("@/components/providers/LanguageProvider", () => ({
  useTranslation: () => ({
    locale: "ko",
    t: dictionaries.ko,
  }),
}));

// Mock IntroCinematic to skip it immediately
vi.mock("./src/components/onboarding/IntroCinematic", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: test mock
    useEffect(() => {
      onComplete();
    }, [onComplete]);
    return null;
  },
}));

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();
