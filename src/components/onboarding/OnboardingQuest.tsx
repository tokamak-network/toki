"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { Dictionary } from "@/locales";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import IntroCinematic from "./IntroCinematic";
import LaptopVideoOverlay from "./LaptopVideoOverlay";
import SeigniorageRain from "@/components/dashboard/SeigniorageRain";
import { useAchievement } from "@/components/providers/AchievementProvider";

// ─── Quest Data ───────────────────────────────────────────────────────

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink";

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/toki-welcome.png",
  explain: "/toki-explain.png",
  thinking: "/toki-thinking.png",
  excited: "/toki-excited.png",
  proud: "/toki-proud.png",
  cheer: "/toki-cheer.png",
  wink: "/toki-wink.png",
};

interface DialogueLine {
  text: string;
  mood?: Mood;
}

interface QuestAction {
  type: "link" | "privy-login" | "confirm" | "navigate" | "substeps";
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
        { text: t.quest1Intro2, mood: "explain" },
        { text: t.quest1Intro3, mood: "cheer" },
      ],
      action: { type: "privy-login", label: t.quest1Action },
      verify: "privy-authenticated",
      success: [
        { text: t.quest1Success1, mood: "excited" },
        { text: t.quest1Success2, mood: "wink" },
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
        { text: t.quest2Intro1, mood: "explain" },
        { text: t.quest2Intro2, mood: "thinking" },
        { text: t.quest2Intro3, mood: "cheer" },
      ],
      action: { type: "substeps", label: t.quest2Action },
      verify: "user-confirm",
      success: [
        { text: t.quest2Success1, mood: "excited" },
        { text: t.quest2Success2, mood: "explain" },
        { text: t.quest2Success3, mood: "wink" },
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
        { text: t.quest3Intro1, mood: "excited" },
        { text: t.quest3Intro2, mood: "explain" },
        { text: t.quest3Intro3, mood: "cheer" },
      ],
      action: { type: "confirm", label: t.quest3ActionLabel, confirmText: t.quest3Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest3Success1, mood: "excited" },
        { text: t.quest3Success2, mood: "welcome" },
        { text: t.quest3Success3, mood: "proud" },
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
        { text: t.quest4Intro2, mood: "explain" },
        { text: t.quest4Intro3, mood: "excited" },
        { text: t.quest4Intro4, mood: "wink" },
      ],
      action: { type: "confirm", label: t.quest4ActionLabel, confirmText: t.quest4Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest4Success1, mood: "excited" },
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
        { text: t.quest5Intro2, mood: "proud" },
        { text: t.quest5Intro3, mood: "explain" },
        { text: t.quest5Intro4, mood: "cheer" },
      ],
      action: { type: "navigate", label: t.quest5Action, route: "/dashboard" },
      verify: "user-confirm",
      success: [
        { text: t.quest5Success1, mood: "excited" },
        { text: t.quest5Success2, mood: "proud" },
        { text: t.quest5Success3, mood: "explain" },
        { text: t.quest5Success4, mood: "wink" },
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
  isLast,
  moodLabel,
  questProgress,
}: {
  line: DialogueLine;
  onNext: () => void;
  isLast: boolean;
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
          {questProgress && (
            <span className="text-xs text-gray-500 tabular-nums">{questProgress}</span>
          )}
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
};

// ─── Exchange Guide Links ─────────────────────────────────────────────

const EXCHANGE_GUIDES = [
  {
    key: "upbit" as const,
    url: "https://support.upbit.com/hc/ko/articles/6713306957977-%EA%B0%9C%EC%9D%B8%EC%A7%80%EA%B0%91%EC%A3%BC%EC%86%8C-%EB%93%B1%EB%A1%9D-%EB%B0%A9%EB%B2%95",
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

// ─── Background Image per Quest ───────────────────────────────────────

const QUEST_BACKGROUNDS: Record<string, string> = {
  "create-wallet": "/backgrounds/1.png",
  "bridge-metamask": "/backgrounds/2.png",
  "verify-exchange": "/backgrounds/3.png",
  "receive-ton": "/backgrounds/staking-night.png",
  "first-stake": "/backgrounds/staking-sunrise.png",
};

// ─── Tutorial Video URLs ──────────────────────────────────────────────

const TUTORIAL_VIDEOS: Record<string, string> = {
  "create-wallet": "https://www.youtube.com/embed/UURB7Tc7D4M?start=129&autoplay=1",
  "install-metamask": "https://www.youtube.com/embed/gGr7GU27_e8?autoplay=1",
  "import-key": "https://www.youtube.com/embed/gGr7GU27_e8?start=24&autoplay=1",
  "verify-exchange": "https://www.youtube.com/embed/VIDEO_ID?autoplay=1",
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
      <div className={`relative overflow-visible ${
        compact
          ? "w-40 sm:w-48 md:w-56 lg:w-64"
          : "w-64 sm:w-80 md:w-96 lg:w-[28rem]"
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
          className={`relative z-10 drop-shadow-2xl transition-opacity duration-200 w-full h-auto ${
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
  const { ready, authenticated, login, exportWallet } = usePrivy();
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
  const [showVideo, setShowVideo] = useState(false);
  const [videoKey, setVideoKey] = useState<string>("create-wallet");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAmount, setCalcAmount] = useState("");
  const [showCinematic, setShowCinematic] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_cinematicComplete, setCinematicComplete] = useState(false);
  const [cinematicJustFinished, setCinematicJustFinished] = useState(false);
  const questAreaRef = useRef<HTMLDivElement>(null);

  // Load progress from localStorage (with migration) + cinematic check
  useEffect(() => {
    const saved = localStorage.getItem("toki-onboarding");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const completed: string[] = data.completed || [];
        // Migrate: if old quest IDs detected, reset progress
        const hasOldIds = completed.some((id: string) => OLD_QUEST_IDS.includes(id));
        if (hasOldIds) {
          localStorage.removeItem("toki-onboarding");
          return;
        }
        setQuestIndex(data.questIndex || 0);
        setTotalXp(data.totalXp || 0);
        setCompletedQuests(new Set(completed));
      } catch {
        // ignore
      }
    }

    // Show intro cinematic on first visit
    // TODO: Re-enable localStorage check when done developing intro
    // const introSeen = localStorage.getItem("toki-intro-seen");
    // if (!introSeen) {
    //   setShowCinematic(true);
    // } else {
    //   setCinematicComplete(true);
    // }
    setShowCinematic(true);
  }, []);

  // Save progress
  const saveProgress = useCallback(
    (qi: number, xp: number, completed: Set<string>) => {
      localStorage.setItem(
        "toki-onboarding",
        JSON.stringify({
          questIndex: qi,
          totalXp: xp,
          completed: Array.from(completed),
        })
      );
    },
    []
  );

  const quest = QUESTS[questIndex];
  const dialogues =
    phase === "intro" || phase === "action" || phase === "verifying"
      ? quest?.intro
      : quest?.success;
  const currentLine = dialogues?.[dialogueIndex];
  const isAllComplete = questIndex >= QUESTS.length;

  // Auto-scroll to quest area
  useEffect(() => {
    questAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, questIndex]);

  // Auto-detect Privy authentication for Quest 1
  useEffect(() => {
    if (phase === "action" && quest?.action?.type === "privy-login") {
      if (authenticated && embeddedWallet) {
        handleVerifySuccess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, embeddedWallet, phase, quest?.action?.type]);

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
    } else if (quest.action.type === "navigate") {
      handleVerifySuccess();
    } else if (quest.action.type === "substeps") {
      // Substeps rendering is handled inline
    }
  };

  const handleSubStepAction = async (substep: QuestSubStep) => {
    if (substep.action.type === "privy-login") {
      if (embeddedWallet) {
        await exportWallet({ address: embeddedWallet.address });
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
    // TODO: Re-enable when done developing intro
    // localStorage.setItem("toki-intro-seen", "1");
  }, []);

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
      <div className="fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/vn-bg-default.png')` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <TokiCharacter mood="proud" phase="badge" />
        <div className="absolute bottom-0 left-0 right-0 z-20">
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
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {QUESTS.map((q) => (
                  <div
                    key={q.id}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-lg font-bold text-white"
                    title={q.badge}
                  >
                    {q.badgeIcon}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
                >
                  {t.onboarding.goToDashboard}
                </button>
                <button
                  onClick={() => router.push("/explore")}
                  className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/15 hover:scale-105 transition-all"
                >
                  {t.onboarding.exploreEcosystem}
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

  return (
    <div className="fixed inset-0 overflow-hidden" ref={questAreaRef}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Top HUD removed — progress shown inside dialogue box */}

      {/* ── Character + Bottom Panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">
          <div className={cinematicJustFinished ? "animate-character-entrance" : ""}>
            <TokiCharacter mood={currentLine?.mood} phase={phase} compact={quest.id === "verify-exchange" && phase === "action"} />
          </div>

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
            <div className="px-4 mb-2">
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
              isLast={dialogueIndex === dialogues.length - 1}
              moodLabel={currentLine.mood ? getMoodLabel(currentLine.mood, t.onboarding) : undefined}
              questProgress={`${questIndex + 1} / ${QUESTS.length}`}
            />
          )}

          {/* Action Phase */}
          {phase === "action" && quest.action && (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              <div className="space-y-4">

                {quest.action.type === "privy-login" && (
                  <>
                    {quest.id === "create-wallet" && (
                      <button
                        onClick={() => { setVideoKey("create-wallet"); setShowVideo(true); }}
                        className="w-full py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>▶</span>
                        <span>{t.onboarding.quest1VideoPrompt}</span>
                      </button>
                    )}
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
                    {/* Video button for Quest 3 */}
                    {quest.id === "verify-exchange" && (
                      <button
                        onClick={() => { setVideoKey("verify-exchange"); setShowVideo(true); }}
                        className="w-full py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>▶</span>
                        <span>{t.onboarding.quest3VideoPrompt}</span>
                      </button>
                    )}
                    {/* Exchange guide links for Quest 3 */}
                    {quest.id === "verify-exchange" && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                          {t.onboarding.quest3ExchangeGuide}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {EXCHANGE_GUIDES.map((ex) => {
                            const labelMap: Record<string, string> = {
                              upbit: t.onboarding.quest3UpbitGuide,
                              bithumb: t.onboarding.quest3BithumbGuide,
                              coinone: t.onboarding.quest3CoinoneGuide,
                              korbit: t.onboarding.quest3KorbitGuide,
                            };
                            return (
                              <a
                                key={ex.key}
                                href={ex.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-white/5 border border-white/10 text-accent-cyan text-sm font-medium hover:bg-white/10 hover:border-accent-cyan/30 transition-colors"
                              >
                                <span>&#x2197;</span>
                                {labelMap[ex.key]}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Calculator button for Quest 4 */}
                    {quest.id === "receive-ton" && (
                      <button
                        onClick={() => { setCalcAmount(""); setShowCalculator(true); }}
                        className="w-full py-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-sm font-medium hover:bg-accent-amber/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-base">&#x1F4B0;</span>
                        <span>{t.onboarding.openCalculator}</span>
                      </button>
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

                    {/* Video button for MetaMask install substep - shown as subtle link after verify area */}
                    {quest.id === "bridge-metamask" && subStepIndex === 0 && !subStepConfirmed && (
                      <div className="flex items-center justify-center gap-3 text-xs">
                        <button
                          onClick={() => handleSubStepAction(currentSubStep)}
                          className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                        >
                          {currentSubStep.action.label}
                        </button>
                        <button
                          onClick={() => { setVideoKey("install-metamask"); setShowVideo(true); }}
                          className="px-4 py-2 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition-colors flex items-center gap-1"
                        >
                          <span>▶</span>
                          <span>{t.onboarding.quest2VideoPrompt}</span>
                        </button>
                      </div>
                    )}

                    {/* Video button for MetaMask import key substep */}
                    {quest.id === "bridge-metamask" && subStepIndex === 2 && (
                      <button
                        onClick={() => { setVideoKey("import-key"); setShowVideo(true); }}
                        className="w-full py-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>▶</span>
                        <span>{t.onboarding.quest2ImportVideoPrompt}</span>
                      </button>
                    )}

                    {/* Action button - hide for metamask install substep (handled above) */}
                    {(currentSubStep.action.type === "privy-login" || currentSubStep.action.type === "link") &&
                      !(quest.id === "bridge-metamask" && subStepIndex === 0) && (
                      <button
                        onClick={() => handleSubStepAction(currentSubStep)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue/80 to-accent-navy/80 text-white font-semibold hover:scale-[1.02] transition-transform"
                      >
                        {currentSubStep.action.label}
                      </button>
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

      {/* Laptop Video Overlay */}
      {showVideo && TUTORIAL_VIDEOS[videoKey] && (
        <LaptopVideoOverlay
          videoUrl={TUTORIAL_VIDEOS[videoKey]}
          bgImage={bgImage}
          onClose={() => setShowVideo(false)}
        />
      )}

      {/* Laptop Calculator Overlay */}
      {showCalculator && (
        <LaptopVideoOverlay
          bgImage={bgImage}
          onClose={() => setShowCalculator(false)}
        >
          <div className="flex flex-col items-center justify-center h-full p-6 sm:p-10">
            <div className="w-full max-w-md space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
                {t.onboarding.calcTitle}
              </h2>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">{t.onboarding.calcInputLabel}</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder={t.onboarding.calcInputPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-mono placeholder:text-gray-600 focus:outline-none focus:border-accent-amber/50 focus:ring-1 focus:ring-accent-amber/30 transition-colors"
                  min="0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <SeigniorageRain inputAmount={calcAmount} totalStaked={11_000_000} />
            </div>
          </div>
        </LaptopVideoOverlay>
      )}

      {/* Intro Cinematic Overlay */}
      {showCinematic && <IntroCinematic onComplete={handleCinematicComplete} />}
    </div>
  );
}
