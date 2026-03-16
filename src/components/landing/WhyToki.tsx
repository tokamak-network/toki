"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function BattleRow({ row, index }: {
  row: { feature: string; old: string; toki: string };
  index: number;
}) {
  const { ref, visible } = useInView(0.3);

  return (
    <div
      ref={ref}
      className={`
        grid grid-cols-[1fr_auto_1fr] gap-3 items-center
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Old way - left */}
      <div className={`
        rounded-xl p-4 border transition-all duration-500
        ${visible
          ? "bg-red-500/5 border-red-500/20"
          : "bg-white/5 border-white/10"}
      `}>
        <div className="text-xs text-gray-500 mb-1">{row.feature}</div>
        <div className="text-red-400/80 text-sm flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-red-500/60" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{row.old}</span>
        </div>
      </div>

      {/* Center divider */}
      <div className="flex flex-col items-center gap-1">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
          transition-all duration-500 delay-300
          ${visible
            ? "bg-cyan-500/20 text-cyan-400 scale-110 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
            : "bg-white/10 text-gray-500 scale-100"}
        `}>
          {visible ? ">" : ""}
        </div>
      </div>

      {/* Toki way - right */}
      <div className={`
        rounded-xl p-4 border transition-all duration-500
        ${visible
          ? "bg-cyan-500/10 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
          : "bg-white/5 border-white/10"}
      `}>
        <div className="text-xs text-gray-500 mb-1">{row.feature}</div>
        <div className="text-cyan-300 text-sm flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" className="shrink-0 mt-0.5 text-cyan-400" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{row.toki}</span>
        </div>
      </div>
    </div>
  );
}

export default function WhyToki() {
  const { t } = useTranslation();
  const comparisons = [
    { feature: t.whyToki.walletSetup, old: t.whyToki.walletTraditional, toki: t.whyToki.walletToki },
    { feature: t.whyToki.gasFees, old: t.whyToki.gasTraditional, toki: t.whyToki.gasToki },
    { feature: t.whyToki.wrapping, old: t.whyToki.wrappingTraditional, toki: t.whyToki.wrappingToki },
    { feature: t.whyToki.operatorSelection, old: t.whyToki.operatorTraditional, toki: t.whyToki.operatorToki },
    { feature: t.whyToki.stepsToStake, old: t.whyToki.stepsTraditional, toki: t.whyToki.stepsToki },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.whyToki.title}
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          {t.whyToki.subtitle}
        </p>

        {/* VS Header */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <span className="text-red-400 font-bold text-lg">{t.whyTokiVs.oldWay}</span>
          </div>

          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <span className="text-white font-black text-sm">{t.whyTokiVs.vs}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold text-lg">{t.whyTokiVs.tokiWay}</span>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400/50">
              <Image src="/characters/toki-proud.png" alt="Toki" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </div>

        {/* Battle rows */}
        <div className="space-y-4">
          {comparisons.map((row, i) => (
            <BattleRow key={row.feature} row={row} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
