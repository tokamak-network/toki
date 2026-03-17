"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { Dictionary } from "@/locales";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import IntroCinematic from "./IntroCinematic";
import LaptopVideoOverlay from "./LaptopVideoOverlay";
import ProfitSimulator from "@/components/landing/ProfitSimulator";
import { fetchStakingData, type StakingData } from "@/lib/staking";
import { useAchievement } from "@/components/providers/AchievementProvider";
import { publicClient } from "@/lib/chain";
import { CONTRACTS } from "@/constants/contracts";
import { erc20Abi, formatUnits } from "viem";

// ─── Quest Data ───────────────────────────────────────────────────────

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing" | "neutral";

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/characters/toki-welcome.png",
  explain: "/characters/toki-explain.png",
  thinking: "/characters/toki-thinking.png",
  excited: "/characters/toki-excited.png",
  proud: "/characters/toki-proud.png",
  cheer: "/characters/toki-cheer.png",
  wink: "/characters/toki-wink.png",
  surprised: "/characters/toki-surprised.png",
  confused: "/characters/toki-confused.png",
  shy: "/characters/toki-shy.png",
  determined: "/characters/toki-determined.png",
  pointing: "/characters/toki-pointing.png",
  reading: "/characters/toki-reading.png",
  "crying-happy": "/characters/toki-crying-happy.png",
  peace: "/characters/toki-peace.png",
  worried: "/characters/toki-worried.png",
  laughing: "/characters/toki-laughing.png",
  neutral: "/characters/toni.png",
};

interface DialogueLine {
  text: string;
  mood?: Mood;
}

interface QuestAction {
  type: "link" | "privy-login" | "confirm" | "navigate" | "substeps" | "balance-check";
  label: string;
  url?: string;
  route?: string;
  confirmText?: string;
}

interface QuestSubStep {
  instruction: string;
  action: QuestAction;
  verify?: string;
}

interface Quest {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeIcon: string;
  xp: number;
  intro: DialogueLine[];
  action?: QuestAction;
  verify?: "privy-authenticated" | "user-confirm" | "metamask-installed";
  success: DialogueLine[];
  substeps?: QuestSubStep[];
}

function buildQuests(t: Dictionary["onboarding"]): Quest[] {
  return [
    {
      id: "create-wallet",
      title: t.quest1Title,
      subtitle: t.quest1Subtitle,
      badge: t.quest1Badge,
      badgeIcon: "W",
      xp: 100,
      intro: [
        { text: t.quest1Intro1, mood: "welcome" },
        { text: t.quest1Intro2, mood: "neutral" },
        { text: t.quest1Intro3, mood: "explain" },
        { text: t.quest1Intro4, mood: "pointing" },
        { text: t.quest1Intro5, mood: "excited" },
        { text: t.quest1Intro6, mood: "cheer" },
      ],
      action: { type: "privy-login", label: t.quest1Action },
      verify: "privy-authenticated",
      success: [
        { text: t.quest1Success1, mood: "surprised" },
        { text: t.quest1Success2, mood: "peace" },
      ],
    },
    {
      id: "bridge-metamask",
      title: t.quest2Title,
      subtitle: t.quest2Subtitle,
      badge: t.quest2Badge,
      badgeIcon: "B",
      xp: 200,
      intro: [
        { text: t.quest2Intro1, mood: "thinking" },
        { text: t.quest2Intro2, mood: "neutral" },
        { text: t.quest2Intro3, mood: "pointing" },
        { text: t.quest2Intro4, mood: "worried" },
        { text: t.quest2Intro5, mood: "determined" },
      ],
      action: { type: "substeps", label: t.quest2Action },
      verify: "user-confirm",
      success: [
        { text: t.quest2Success1, mood: "laughing" },
        { text: t.quest2Success2, mood: "explain" },
        { text: t.quest2Success3, mood: "shy" },
      ],
      substeps: [
        {
          instruction: t.installMetamaskInstruction,
          action: { type: "link", label: t.installMetamaskButton, url: "https://metamask.io/download/" },
          verify: "metamask-installed",
        },
        {
          instruction: t.exportKeyInstruction,
          action: { type: "privy-login", label: t.exportKeyButton },
          verify: t.exportKeyConfirm,
        },
        {
          instruction: t.importKeyInstruction,
          action: { type: "confirm", label: t.quest3ActionLabel, confirmText: t.importKeyConfirm },
          verify: t.importKeyConfirm,
        },
      ],
    },
    {
      id: "verify-exchange",
      title: t.quest3Title,
      subtitle: t.quest3Subtitle,
      badge: t.quest3Badge,
      badgeIcon: "E",
      xp: 300,
      intro: [
        { text: t.quest3Intro1, mood: "determined" },
        { text: t.quest3Intro3, mood: "pointing" },
      ],
      action: { type: "confirm", label: t.quest3ActionLabel, confirmText: t.quest3Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest3Success1, mood: "crying-happy" },
        { text: t.quest3Success2, mood: "peace" },
        { text: t.quest3Success3, mood: "laughing" },
      ],
    },
    {
      id: "receive-ton",
      title: t.quest4Title,
      subtitle: t.quest4Subtitle,
      badge: t.quest4Badge,
      badgeIcon: "T",
      xp: 250,
      intro: [
        { text: t.quest4Intro1, mood: "excited" },
        { text: t.quest4Intro2, mood: "pointing" },
        { text: t.quest4Intro3, mood: "surprised" },
        { text: t.quest4Intro4, mood: "wink" },
      ],
      action: { type: "balance-check", label: t.quest4ActionLabel },
      verify: "user-confirm",
      success: [
        { text: t.quest4Success1, mood: "laughing" },
        { text: t.quest4Success2, mood: "proud" },
      ],
    },
    {
      id: "first-stake",
      title: t.quest5Title,
      subtitle: t.quest5Subtitle,
      badge: t.quest5Badge,
      badgeIcon: "S",
      xp: 500,
      intro: [
        { text: t.quest5Intro1, mood: "excited" },
        { text: t.quest5Intro2, mood: "crying-happy" },
        { text: t.quest5Intro3, mood: "pointing" },
        { text: t.quest5Intro4, mood: "determined" },
      ],
      action: { type: "navigate", label: t.quest5Action, route: "/staking" },
      verify: "user-confirm",
      success: [
        { text: t.quest5Success1, mood: "surprised" },
        { text: t.quest5Success2, mood: "shy" },
        { text: t.quest5Success3, mood: "explain" },
        { text: t.quest5Success4, mood: "peace" },
      ],
    },
  ];
}

function getMoodLabel(mood: Mood, t: Dictionary["onboarding"]): string {
  const map: Record<Mood, string> = {
    welcome: t.moodWelcome,
    explain: t.moodExplain,
    thinking: t.moodThinking,
    excited: t.moodExcited,
    proud: t.moodProud,
    cheer: t.moodCheer,
    wink: t.moodWink,
    surprised: t.moodSurprised,
    confused: t.moodConfused,
    shy: t.moodShy,
    determined: t.moodDetermined,
    pointing: t.moodPointing,
    reading: t.moodReading,
    "crying-happy": t.moodCryingHappy,
    peace: t.moodPeace,
    worried: t.moodWorried,
    laughing: t.moodLaughing,
    neutral: t.moodNeutral,
  };
  return map[mood];
}

// ─── Typing Effect Hook ───────────────────────────────────────────────

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ─── Sub Components ───────────────────────────────────────────────────

function BadgeReveal({ quest }: { quest: Quest }) {
  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-3xl font-bold text-white mb-3 animate-float">
        {quest.badgeIcon}
      </div>
      <div className="text-accent-cyan font-semibold">{quest.badge}</div>
      <div className="text-accent-amber text-sm font-mono-num mt-1">
        +{quest.xp} XP
      </div>
    </div>
  );
}

// ─── Dialogue Box ─────────────────────────────────────────────────────

function DialogueBox({
  line,
  onNext,
  onPrev,
  isLast,
  canGoBack,
  moodLabel,
  questProgress,
}: {
  line: DialogueLine;
  onNext: () => void;
  onPrev?: () => void;
  isLast: boolean;
  canGoBack?: boolean;
  moodLabel?: string;
  questProgress?: string;
}) {
  const { displayed, done, skip } = useTypewriter(line.text, 35);
  const { t } = useTranslation();

  return (
    <div
      className="cursor-pointer select-none w-full"
      onClick={() => (done ? onNext() : skip())}
    >
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6 h-[160px] sm:h-[176px] flex flex-col">
        {/* Name plate + progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
            {line.mood && moodLabel && (
              <span className="text-xs text-accent-cyan/60">
                {moodLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canGoBack && onPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
              >
                ◀ {t.onboarding.clickToPrev}
              </button>
            )}
            {questProgress && (
              <span className="text-xs text-gray-500 tabular-nums">{questProgress}</span>
            )}
          </div>
        </div>
        <p className="text-gray-100 text-base sm:text-lg leading-relaxed flex-1">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {done && (
          <div className="text-right">
            <span className="text-xs text-gray-500 animate-pulse">
              {isLast ? t.onboarding.clickToContinue : t.onboarding.clickToNext} ▼
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mood Glow Colors ────────────────────────────────────────────────

const MOOD_GLOW: Record<Mood, string> = {
  welcome: "rgba(74, 144, 217, 0.35)",
  explain: "rgba(96, 165, 250, 0.35)",
  thinking: "rgba(99, 102, 241, 0.35)",
  excited: "rgba(245, 158, 11, 0.45)",
  proud: "rgba(34, 211, 238, 0.40)",
  cheer: "rgba(168, 85, 247, 0.35)",
  wink: "rgba(236, 72, 153, 0.35)",
  surprised: "rgba(245, 158, 11, 0.40)",
  confused: "rgba(99, 102, 241, 0.30)",
  shy: "rgba(236, 72, 153, 0.40)",
  determined: "rgba(239, 68, 68, 0.35)",
  pointing: "rgba(34, 211, 238, 0.35)",
  reading: "rgba(96, 165, 250, 0.30)",
  "crying-happy": "rgba(245, 158, 11, 0.40)",
  peace: "rgba(168, 85, 247, 0.35)",
  worried: "rgba(239, 68, 68, 0.30)",
  laughing: "rgba(245, 158, 11, 0.45)",
  neutral: "rgba(148, 163, 184, 0.30)",
};

// ─── Exchange Guide Links ─────────────────────────────────────────────

const EXCHANGE_GUIDES = [
  {
    key: "upbit" as const,
    url: "https://support.upbit.com/hc/ko/articles/6713306957977-%EA%B0%9C%EC%9D%B8%EC%A7%80%EA%B0%91%EC%A3%BC%EC%86%8C-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95",
    mobileUrl: "https://support.upbit.com/hc/ko/articles/5077672491801-%EB%AA%A8%EB%B0%94%EC%9D%BC%EC%97%90%EC%84%9C-%EA%B0%9C%EC%9D%B8%EC%A7%80%EA%B0%91-%EC%A3%BC%EC%86%8C-%EB%93%B1%EB%A1%9D%EC%9D%B4-%EA%B0%80%EB%8A%A5%ED%95%9C%EA%B0%80%EC%9A%94",
  },
  {
    key: "bithumb" as const,
    url: "https://support.bithumb.com/hc/ko/articles/51144300935577-100%EB%A7%8C%EC%9B%90-%EB%AF%B8%EB%A7%8C-%EC%B6%9C%EA%B8%88-%EA%B0%80%EC%83%81%EC%9E%90%EC%82%B0-%EC%A3%BC%EC%86%8C-%EB%93%B1%EB%A1%9D-%EA%B0%80%EC%9D%B4%EB%93%9C",
  },
  {
    key: "coinone" as const,
    url: "https://support.coinone.co.kr/support/solutions/articles/31000163221-%EA%B0%80%EC%83%81%EC%9E%90%EC%82%B0-%EC%A3%BC%EC%86%8C%EB%A1%9D-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95-%EC%9B%B9-%EC%95%B1%EC%97%90%EC%84%9C-%EC%9D%B8%EC%A6%9D%ED%95%98%EA%B8%B0-",
  },
  {
    key: "korbit" as const,
    url: "https://www.korbit.co.kr/faq/list/?category=6gTj8LJTQpSXvmFTie9hhs&article=7dWVcdas0GTuwWgLc1hPpV",
  },
];

// ─── Video Comment per key ────────────────────────────────────────────

function getVideoComment(videoKey: string, t: Dictionary["onboarding"]): string {
  const map: Record<string, string> = {
    "install-metamask": t.videoCommentInstall,
    "import-key": t.videoCommentImport,
    "verify-exchange": t.videoCommentExchange,
    "receive-ton": t.videoCommentReceiveTon,
  };
  return map[videoKey] || "";
}

// ─── Background Image per Quest ───────────────────────────────────────

const QUEST_BACKGROUNDS: Record<string, string> = {
  "create-wallet": "/backgrounds/1.png",
  "bridge-metamask": "/backgrounds/2.png",
  "verify-exchange": "/backgrounds/3.png",
  "receive-ton": "/backgrounds/staking-night.png",
  "first-stake": "/backgrounds/staking-sunrise.png",
};

// ─── Tutorial Video URLs ──────────────────────────────────────────────

const TUTORIAL_VIDEOS: Record<string, { embed: string; mobileUrl?: string }> = {
  "create-wallet": { embed: "https://www.youtube.com/embed/UURB7Tc7D4M?start=129" },
  "install-metamask": { embed: "https://www.youtube.com/embed/KjwlrQAtdYU", mobileUrl: "https://www.youtube.com/shorts/stRSJxS2kyY" },
  "import-key": { embed: "https://www.youtube.com/embed/yvOie0hBr2k", mobileUrl: "https://www.youtube.com/watch?v=O8R6V2fvwKs&t=173" },
  "receive-ton": { embed: "https://www.youtube.com/embed/D-6tFe_KBZs" },
};

// ─── Character Display (Visual Novel Style) ──────────────────────────

function TokiCharacter({ mood, phase, compact }: { mood?: Mood; phase?: Phase; compact?: boolean }) {
  const effectiveMood: Mood =
    phase === "badge"
      ? "proud"
      : phase === "action" || phase === "verifying"
        ? "cheer"
        : mood || "welcome";

  const imageSrc = MOOD_IMAGES[effectiveMood];
  const [prevSrc, setPrevSrc] = useState(imageSrc);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (imageSrc !== prevSrc) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevSrc(imageSrc);
        setTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, prevSrc]);

  const glowColor = MOOD_GLOW[effectiveMood];

  return (
    <div className="flex justify-center z-10">
      <div className={`relative overflow-hidden ${
        compact
          ? "w-40 sm:w-48 md:w-56 lg:w-64 h-40 sm:h-48 md:h-56 lg:h-64"
          : "w-64 sm:w-80 md:w-96 lg:w-[28rem] h-64 sm:h-80 md:h-96 lg:h-[28rem]"
      }`}>
        <div
          className="absolute inset-[15%] bottom-0 rounded-full blur-3xl -z-10 animate-glow-pulse transition-colors duration-700 opacity-40"
          style={{ backgroundColor: glowColor }}
        />
        <Image
          src={transitioning ? prevSrc : imageSrc}
          alt="Toki"
          width={512}
          height={512}
          className={`relative z-10 drop-shadow-2xl transition-opacity duration-200 w-full h-full object-cover object-top ${
            transitioning ? "opacity-0" : "opacity-100"
          }`}
          priority
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

type Phase = "intro" | "action" | "verifying" | "success" | "badge";

// Old quest IDs for localStorage migration
const OLD_QUEST_IDS = ["install-metamask", "connect-toki", "verify-upbit"];

export default function OnboardingQuest() {
  const router = useRouter();
  const { t } = useTranslation();
  const { ready, authenticated, login, exportWallet, user } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(w => w.walletClientType === "privy");

  const { trackActivity } = useAchievement();
  const QUESTS = buildQuests(t.onboarding);
  const [questIndex, setQuestIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(
    new Set()
  );
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [subStepConfirmed, setSubStepConfirmed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [tonBalance, setTonBalance] = useState<number | null>(null);
  const [balanceConfirmed, setBalanceConfirmed] = useState(false);
  const [balanceWaiting, setBalanceWaiting] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_cinematicComplete, setCinematicComplete] = useState(false);
  const [cinematicJustFinished, setCinematicJustFinished] = useState(false);
  const questAreaRef = useRef<HTMLDivElement>(null);

  // Per-account localStorage keys
  const userId = user?.id;
  const obKey = userId ? `toki-onboarding-${userId}` : null;
  const introKey = userId ? `toki-intro-seen-${userId}` : null;

  // Load progress from localStorage (with migration) + cinematic check
  useEffect(() => {
    if (!obKey || !introKey) return;

    try {
      // Try per-user key first, then legacy global key for migration
      const saved = localStorage.getItem(obKey) || localStorage.getItem("toki-onboarding");
      if (saved) {
        const data = JSON.parse(saved);
        const completed: string[] = data.completed || [];
        // Migrate: if old quest IDs detected, reset progress
        const hasOldIds = completed.some((id: string) => OLD_QUEST_IDS.includes(id));
        if (hasOldIds) {
          localStorage.removeItem(obKey);
          return;
        }
        setQuestIndex(data.questIndex || 0);
        setTotalXp(data.totalXp || 0);
        setCompletedQuests(new Set(completed));
      }
    } catch {
      // ignore
    }

    // Show intro cinematic on first visit only (skip on mobile)
    const introSeen = localStorage.getItem(introKey) || localStorage.getItem("toki-intro-seen");
    const isMobile = window.innerWidth < 768;
    if (!introSeen && !isMobile) {
      setShowCinematic(true);
    } else {
      setCinematicComplete(true);
      if (!introSeen && isMobile) {
        localStorage.setItem(introKey, "1");
      }
    }
  }, [obKey, introKey]);

  // Preload all mood images so character appears instantly on mobile
  useEffect(() => {
    Object.values(MOOD_IMAGES).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Save progress
  const saveProgress = useCallback(
    (qi: number, xp: number, completed: Set<string>) => {
      if (!obKey) return;
      try {
        localStorage.setItem(
          obKey,
          JSON.stringify({
            questIndex: qi,
            totalXp: xp,
            completed: Array.from(completed),
          })
        );
      } catch {
        // iOS private browsing or quota exceeded
      }
    },
    [obKey]
  );

  const quest = QUESTS[questIndex];
  const dialogues =
    phase === "intro" || phase === "action" || phase === "verifying"
      ? quest?.intro
      : quest?.success;
  const currentLine = dialogues?.[dialogueIndex];
  const isAllComplete = questIndex >= QUESTS.length;

  // Auto-fetch staking data when Quest 4 action phase starts
  useEffect(() => {
    if (quest?.id === "receive-ton" && phase === "action" && !stakingData) {
      fetchStakingData().then(setStakingData).catch(console.error);
    }
  }, [quest?.id, phase, stakingData]);

  // Balance check polling for Quest 4
  const checkTonBalance = useCallback(async () => {
    const addr = embeddedWallet?.address;
    if (!addr) return;
    try {
      const bal = await publicClient.readContract({
        address: CONTRACTS.TON as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [addr as `0x${string}`],
      });
      setTonBalance(Number(formatUnits(bal, 18)));
    } catch {
      // ignore
    }
  }, [embeddedWallet?.address]);

  useEffect(() => {
    if (quest?.id !== "receive-ton" || phase !== "action") return;
    if (balanceConfirmed) return;
    checkTonBalance();
    const interval = setInterval(checkTonBalance, 10000); // 10초마다 폴링
    return () => clearInterval(interval);
  }, [quest?.id, phase, balanceConfirmed, checkTonBalance]);

  // Auto-scroll to quest area
  useEffect(() => {
    questAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, questIndex]);

  // Auto-detect Privy authentication for Quest 1
  // Also handles page reload after Google login — skip intro if already authenticated
  useEffect(() => {
    if (quest?.action?.type === "privy-login" && authenticated && embeddedWallet) {
      if (phase === "action") {
        handleVerifySuccess();
      } else if (phase === "intro" && quest.id === "create-wallet" && !completedQuests.has("create-wallet")) {
        handleVerifySuccess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, embeddedWallet, phase, quest?.action?.type, quest?.id]);

  const handleNextDialogue = () => {
    if (!dialogues) return;
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else if (phase === "intro") {
      setPhase("action");
    } else if (phase === "success") {
      setPhase("badge");
      // Trigger achievement toast immediately when badge phase starts
      if (quest) {
        trackActivity("quest-complete", { questId: quest.id, xp: quest.xp });
      }
    }
  };

  const handlePrevDialogue = () => {
    if (dialogueIndex > 0) {
      setDialogueIndex(dialogueIndex - 1);
    }
  };

  const handleAction = async () => {
    if (!quest?.action) return;

    if (quest.action.type === "privy-login") {
      if (!ready) {
        alert(t.onboarding.privyNotReady);
        return;
      }
      if (authenticated && embeddedWallet) {
        handleVerifySuccess();
      } else {
        login();
      }
    } else if (quest.action.type === "link") {
      window.open(quest.action.url, "_blank");
      setPhase("verifying");
    } else if (quest.action.type === "confirm") {
      if (!confirmed) return;
      handleVerifySuccess();
    } else if (quest.action.type === "balance-check") {
      if (!balanceConfirmed) return;
      handleVerifySuccess();
    } else if (quest.action.type === "navigate") {
      handleVerifySuccess();
    } else if (quest.action.type === "substeps") {
      // Substeps rendering is handled inline
    }
  };

  const [keyExported, setKeyExported] = useState(false);

  const handleSubStepAction = async (substep: QuestSubStep) => {
    if (substep.action.type === "privy-login") {
      if (embeddedWallet) {
        await exportWallet({ address: embeddedWallet.address });
        setKeyExported(true);
      }
    } else if (substep.action.type === "link") {
      window.open(substep.action.url, "_blank");
    }
  };

  const handleSubStepNext = () => {
    if (!quest?.substeps) return;
    if (subStepIndex < quest.substeps.length - 1) {
      setSubStepIndex(subStepIndex + 1);
      setSubStepConfirmed(false);
    } else {
      handleVerifySuccess();
    }
  };

  const handleVerify = async () => {
    if (quest?.verify === "metamask-installed") {
      // On mobile, window.ethereum is only available inside MetaMask's in-app browser,
      // not in Safari/Chrome even when the app is installed. Trust user confirmation.
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        handleVerifySuccess();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        handleVerifySuccess();
      } else {
        alert(t.onboarding.metamaskNotYet);
      }
    }
  };

  const handleVerifySuccess = () => {
    setPhase("success");
    setDialogueIndex(0);
    setConfirmed(false);
    setSubStepIndex(0);
    setSubStepConfirmed(false);
  };

  const handleCinematicComplete = useCallback(() => {
    setShowCinematic(false);
    setCinematicComplete(true);
    setCinematicJustFinished(true);
    if (introKey) localStorage.setItem(introKey, "1");
  }, [introKey]);

  const handleBadgeDone = () => {
    if (!quest) return;
    const newCompleted = new Set(completedQuests);
    newCompleted.add(quest.id);
    const newXp = totalXp + quest.xp;
    const newIndex = questIndex + 1;

    setCompletedQuests(newCompleted);
    setTotalXp(newXp);
    setQuestIndex(newIndex);
    setPhase("intro");
    setDialogueIndex(0);
    saveProgress(newIndex, newXp, newCompleted);

    if (quest.action?.type === "navigate" && quest.action.route) {
      router.push(quest.action.route);
    }
  };

  // ─── Render: All Complete ──────────────────────────────────────────

  if (isAllComplete) {
    return (
      <div className="fixed inset-0 overflow-hidden flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/vn-bg-default.png')` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Spacer pushes content to bottom */}
        <div className="flex-1" />
        <div className="relative z-20">
          <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-8 sm:px-8">
            <div className="max-w-2xl mx-auto text-center animate-fade-in">
              <h1 className="text-3xl font-bold text-gradient mb-3">
                {t.onboarding.allClear}
              </h1>
              <p className="text-gray-400 mb-2">
                {t.onboarding.allClearDesc}
              </p>
              <p className="text-accent-amber font-mono-num text-xl mb-6">
                {t.onboarding.totalXp.replace("{xp}", String(totalXp))}
              </p>


              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/staking")}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
                >
                  {t.onboarding.goToStaking}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Visual Novel Layout ────────────────────────────────────

  const bgImage = QUEST_BACKGROUNDS[quest?.id] || "/vn-bg-default.png";
  const isSubStepQuest = quest?.action?.type === "substeps" && quest.substeps;
  const currentSubStep = isSubStepQuest ? quest.substeps![subStepIndex] : null;

  // Auto-determine video key based on current quest/step
  const autoVideoKey = (() => {
    if (phase !== "action") return null;
    if (quest?.id === "bridge-metamask" && quest.substeps) {
      if (subStepIndex === 0) return "install-metamask";
      if (subStepIndex === 2) return "import-key";
    }
    if (quest?.id === "receive-ton") return "receive-ton";
    return null;
  })();

  return (
    <div className="fixed inset-0 overflow-hidden" ref={questAreaRef}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Top HUD removed — progress shown inside dialogue box */}

      {/* ── Character (or inline video) + Bottom Panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Inline video — wider container, desktop only */}
        {autoVideoKey && TUTORIAL_VIDEOS[autoVideoKey] && (
          <>
            {/* Desktop: iframe */}
            <div className="hidden md:flex flex-col items-center px-4 mb-2">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10" style={{ width: 1020, maxWidth: "100%", height: 574 }}>
                <iframe
                  src={TUTORIAL_VIDEOS[autoVideoKey].embed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: "none" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {getVideoComment(autoVideoKey, t.onboarding)}
              </p>
            </div>
            {/* Mobile: external link button (use mobileUrl if available) */}
            <div className="flex md:hidden justify-center px-4 mb-2">
              <a
                href={TUTORIAL_VIDEOS[autoVideoKey].mobileUrl ?? TUTORIAL_VIDEOS[autoVideoKey].embed.replace("/embed/", "/watch?v=").replace(/\?(?!v=)/, "&")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
              >
                <span>▶</span>
                <span>{getVideoComment(autoVideoKey, t.onboarding)}</span>
              </a>
            </div>
          </>
        )}

        <div className="max-w-3xl mx-auto">
          {/* Character — hidden when video is showing */}
          {!(autoVideoKey && TUTORIAL_VIDEOS[autoVideoKey]) && (
            <div className={cinematicJustFinished ? "animate-character-entrance" : ""}>
              <TokiCharacter mood={currentLine?.mood} phase={phase} compact={quest.id === "verify-exchange" && phase === "action"} />
            </div>
          )}

          {/* Wallet Address (Quest 1 success) */}
          {embeddedWallet && phase === "success" && quest.id === "create-wallet" && (
            <div className="mx-4 mb-2 p-3 rounded-lg bg-black/50 backdrop-blur border border-accent-cyan/20 text-center">
              <div className="text-xs text-gray-400 mb-1">{t.onboarding.yourAddress}</div>
              <div className="font-mono text-sm text-accent-cyan break-all">
                {embeddedWallet.address}
              </div>
            </div>
          )}

          {/* Badge Reveal */}
          {phase === "badge" && (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              <BadgeReveal quest={quest} />
              <button
                onClick={handleBadgeDone}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 hover:scale-[1.02] transition-all"
              >
                {questIndex < QUESTS.length - 1
                  ? t.onboarding.nextQuest
                  : t.onboarding.complete}
              </button>
            </div>
          )}

          {/* Dialogue */}
          {(phase === "intro" || phase === "success") && currentLine && (
            <DialogueBox
              line={currentLine}
              onNext={handleNextDialogue}
              onPrev={handlePrevDialogue}
              canGoBack={dialogueIndex > 0}
              isLast={dialogueIndex === dialogues.length - 1}
              moodLabel={currentLine.mood ? getMoodLabel(currentLine.mood, t.onboarding) : undefined}
              questProgress={`${questIndex + 1} / ${QUESTS.length}`}
            />
          )}

          {/* Action Phase */}
          {phase === "action" && quest.action && (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 tabular-nums">{questIndex + 1} / {QUESTS.length}</span>
                <button
                  onClick={() => {
                    setPhase("intro");
                    setDialogueIndex(quest.intro.length - 1);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
                >
                  ◀ {t.onboarding.clickToPrev}
                </button>
              </div>
              <div className="space-y-4">

                {quest.action.type === "privy-login" && (
                  <>
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  </>
                )}

                {(quest.action.type === "link" || quest.action.type === "navigate") && (
                  <button
                    onClick={handleAction}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                  >
                    {quest.action.label}
                  </button>
                )}

                {quest.action.type === "confirm" && (
                  <>
                    {/* Copy address for Quest 3 */}
                    {quest.id === "verify-exchange" && embeddedWallet && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(embeddedWallet.address);
                          setAddressCopied(true);
                          setTimeout(() => setAddressCopied(false), 2000);
                        }}
                        className="w-full py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-sm font-medium hover:bg-accent-cyan/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {addressCopied ? (
                          <span className="text-emerald-400">✓ {t.onboarding.addressCopied}</span>
                        ) : (
                          <>
                            <span className="text-accent-cyan">📋</span>
                            <span className="text-accent-cyan">{t.onboarding.copyAddress}</span>
                            <span className="text-accent-cyan/60 font-mono text-xs">
                              {embeddedWallet.address.slice(0, 6)}...{embeddedWallet.address.slice(-4)}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                    {/* Exchange selector for Quest 3 */}
                    {quest.id === "verify-exchange" && (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                          {t.onboarding.quest3SelectExchange}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {EXCHANGE_GUIDES.map((ex) => {
                            const labelMap: Record<string, string> = {
                              upbit: t.onboarding.quest3UpbitGuide,
                              bithumb: t.onboarding.quest3BithumbGuide,
                              coinone: t.onboarding.quest3CoinoneGuide,
                              korbit: t.onboarding.quest3KorbitGuide,
                            };
                            const isSelected = selectedExchange === ex.key;
                            return (
                              <button
                                key={ex.key}
                                onClick={() => setSelectedExchange(isSelected ? null : ex.key)}
                                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-accent-cyan/20 border-accent-cyan/50 border text-accent-cyan scale-[1.02]"
                                    : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                                }`}
                              >
                                {labelMap[ex.key]}
                              </button>
                            );
                          })}
                        </div>
                        {selectedExchange && (() => {
                          const guide = EXCHANGE_GUIDES.find(e => e.key === selectedExchange);
                          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                          const href = isMobile && guide?.mobileUrl ? guide.mobileUrl : guide?.url;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
                            >
                              <span>&#x2197;</span>
                              <span>{t.onboarding.quest3OpenGuide}</span>
                            </a>
                          );
                        })()}
                      </div>
                    )}
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded accent-accent-cyan"
                      />
                      <span className="text-gray-300 text-sm">
                        {quest.action.confirmText}
                      </span>
                    </label>
                    <button
                      onClick={handleAction}
                      disabled={!confirmed}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  </>
                )}

                {/* Balance check (Quest 4: Receive TON) */}
                {quest.action.type === "balance-check" && (
                  <div className="space-y-4">
                    {/* Calculator button */}
                    <button
                      onClick={() => {
                        setShowCalculator(true);
                        if (!stakingData) {
                          fetchStakingData().then(setStakingData).catch(console.error);
                        }
                      }}
                      className="w-full py-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-sm font-medium hover:bg-accent-amber/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-base">&#x1F4B0;</span>
                      <span>{t.onboarding.openCalculator}</span>
                    </button>

                    {/* Balance status */}
                    {tonBalance === null ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-4 h-4 border-2 border-accent-cyan/50 border-t-accent-cyan rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm">{t.onboarding.balanceChecking}</span>
                      </div>
                    ) : tonBalance === 0 && !balanceWaiting ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/30">
                          <span className="text-lg">&#x23F3;</span>
                          <span className="text-accent-amber text-sm">{t.onboarding.balanceZero}</span>
                        </div>
                        <button
                          onClick={() => checkTonBalance()}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          {t.onboarding.balanceRefresh}
                        </button>
                      </div>
                    ) : balanceConfirmed ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <span className="text-lg">&#x2705;</span>
                          <span className="text-emerald-400 text-sm">
                            {t.onboarding.balanceConfirmed.replace("{amount}", tonBalance!.toLocaleString("en-US", { maximumFractionDigits: 2 }))}
                          </span>
                        </div>
                        <button
                          onClick={handleAction}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                        >
                          {quest.action.label}
                        </button>
                      </div>
                    ) : balanceWaiting ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                          <div className="w-4 h-4 border-2 border-accent-cyan/50 border-t-accent-cyan rounded-full animate-spin" />
                          <span className="text-accent-cyan text-sm">{t.onboarding.balanceWaiting}</span>
                        </div>
                        <button
                          onClick={() => checkTonBalance()}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          {t.onboarding.balanceRefresh}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
                          <div className="text-accent-cyan text-sm font-semibold mb-1">
                            {t.onboarding.balanceFound.replace("{amount}", tonBalance.toLocaleString("en-US", { maximumFractionDigits: 2 }))} TON
                          </div>
                          <div className="text-gray-400 text-xs">
                            {t.onboarding.balanceAsk}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBalanceConfirmed(true)}
                            className="flex-1 py-3 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/30 transition-colors"
                          >
                            {t.onboarding.balanceYes}
                          </button>
                          <button
                            onClick={() => setBalanceWaiting(true)}
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/10 transition-colors"
                          >
                            {t.onboarding.balanceNo}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Substeps (Quest 2: Bridge to MetaMask) */}
                {isSubStepQuest && currentSubStep && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      {quest.substeps!.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i < subStepIndex
                              ? "bg-accent-cyan"
                              : i === subStepIndex
                                ? "bg-accent-cyan/60 animate-pulse"
                                : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-accent-cyan/80 mb-1">
                      {t.onboarding.substepLabel
                        .replace("{current}", String(subStepIndex + 1))
                        .replace("{total}", String(quest.substeps!.length))}
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {currentSubStep.instruction}
                    </p>

                    {/* Action button */}
                    {(currentSubStep.action.type === "privy-login" || currentSubStep.action.type === "link") && (
                      <button
                        onClick={() => handleSubStepAction(currentSubStep)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue/80 to-accent-navy/80 text-white font-semibold hover:scale-[1.02] transition-transform"
                      >
                        {currentSubStep.action.label}
                      </button>
                    )}

                    {/* Copy reminder after key export */}
                    {quest.id === "bridge-metamask" && subStepIndex === 1 && keyExported && !subStepConfirmed && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-sm">
                        <span className="text-base">&#x1F511;</span>
                        <span>{t.onboarding.keyCopyReminder}</span>
                      </div>
                    )}

                    {/* Re-export key button on substep 3 (import key into MetaMask) */}
                    {quest.id === "bridge-metamask" && subStepIndex === 2 && embeddedWallet && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500">{t.onboarding.exportKeyAgainHint}</p>
                        <button
                          onClick={async () => {
                            await exportWallet({ address: embeddedWallet.address });
                          }}
                          className="w-full py-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-sm font-medium hover:bg-accent-amber/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="text-base">&#x1F511;</span>
                          <span>{t.onboarding.exportKeyAgain}</span>
                        </button>
                      </div>
                    )}

                    {currentSubStep.verify && currentSubStep.verify !== "metamask-installed" && (
                      <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={subStepConfirmed}
                          onChange={(e) => setSubStepConfirmed(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded accent-accent-cyan"
                        />
                        <span className="text-gray-300 text-sm">
                          {currentSubStep.verify}
                        </span>
                      </label>
                    )}

                    {currentSubStep.verify === "metamask-installed" && !subStepConfirmed && (
                      <div className="space-y-3">
                        <p className="text-gray-400 text-xs text-center">
                          {t.onboarding.metamaskInstallCheck}
                        </p>
                        <button
                          onClick={() => {
                            const isMobile = window.innerWidth < 768;
                            if (isMobile) {
                              setSubStepConfirmed(true);
                              return;
                            }
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const ethereum = (window as any).ethereum;
                            if (ethereum) {
                              setSubStepConfirmed(true);
                            } else {
                              alert(t.onboarding.metamaskNotYet);
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-emerald-500 text-black font-bold text-sm hover:scale-[1.02] transition-transform animate-pulse shadow-lg shadow-accent-cyan/25"
                        >
                          {t.onboarding.verifyInstall}
                        </button>
                      </div>
                    )}

                    {currentSubStep.verify === "metamask-installed" && subStepConfirmed && (
                      <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm font-semibold">
                        <span>&#10003;</span>
                        <span>MetaMask Verified</span>
                      </div>
                    )}

                    {(!currentSubStep.verify || currentSubStep.verify !== "metamask-installed" || subStepConfirmed) && (
                      <button
                        onClick={handleSubStepNext}
                        disabled={!subStepConfirmed}
                        className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${
                          subStepConfirmed
                            ? "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02]"
                            : "bg-emerald-600/40 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        {subStepIndex < quest.substeps!.length - 1
                          ? t.onboarding.clickToNext
                          : t.onboarding.complete}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verifying Phase */}
          {phase === "verifying" && (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              <p className="text-gray-400 text-sm mb-4 text-center">
                {t.onboarding.metamaskInstallCheck}
              </p>
              <button
                onClick={handleVerify}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold hover:scale-[1.02] transition-transform"
              >
                {t.onboarding.verifyInstall}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calculator Overlay — full screen on mobile, laptop frame on desktop */}
      {showCalculator && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="sm:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-start p-4 pt-6">
              <button
                onClick={() => setShowCalculator(false)}
                className="self-end mb-3 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-gray-400 text-xs"
              >
                ✕ Close
              </button>
              {stakingData ? (
                <ProfitSimulator data={stakingData} onClose={() => setShowCalculator(false)} />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">{t.onboarding.calcTitle}</p>
                </div>
              )}
            </div>
          </div>
          {/* Desktop: laptop frame */}
          <div className="hidden sm:block">
            <LaptopVideoOverlay
              bgImage={bgImage}
              onClose={() => setShowCalculator(false)}
            >
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
                {stakingData ? (
                  <ProfitSimulator data={stakingData} onClose={() => setShowCalculator(false)} />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">{t.onboarding.calcTitle}</p>
                  </div>
                )}
              </div>
            </LaptopVideoOverlay>
          </div>
        </>
      )}

      {/* Intro Cinematic Overlay */}
      {showCinematic && <IntroCinematic onComplete={handleCinematicComplete} />}
    </div>
  );
}
