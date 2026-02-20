"use client";

import HeroButtons from "./HeroButtons";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function HeroSection({ apr }: { apr: number | null }) {
  const displayApr = apr ? `~${apr.toFixed(0)}%` : "~20%+";
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-navy/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-cyan/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left: Text content */}
        <div className="flex-1 text-center lg:text-left animate-fade-in">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 text-accent-sky text-sm mb-6">
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-gradient">{t.hero.title1}</span>
            <br />
            <span className="text-foreground">
              {t.hero.title2}
              <br />
              {t.hero.title3}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-lg mb-8 leading-relaxed">
            {t.hero.subtitle1}
            <br />
            {t.hero.subtitle2}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-10">
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-amber font-mono-num">
                {displayApr}
              </div>
              <div className="text-sm text-gray-500">{t.hero.apr}</div>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-cyan font-mono-num">
                {t.hero.steps}
              </div>
              <div className="text-sm text-gray-500">{t.hero.stepsDesc}</div>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-accent-blue font-mono-num">
                {t.hero.tonOnly}
              </div>
              <div className="text-sm text-gray-500">{t.hero.tonOnlyDesc}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <HeroButtons />
        </div>

        {/* Right: Toki promo video */}
        <div className="flex-1 flex justify-center animate-slide-up">
          <div className="relative w-72 sm:w-80 lg:w-96">
            <div className="absolute inset-0 bg-accent-blue/20 rounded-3xl blur-2xl -z-10" />
            <video
              src="/toki-promo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="rounded-2xl drop-shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
