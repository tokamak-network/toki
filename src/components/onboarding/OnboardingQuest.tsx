"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { Dictionary } from "@/locales";

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
  type: "link" | "connect" | "confirm" | "balance-check" | "navigate";
  label: string;
  url?: string;
  route?: string;
  confirmText?: string;
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
  verify?: "metamask-installed" | "metamask-connected" | "user-confirm";
  success: DialogueLine[];
}

function buildQuests(t: Dictionary["onboarding"]): Quest[] {
  return [
    {
      id: "install-metamask",
      title: t.quest1Title,
      subtitle: t.quest1Subtitle,
      badge: t.quest1Badge,
      badgeIcon: "V",
      xp: 100,
      intro: [
        { text: t.quest1Intro1, mood: "welcome" },
        { text: t.quest1Intro2, mood: "welcome" },
        { text: t.quest1Intro3, mood: "explain" },
        { text: t.quest1Intro4, mood: "explain" },
        { text: t.quest1Intro5, mood: "cheer" },
      ],
      action: { type: "link", label: t.quest1Action, url: "https://metamask.io/download/" },
      verify: "metamask-installed",
      success: [
        { text: t.quest1Success1, mood: "excited" },
        { text: t.quest1Success2, mood: "wink" },
      ],
    },
    {
      id: "create-wallet",
      title: t.quest2Title,
      subtitle: t.quest2Subtitle,
      badge: t.quest2Badge,
      badgeIcon: "K",
      xp: 150,
      intro: [
        { text: t.quest2Intro1, mood: "explain" },
        { text: t.quest2Intro2, mood: "explain" },
        { text: t.quest2Intro3, mood: "thinking" },
        { text: t.quest2Intro4, mood: "thinking" },
        { text: t.quest2Intro5, mood: "thinking" },
        { text: t.quest2Intro6, mood: "cheer" },
      ],
      action: { type: "confirm", label: t.quest2ActionLabel, confirmText: t.quest2Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest2Success1, mood: "welcome" },
        { text: t.quest2Success2, mood: "thinking" },
        { text: t.quest2Success3, mood: "excited" },
      ],
    },
    {
      id: "connect-toki",
      title: t.quest3Title,
      subtitle: t.quest3Subtitle,
      badge: t.quest3Badge,
      badgeIcon: "F",
      xp: 200,
      intro: [
        { text: t.quest3Intro1, mood: "excited" },
        { text: t.quest3Intro2, mood: "explain" },
        { text: t.quest3Intro3, mood: "wink" },
      ],
      action: { type: "connect", label: t.quest3Action },
      verify: "metamask-connected",
      success: [
        { text: t.quest3Success1, mood: "excited" },
        { text: t.quest3Success2, mood: "explain" },
        { text: t.quest3Success3, mood: "wink" },
      ],
    },
    {
      id: "verify-upbit",
      title: t.quest4Title,
      subtitle: t.quest4Subtitle,
      badge: t.quest4Badge,
      badgeIcon: "U",
      xp: 300,
      intro: [
        { text: t.quest4Intro1, mood: "explain" },
        { text: t.quest4Intro2, mood: "cheer" },
        { text: t.quest4Intro3, mood: "explain" },
        { text: t.quest4Intro4, mood: "explain" },
        { text: t.quest4Intro5, mood: "explain" },
        { text: t.quest4Intro6, mood: "thinking" },
        { text: t.quest4Intro7, mood: "cheer" },
      ],
      action: { type: "confirm", label: t.quest4ActionLabel, confirmText: t.quest4Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest4Success1, mood: "excited" },
        { text: t.quest4Success2, mood: "welcome" },
        { text: t.quest4Success3, mood: "proud" },
      ],
    },
    {
      id: "receive-ton",
      title: t.quest5Title,
      subtitle: t.quest5Subtitle,
      badge: t.quest5Badge,
      badgeIcon: "T",
      xp: 250,
      intro: [
        { text: t.quest5Intro1, mood: "excited" },
        { text: t.quest5Intro2, mood: "explain" },
        { text: t.quest5Intro3, mood: "thinking" },
        { text: t.quest5Intro4, mood: "cheer" },
      ],
      action: { type: "confirm", label: t.quest5ActionLabel, confirmText: t.quest5Confirm },
      verify: "user-confirm",
      success: [
        { text: t.quest5Success1, mood: "excited" },
        { text: t.quest5Success2, mood: "proud" },
      ],
    },
    {
      id: "first-stake",
      title: t.quest6Title,
      subtitle: t.quest6Subtitle,
      badge: t.quest6Badge,
      badgeIcon: "S",
      xp: 500,
      intro: [
        { text: t.quest6Intro1, mood: "excited" },
        { text: t.quest6Intro2, mood: "proud" },
        { text: t.quest6Intro3, mood: "explain" },
        { text: t.quest6Intro4, mood: "cheer" },
      ],
      action: { type: "navigate", label: t.quest6Action, route: "/dashboard" },
      verify: "user-confirm",
      success: [
        { text: t.quest6Success1, mood: "excited" },
        { text: t.quest6Success2, mood: "proud" },
        { text: t.quest6Success3, mood: "explain" },
        { text: t.quest6Success4, mood: "wink" },
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

function ProgressBar({
  current,
  total,
  xp,
}: {
  current: number;
  total: number;
  xp: number;
}) {
  const { t } = useTranslation();
  const pct = (current / total) * 100;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">
          {t.onboarding.quest} {Math.min(current + 1, total)} / {total}
        </span>
        <span className="text-sm font-mono-num text-accent-amber">
          {xp} XP
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  index,
  status,
  isCurrent,
  onClick,
}: {
  quest: Quest;
  index: number;
  status: "locked" | "current" | "completed";
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "locked"}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        status === "completed"
          ? "bg-accent-blue/10 border border-accent-blue/30"
          : isCurrent
            ? "bg-white/10 border border-accent-cyan/40 scale-[1.02]"
            : "bg-white/5 border border-transparent opacity-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            status === "completed"
              ? "bg-accent-blue text-white"
              : isCurrent
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40"
                : "bg-white/10 text-gray-500"
          }`}
        >
          {status === "completed" ? quest.badgeIcon : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-semibold ${status === "completed" ? "text-accent-sky" : isCurrent ? "text-gray-200" : "text-gray-500"}`}
          >
            {quest.title}
          </div>
          <div className="text-xs text-gray-500 truncate">{quest.subtitle}</div>
        </div>
        {status === "completed" && (
          <div className="text-xs text-accent-amber font-mono-num shrink-0">
            +{quest.xp} XP
          </div>
        )}
      </div>
    </button>
  );
}

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
}: {
  line: DialogueLine;
  onNext: () => void;
  isLast: boolean;
  moodLabel?: string;
}) {
  const { displayed, done, skip } = useTypewriter(line.text, 35);
  const { t } = useTranslation();

  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => (done ? onNext() : skip())}
    >
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-cyan font-semibold text-sm">Toki</span>
          {line.mood && moodLabel && (
            <span className="text-xs text-gray-500">
              {moodLabel}
            </span>
          )}
        </div>
        <p className="text-gray-200 text-base leading-relaxed min-h-[2.5rem]">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {done && (
          <div className="text-right mt-2">
            <span className="text-xs text-gray-500">
              {isLast ? t.onboarding.clickToContinue : t.onboarding.clickToNext}
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

// ─── Sparkle Particles ───────────────────────────────────────────────

function SparkleParticles({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; delay: number; color: string }[]
  >([]);

  useEffect(() => {
    if (trigger === 0) return;
    const colors = ["#22d3ee", "#f59e0b", "#60a5fa", "#a855f7", "#ec4899"];
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 6 + Math.random() * 8,
      delay: i * 0.15 + Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute -inset-10 pointer-events-none overflow-visible -z-10">
      {particles.map((p) => {
        const edge = Math.random() > 0.5;
        const x = edge
          ? (Math.random() > 0.5 ? Math.random() * 15 : 85 + Math.random() * 15)
          : p.x;
        const y = !edge
          ? (Math.random() > 0.5 ? Math.random() * 15 : 85 + Math.random() * 15)
          : p.y;
        return (
          <div
            key={p.id}
            className="absolute animate-sparkle"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: "50%",
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Confetti Effect ─────────────────────────────────────────────────

function ConfettiEffect({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<
    { id: number; x: number; color: string; delay: number; rotate: number }[]
  >([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const colors = ["#22d3ee", "#f59e0b", "#60a5fa", "#a855f7", "#ec4899", "#4ade80"];
    const newPieces = Array.from({ length: 24 }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: i * 0.1 + Math.random() * 0.5,
      rotate: Math.random() * 360,
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), 6000);
    return () => clearTimeout(timer);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="absolute -inset-12 pointer-events-none overflow-visible -z-10">
      {pieces.map((p) => {
        const x = Math.random() > 0.5
          ? Math.random() * 20
          : 80 + Math.random() * 20;
        return (
          <div
            key={p.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${x}%`,
              top: "-8px",
              width: "8px",
              height: "8px",
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Character Display ────────────────────────────────────────────────

function TokiCharacter({ mood, phase }: { mood?: Mood; phase?: Phase }) {
  const effectiveMood: Mood =
    phase === "badge"
      ? "proud"
      : phase === "action" || phase === "verifying"
        ? "cheer"
        : mood || "welcome";

  const imageSrc = MOOD_IMAGES[effectiveMood];
  const [prevSrc, setPrevSrc] = useState(imageSrc);
  const [transitioning, setTransitioning] = useState(false);
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const prevMoodRef = useRef<Mood>(effectiveMood);

  useEffect(() => {
    if (imageSrc !== prevSrc) {
      if (imageSrc !== MOOD_IMAGES[prevMoodRef.current]) {
        setSparkleTrigger((n) => n + 1);
      }
      prevMoodRef.current = effectiveMood;
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevSrc(imageSrc);
        setTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageSrc, prevSrc, effectiveMood]);

  const glowColor = MOOD_GLOW[effectiveMood];
  const isBadge = phase === "badge";

  return (
    <div className="relative w-48 sm:w-56 lg:w-64 overflow-visible">
      <div
        className="absolute inset-0 rounded-3xl blur-3xl -z-10 animate-glow-pulse transition-colors duration-700"
        style={{ backgroundColor: glowColor }}
      />
      <div
        className="absolute -inset-4 rounded-[2rem] blur-2xl -z-20 opacity-20 transition-colors duration-700"
        style={{ backgroundColor: glowColor }}
      />
      <SparkleParticles trigger={sparkleTrigger} />
      <ConfettiEffect active={isBadge} />
      <Image
        src={transitioning ? prevSrc : imageSrc}
        alt="Toki"
        width={300}
        height={300}
        className={`relative z-10 rounded-2xl drop-shadow-xl transition-opacity duration-200 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
        priority
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

type Phase = "intro" | "action" | "verifying" | "success" | "badge";

export default function OnboardingQuest() {
  const router = useRouter();
  const { t } = useTranslation();
  const QUESTS = buildQuests(t.onboarding);
  const [questIndex, setQuestIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [connectedAddr, setConnectedAddr] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(
    new Set()
  );
  const questAreaRef = useRef<HTMLDivElement>(null);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("toki-onboarding");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setQuestIndex(data.questIndex || 0);
        setTotalXp(data.totalXp || 0);
        setCompletedQuests(new Set(data.completed || []));
      } catch {
        // ignore
      }
    }
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

  const handleNextDialogue = () => {
    if (!dialogues) return;
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else if (phase === "intro") {
      setPhase("action");
    } else if (phase === "success") {
      setPhase("badge");
    }
  };

  const handleAction = async () => {
    if (!quest?.action) return;

    if (quest.action.type === "link") {
      window.open(quest.action.url, "_blank");
      setPhase("verifying");
    } else if (quest.action.type === "connect") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          alert(t.onboarding.metamaskNotDetected);
          return;
        }
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          setConnectedAddr(accounts[0]);
          handleVerifySuccess();
        }
      } catch {
        alert(t.onboarding.metamaskCancelled);
      }
    } else if (quest.action.type === "confirm") {
      if (!confirmed) return;
      handleVerifySuccess();
    } else if (quest.action.type === "navigate") {
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
  };

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

  const handleQuestCardClick = (index: number) => {
    if (index <= questIndex) {
      // Can review completed quests but not change progress
    }
  };

  // ─── Render: All Complete ──────────────────────────────────────────

  if (isAllComplete) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center animate-fade-in">
          <TokiCharacter mood="proud" phase="badge" />
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gradient mb-4">
              {t.onboarding.allClear}
            </h1>
            <p className="text-gray-400 mb-2">
              {t.onboarding.allClearDesc}
            </p>
            <p className="text-accent-amber font-mono-num text-xl mb-8">
              {t.onboarding.totalXp.replace("{xp}", String(totalXp))}
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {QUESTS.map((q) => (
                <div
                  key={q.id}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-lg font-bold text-white"
                  title={q.badge}
                >
                  {q.badgeIcon}
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
            >
              {t.onboarding.goToDashboard}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Quest in Progress ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-grid pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* XP Display */}
        <div className="flex justify-end mb-4">
          <span className="text-sm font-mono-num text-accent-amber">
            {totalXp} XP
          </span>
        </div>
        <ProgressBar
          current={questIndex}
          total={QUESTS.length}
          xp={totalXp}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Quest List */}
          <div className="lg:w-64 shrink-0">
            <h3 className="text-sm text-gray-500 mb-3 font-semibold">
              {t.onboarding.quests}
            </h3>
            <div className="space-y-2">
              {QUESTS.map((q, i) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  index={i}
                  status={
                    completedQuests.has(q.id)
                      ? "completed"
                      : i === questIndex
                        ? "current"
                        : "locked"
                  }
                  isCurrent={i === questIndex}
                  onClick={() => handleQuestCardClick(i)}
                />
              ))}
            </div>
          </div>

          {/* Right: Quest Content */}
          <div className="flex-1" ref={questAreaRef}>
            {/* Quest Title */}
            <div className="mb-6">
              <div className="text-xs text-accent-cyan mb-1">
                {t.onboarding.quest} {questIndex + 1}
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                {quest.title}
              </h2>
              <p className="text-sm text-gray-500">{quest.subtitle}</p>
            </div>

            {/* Character + Dialogue Area */}
            <div className="flex flex-col items-center gap-6">
              {/* Toki Character */}
              <TokiCharacter mood={currentLine?.mood} phase={phase} />

              {/* Connected Address */}
              {connectedAddr && phase === "success" && quest.id === "connect-toki" && (
                <div className="w-full p-3 rounded-lg bg-white/5 border border-accent-cyan/20 text-center">
                  <div className="text-xs text-gray-500 mb-1">{t.onboarding.yourAddress}</div>
                  <div className="font-mono text-sm text-accent-cyan break-all">
                    {connectedAddr}
                  </div>
                </div>
              )}

              {/* Badge Reveal */}
              {phase === "badge" && (
                <div className="w-full">
                  <BadgeReveal quest={quest} />
                  <button
                    onClick={handleBadgeDone}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold hover:scale-[1.02] transition-transform"
                  >
                    {questIndex < QUESTS.length - 1
                      ? t.onboarding.nextQuest
                      : t.onboarding.complete}
                  </button>
                </div>
              )}

              {/* Dialogue */}
              {(phase === "intro" || phase === "success") && currentLine && (
                <div className="w-full">
                  <DialogueBox
                    line={currentLine}
                    onNext={handleNextDialogue}
                    isLast={dialogueIndex === dialogues.length - 1}
                    moodLabel={currentLine.mood ? getMoodLabel(currentLine.mood, t.onboarding) : undefined}
                  />
                </div>
              )}

              {/* Action Phase */}
              {phase === "action" && quest.action && (
                <div className="w-full space-y-4">
                  {quest.action.type === "link" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}

                  {quest.action.type === "connect" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}

                  {quest.action.type === "confirm" && (
                    <div className="space-y-3">
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
                    </div>
                  )}

                  {quest.action.type === "navigate" && (
                    <button
                      onClick={handleAction}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                    >
                      {quest.action.label}
                    </button>
                  )}
                </div>
              )}

              {/* Verifying Phase (MetaMask install check) */}
              {phase === "verifying" && (
                <div className="w-full space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-gray-400 text-sm mb-4">
                      {t.onboarding.metamaskInstallCheck}
                    </p>
                    <button
                      onClick={handleVerify}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold hover:scale-[1.02] transition-transform"
                    >
                      {t.onboarding.verifyInstall}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
