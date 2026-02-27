"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

const steps = [
  {
    sprite: "/toki-welcome.png",
    mood: "welcome",
    color: "from-blue-500/20 to-cyan-500/20",
    accent: "border-cyan-400/40",
    number: "01",
    entrance: "animate-slide-left",
    glow: "animate-glow-cyan",
    glowColor: "bg-cyan-400/10",
  },
  {
    sprite: "/toki-explain.png",
    mood: "explain",
    color: "from-sky-500/20 to-blue-500/20",
    accent: "border-blue-400/40",
    number: "02",
    entrance: "animate-slide-right",
    glow: "animate-glow-blue",
    glowColor: "bg-blue-400/10",
  },
  {
    sprite: "/toki-cheer.png",
    mood: "cheer",
    color: "from-amber-500/20 to-yellow-500/20",
    accent: "border-amber-400/40",
    number: "03",
    entrance: "animate-drop-in",
    glow: "animate-glow-amber",
    glowColor: "bg-amber-400/10",
  },
];

function TypingText({
  text,
  active,
  onDone,
}: {
  text: string;
  active: boolean;
  onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, 30);
    return () => clearInterval(id);
  }, [text, active, onDone]);

  return (
    <span>
      {displayed}
      {!done && active && (
        <span className="inline-block w-0.5 h-5 bg-white/80 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

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

// Sparkle positions around the character
const SPARKLE_POSITIONS = [
  { x: -10, y: -15, delay: 0 },
  { x: 25, y: -20, delay: 100 },
  { x: 40, y: 5, delay: 200 },
  { x: -15, y: 20, delay: 150 },
  { x: 30, y: 30, delay: 50 },
];

function StepCard({
  step,
  index,
  dialogue,
  title,
}: {
  step: (typeof steps)[0];
  index: number;
  dialogue: string;
  title: string;
}) {
  const { ref, visible } = useInView(0.2);
  const isEven = index % 2 === 0;
  const [entered, setEntered] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Trigger entered state after entrance animation completes
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setEntered(true), 800);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleTypingDone = useCallback(() => {
    setReacting(true);
    setShowSparkles(true);
    // Remove reaction class after animation
    setTimeout(() => setReacting(false), 500);
    setTimeout(() => setShowSparkles(false), 800);
  }, []);

  return (
    <div
      ref={ref}
      className={`
        relative rounded-2xl border ${step.accent} bg-gradient-to-br ${step.color}
        backdrop-blur-sm overflow-hidden
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Step number badge */}
      <div className="absolute top-4 left-4 text-5xl font-bold text-white/10 select-none">
        {step.number}
      </div>

      <div
        className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-6 p-6 md:p-8`}
      >
        {/* Toki sprite with dynamic animations */}
        <div className="relative shrink-0 w-32 h-32 md:w-40 md:h-40">
          {/* Glow background */}
          <div
            className={`
              absolute inset-[-20%] rounded-full blur-2xl transition-opacity duration-500
              ${step.glowColor}
              ${visible ? `opacity-100 ${step.glow}` : "opacity-0"}
            `}
          />

          {/* Character container: entrance → float → reaction */}
          <div
            className={`
              relative z-10 w-full h-full
              ${visible ? step.entrance : "opacity-0"}
              ${entered ? "animate-float" : ""}
              ${reacting ? "animate-reaction" : ""}
            `}
          >
            <Image
              src={step.sprite}
              alt={step.mood}
              width={160}
              height={160}
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            />

            {/* Sparkle particles on typing complete */}
            {showSparkles &&
              SPARKLE_POSITIONS.map((pos, i) => (
                <div
                  key={i}
                  className="absolute animate-sparkle"
                  style={{
                    top: `calc(50% + ${pos.y}px)`,
                    left: `calc(50% + ${pos.x}px)`,
                    animationDelay: `${pos.delay}ms`,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className="text-yellow-300"
                  >
                    <path
                      fill="currentColor"
                      d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z"
                    />
                  </svg>
                </div>
              ))}
          </div>
        </div>

        {/* Dialogue box */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/40 mb-2 uppercase tracking-wider font-medium">
            Step {step.number} — {title}
          </div>

          {/* VN-style dialogue box */}
          <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-5">
            {/* Name tag */}
            <div className="absolute -top-3 left-4 px-3 py-0.5 bg-accent-blue rounded-full text-xs font-bold text-white">
              Toki
            </div>

            <p className="text-white/90 text-base md:text-lg leading-relaxed mt-1">
              <TypingText
                text={dialogue}
                active={visible}
                onDone={handleTypingDone}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation();

  const dialogues = [
    t.howItWorksVn.step1Dialogue,
    t.howItWorksVn.step2Dialogue,
    t.howItWorksVn.step3Dialogue,
  ];

  const titles = [
    t.howItWorks.step1Title,
    t.howItWorks.step2Title,
    t.howItWorks.step3Title,
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {t.howItWorks.title}
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          {t.howItWorks.subtitle}
        </p>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <StepCard
              key={step.number}
              step={step}
              index={i}
              dialogue={dialogues[i]}
              title={titles[i]}
            />
          ))}
        </div>

        {/* Connection line */}
        <div className="hidden md:flex justify-center mt-8 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan" />
            <div className="w-24 h-px bg-gradient-to-r from-accent-cyan to-accent-blue" />
            <div className="w-2 h-2 rounded-full bg-accent-blue" />
            <div className="w-24 h-px bg-gradient-to-r from-accent-blue to-accent-amber" />
            <div className="w-2 h-2 rounded-full bg-accent-amber" />
          </div>
        </div>
      </div>
    </section>
  );
}
