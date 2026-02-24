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
      className="cursor-pointer select-none w-full"
      onClick={() => (done ? onNext() : skip())}
    >
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
        {/* Name plate */}
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
          <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
          {line.mood && moodLabel && (
            <span className="text-xs text-accent-cyan/60">
              {moodLabel}
            </span>
          )}
        </div>
        <p className="text-gray-100 text-base sm:text-lg leading-relaxed min-h-[3rem]">
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-5 bg-accent-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {done && (
          <div className="text-right mt-3">
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

// ─── Background Image per Quest ───────────────────────────────────────

const QUEST_BACKGROUNDS: Record<string, string> = {
  "install-metamask": "/vn-bg-default.png",
  "create-wallet": "/vn-bg-default.png",
  "connect-toki": "/vn-bg-default.png",
  "verify-upbit": "/vn-bg-default.png",
  "receive-ton": "/vn-bg-default.png",
  "first-stake": "/vn-bg-default.png",
};

// ─── Character Display (Visual Novel Style) ──────────────────────────

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
    <div className="absolute bottom-44 sm:bottom-52 left-1/2 -translate-x-1/2 z-10">
      <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] overflow-visible">
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

  // ─── Render: All Complete ──────────────────────────────────────────

  if (isAllComplete) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/vn-bg-default.png')` }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Character */}
        <TokiCharacter mood="proud" phase="badge" />

        {/* Bottom Panel */}
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
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg glow-blue hover:scale-105 transition-transform"
              >
                {t.onboarding.goToDashboard}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Visual Novel Layout ────────────────────────────────────

  const bgImage = QUEST_BACKGROUNDS[quest?.id] || "/vn-bg-default.png";

  return (
    <div className="fixed inset-0 overflow-hidden" ref={questAreaRef}>
      {/* ── Layer 0: Background Image (fixed per quest) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* ── Layer 1: Top HUD (quest progress + XP) ── */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-16">
        <div className="px-4 sm:px-6 max-w-3xl mx-auto">
          {/* Quest step dots + XP */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {QUESTS.map((q, i) => (
                <div
                  key={q.id}
                  className={`transition-all duration-300 rounded-full ${
                    completedQuests.has(q.id)
                      ? "w-8 h-2 bg-accent-cyan"
                      : i === questIndex
                        ? "w-8 h-2 bg-accent-cyan/60 animate-pulse"
                        : "w-2 h-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-mono-num text-accent-amber drop-shadow-lg">
              {totalXp} XP
            </span>
          </div>
          {/* Quest title overlay */}
          <div className="mt-2">
            <span className="text-xs text-accent-cyan/80 drop-shadow">
              {t.onboarding.quest} {questIndex + 1} / {QUESTS.length}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
              {quest.title}
            </h2>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Character (center-bottom, above dialogue) ── */}
      <TokiCharacter mood={currentLine?.mood} phase={phase} />

      {/* ── Layer 3: Bottom dialogue / action panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">

          {/* Connected Address (shown during connect quest success) */}
          {connectedAddr && phase === "success" && quest.id === "connect-toki" && (
            <div className="mx-4 mb-2 p-3 rounded-lg bg-black/50 backdrop-blur border border-accent-cyan/20 text-center">
              <div className="text-xs text-gray-400 mb-1">{t.onboarding.yourAddress}</div>
              <div className="font-mono text-sm text-accent-cyan break-all">
                {connectedAddr}
              </div>
            </div>
          )}

          {/* Badge Reveal */}
          {phase === "badge" && (
            <div className="px-4 mb-2">
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

          {/* Dialogue (intro / success phases) */}
          {(phase === "intro" || phase === "success") && currentLine && (
            <DialogueBox
              line={currentLine}
              onNext={handleNextDialogue}
              isLast={dialogueIndex === dialogues.length - 1}
              moodLabel={currentLine.mood ? getMoodLabel(currentLine.mood, t.onboarding) : undefined}
            />
          )}

          {/* Action Phase */}
          {phase === "action" && quest.action && (
            <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
              <div className="space-y-4">
                {(quest.action.type === "link" || quest.action.type === "connect" || quest.action.type === "navigate") && (
                  <button
                    onClick={handleAction}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-semibold text-lg hover:scale-[1.02] transition-transform"
                  >
                    {quest.action.label}
                  </button>
                )}

                {quest.action.type === "confirm" && (
                  <>
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
    </div>
  );
}
