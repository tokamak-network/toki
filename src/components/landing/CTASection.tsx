"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";

export default function CTASection() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Start video when section comes into view
          videoRef.current?.play();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-4 overflow-hidden">
      {/* Background video */}
      <video
        ref={videoRef}
        src="/toki-cta.mp4"
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Gradient edges for seamless blend with page */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080b14] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080b14] to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2
          className={`
            text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.1] mb-6
            transition-all duration-700 ease-out
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          {t.cta.title}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
            {t.cta.titleHighlight}
          </span>{" "}
          {t.cta.titleEnd}
        </h2>

        <p
          className={`
            text-gray-300 text-lg sm:text-xl mb-10 max-w-xl mx-auto
            transition-all duration-700 delay-200 ease-out
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          {t.cta.subtitle}
        </p>

        <Link
          href="/dashboard"
          className={`
            inline-flex items-center gap-3 px-10 py-5 rounded-2xl
            bg-gradient-to-r from-amber-500 to-yellow-500
            text-black font-bold text-lg
            hover:scale-105 transition-all duration-300
            shadow-[0_0_40px_rgba(245,158,11,0.3)]
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
          style={{ transitionDelay: visible ? "400ms" : "0ms", transitionDuration: "700ms" }}
        >
          {t.cta.button}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
