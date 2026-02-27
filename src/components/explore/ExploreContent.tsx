"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import type { Dictionary } from "@/locales";

// ─── Types ───────────────────────────────────────────────────────────

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink";
type ExplorePhase = "greeting" | "choosing" | "recommended" | "fullList";

interface DialogueLine {
  text: string;
  mood: Mood;
}

interface InterestCategory {
  id: string;
  icon: string;
  nameKey: keyof Dictionary["explore"];
  descKey: keyof Dictionary["explore"];
}

interface EcosystemService {
  id: string;
  icon: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  url: string;
  categories: string[];
  comingSoon: boolean;
  order: number;
}

interface CategoryReaction {
  categoryId: string;
  lines: DialogueLine[];
}

// ─── Constants ───────────────────────────────────────────────────────

const MOOD_IMAGES: Record<Mood, string> = {
  welcome: "/toki-welcome.png",
  explain: "/toki-explain.png",
  thinking: "/toki-thinking.png",
  excited: "/toki-excited.png",
  proud: "/toki-proud.png",
  cheer: "/toki-cheer.png",
  wink: "/toki-wink.png",
};

const MOOD_GLOW: Record<Mood, string> = {
  welcome: "rgba(74, 144, 217, 0.35)",
  explain: "rgba(96, 165, 250, 0.35)",
  thinking: "rgba(99, 102, 241, 0.35)",
  excited: "rgba(245, 158, 11, 0.45)",
  proud: "rgba(34, 211, 238, 0.40)",
  cheer: "rgba(168, 85, 247, 0.35)",
  wink: "rgba(236, 72, 153, 0.35)",
};

const CATEGORIES: InterestCategory[] = [
  { id: "earn", icon: "\uD83D\uDCB0", nameKey: "catEarnName", descKey: "catEarnDesc" },
  { id: "play", icon: "\uD83C\uDFAE", nameKey: "catPlayName", descKey: "catPlayDesc" },
  { id: "build", icon: "\uD83D\uDEE0", nameKey: "catBuildName", descKey: "catBuildDesc" },
  { id: "vote", icon: "\uD83D\uDDF3", nameKey: "catVoteName", descKey: "catVoteDesc" },
];

const CATEGORY_ICON: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.icon])
);

function resolveIcon(service: EcosystemService): string {
  if (service.icon && service.icon !== "\uD83D\uDD17") return service.icon;
  const cat = service.categories[0];
  return (cat && CATEGORY_ICON[cat]) || "\uD83D\uDD17";
}

function buildGreetingLines(t: Dictionary["explore"]): DialogueLine[] {
  return [
    { text: t.greeting1, mood: "welcome" },
    { text: t.greeting2, mood: "explain" },
    { text: t.greeting3, mood: "cheer" },
  ];
}

function buildCategoryReactions(t: Dictionary["explore"]): CategoryReaction[] {
  return [
    {
      categoryId: "earn",
      lines: [
        { text: t.reactEarn1, mood: "excited" },
        { text: t.reactEarn2, mood: "cheer" },
      ],
    },
    {
      categoryId: "play",
      lines: [
        { text: t.reactPlay1, mood: "wink" },
        { text: t.reactPlay2, mood: "cheer" },
      ],
    },
    {
      categoryId: "build",
      lines: [
        { text: t.reactBuild1, mood: "proud" },
        { text: t.reactBuild2, mood: "explain" },
      ],
    },
    {
      categoryId: "vote",
      lines: [
        { text: t.reactVote1, mood: "excited" },
        { text: t.reactVote2, mood: "cheer" },
      ],
    },
  ];
}

// ─── Typewriter Hook (inline copy from OnboardingQuest) ──────────────

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

// ─── Toki Character (inline copy from OnboardingQuest) ───────────────

function TokiCharacter({ mood, size = "large" }: { mood: Mood; size?: "large" | "small" }) {
  const imageSrc = MOOD_IMAGES[mood];
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

  const glowColor = MOOD_GLOW[mood];

  if (size === "small") {
    return (
      <div className="flex-shrink-0 w-12 h-12 relative">
        <Image
          src={imageSrc}
          alt="Toki"
          width={48}
          height={48}
          className="w-full h-auto drop-shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center z-10">
      <div className="relative w-64 sm:w-80 md:w-96 lg:w-[28rem] overflow-visible">
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

// ─── Dialogue Box ────────────────────────────────────────────────────

function ExploreDialogueBox({
  line,
  onNext,
  isLast,
}: {
  line: DialogueLine;
  onNext: () => void;
  isLast: boolean;
}) {
  const { displayed, done, skip } = useTypewriter(line.text, 35);

  return (
    <div
      className="cursor-pointer select-none w-full"
      onClick={() => (done ? onNext() : skip())}
    >
      <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6 h-[140px] sm:h-[156px] flex flex-col">
        <div className="flex items-center mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
            <span className="text-accent-cyan font-bold text-sm tracking-wide">Toki</span>
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
              {isLast ? "Click to continue" : "Click to next"} ▼
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Category Picker ─────────────────────────────────────────────────

function CategoryPicker({
  categories,
  t,
  onSelect,
  onShowAll,
}: {
  categories: InterestCategory[];
  t: Dictionary["explore"];
  onSelect: (id: string) => void;
  onShowAll: () => void;
}) {
  return (
    <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-cyan/30 transition-all text-left animate-slide-up-fade"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="text-2xl mb-2">{cat.icon}</div>
            <div className="text-white font-semibold text-sm group-hover:text-accent-cyan transition-colors">
              {t[cat.nameKey]}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">{t[cat.descKey]}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onShowAll}
        className="w-full text-center text-sm text-gray-400 hover:text-accent-cyan transition-colors py-2"
      >
        {t.showAll} →
      </button>
    </div>
  );
}

// ─── Service Card ────────────────────────────────────────────────────

function ServiceCard({ service, t, locale, onServiceClick }: { service: EcosystemService; t: Dictionary["explore"]; locale: string; onServiceClick?: (serviceId: string) => void }) {
  const name = locale === "ko" ? service.nameKo : service.nameEn;
  const desc = locale === "ko" ? service.descKo : service.descEn;
  const icon = resolveIcon(service);

  if (service.comingSoon) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 opacity-60">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-4">{desc}</p>
        <span className="inline-block px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-500 font-medium">
          {t.comingSoon}
        </span>
      </div>
    );
  }

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onServiceClick?.(service.id)}
      className="block group p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-cyan/30 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-200 mb-1 group-hover:text-accent-cyan transition-colors">
        {name}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      <span className="inline-flex items-center gap-1.5 text-sm text-accent-cyan font-medium group-hover:gap-2.5 transition-all">
        {t.visitService} <span>→</span>
      </span>
    </a>
  );
}

// ─── Recommended Cards ───────────────────────────────────────────────

function RecommendedCards({
  services,
  t,
  locale,
  onTryAnother,
  onShowAll,
  onServiceClick,
}: {
  services: EcosystemService[];
  t: Dictionary["explore"];
  locale: string;
  onTryAnother: () => void;
  onShowAll: () => void;
  onServiceClick?: (serviceId: string) => void;
}) {
  return (
    <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {services.map((service, i) => (
          <div
            key={service.id}
            className="animate-slide-up-fade"
            style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
          >
            <ServiceCard service={service} t={t} locale={locale} onServiceClick={onServiceClick} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onTryAnother}
          className="flex-1 py-3 rounded-xl bg-white/10 text-gray-300 font-medium text-sm hover:bg-white/15 transition-colors"
        >
          {t.tryAnother}
        </button>
        <button
          onClick={onShowAll}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-navy text-white font-medium text-sm hover:scale-[1.02] transition-transform"
        >
          {t.showAll}
        </button>
      </div>
    </div>
  );
}

// ─── Full Service Grid ───────────────────────────────────────────────

function FullServiceGrid({ t, services, locale, onServiceClick }: { t: Dictionary["explore"]; services: EcosystemService[]; locale: string; onServiceClick?: (serviceId: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { id: "all", label: t.filterAll },
    ...CATEGORIES.map((cat) => ({ id: cat.id, label: `${cat.icon} ${t[cat.nameKey]}` })),
  ];

  const filtered =
    activeFilter === "all"
      ? services
      : services.filter((s) => s.categories.includes(activeFilter));

  return (
    <div className="min-h-screen bg-grid pt-16">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Toki intro message */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/10">
          <TokiCharacter mood="cheer" size="small" />
          <p className="text-gray-300 text-sm">{t.fullListIntro}</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === f.id
                  ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Service Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {filtered.map((service, i) => (
            <div
              key={service.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <ServiceCard service={service} t={t} locale={locale} onServiceClick={onServiceClick} />
            </div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/15 transition-colors"
          >
            <span>←</span> {t.backToDashboard}
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─── Main Component (State Machine) ──────────────────────────────────

export default function ExploreContent() {
  const { t, locale } = useTranslation();
  const { trackActivity } = useAchievement();
  const et = t.explore;

  const [phase, setPhase] = useState<ExplorePhase>("greeting");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reactionDialogueIndex, setReactionDialogueIndex] = useState(0);
  const [reactionDone, setReactionDone] = useState(false);
  const [allServices, setAllServices] = useState<EcosystemService[]>([]);

  // Track explore page visit on mount
  useEffect(() => {
    trackActivity("explore-visit");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data) => setAllServices(data))
      .catch(() => {});
  }, []);

  const greetingLines = buildGreetingLines(et);
  const categoryReactions = buildCategoryReactions(et);

  const currentGreetingLine = greetingLines[dialogueIndex];
  const currentReaction = categoryReactions.find((r) => r.categoryId === selectedCategory);
  const currentReactionLine = currentReaction?.lines[reactionDialogueIndex];

  const recommendedServices = selectedCategory
    ? allServices.filter((s) => s.categories.includes(selectedCategory)).slice(0, 3)
    : [];

  // ── Phase: greeting ──
  const handleGreetingNext = () => {
    if (dialogueIndex < greetingLines.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      setPhase("choosing");
    }
  };

  // ── Phase: choosing ──
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setReactionDialogueIndex(0);
    setReactionDone(false);
    setPhase("recommended");
    trackActivity("category-view", { categoryId });
  };

  const handleShowAll = () => {
    setPhase("fullList");
  };

  // ── Phase: recommended ──
  const handleReactionNext = () => {
    if (!currentReaction) return;
    if (reactionDialogueIndex < currentReaction.lines.length - 1) {
      setReactionDialogueIndex(reactionDialogueIndex + 1);
    } else {
      setReactionDone(true);
    }
  };

  const handleTryAnother = () => {
    setSelectedCategory(null);
    setPhase("choosing");
  };

  const handleServiceClick = useCallback((serviceId: string) => {
    trackActivity("service-click", { serviceId });
  }, [trackActivity]);

  // ── Phase: fullList ──
  if (phase === "fullList") {
    return <FullServiceGrid t={et} services={allServices} locale={locale} onServiceClick={handleServiceClick} />;
  }

  // ── Visual Novel Phases (greeting, choosing, recommended) ──
  const currentMood: Mood =
    phase === "greeting"
      ? currentGreetingLine?.mood || "welcome"
      : phase === "choosing"
        ? "cheer"
        : currentReactionLine?.mood || "excited";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/backgrounds/explore.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

      {/* Character + Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-3xl mx-auto">
          <TokiCharacter mood={currentMood} />

          {/* Phase: greeting */}
          {phase === "greeting" && currentGreetingLine && (
            <ExploreDialogueBox
              line={currentGreetingLine}
              onNext={handleGreetingNext}
              isLast={dialogueIndex === greetingLines.length - 1}
            />
          )}

          {/* Phase: choosing */}
          {phase === "choosing" && (
            <CategoryPicker
              categories={CATEGORIES}
              t={et}
              onSelect={handleCategorySelect}
              onShowAll={handleShowAll}
            />
          )}

          {/* Phase: recommended — reaction dialogue */}
          {phase === "recommended" && !reactionDone && currentReactionLine && (
            <ExploreDialogueBox
              line={currentReactionLine}
              onNext={handleReactionNext}
              isLast={reactionDialogueIndex === (currentReaction?.lines.length ?? 1) - 1}
            />
          )}

          {/* Phase: recommended — cards shown after reaction dialogue */}
          {phase === "recommended" && reactionDone && (
            <RecommendedCards
              services={recommendedServices}
              t={et}
              locale={locale}
              onTryAnother={handleTryAnother}
              onShowAll={handleShowAll}
              onServiceClick={handleServiceClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
