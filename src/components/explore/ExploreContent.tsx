"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAchievement } from "@/components/providers/AchievementProvider";
import type { Dictionary } from "@/locales";

// ─── Types ───────────────────────────────────────────────────────────

type Mood = "welcome" | "explain" | "thinking" | "excited" | "proud" | "cheer" | "wink" | "surprised" | "confused" | "shy" | "determined" | "pointing" | "reading" | "crying-happy" | "peace" | "worried" | "laughing";
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
};

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
};

const CATEGORIES: InterestCategory[] = [
  { id: "earn", icon: "\uD83D\uDCB0", nameKey: "catEarnName", descKey: "catEarnDesc" },
  { id: "play", icon: "\uD83C\uDFAE", nameKey: "catPlayName", descKey: "catPlayDesc" },
  { id: "build", icon: "\uD83D\uDEE0", nameKey: "catBuildName", descKey: "catBuildDesc" },
  { id: "vote", icon: "\uD83D\uDDF3", nameKey: "catVoteName", descKey: "catVoteDesc" },
];

const CATEGORY_MINI_IMAGES: Record<string, string> = {
  earn: "/characters/mini/toki-explore-earn.png",
  play: "/characters/mini/toki-explore-play.png",
  build: "/characters/mini/toki-explore-build.png",
  vote: "/characters/mini/toki-explore-vote.png",
};

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

// ─── Toki's Pick Banner ─────────────────────────────────────────────

function TokiPickBanner({
  services,
  t,
  locale,
  onServiceClick,
}: {
  services: EcosystemService[];
  t: Dictionary["explore"];
  locale: string;
  onServiceClick?: (serviceId: string) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Pick featured services (first 3 non-comingSoon)
  const featured = services.filter((s) => !s.comingSoon).slice(0, 3);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const service = featured[currentSlide];
  if (!service) return null;

  const name = locale === "ko" ? service.nameKo : service.nameEn;
  const desc = locale === "ko" ? service.descKo : service.descEn;
  const icon = resolveIcon(service);

  return (
    <div className="mb-4 rounded-xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/[0.07] to-accent-blue/[0.04] overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <span className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase bg-accent-cyan/10 border border-accent-cyan/25 px-2 py-0.5 rounded-full">
          {t.tokiPickLabel}
        </span>
      </div>
      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onServiceClick?.(service.id)}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-[11px] text-gray-400 line-clamp-1">{desc}</div>
        </div>
        <span className="text-[11px] text-accent-cyan font-semibold bg-accent-cyan/10 px-2.5 py-1.5 rounded-lg flex-shrink-0">
          {t.visitService} →
        </span>
      </a>
      {featured.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-2.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentSlide ? "w-4 bg-accent-cyan" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Picker ─────────────────────────────────────────────────

function CategoryPicker({
  categories,
  t,
  onSelect,
  onShowAll,
  services,
  locale,
  onServiceClick,
}: {
  categories: InterestCategory[];
  t: Dictionary["explore"];
  onSelect: (id: string) => void;
  onShowAll: () => void;
  services: EcosystemService[];
  locale: string;
  onServiceClick?: (serviceId: string) => void;
}) {
  return (
    <div className="bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
      {/* Toki's Pick Banner */}
      <TokiPickBanner services={services} t={t} locale={locale} onServiceClick={onServiceClick} />

      {/* Category Grid with mini character images */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-cyan/30 transition-all text-left animate-slide-up-fade overflow-hidden"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3">
              {/* Mini character */}
              <div className="w-14 h-14 flex-shrink-0 relative">
                <Image
                  src={CATEGORY_MINI_IMAGES[cat.id] || ""}
                  alt={String(t[cat.nameKey])}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm group-hover:text-accent-cyan transition-colors">
                  {t[cat.nameKey]}
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5 leading-snug">{t[cat.descKey]}</div>
              </div>
            </div>
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

// ─── Category Colors ─────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  earn: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" },
  play: { border: "border-pink-500/30", bg: "bg-pink-500/10", text: "text-pink-400" },
  build: { border: "border-accent-cyan/30", bg: "bg-accent-cyan/10", text: "text-accent-cyan" },
  vote: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

// ─── Service Card ────────────────────────────────────────────────────

function ServiceCard({ service, t, locale, onServiceClick }: { service: EcosystemService; t: Dictionary["explore"]; locale: string; onServiceClick?: (serviceId: string) => void }) {
  const name = locale === "ko" ? service.nameKo : service.nameEn;
  const desc = locale === "ko" ? service.descKo : service.descEn;
  const icon = resolveIcon(service);

  if (service.comingSoon) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-400 truncate">{name}</h3>
          <p className="text-xs text-gray-600 truncate">{desc}</p>
        </div>
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded flex-shrink-0">
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
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.06] hover:bg-white/10 hover:border-accent-cyan/30 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-white/[0.07] flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-accent-cyan transition-colors truncate">
          {name}
        </h3>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
      <span className="text-gray-600 group-hover:text-accent-cyan transition-colors flex-shrink-0 text-sm">↗</span>
    </a>
  );
}

// ─── Service Card (large, for recommended) ──────────────────────────

function ServiceCardLarge({ service, t, locale, onServiceClick }: { service: EcosystemService; t: Dictionary["explore"]; locale: string; onServiceClick?: (serviceId: string) => void }) {
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
            <ServiceCardLarge service={service} t={t} locale={locale} onServiceClick={onServiceClick} />
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
  // Group services by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    services: services.filter((s) => s.categories.includes(cat.id)),
  }));

  const totalCount = services.length;

  return (
    <div className="min-h-screen bg-grid pt-16">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Toki intro message */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/10">
          <TokiCharacter mood="cheer" size="small" />
          <p className="text-gray-300 text-sm">{t.fullListIntro}</p>
        </div>

        {/* Stats summary bar */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-1">
          <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">{t.statsTotal}</div>
            <div className="text-xl font-bold text-white">{totalCount}</div>
          </div>
          {grouped.map((cat) => {
            const colors = CATEGORY_COLORS[cat.id];
            return (
              <div
                key={cat.id}
                className={`flex-shrink-0 px-4 py-2 rounded-xl ${colors?.bg || "bg-white/5"} border ${colors?.border || "border-white/10"}`}
              >
                <div className={`text-[11px] uppercase tracking-wider ${colors?.text || "text-gray-400"}`}>
                  {t[cat.nameKey]}
                </div>
                <div className="text-xl font-bold text-white">{cat.services.length}</div>
              </div>
            );
          })}
        </div>

        {/* Category sections */}
        {grouped.map((cat, catIdx) => {
          if (cat.services.length === 0) return null;
          const colors = CATEGORY_COLORS[cat.id];
          return (
            <section key={cat.id} className="mb-10">
              {/* Section header with mini character */}
              <div
                className="flex items-center gap-3 mb-4 animate-slide-up-fade"
                style={{ animationDelay: `${catIdx * 100}ms`, animationFillMode: "both" }}
              >
                <div className="w-10 h-10 flex-shrink-0">
                  <Image
                    src={CATEGORY_MINI_IMAGES[cat.id] || ""}
                    alt={String(t[cat.nameKey])}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-bold ${colors?.text || "text-white"}`}>
                    {t[cat.nameKey]}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {(t.statsCategory as string).replace("{count}", String(cat.services.length))}
                  </p>
                </div>
              </div>

              {/* Service list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.services.map((service, i) => (
                  <div
                    key={service.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${catIdx * 100 + i * 40}ms`, animationFillMode: "both" }}
                  >
                    <ServiceCard service={service} t={t} locale={locale} onServiceClick={onServiceClick} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Back to Dashboard */}
        <div className="text-center mt-4 mb-12">
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
              services={allServices}
              locale={locale}
              onServiceClick={handleServiceClick}
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
