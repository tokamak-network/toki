"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import type { StakingData } from "@/lib/staking";

interface StakingPreviewClientProps {
  data: StakingData | null;
}

function AnimatedGauge({
  value,
  max,
  color,
  delay = 0,
}: {
  value: number;
  max: number;
  color: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(Math.min((value / max) * 100, 100)), delay);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, max, delay]);

  return (
    <div
      ref={ref}
      className="w-full h-3 rounded-full bg-white/10 overflow-hidden"
    >
      <div
        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function StatRow({
  label,
  value,
  subtext,
  gauge,
  gaugeMax,
  color,
  delay,
}: {
  label: string;
  value: string;
  subtext: string;
  gauge: number;
  gaugeMax: number;
  color: string;
  delay: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-lg font-bold font-mono-num ${color}`}>
          {value}
        </span>
      </div>
      <AnimatedGauge
        value={gauge}
        max={gaugeMax}
        color={color.replace("text-", "bg-")}
        delay={delay}
      />
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  );
}

export default function StakingPreviewClient({
  data,
}: StakingPreviewClientProps) {
  const { t } = useTranslation();
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShowCard(true);
      },
      { threshold: 0.2 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center text-gray-500">
          {t.stakingPreview.failedToLoad}
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* RPG Report Card */}
        <div
          ref={cardRef}
          className={`
            relative rounded-2xl border border-amber-400/30
            bg-gradient-to-br from-amber-500/5 via-[var(--background)] to-blue-500/5
            backdrop-blur-sm overflow-hidden
            transition-all duration-700
            ${showCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          {/* Radial burst lines */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 right-0 h-[200%] w-px bg-gradient-to-b from-amber-400/20 to-transparent origin-top"
                style={{
                  transform: `translate(-50%, -10%) rotate(${i * 22.5}deg)`,
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="relative border-b border-white/10 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                {t.statsCard.reportTitle}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {t.statsCard.reportSubtitle}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs text-gray-500">{t.statsCard.grade}</div>
              <div className="text-3xl font-black text-amber-400 animate-pulse">
                {t.statsCard.gradeValue}
              </div>
            </div>
          </div>

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left: Toki + comment */}
              <div
                className={`
                shrink-0 flex flex-col items-center gap-4
                transition-all duration-500 delay-300
                ${showCard ? "opacity-100 scale-100" : "opacity-0 scale-75"}
              `}
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-2xl" />
                  <Image
                    src="/toki-proud.png"
                    alt="Toki proud"
                    width={140}
                    height={140}
                    className="relative z-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  />
                </div>
                {/* Speech bubble */}
                <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-3 max-w-[200px]">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/40 border-l border-t border-white/10 rotate-45" />
                  <p className="text-xs text-gray-300 text-center leading-relaxed">
                    {t.statsCard.tokiComment}
                  </p>
                </div>
              </div>

              {/* Right: Stats as gauge bars */}
              <div className="flex-1 space-y-5">
                <StatRow
                  label={t.stakingPreview.currentApr}
                  value={`${data.apr.toFixed(1)}%`}
                  subtext={t.stakingPreview.compoundSeigniorage}
                  gauge={data.apr}
                  gaugeMax={50}
                  color="text-accent-amber"
                  delay={200}
                />
                <StatRow
                  label={t.stakingPreview.totalStaked}
                  value={`${(data.totalStakedRaw / 1_000_000).toFixed(1)}M TON`}
                  subtext={`${data.totalStaked} TON`}
                  gauge={data.totalStakedRaw / 1_000_000}
                  gaugeMax={50}
                  color="text-accent-cyan"
                  delay={400}
                />
                <StatRow
                  label={t.stakingPreview.seigPerBlock}
                  value={data.seigPerBlock}
                  subtext={t.stakingPreview.wtonPerBlock}
                  gauge={parseFloat(data.seigPerBlock)}
                  gaugeMax={5}
                  color="text-accent-sky"
                  delay={600}
                />
                <StatRow
                  label={t.stakingPreview.operators}
                  value={String(data.operatorCount)}
                  subtext={t.stakingPreview.autoSelected}
                  gauge={data.operatorCount}
                  gaugeMax={20}
                  color="text-accent-blue"
                  delay={800}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
