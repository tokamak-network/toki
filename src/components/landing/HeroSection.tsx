"use client";

import { useRef, useState, useCallback } from "react";
import HeroButtons from "./HeroButtons";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function HeroSection({ apr }: { apr: number | null }) {
  const displayApr = apr ? `~${apr.toFixed(0)}%` : "~20%+";
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/toki-promo-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/toki-promo.webm" type="video/webm" />
        <source src="/toki-promo.mp4" type="video/mp4" />
      </video>

      {/* Unmute button */}
      <button
        onClick={toggleMute}
        className={`absolute top-20 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isMuted
            ? "bg-white/10 border border-white/20 hover:bg-white/20"
            : "bg-accent-cyan/20 border border-accent-cyan/40 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
        }`}
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
            <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-cyan">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}</button>

      {/* Overlay: left side stronger for text readability, bottom for page transition */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-[var(--background)]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

      {/* Content — left bottom */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 animate-fade-in" style={{ marginTop: 500 }}>
        <div className="max-w-lg">
          {/* Stats */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-10">
            <div className="px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-accent-amber font-mono-num">
                {displayApr}
              </div>
              <div className="text-sm text-gray-400">{t.hero.apr}</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-accent-cyan font-mono-num">
                {t.hero.steps}
              </div>
              <div className="text-sm text-gray-400">{t.hero.stepsDesc}</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold text-accent-blue font-mono-num">
                {t.hero.tonOnly}
              </div>
              <div className="text-sm text-gray-400">{t.hero.tonOnlyDesc}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <HeroButtons />
        </div>
      </div>
    </section>
  );
}
