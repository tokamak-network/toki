"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// Mini character assets for "perched on card" effect
const miniCharacters: ({ src: string; position: string } | null)[] = [
  // Step 1: Lying down, peeking — top-right
  {
    src: "/toki-mini-step1.png",
    position: "right-[-10px] top-[-55px] md:top-[-65px] w-[120px] h-[100px] md:w-[140px] md:h-[116px]",
  },
  // Step 2: Sitting on edge — bottom-left, bar aligned with card border
  {
    src: "/toki-mini-step2.png",
    position: "left-[5px] md:left-[13px] bottom-[-20px] md:bottom-[-24px] w-[90px] h-[108px] md:w-[105px] md:h-[126px]",
  },
  // Step 3: Victory celebration, jumping — centered on card top
  {
    src: "/toki-mini-step3.png",
    position: "left-1/2 -translate-x-1/2 top-[-78px] md:top-[-92px] w-[80px] h-[120px] md:w-[95px] md:h-[142px]",
  },
];

const steps = [
  {
    bg: "/bg-step1.jpg",
    character: "/toki-step1.png",
    accentColor: "text-cyan-400",
    accentBorder: "border-cyan-400/40",
    accentGlow: "shadow-cyan-400/20",
    accentBg: "bg-cyan-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  {
    bg: "/bg-step2.jpg",
    character: "/toki-step2.png",
    accentColor: "text-blue-400",
    accentBorder: "border-blue-400/40",
    accentGlow: "shadow-blue-400/20",
    accentBg: "bg-blue-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
      </svg>
    ),
  },
  {
    bg: "/bg-step3.jpg",
    character: "/toki-step3.png",
    accentColor: "text-amber-400",
    accentBorder: "border-amber-400/40",
    accentGlow: "shadow-amber-400/20",
    accentBg: "bg-amber-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
];

function ArrowConnector({ accentColor }: { accentColor: string }) {
  return (
    <div className="hidden md:flex items-center justify-center shrink-0 w-8">
      <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${accentColor} opacity-40`}>
        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StepCard({
  step,
  index,
  heading,
  highlight,
  bullets,
  cta,
  isExpanded,
  onToggle,
  visible,
}: {
  step: (typeof steps)[0];
  index: number;
  heading: string;
  highlight: string;
  bullets: string[];
  cta?: string;
  isExpanded: boolean;
  onToggle: () => void;
  visible: boolean;
}) {
  return (
    <div
      className={`
        relative min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        ${isExpanded ? "md:flex-[3]" : "md:flex-1"}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Mini character perched on card (only when collapsed and asset exists) */}
      {miniCharacters[index] && (
        <div
          className={`
            absolute z-20 pointer-events-none
            transition-all duration-500
            ${isExpanded ? "opacity-0 scale-75" : "opacity-100 scale-100"}
            ${miniCharacters[index]!.position}
          `}
        >
          <Image
            src={miniCharacters[index]!.src}
            alt=""
            fill
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          />
        </div>
      )}

      {/* Card body */}
      <div
        onClick={onToggle}
        className={`
          group relative rounded-2xl overflow-hidden cursor-pointer
          border transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
          ${isExpanded
            ? `${step.accentBorder} shadow-lg ${step.accentGlow}`
            : "border-white/10 hover:border-white/20"
          }
        `}
      >
        {/* Background image (visible when expanded) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${isExpanded ? "opacity-100" : "opacity-0"}`}
        >
          <Image src={step.bg} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Default dark bg when collapsed */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${isExpanded ? "opacity-0" : "opacity-100"} bg-white/[0.03]`}
        />

        {/* Content */}
        <div className="relative z-10 h-full">
          {/* Collapsed state */}
          <div
            className={`
              transition-all duration-500
              ${isExpanded ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}
            `}
          >
            <div className="p-6 md:p-8 flex flex-col items-center text-center gap-4 min-h-[220px] md:min-h-[280px] justify-center">
              {/* Icon */}
              <div className={`${step.accentColor} transition-colors`}>
                {step.icon}
              </div>

              {/* Step number */}
              <div className={`text-xs font-bold tracking-[0.2em] ${step.accentColor} uppercase`}>
                Step {String(index + 1).padStart(2, "0")}
              </div>

              {/* Title */}
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase leading-tight tracking-tight text-white/90">
                  {heading}
                </h3>
                <h3 className={`text-lg md:text-xl font-black uppercase leading-tight tracking-tight ${step.accentColor}`}>
                  {highlight}
                </h3>
              </div>

              {/* Expand hint */}
              <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${step.accentColor} opacity-40 group-hover:opacity-100 transition-opacity`}>
                <span>Details</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 animate-bounce">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Expanded state */}
          <div
            className={`
              transition-all duration-500
              ${isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}
            `}
          >
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 min-h-[320px] md:min-h-[400px]">
              {/* Character image */}
              <div className="relative w-40 h-48 md:w-56 md:h-72 shrink-0 mx-auto md:mx-0">
                <Image
                  src={step.character}
                  alt={`Step ${index + 1}`}
                  fill
                  className="object-contain object-bottom drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                {/* Step label */}
                <div className={`text-xs font-bold tracking-[0.2em] ${step.accentColor} uppercase mb-3`}>
                  Step {String(index + 1).padStart(2, "0")}
                </div>

                {/* Heading */}
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase leading-[1.1] tracking-tight mb-4">
                  {heading}<br />
                  <span className={step.accentColor}>{highlight}</span>
                </h3>

                {/* Bullets */}
                <div className="space-y-2 mb-4">
                  {bullets.map((bullet, i) => (
                    <p
                      key={i}
                      className={`
                        text-sm md:text-base text-gray-200 font-medium
                        transition-all duration-400 ease-out
                        ${isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
                      `}
                      style={{ transitionDelay: isExpanded ? `${300 + i * 100}ms` : "0ms" }}
                    >
                      <span className={`${step.accentColor} mr-2`}>&bull;</span>
                      {bullet}
                    </p>
                  ))}
                </div>

                {/* CTA (last step) */}
                {cta && (
                  <div className="mt-2">
                    <Link
                      href="/dashboard"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    >
                      {cta}
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>

              {/* Close hint */}
              <button
                className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500
            ${isExpanded ? `${step.accentBg} opacity-60` : "bg-white/5 opacity-100"}
          `}
        />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation();
  const { ref, visible } = useInView(0.1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const stepData = [
    {
      heading: t.howItWorks.step1Heading,
      highlight: t.howItWorks.step1Highlight,
      bullets: [t.howItWorks.step1Bullet1, t.howItWorks.step1Bullet2, t.howItWorks.step1Bullet3],
    },
    {
      heading: t.howItWorks.step2Heading,
      highlight: t.howItWorks.step2Highlight,
      bullets: [t.howItWorks.step2Bullet1, t.howItWorks.step2Bullet2, t.howItWorks.step2Bullet3],
    },
    {
      heading: t.howItWorks.step3Heading,
      highlight: t.howItWorks.step3Highlight,
      bullets: [t.howItWorks.step3Bullet1, t.howItWorks.step3Bullet2, t.howItWorks.step3Bullet3],
      cta: t.howItWorks.step3Cta,
    },
  ];

  return (
    <section ref={ref} className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div
          className={`text-center mb-16 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[1.1] mb-6">
            {t.howItWorks.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400">
              {t.howItWorks.titleHighlight}
            </span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Interactive cards - desktop: row, mobile: stack */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-3 items-stretch pt-20">
          {steps.flatMap((step, i) => {
            const card = (
              <StepCard
                key={`card-${i}`}
                step={step}
                index={i}
                heading={stepData[i].heading}
                highlight={stepData[i].highlight}
                bullets={stepData[i].bullets}
                cta={stepData[i].cta}
                isExpanded={expandedIndex === i}
                onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                visible={visible}
              />
            );
            if (i < steps.length - 1) {
              return [card, <ArrowConnector key={`arrow-${i}`} accentColor={step.accentColor} />];
            }
            return [card];
          })}
        </div>

        {/* CTA below cards */}
        <div
          className={`
            text-center mt-12 transition-all duration-700 delay-500 ease-out
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            {t.howItWorks.step3Cta}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-4xl mx-auto mt-24">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
}
